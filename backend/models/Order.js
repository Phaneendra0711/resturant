import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      default: "",
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

const staffAssignmentSchema = new mongoose.Schema(
  {
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

    assignedAt: {
      type: Date,
      default: null,
    },

    servedAt: {
      type: Date,
      default: null,
    },

    targetMinutes: {
      type: Number,
      default: 15,
    },

    performance: {
      type: String,
      enum: [
        "FAST",
        "PERFECT",
        "SLOW",
        "OUT_OF_TIME",
        "",
      ],
      default: "",
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      default: "Customer",
    },

    items: {
      type: [orderItemSchema],
      required: true,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

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

    tableNumber: {
      type: String,
      default: "",
    },

    couponCode: {
      type: String,
      default: "",
    },

    chefDescription: {
      type: String,
      default: "",
    },

    waiterDescription: {
      type: String,
      default: "",
    },

    chef: {
      type: staffAssignmentSchema,
      default: () => ({}),
    },

    waiter: {
      type: staffAssignmentSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model(
  "Order",
  orderSchema
);

export default Order;