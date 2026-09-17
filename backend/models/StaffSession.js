import mongoose from "mongoose";

const staffSessionSchema = new mongoose.Schema(
  {
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", required: true, index: true },
    role: { type: String, required: true },
    loginAt: { type: Date, required: true, default: Date.now },
    logoutAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("StaffSession", staffSessionSchema);
