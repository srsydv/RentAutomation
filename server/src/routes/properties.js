import express from "express";
import mongoose from "mongoose";
import { authMiddleware } from "../middleware/auth.js";
import { requireDb } from "../middleware/db.js";
import { sendApiError } from "../lib/apiError.js";
import {
  dropStaleIndexes,
  isPropertyContractIndexError,
} from "../lib/syncIndexes.js";
import { Property } from "../models/Property.js";
import { Tenant } from "../models/Tenant.js";

const router = express.Router();
router.use(authMiddleware);
router.use(requireDb);

router.get("/", async (req, res) => {
  try {
    const list = await Property.find({ landlordId: req.userId }).sort({ createdAt: -1 });
    res.json(list);
  } catch (e) {
    sendApiError(res, e, "properties list");
  }
});

async function createPropertyRecord(landlordId, name, rent, day) {
  return Property.create({
    landlordId,
    name: String(name).trim(),
    rentAmount: rent,
    dueDay: day,
  });
}

router.post("/", async (req, res) => {
  try {
    const { name, rentAmount, dueDay, tenantName, tenantPhone } = req.body;
    if (!name?.trim() || rentAmount == null || dueDay == null) {
      return res.status(400).json({ error: "name, rentAmount, dueDay required" });
    }

    const rent = Number(rentAmount);
    const day = Number(dueDay);
    if (!Number.isFinite(rent) || rent < 0) {
      return res.status(400).json({ error: "rentAmount must be a valid number ≥ 0" });
    }
    if (!Number.isInteger(day) || day < 1 || day > 31) {
      return res.status(400).json({ error: "dueDay must be an integer 1–31" });
    }

    const landlordId = new mongoose.Types.ObjectId(req.userId);
    let property;

    try {
      property = await createPropertyRecord(landlordId, name, rent, day);
    } catch (createErr) {
      if (isPropertyContractIndexError(createErr)) {
        console.warn(
          "propertyContractAddress_1 blocked insert — dropping stale index and retrying"
        );
        await dropStaleIndexes();
        property = await createPropertyRecord(landlordId, name, rent, day);
      } else {
        throw createErr;
      }
    }

    let tenant = null;
    const trimmedTenant = tenantName ? String(tenantName).trim() : "";
    if (trimmedTenant) {
      try {
        tenant = await Tenant.create({
          landlordId,
          propertyId: property._id,
          name: trimmedTenant,
          phone: tenantPhone ? String(tenantPhone).trim() : "",
          rentAmount: rent,
          paymentStatus: "pending",
        });
      } catch (tenantErr) {
        await Property.findByIdAndDelete(property._id);
        throw tenantErr;
      }
    }

    res.status(201).json({ property, tenant });
  } catch (e) {
    sendApiError(res, e, "properties create");
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const p = await Property.findOneAndDelete({ _id: req.params.id, landlordId: req.userId });
    if (!p) return res.status(404).json({ error: "Not found" });
    await Tenant.deleteMany({ propertyId: p._id });
    res.json({ ok: true });
  } catch (e) {
    sendApiError(res, e, "properties delete");
  }
});

export default router;
