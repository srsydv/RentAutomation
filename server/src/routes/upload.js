import express from "express";
import multer from "multer";
import { authMiddleware } from "../middleware/auth.js";
import { Tenant } from "../models/Tenant.js";
import { LeaseFile } from "../models/LeaseFile.js";
import { uploadBufferToBlob, isBlobConfigured } from "../services/blob.js";

const router = express.Router();
router.use(authMiddleware);
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!isBlobConfigured()) {
      return res.status(503).json({
        error: "Azure Blob Storage is not configured. Set AZURE_STORAGE_CONNECTION_STRING in .env",
      });
    }
    const { tenantId, docType } = req.body;
    if (!tenantId || !req.file) {
      return res.status(400).json({ error: "tenantId and file required" });
    }
    const tenant = await Tenant.findOne({ _id: tenantId, landlordId: req.userId });
    if (!tenant) return res.status(404).json({ error: "Tenant not found" });
    const dt = ["agreement", "id_proof", "other"].includes(docType) ? docType : "agreement";
    const url = await uploadBufferToBlob(req.file.originalname, req.file.buffer, req.file.mimetype);
    const doc = await LeaseFile.create({
      landlordId: req.userId,
      tenantId,
      fileName: req.file.originalname,
      blobUrl: url,
      docType: dt,
    });
    res.status(201).json(doc);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || "Upload failed" });
  }
});

router.get("/tenant/:tenantId", async (req, res) => {
  const tenant = await Tenant.findOne({ _id: req.params.tenantId, landlordId: req.userId });
  if (!tenant) return res.status(404).json({ error: "Not found" });
  const files = await LeaseFile.find({ tenantId: req.params.tenantId }).sort({ createdAt: -1 });
  res.json(files);
});

export default router;
