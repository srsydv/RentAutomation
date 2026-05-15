import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import { Property } from "../models/Property.js";
import { Tenant } from "../models/Tenant.js";

const router = express.Router();
router.use(authMiddleware);

router.get("/stats", async (req, res) => {
  const landlordId = req.userId;
  const [totalProperties, paidCount, pendingCount] = await Promise.all([
    Property.countDocuments({ landlordId }),
    Tenant.countDocuments({ landlordId, paymentStatus: "paid" }),
    Tenant.countDocuments({ landlordId, paymentStatus: "pending" }),
  ]);
  res.json({
    totalProperties,
    paidRents: paidCount,
    pendingRents: pendingCount,
  });
});

export default router;
