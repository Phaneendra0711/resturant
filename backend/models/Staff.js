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

    creditPoints: {
      type: Number,
      default: 0,
    },

    onlineAt: {
      type: Date,
      default: null,
    },

    // Tracks when a chef became idle while logged in and waiting for a task.
    chefIdleSince: {
      type: Date,
      default: null,
    },

    chefPenaltyStartedAt: {
      type: Date,
      default: null,
    },

    waiterIdleSince: {
      type: Date,
      default: null,
    },

    waiterPenaltyStartedAt: {
      type: Date,
      default: null,
    },

    // ==========================================
    // WAITER ACTIVE TASKS
    // ==========================================
    //
    // A waiter can have maximum 2 active tasks.
    //
    // Possible task types:
    // ORDER
    // ASSISTANCE
    // WATER
    //
    waiterTasks: {
      type: [
        {
          type: String,
          enum: [
            "ORDER",
            "ASSISTANCE",
            "WATER",
          ],
        },
      ],
      default: [],
      validate: {
        validator: function (tasks) {
          return tasks.length <= 2;
        },
        message:
          "A waiter can have maximum 2 active tasks",
      },
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
