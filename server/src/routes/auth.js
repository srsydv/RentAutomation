import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { requireDb } from "../middleware/db.js";
import { sendApiError } from "../lib/apiError.js";
import { User } from "../models/User.js";

const router = express.Router();
router.use(requireDb);

router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password || password.length < 6) {
      return res.status(400).json({ error: "Valid email and password (min 6 chars) required" });
    }
    const exists = await User.findOne({ email: String(email).toLowerCase() });
    if (exists) return res.status(409).json({ error: "Email already registered" });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email: String(email).toLowerCase(), passwordHash });
    const token = signToken(user);
    res.status(201).json({ token, user: { id: user._id, email: user.email } });
  } catch (e) {
    sendApiError(res, e, "register");
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: String(email || "").toLowerCase() });
    if (!user || !(await bcrypt.compare(password || "", user.passwordHash))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = signToken(user);
    res.json({ token, user: { id: user._id, email: user.email } });
  } catch (e) {
    sendApiError(res, e, "login");
  }
});

function signToken(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }
  return jwt.sign({ sub: String(user._id), email: user.email }, secret, {
    expiresIn: "7d",
  });
}

export default router;
