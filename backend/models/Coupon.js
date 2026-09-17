import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, trim: true },
    amount: { type: Number, required: true, min: 1 },
    issuedById: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", required: true },
    issuedByName: { type: String, default: "" },
    source: { type: String, enum: ["CASH", "CREDIT"], default: "CASH" },
    redeemedAt: { type: Date, default: null },
    redeemedOrderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Coupon", couponSchema);
