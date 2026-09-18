import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, trim: true },
    amount: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: (value) => Number.isInteger(value) && value >= 0,
        message: "Coupon amount must be a whole non-negative number",
      },
    },
    customerName: { type: String, required: true, trim: true },
    tableNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 30,
      validate: {
        validator: (value) => Number.isInteger(value) && value >= 1 && value <= 30,
        message: "Table number must be between 1 and 30",
      },
    },
    issuedById: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", default: null },
    issuedByName: { type: String, default: "" },
    source: { type: String, enum: ["CASH", "CREDIT"], default: "CASH" },
    redeemedAt: { type: Date, default: null },
    redeemedOrderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Coupon", couponSchema);
