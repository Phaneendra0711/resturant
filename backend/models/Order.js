import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    price: {
      type: Number,
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    image: {
      type: String,
      default: "",
    },

    // Customer's food preference/instruction
    preference: {
      type: String,
      default: "",
    },

    // Customer-side estimated preparation time
    estimatedMinutes: {
      type: Number,
      default: 25,
    },

    // Chef's working estimation
    chefEstimatedMinutes: {
      type: Number,
      default: 15,
    },

    // Individual item tracking
    status: {
      type: String,
      enum: [
        "NEW",
        "PREPARING",
        "READY",
        "ON_THE_WAY",
        "SERVED",
      ],
      default: "NEW",
    },

    // Chef timing
    acceptedAt: {
      type: Date,
      default: null,
    },

    readyAt: {
      type: Date,
      default: null,
    },

    chefId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      default: null,
    },

    chefName: {
      type: String,
      default: "",
    },

    // Waiter timing
    waiterAssignedAt: {
      type: Date,
      default: null,
    },

    servedAt: {
      type: Date,
      default: null,
    },

    waiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      default: null,
    },

    waiterName: {
      type: String,
      default: "",
    },
  },
  {
    _id: true,
  }
);

const orderSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: true,
  },

  tableNumber: {
    type: String,
    required: true,
  },

  // Each item now has its own tracking
  items: {
    type: [orderItemSchema],
    required: true,
  },

  totalAmount: {
    type: Number,
    required: true,
  },

  // Kept for compatibility with your existing system.
  // Later we will make this represent the overall order status.
  status: {
    type: String,
    enum: [
      "NEW",
      "PREPARING",
      "READY",
      "ON_THE_WAY",
      "SERVED",
    ],
    default: "NEW",
  },

  // Kept for compatibility with existing code
  chef: {
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      default: null,
    },
    name: {
      type: String,
      default: "",
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
    readyAt: {
      type: Date,
      default: null,
    },
  },

  // Kept for compatibility with existing code
  waiter: {
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      default: null,
    },
    name: {
      type: String,
      default: "",
    },
    assignedAt: {
      type: Date,
      default: null,
    },
    servedAt: {
      type: Date,
      default: null,
    },
  },

  paymentStatus: {
    type: String,
    default: "PENDING",
  },

  paymentMethod: {
    type: String,
    default: "",
  },

  amountPaid: {
    type: Number,
    default: 0,
  },

  paidAt: {
    type: Date,
    default: null,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },

  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const Order = mongoose.model("Order", orderSchema);

export default Order;