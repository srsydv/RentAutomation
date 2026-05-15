import mongoose from "mongoose";

const paymentHistorySchema = new mongoose.Schema(
  {
    landlordId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true },
    propertyId: { type: mongoose.Schema.Types.ObjectId, ref: "Property", required: true },
    month: { type: String, required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ["paid", "pending"], required: true },
  },
  { timestamps: true }
);

paymentHistorySchema.index({ landlordId: 1, tenantId: 1, month: 1 }, { unique: true });

export const PaymentHistory =
  mongoose.models.PaymentHistory ||
  mongoose.model("PaymentHistory", paymentHistorySchema);
