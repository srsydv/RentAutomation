function normalizeEndpoint(raw) {
  let endpoint = raw?.replace(/\/$/, "") || "";
  // Allow pasting full Target URI from Foundry Details tab
  endpoint = endpoint.replace(/\/chat\/completions\/?$/, "");
  return endpoint;
}

function requireAzureOpenAIConfig() {
  const endpoint = normalizeEndpoint(process.env.AZURE_OPENAI_ENDPOINT);
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const deployment =
    process.env.AZURE_OPENAI_DEPLOYMENT || process.env.AZURE_OPENAI_MODEL;

  if (!endpoint || !apiKey || !deployment) {
    const err = new Error(
      "Azure OpenAI is not configured. Set AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY, and AZURE_OPENAI_DEPLOYMENT in server/.env"
    );
    err.statusCode = 503;
    throw err;
  }

  return {
    endpoint,
    apiKey,
    deployment,
    apiVersion: process.env.AZURE_OPENAI_API_VERSION || "2024-08-01-preview",
  };
}

function buildChatCompletionsRequest({ endpoint, deployment, apiVersion }) {
  // Foundry v1 API (Grok, Phi, etc.): .../openai/v1/chat/completions + model in body
  if (endpoint.includes("/openai/v1")) {
    const base = endpoint.endsWith("/openai/v1") ? endpoint : endpoint.replace(/\/openai\/v1\/?$/, "/openai/v1");
    return {
      url: `${base}/chat/completions`,
      body: (input, maxOutputTokens) => ({
        model: deployment,
        messages: [
          {
            role: "system",
            content:
              "You are a helpful AI assistant for a landlord rent management app. Be concise and practical.",
          },
          { role: "user", content: input },
        ],
        max_tokens: maxOutputTokens,
        temperature: 0.7,
      }),
    };
  }

  // Classic Azure OpenAI: .../openai/deployments/{name}/chat/completions
  const base = endpoint.replace(/\/openai\/v1\/?$/, "");
  return {
    url: `${base}/openai/deployments/${encodeURIComponent(deployment)}/chat/completions?api-version=${apiVersion}`,
    body: (input, maxOutputTokens) => ({
      messages: [
        {
          role: "system",
          content:
            "You are a helpful AI assistant for a landlord rent management app. Be concise and practical.",
        },
        { role: "user", content: input },
      ],
      max_tokens: maxOutputTokens,
      temperature: 0.7,
    }),
  };
}

export async function callAzureOpenAIText({ input, maxOutputTokens = 500 }) {
  const config = requireAzureOpenAIConfig();
  const { url, body } = buildChatCompletionsRequest(config);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "api-key": config.apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body(input, maxOutputTokens)),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const err = new Error(`Azure OpenAI error (${res.status}): ${text || res.statusText}`);
    err.statusCode = res.status >= 400 && res.status < 500 ? 400 : 502;
    throw err;
  }

  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content;
  return typeof content === "string" ? content.trim() : "";
}
