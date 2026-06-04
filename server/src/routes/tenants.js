import express from "express";
import mongoose from "mongoose";
import { authMiddleware } from "../middleware/auth.js";
import { requireDb } from "../middleware/db.js";
import { sendApiError } from "../lib/apiError.js";
import { Tenant } from "../models/Tenant.js";
import { Property } from "../models/Property.js";
import { PaymentHistory } from "../models/PaymentHistory.js";
import { Notification } from "../models/Notification.js";

const router = express.Router();
router.use(authMiddleware);
router.use(requireDb);

function monthKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

router.get("/", async (req, res) => {
  const list = await Tenant.find({ landlordId: req.userId })
    .populate("propertyId")
    .sort({ createdAt: -1 });
  res.json(list);
});

router.post("/", async (req, res) => {
  try {
    const { propertyId, name, phone, rentAmount } = req.body;
    if (!propertyId || !name || rentAmount == null) {
      return res.status(400).json({ error: "propertyId, name, rentAmount required" });
    }
    const prop = await Property.findOne({ _id: propertyId, landlordId: req.userId });
    if (!prop) return res.status(404).json({ error: "Property not found" });
    const rent = Number(rentAmount);
    if (!Number.isFinite(rent) || rent < 0) {
      return res.status(400).json({ error: "rentAmount must be a valid number ≥ 0" });
    }
    const tenant = await Tenant.create({
      landlordId: new mongoose.Types.ObjectId(req.userId),
      propertyId,
      name: String(name).trim(),
      phone: phone ? String(phone).trim() : "",
      rentAmount: rent,
      paymentStatus: "pending",
    });
    res.status(201).json(tenant);
  } catch (e) {
    sendApiError(res, e, "tenants create");
  }
});

router.patch("/:id/status", async (req, res) => {
  const { paymentStatus } = req.body;
  if (!["paid", "pending"].includes(paymentStatus)) {
    return res.status(400).json({ error: "paymentStatus must be paid or pending" });
  }
  const tenant = await Tenant.findOne({ _id: req.params.id, landlordId: req.userId });
  if (!tenant) return res.status(404).json({ error: "Not found" });
  tenant.paymentStatus = paymentStatus;
  await tenant.save();

  const prop = await Property.findById(tenant.propertyId);
  const month = monthKey();
  await PaymentHistory.findOneAndUpdate(
    { tenantId: tenant._id, month },
    {
      landlordId: req.userId,
      tenantId: tenant._id,
      propertyId: tenant.propertyId,
      month,
      amount: tenant.rentAmount,
      status: paymentStatus,
    },
    { upsert: true, new: true }
  );

  if (paymentStatus === "paid") {
    await Notification.create({
      userId: req.userId,
      title: "Payment received",
      message: `Rent marked paid for ${tenant.name} (${prop?.name || "property"}) — ₹${tenant.rentAmount}.`,
      type: "payment_received",
    });
  }

  res.json(tenant);
});

router.delete("/:id", async (req, res) => {
  const t = await Tenant.findOneAndDelete({ _id: req.params.id, landlordId: req.userId });
  if (!t) return res.status(404).json({ error: "Not found" });
  await PaymentHistory.deleteMany({ tenantId: t._id });
  res.json({ ok: true });
});

export default router;
