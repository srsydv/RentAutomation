import "dotenv/config";
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import authRoutes from "./routes/auth.js";
import propertyRoutes from "./routes/properties.js";
import tenantRoutes from "./routes/tenants.js";
import dashboardRoutes from "./routes/dashboard.js";
import paymentRoutes from "./routes/payments.js";
import notificationRoutes from "./routes/notifications.js";
import uploadRoutes from "./routes/upload.js";
import reportRoutes from "./routes/reports.js";
import { startReminderCron } from "./services/reminderCron.js";

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(__dirname, "../../client/dist");

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());

app.get("/health", (_req, res) => {
  const mongo =
    mongoose.connection.readyState === 1
      ? "connected"
      : mongoose.connection.readyState === 2
        ? "connecting"
        : "disconnected";
  res.json({
    ok: mongo === "connected",
    mongo,
    staticUi: fs.existsSync(clientDist),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/tenants", tenantRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/reports", reportRoutes);

if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist, { extensions: ["html"] }));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path === "/health") return next();
    res.sendFile(path.join(clientDist, "index.html"), (err) => {
      if (err) next(err);
    });
  });
}

const port = Number(process.env.PORT || 4000);
const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/rentlandlord";

app.listen(port, "0.0.0.0", () => {
  console.log(`Listening on port ${port}`);
  console.log(`Static UI path: ${clientDist} (exists: ${fs.existsSync(clientDist)})`);
  console.log(`MONGODB_URI configured: ${Boolean(process.env.MONGODB_URI)}`);
});

mongoose
  .connect(mongoUri)
  .then(() => {
    console.log("MongoDB connected");
    startReminderCron();
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    console.error(
      "Set MONGODB_URI in Azure Portal → App Service → Configuration → Application settings"
    );
  });
