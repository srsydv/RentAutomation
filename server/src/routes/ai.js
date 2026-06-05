import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import { requireDb } from "../middleware/db.js";
import { sendApiError } from "../lib/apiError.js";
import { Tenant } from "../models/Tenant.js";
import { Property } from "../models/Property.js";
import { callAzureOpenAIText } from "../services/azureOpenAI.js";

const router = express.Router();
router.use(authMiddleware);
router.use(requireDb);

router.get("/reminder-preview/:tenantId", async (req, res) => {
  try {
    const { tenantId } = req.params;
    const tenant = await Tenant.findOne({ _id: tenantId, landlordId: req.userId })
      .populate("propertyId")
      .lean();
    if (!tenant) return res.status(404).json({ error: "Tenant not found" });

    const property = tenant.propertyId;
    const propertyName = property?.name || "the property";
    const rent = tenant.rentAmount;
    const dueDay = property?.dueDay;
    const paymentStatus = tenant.paymentStatus;

    const tone = String(req.query.tone || "polite");
    const channel = String(req.query.channel || "whatsapp");

    const prompt = [
      "You write rent reminder messages for landlords.",
      "Return ONLY the message text, no quotes, no markdown.",
      "",
      `Tenant name: ${tenant.name}`,
      `Property: ${propertyName}`,
      `Rent amount: ${rent}`,
      `Due day of month: ${dueDay ?? "unknown"}`,
      `Current status: ${paymentStatus}`,
      `Preferred channel: ${channel}`,
      `Tone: ${tone}`,
      "",
      "Constraints:",
      "- Keep it under 450 characters",
      "- Include amount and due day (if known)",
      "- Include a gentle call-to-action to pay",
      "- Do not mention internal system details",
    ].join("\n");

    const text = await callAzureOpenAIText({ input: prompt, maxOutputTokens: 250 });
    res.json({ message: text });
  } catch (e) {
    const statusCode = e?.statusCode;
    if (statusCode) return res.status(statusCode).json({ error: e.message });
    sendApiError(res, e, "ai reminder-preview");
  }
});

router.get("/portfolio-summary", async (req, res) => {
  try {
    const [properties, tenants] = await Promise.all([
      Property.find({ landlordId: req.userId }).sort({ createdAt: -1 }).lean(),
      Tenant.find({ landlordId: req.userId }).populate("propertyId").sort({ createdAt: -1 }).lean(),
    ]);

    const pending = tenants.filter((t) => t.paymentStatus === "pending");
    const paid = tenants.filter((t) => t.paymentStatus === "paid");

    const tone = String(req.query.tone || "actionable");

    const lines = pending.slice(0, 30).map((t) => {
      const p = t.propertyId;
      return `- ${t.name} | ${p?.name || "property"} | rent ${t.rentAmount} | due ${p?.dueDay ?? "?"} | phone ${t.phone || "-"}`;
    });

    const prompt = [
      "You are an AI rent automation assistant for a landlord dashboard.",
      "Write a concise summary and next-step plan.",
      "Return plain text only (no markdown).",
      "",
      `Total properties: ${properties.length}`,
      `Total tenants: ${tenants.length}`,
      `Paid tenants: ${paid.length}`,
      `Pending tenants: ${pending.length}`,
      "",
      "Pending list (max 30):",
      ...lines,
      "",
      `Tone: ${tone}`,
      "",
      "Output format:",
      "1) 2-3 sentence summary",
      "2) 3-6 bullet-like lines (start with '-') of recommended actions",
    ].join("\n");

    const text = await callAzureOpenAIText({ input: prompt, maxOutputTokens: 450 });
    res.json({ summary: text });
  } catch (e) {
    const statusCode = e?.statusCode;
    if (statusCode) return res.status(statusCode).json({ error: e.message });
    sendApiError(res, e, "ai portfolio-summary");
  }
});

export default router;

