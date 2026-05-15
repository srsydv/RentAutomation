import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import { Notification } from "../models/Notification.js";

const router = express.Router();
router.use(authMiddleware);

router.get("/", async (req, res) => {
  const list = await Notification.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(50);
  res.json(list);
});

router.patch("/:id/read", async (req, res) => {
  const n = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    { read: true },
    { new: true }
  );
  if (!n) return res.status(404).json({ error: "Not found" });
  res.json(n);
});

router.post("/read-all", async (req, res) => {
  await Notification.updateMany({ userId: req.userId, read: false }, { read: true });
  res.json({ ok: true });
});

export default router;
