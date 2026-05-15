import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import { Property } from "../models/Property.js";
import { Tenant } from "../models/Tenant.js";

const router = express.Router();
router.use(authMiddleware);

router.get("/", async (req, res) => {
  const list = await Property.find({ landlordId: req.userId }).sort({ createdAt: -1 });
  res.json(list);
});

router.post("/", async (req, res) => {
  try {
    const { name, rentAmount, dueDay, tenantName, tenantPhone } = req.body;
    if (!name || rentAmount == null || dueDay == null) {
      return res.status(400).json({ error: "name, rentAmount, dueDay required" });
    }
    const day = Number(dueDay);
    if (day < 1 || day > 31) return res.status(400).json({ error: "dueDay must be 1–31" });
    const property = await Property.create({
      landlordId: req.userId,
      name: String(name).trim(),
      rentAmount: Number(rentAmount),
      dueDay: day,
    });
    let tenant = null;
    if (tenantName) {
      tenant = await Tenant.create({
        landlordId: req.userId,
        propertyId: property._id,
        name: String(tenantName).trim(),
        phone: tenantPhone ? String(tenantPhone).trim() : "",
        rentAmount: Number(rentAmount),
        paymentStatus: "pending",
      });
    }
    res.status(201).json({ property, tenant });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:id", async (req, res) => {
  const p = await Property.findOneAndDelete({ _id: req.params.id, landlordId: req.userId });
  if (!p) return res.status(404).json({ error: "Not found" });
  await Tenant.deleteMany({ propertyId: p._id });
  res.json({ ok: true });
});

export default router;
