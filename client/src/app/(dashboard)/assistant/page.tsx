"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { buildSmsUrl, buildWhatsAppUrl } from "@/lib/messagingLinks";

type Property = { _id: string; name: string; rentAmount: number; dueDay: number };
type Tenant = {
  _id: string;
  name: string;
  phone: string;
  rentAmount: number;
  paymentStatus: "paid" | "pending";
  propertyId: Property | string;
};

export default function AssistantPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantId, setTenantId] = useState("");
  const [tone, setTone] = useState<"polite" | "firm" | "friendly">("polite");
  const [channel, setChannel] = useState<"whatsapp" | "sms" | "email">("whatsapp");
  const [message, setMessage] = useState("");
  const [summary, setSummary] = useState("");
  const [err, setErr] = useState("");
  const [loadingMsg, setLoadingMsg] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);

  useEffect(() => {
    api<Tenant[]>("/api/tenants")
      .then((t) => {
        setTenants(t);
        if (!tenantId && t.length) setTenantId(t[0]._id);
      })
      .catch((e) => setErr(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = useMemo(() => tenants.find((t) => t._id === tenantId) || null, [tenants, tenantId]);
  const propertyName =
    typeof selected?.propertyId === "object" && selected?.propertyId?.name ? selected.propertyId.name : "—";
  const tenantPhone = selected?.phone?.trim() || "";
  const whatsAppUrl = message && tenantPhone ? buildWhatsAppUrl(tenantPhone, message) : null;
  const smsUrl = message && tenantPhone ? buildSmsUrl(tenantPhone, message) : null;

  function sendOnWhatsApp() {
    if (!whatsAppUrl) {
      setErr("Add a phone number for this tenant on the Tenants page first.");
      return;
    }
    window.open(whatsAppUrl, "_blank", "noopener,noreferrer");
  }

  function sendOnSms() {
    if (!smsUrl) {
      setErr("Add a phone number for this tenant on the Tenants page first.");
      return;
    }
    window.location.href = smsUrl;
  }

  async function generateReminder() {
    setErr("");
    setMessage("");
    if (!tenantId) return;
    setLoadingMsg(true);
    try {
      const r = await api<{ message: string }>(`/api/ai/reminder-preview/${tenantId}?tone=${tone}&channel=${channel}`);
      setMessage(r.message || "");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setLoadingMsg(false);
    }
  }

  async function generateSummary() {
    setErr("");
    setSummary("");
    setLoadingSummary(true);
    try {
      const r = await api<{ summary: string }>(`/api/ai/portfolio-summary?tone=actionable`);
      setSummary(r.summary || "");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setLoadingSummary(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">AI Assistant</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Powered by Microsoft Azure OpenAI — generate rent reminders and portfolio action plans.
        </p>
      </div>

      {err && <p className="text-sm text-red-600">{err}</p>}

      <div className="grid gap-4 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Tenant</label>
            <select
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
            >
              {tenants.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name} ({typeof t.propertyId === "object" && t.propertyId?.name ? t.propertyId.name : "property"})
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-zinc-500">
              Selected property: {propertyName}
              {tenantPhone ? ` · Phone: ${tenantPhone}` : " · No phone on file"}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Tone</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value as any)}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
              >
                <option value="polite">Polite</option>
                <option value="friendly">Friendly</option>
                <option value="firm">Firm</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Channel</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as any)}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
              >
                <option value="whatsapp">WhatsApp</option>
                <option value="sms">SMS</option>
                <option value="email">Email</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={!tenantId || loadingMsg}
            onClick={generateReminder}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {loadingMsg ? "Generating…" : "Generate reminder"}
          </button>
          <button
            type="button"
            disabled={loadingSummary}
            onClick={generateSummary}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-600 disabled:opacity-50"
          >
            {loadingSummary ? "Generating…" : "Generate portfolio summary"}
          </button>
        </div>

        {message && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Reminder preview</p>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
            <div className="flex flex-wrap items-center gap-2">
              {channel === "whatsapp" && (
                <button
                  type="button"
                  onClick={sendOnWhatsApp}
                  disabled={!whatsAppUrl}
                  className="rounded-lg bg-[#25D366] px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Send on WhatsApp
                </button>
              )}
              {channel === "sms" && (
                <button
                  type="button"
                  onClick={sendOnSms}
                  disabled={!smsUrl}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Send SMS
                </button>
              )}
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(message)}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600"
              >
                Copy message
              </button>
            </div>
            {!tenantPhone && channel === "whatsapp" && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Add the tenant&apos;s phone on the Tenants page to enable WhatsApp.
              </p>
            )}
          </div>
        )}

        {summary && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Portfolio summary</p>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={8}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </div>
        )}
      </div>
    </div>
  );
}

