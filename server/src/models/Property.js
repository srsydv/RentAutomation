import mongoose from "mongoose";

const propertySchema = new mongoose.Schema(
  {
    landlordId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    rentAmount: { type: Number, required: true, min: 0 },
    dueDay: { type: Number, required: true, min: 1, max: 31 },
  },
  { timestamps: true }
);

export const Property =
  mongoose.models.Property || mongoose.model("Property", propertySchema);
