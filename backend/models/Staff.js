import mongoose from "mongoose";

const staffSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    passwordHash: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["ADMIN", "CHEF", "WAITER"],
      required: true,
    },

    active: {
      type: Boolean,
      default: true,
    },

    // ==========================================
    // WAITER CURRENT TASK
    // ==========================================
    waiterTask: {
      type: String,
      enum: ["", "ORDER", "ASSISTANCE"],
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const Staff = mongoose.model(
  "Staff",
  staffSchema
);

export default Staff;