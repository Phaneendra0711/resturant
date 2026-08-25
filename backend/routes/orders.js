import express from "express";
import Order from "../models/Order.js";

const router = express.Router();

/*
  CREATE ORDER
  POST /api/orders
*/
router.post("/", async (req, res) => {
  try {
    console.log("🔥 CREATE ORDER ROUTE IS RUNNING");
    console.log("🔥 ORDER BODY:", req.body);

    const {
      customerName,
      items,
      totalAmount,
      paymentStatus,
      paymentMethod,
      amountPaid,
      paidAt,
      tableNumber,
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order must contain at least one item",
      });
    }

    console.log("🔥 CREATING ORDER WITH STATUS NEW");

    const order = await Order.create({
      customerName,
      items,
      totalAmount,

      // =========================
      // ORDER STATUS
      // =========================

      status: "NEW",

      // =========================
      // PAYMENT INFORMATION
      // =========================

      paymentStatus: paymentStatus || "PAID",
      paymentMethod: paymentMethod || "DEMO",
      amountPaid: amountPaid ?? totalAmount,
      paidAt: paidAt || new Date(),

      // =========================
      // TABLE
      // =========================

      tableNumber,

      // =========================
      // STAFF
      // =========================

      chef: {
        staffId: "",
        name: "",
        acceptedAt: null,
        readyAt: null,
      },

      waiter: {
        staffId: "",
        name: "",
        assignedAt: null,
        servedAt: null,
      },
    });

    console.log("ORDER CREATED:", order);

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order,
    });
  } catch (error) {
    console.error("Create order error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create order",
      error: error.message,
    });
  }
});


/*
  GET ALL ORDERS
  GET /api/orders
*/
router.get("/", async (req, res) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Get orders error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
});


/*
  GET ONE ORDER
  GET /api/orders/:id
*/
router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findById(
      req.params.id
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Get order error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch order",
      error: error.message,
    });
  }
});


/*
  UPDATE ORDER STATUS
  PATCH /api/orders/:id/status
*/
router.patch("/:id/status", async (req, res) => {
  try {
    const {
      status,
      staffId,
      staffName,
      staffRole,
    } = req.body;

    const allowedStatuses = [
      "NEW",
      "PREPARING",
      "READY",
      "ON_THE_WAY",
      "SERVED",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
    }

    const order = await Order.findById(
      req.params.id
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const now = new Date();

    /*
      =========================
      CHEF ACTIONS
      =========================
    */

    if (
      staffRole === "chef" &&
      status === "PREPARING"
    ) {
      order.chef = {
        staffId: staffId || "",
        name: staffName || "",
        acceptedAt:
          order.chef?.acceptedAt || now,
        readyAt:
          order.chef?.readyAt || null,
      };
    }

    if (
      staffRole === "chef" &&
      status === "READY"
    ) {
      order.chef = {
        staffId:
          staffId ||
          order.chef?.staffId ||
          "",

        name:
          staffName ||
          order.chef?.name ||
          "",

        acceptedAt:
          order.chef?.acceptedAt || now,

        readyAt: now,
      };
    }


    /*
      =========================
      WAITER ACTIONS
      =========================
    */

    if (
      staffRole === "waiter" &&
      status === "ON_THE_WAY"
    ) {
      order.waiter = {
        staffId: staffId || "",
        name: staffName || "",
        assignedAt:
          order.waiter?.assignedAt || now,
        servedAt:
          order.waiter?.servedAt || null,
      };
    }

    if (
      staffRole === "waiter" &&
      status === "SERVED"
    ) {
      order.waiter = {
        staffId:
          staffId ||
          order.waiter?.staffId ||
          "",

        name:
          staffName ||
          order.waiter?.name ||
          "",

        assignedAt:
          order.waiter?.assignedAt || now,

        servedAt: now,
      };
    }


    /*
      =========================
      UPDATE STATUS
      =========================
    */

    order.status = status;

    await order.save();

    console.log(
      "ORDER UPDATED:",
      order._id,
      status,
      staffRole,
      staffName
    );

    res.json({
      success: true,
      message: "Order status updated",
      order,
    });

  } catch (error) {
    console.error(
      "Update order status error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to update order status",
      error: error.message,
    });
  }
});


export default router;