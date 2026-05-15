import express from "express";
import PDFDocument from "pdfkit";
import { authMiddleware } from "../middleware/auth.js";
import { Tenant } from "../models/Tenant.js";
import { Property } from "../models/Property.js";
import { PaymentHistory } from "../models/PaymentHistory.js";

const router = express.Router();
router.use(authMiddleware);

router.get("/rent-report.pdf", async (req, res) => {
  const tenants = await Tenant.find({ landlordId: req.userId }).populate("propertyId");
  const history = await PaymentHistory.find({ landlordId: req.userId })
    .populate("tenantId", "name")
    .sort({ month: -1 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=rent-report.pdf");

  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(res);
  doc.fontSize(20).text("Rent report", { underline: true });
  doc.moveDown();
  doc.fontSize(12).text(`Generated: ${new Date().toISOString().slice(0, 10)}`);
  doc.moveDown();
  doc.fontSize(14).text("Tenants", { underline: true });
  doc.moveDown(0.5);
  tenants.forEach((t) => {
    const p = t.propertyId;
    doc.fontSize(11).text(
      `• ${t.name} — ${p?.name || "-"} — ₹${t.rentAmount} — ${t.paymentStatus} — ${t.phone || "-"}`
    );
  });
  doc.moveDown();
  doc.fontSize(14).text("Payment history", { underline: true });
  doc.moveDown(0.5);
  history.forEach((h) => {
    const tn = h.tenantId?.name || "—";
    doc.fontSize(11).text(`• ${h.month} — ${tn} — ₹${h.amount} — ${h.status}`);
  });
  doc.end();
});

export default router;
