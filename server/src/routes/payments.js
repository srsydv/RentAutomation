import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import { PaymentHistory } from "../models/PaymentHistory.js";

const router = express.Router();
router.use(authMiddleware);

router.get("/history", async (req, res) => {
  const list = await PaymentHistory.find({ landlordId: req.userId })
    .populate("tenantId", "name")
    .sort({ month: -1, createdAt: -1 });
  res.json(list);
});

export default router;
