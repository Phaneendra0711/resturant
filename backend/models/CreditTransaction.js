import mongoose from "mongoose";

// The ledger is append-only: staff balances can always be explained in the
// admin view without trying to reconstruct past timer calculations.
const creditTransactionSchema = new mongoose.Schema(
  {
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", required: true, index: true },
    staffName: { type: String, default: "" },
    role: { type: String, enum: ["CHEF", "WAITER"], required: true },
    points: { type: Number, required: true },
    reason: { type: String, required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
    itemId: { type: String, default: "" },
    assistanceId: { type: mongoose.Schema.Types.ObjectId, ref: "AssistanceRequest", default: null },
    elapsedSeconds: { type: Number, default: 0 },
  },
  { timestamps: true }
);

creditTransactionSchema.index({ staffId: 1, createdAt: -1 });
creditTransactionSchema.index({ orderId: 1, itemId: 1, reason: 1 });

export default mongoose.model("CreditTransaction", creditTransactionSchema);
