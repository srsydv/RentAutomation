import jwt from "jsonwebtoken";
import mongoose from "mongoose";

export function authMiddleware(req, res, next) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(503).json({ error: "JWT_SECRET is not configured on the server" });
  }

  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: "Missing token" });
  }

  try {
    const payload = jwt.verify(token, secret);
    if (!payload?.sub || !mongoose.Types.ObjectId.isValid(payload.sub)) {
      return res.status(401).json({ error: "Invalid token" });
    }
    req.userId = payload.sub;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}
