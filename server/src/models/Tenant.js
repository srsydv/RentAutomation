import mongoose from "mongoose";

const tenantSchema = new mongoose.Schema(
  {
    landlordId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    propertyId: { type: mongoose.Schema.Types.ObjectId, ref: "Property", required: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, default: "", trim: true },
    rentAmount: { type: Number, required: true, min: 0 },
    paymentStatus: { type: String, enum: ["paid", "pending"], default: "pending" },
    reminderEveSentForMonth: { type: String, default: "" },
    reminderDaySentForMonth: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Tenant =
  mongoose.models.Tenant || mongoose.model("Tenant", tenantSchema);
