import mongoose from "mongoose";

const leaseFileSchema = new mongoose.Schema(
  {
    landlordId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true },
    fileName: { type: String, required: true },
    blobUrl: { type: String, required: true },
    docType: { type: String, enum: ["agreement", "id_proof", "other"], default: "agreement" },
  },
  { timestamps: true }
);

export const LeaseFile =
  mongoose.models.LeaseFile || mongoose.model("LeaseFile", leaseFileSchema);
