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
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    // =========================
    // CUSTOMER INFORMATION
    // =========================

    customerName: {
      type: String,
      default: "Customer",
    },

    tableNumber: {
      type: String,
      default: "",
    },

    // =========================
    // ORDER ITEMS
    // =========================

    items: {
      type: [orderItemSchema],
      required: true,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    // =========================
    // ORDER STATUS
    // =========================

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

    // =========================
    // STAFF INFORMATION
    // =========================

    chef: {
      staffId: {
        type: String,
        default: "",
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

    waiter: {
      staffId: {
        type: String,
        default: "",
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

    // =========================
    // PAYMENT INFORMATION
    // =========================

    paymentStatus: {
      type: String,
      enum: [
        "PENDING",
        "PAID",
        "FAILED",
      ],
      default: "PENDING",
    },

    paymentMethod: {
      type: String,
      enum: [
        "UPI",
        "CARD",
        "CASH",
        "DEMO",
      ],
      default: "DEMO",
    },

    amountPaid: {
      type: Number,
      default: 0,
    },

    paidAt: {
      type: Date,
      default: null,
    },

    // =========================
    // IMPORTANT TIMESTAMPS
    // =========================

    createdAt: {
      type: Date,
      default: Date.now,
    },

    updatedAt: {
      type: Date,
      default: Date.now,
    },
  }
);

const Order = mongoose.model(
  "Order",
  orderSchema
);

export default Order;