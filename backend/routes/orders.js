import express from "express";
import mongoose from "mongoose";

import Order from "../models/Order.js";
import AssistanceRequest from "../models/AssistanceRequest.js";
import Coupon from "../models/Coupon.js";
import { addCredits, todayWaiterOrderCount } from "../utils/credits.js";

const router = express.Router();

const compensationCode = () => `COMP-${String(Math.floor(10000 + Math.random() * 90000))}`;

const ensureCompensationCoupon = async (order, servedAt) => {
  const isServed = order.status === "SERVED";
  const completionTime = isServed
    ? order.waiter?.servedAt ||
      order.items.find((item) => item.servedAt)?.servedAt ||
      servedAt
    : servedAt;

  const estimateMinutes = (
    Number(order.customerEstimate?.firstMinutes || 0) +
    Number(order.customerEstimate?.lastMinutes || 0)
  ) / 2;
  const estimatedSeconds = Math.max(0, estimateMinutes * 60);
  const actualSeconds = secondsBetween(order.createdAt, completionTime);
  const delaySeconds = Math.max(0, actualSeconds - estimatedSeconds);
  if (delaySeconds <= 0) return null;
  const amount = Math.floor(delaySeconds / 6);

  if (order.compensationCouponCode) {
    const coupon = await Coupon.findOne({ code: order.compensationCouponCode });
    if (coupon && coupon.redeemedAt === null && coupon.amount !== amount) {
      coupon.amount = amount;
      await coupon.save();
    }
    if (order.compensationDelaySeconds !== Math.floor(delaySeconds) || order.compensationCouponAmount !== amount) {
      order.compensationCouponAmount = amount;
      order.compensationDelaySeconds = Math.floor(delaySeconds);
      await order.save();
    }
    return coupon;
  }

  let coupon = null;
  for (let attempt = 0; attempt < 10 && !coupon; attempt += 1) {
    try {
      coupon = await Coupon.create({
        code: compensationCode(),
        amount,
        customerName: order.customerName,
        tableNumber: Number(order.tableNumber) || 1,
        issuedByName: "SYSTEM COMPENSATION",
        source: "CREDIT",
        redeemedAt: null,
        redeemedOrderId: null,
      });
    } catch (error) {
      if (error.code !== 11000) throw error;
    }
  }

  if (!coupon) throw new Error("Could not generate compensation coupon");

  order.compensationCouponCode = coupon.code;
  order.compensationCouponAmount = amount;
  order.compensationDelaySeconds = Math.floor(delaySeconds);
  await order.save();
  return coupon;
};

/* =========================================================
   HELPERS
========================================================= */

const normalizeRole = (role) =>
  String(role || "").trim().toLowerCase();

/*
   IMPORTANT:
   ONLY Water Bottle and Coke are waiter-service items.

   Normal beverages such as:
   Fresh Watermelon Juice
   Milkshake
   Coffee
   etc.
   remain FOOD and go to the Chef.
*/
const isServiceItem = (item) => {
  const name = String(item?.name || "")
    .trim()
    .toUpperCase();

  const category = String(item?.category || "")
    .trim()
    .toUpperCase();

  if (category === "BEVERAGES" || category === "BEVERAGE") {
    return (
      name === "WATER BOTTLE" ||
      name === "COKE" ||
      name === "COCA COLA"
    );
  }

  if (String(item?.serviceType || "").toUpperCase() === "SERVICE") {
    return true;
  }

  return (
    name === "WATER BOTTLE" ||
    name === "COKE" ||
    name === "COCA COLA"
  );
};

/*
   Convert every possible Cart value into:
   NOW
   FIRST
   LAST
*/
const normalizeServicePreference = (item) => {
  const rawService = String(
    item?.servicePreference || ""
  )
    .trim()
    .toUpperCase();

  const rawPreference = String(
    item?.preference || ""
  )
    .trim()
    .toUpperCase();

  const raw = rawService || rawPreference;

  if (
    raw === "FIRST" ||
    raw.includes("FIRST") ||
    raw.includes("1ST")
  ) {
    return "FIRST";
  }

  if (
    raw === "LAST" ||
    raw.includes("LAST")
  ) {
    return "LAST";
  }

  return "NOW";
};

const isFood = (item) => !isServiceItem(item);

const getFoodPriorityValue = (item) => {
  const text = String(item?.preference || "").trim().toUpperCase();
  const match = text.match(/\d+/);
  return match ? Number(match[0]) : 999;
};

const secondsBetween = (from, to = new Date()) => Math.max(
  0,
  Math.floor((new Date(to).getTime() - new Date(from).getTime()) / 1000)
);

const chefTimerPoints = (item, finishedAt) => {
  const elapsedSeconds = secondsBetween(item.acceptedAt, finishedAt);
  if (elapsedSeconds < 15 * 60) {
    return { points: Math.floor((15 * 60 - elapsedSeconds) / 2), elapsedSeconds, reason: "CHEF_EARLY_READY" };
  }
  if (elapsedSeconds > 20 * 60) {
    return { points: -2 * (elapsedSeconds - 20 * 60), elapsedSeconds, reason: "CHEF_LATE_READY" };
  }
  return { points: 0, elapsedSeconds, reason: "CHEF_ORANGE_WINDOW" };
};

const waiterTimerPoints = (item, finishedAt) => {
  const elapsedSeconds = secondsBetween(item.waiterAssignedAt, finishedAt);
  const targetSeconds = (isFood(item) ? 8 : 5) * 60;
  if (elapsedSeconds <= targetSeconds) {
    const remainingSeconds = targetSeconds - elapsedSeconds;
    return { points: remainingSeconds, elapsedSeconds, reason: "WAITER_ON_TIME_SERVICE" };
  }

  return {
    points: -2 * (elapsedSeconds - targetSeconds),
    elapsedSeconds,
    reason: "WAITER_LATE_SERVICE",
  };
};

const getWaiterTaskGroup = (order, item) => {
  const preference = normalizeServicePreference(item);

  // A NOW service item is always independent. This also repairs legacy
  // orders whose stored group was created before the preference changed.
  if (!isFood(item) && preference === "NOW") {
    return `SERVICE_${String(item._id)}`;
  }

  if (item.waiterTaskGroup) {
    return String(item.waiterTaskGroup);
  }

  const foods = (order.items || []).filter(isFood);

  if (!isFood(item) && preference === "FIRST" && foods[0]) {
    return `FOOD_${String(foods[0]._id)}`;
  }

  if (!isFood(item) && preference === "LAST" && foods.at(-1)) {
    return `FOOD_${String(foods.at(-1)._id)}`;
  }

  return isFood(item)
    ? `FOOD_${String(item._id)}`
    : `SERVICE_${String(item._id)}`;
};

/* =========================================================
   OVERALL ORDER STATUS
========================================================= */

const updateOverallOrderStatus = (order) => {
  const items = order.items || [];

  if (items.length === 0) {
    order.status = "NEW";
    return;
  }

  const allServed = items.every(
    (item) => item.status === "SERVED"
  );

  if (allServed) {
    order.status = "SERVED";
    return;
  }

  // Order stage is driven only by food activity. Service items must not move
  // the overall order state while food is still pending.
  const foodItems = items.filter(isFood);

  if (foodItems.length > 0) {
    const hasStartedFood = foodItems.some(
      (item) =>
        ["PREPARING", "READY", "ON_THE_WAY", "SERVED"].includes(item.status)
    );

    if (!hasStartedFood) {
      order.status = "NEW";
      return;
    }

    order.status = "PREPARING";
    return;
  }

  order.status = "NEW";
};

/* =========================================================
   WAITER ACTIVE TASK COUNT
========================================================= */

const getActiveWaiterTaskCount = async (staffId) => {
  const orders = await Order.find({
    items: {
      $elemMatch: {
        waiterId: staffId,
        status: "ON_THE_WAY",
      },
    },
  }).select("items");

  const activeGroups = new Set();

  orders.forEach((order) => {
    order.items.forEach((item) => {
      if (
        item.status === "ON_THE_WAY" &&
        String(item.waiterId || "") === String(staffId)
      ) {
        activeGroups.add(
          `${order._id}:${getWaiterTaskGroup(order, item)}`
        );
      }
    });
  });

  const activeAssistance =
    await AssistanceRequest.countDocuments({
      status: "ACCEPTED",
      acceptedById: staffId,
    });

  return activeGroups.size + activeAssistance;
};

/* =========================================================
   CREATE ORDER
   POST /api/orders
========================================================= */

router.post("/", async (req, res) => {
  try {
    const {
      customerName,
      items,
      totalAmount,
      paymentStatus,
      paymentMethod,
      amountPaid,
      paidAt,
      tableNumber,
      couponCode,
      chefDescription,
      waiterDescription,
    } = req.body;

    console.log("=================================");
    console.log("CREATE ORDER");
    console.log("RAW ITEMS:");
    console.log(JSON.stringify(items, null, 2));
    console.log("=================================");

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order must contain at least one item",
      });
    }

    /*
      -------------------------------------------------------
      NORMALIZE ITEMS
      -------------------------------------------------------
    */

    const rawNormalizedItems = items.map((item) => {
      const service = isServiceItem(item);

      const servicePreference = service
        ? normalizeServicePreference(item)
        : "";

      return {
        ...item,

        quantity: Math.max(
          1,
          Number(item.quantity) || 1
        ),

        price: Number(item.price) || 0,

        serviceType: service
          ? "SERVICE"
          : "FOOD",

        servicePreference,

        serviceGroup: service
          ? servicePreference
          : "",

        waiterServiceTargetMinutes: service
          ? 5
          : 8,

        /*
          Keep original preference for display.
        */
        preference:
          item.preference ||
          (
            service
              ? servicePreference
              : ""
          ),
      };
    });

    /*
      -------------------------------------------------------
      FOOD ITEMS ONLY
      -------------------------------------------------------
    */

    const getPreferenceNumber = (item) => {
      const text = String(
        item.preference || ""
      ).toUpperCase();

      const match = text.match(/\d+/);

      return match
        ? Number(match[0])
        : 999;
    };

    const orderedItems = [...rawNormalizedItems].sort((a, b) => {
      const aPriority = getPreferenceNumber(a);
      const bPriority = getPreferenceNumber(b);

      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      return String(a.name || "").localeCompare(String(b.name || ""));
    });

    const foodItems = orderedItems.filter(
      (item) => item.serviceType === "FOOD"
    );

    if (foodItems.length === 0) {
      rawNormalizedItems.forEach((item) => {
        if (item.serviceType === "SERVICE") {
          item.servicePreference = "NOW";
          item.serviceGroup = "NOW";
          item.preference = "SERVE NOW";
        }
      });
    }

    /*
      -------------------------------------------------------
      CUSTOMER ESTIMATE
      -------------------------------------------------------
    */

    let customerFirstMinutes = 0;
    let customerLastMinutes = 0;

    if (foodItems.length > 0) {
      const firstQuantity = Math.max(
        1,
        Number(foodItems[0].quantity) || 1
      );

      const differentItems = foodItems.length;

      const extraQuantityMinutes =
        foodItems.reduce(
          (total, item) => {
            const quantity = Math.max(
              1,
              Number(item.quantity) || 1
            );

            return (
              total +
              (quantity - 1) * 5
            );
          },
          0
        );

      customerFirstMinutes =
        20 +
        (firstQuantity - 1) * 5;

      customerLastMinutes =
        15 +
        differentItems * 10 +
        extraQuantityMinutes;
    } else if (orderedItems.length === 1) {
      customerFirstMinutes = 10;
      customerLastMinutes = 10;
    }

    /*
      -------------------------------------------------------
      CHEF DEADLINE
      -------------------------------------------------------
    */

    const chefDeadline =
      foodItems.length > 0
        ? Math.max(
            20,
            customerLastMinutes - 10
          )
        : 0;

    /*
      -------------------------------------------------------
      CHEF TIMER DISTRIBUTION
      -------------------------------------------------------
    */

    const foodCount = foodItems.length;

    const step =
      foodCount > 1
        ? (chefDeadline - 20) /
          (foodCount - 1)
        : 0;

    /*
      -------------------------------------------------------
      BUILD FINAL ITEMS

      FOOD:
        chef timers

      SERVICE:
        no chef timers
    -------------------------------------------------------
    */

    let foodIndex = 0;

    const getPersistentTaskGroup = (item, service) => {
      if (!service) {
        return `FOOD_GROUP_${foodItems.indexOf(item) + 1}`;
      }

      if (item.servicePreference === "FIRST" && foodItems[0]) {
        return "FOOD_GROUP_1";
      }

      if (item.servicePreference === "LAST" && foodItems.length > 0) {
        return `FOOD_GROUP_${foodItems.length}`;
      }

      // NOW items are independent waiter tasks, even when an order has
      // multiple service items.
      return `SERVICE_NOW_${rawNormalizedItems.indexOf(item) + 1}`;
    };

    const calculatedItems =
      orderedItems.map((item) => {
        const service =
          item.serviceType === "SERVICE";

        const waiterTaskGroup = getPersistentTaskGroup(item, service);

        /*
          SERVICE ITEM
        */

        if (service) {
          return {
            name: item.name,
            category: item.category || "",
            price: Number(item.price) || 0,
            quantity: Math.max(
              1,
              Number(item.quantity) || 1
            ),
            image: item.image || "",

            serviceType: "SERVICE",

            servicePreference:
              item.servicePreference,

            whenToServe:
              item.servicePreference || "NOW",

            serviceGroup:
              item.servicePreference,

            waiterTaskGroup,

            waiterServiceTargetMinutes: 5,

            preference:
              item.preference || "",

            customerFirstMinutes: 0,
            customerLastMinutes: 0,

            chefGreenMinutes: 0,
            chefOrangeMinutes: 0,

            status: "WAITING",

            acceptedAt: null,
            readyAt: null,

            chefId: null,
            chefName: "",

            waiterAssignedAt: null,
            servedAt: null,

            waiterId: null,
            waiterName: "",
          };
        }

        /*
          FOOD ITEM
        */

        const index = foodIndex++;

        let chefGreenMinutes;

        if (foodCount === 1) {
          chefGreenMinutes = 15;
        } else {
          const rawMinutes =
            20 + index * step;

          chefGreenMinutes =
            Math.max(
              20,
              Math.floor(
                rawMinutes / 5
              ) * 5
            );
        }

        const chefOrangeMinutes =
          chefGreenMinutes + 5;

        return {
          name: item.name,
          category: item.category || "",
          price: Number(item.price) || 0,
          quantity: Math.max(
            1,
            Number(item.quantity) || 1
          ),
          image: item.image || "",

          serviceType: "FOOD",
          servicePreference: "",
          serviceGroup: "",

          waiterTaskGroup,

          waiterServiceTargetMinutes: 8,

          preference:
            item.preference || "",

          customerFirstMinutes:
            index === 0
              ? customerFirstMinutes
              : 0,

          customerLastMinutes:
            index === foodCount - 1
              ? customerLastMinutes
              : 0,

          chefGreenMinutes,
          chefOrangeMinutes,

          status: "ORDERED",

          acceptedAt: null,
          readyAt: null,

          chefId: null,
          chefName: "",

          waiterAssignedAt: null,
          servedAt: null,

          waiterId: null,
          waiterName: "",
        };
      });

    console.log(
      "SERVICE ITEMS:",
      calculatedItems
        .filter(
          (item) =>
            item.serviceType === "SERVICE"
        )
        .map((item) => ({
          name: item.name,
          servicePreference:
            item.servicePreference,
        }))
    );

    console.log(
      "CHEF ITEMS:",
      calculatedItems
        .filter(
          (item) =>
            item.serviceType === "FOOD"
        )
        .map((item) => ({
          name: item.name,
          preference: item.preference,
          green: item.chefGreenMinutes,
          orange: item.chefOrangeMinutes,
        }))
    );

    /*
      -------------------------------------------------------
      CREATE ORDER
      -------------------------------------------------------
    */

    const requestedCouponCode = String(couponCode || "").trim();
    const coupon = requestedCouponCode
      ? await Coupon.findOne({ code: requestedCouponCode, redeemedAt: null })
      : null;

    if (requestedCouponCode && !coupon) {
      return res.status(409).json({ success: false, message: "Coupon is invalid or has already been used" });
    }

    const foodSubtotal = calculatedItems
      .filter((item) => item.serviceType === "FOOD")
      .reduce((sum, item) => sum + item.price * item.quantity, 0);
    const grossTotal = calculatedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    ) + Math.round(foodSubtotal * 0.05);
    const finalTotal = coupon
      ? Math.max(0, grossTotal - coupon.amount)
      : grossTotal;

    const order = await Order.create({
      customerName:
        customerName || "Customer",

      tableNumber:
        tableNumber || "",

      items: calculatedItems,

      totalAmount:
        finalTotal,

      customerEstimate: {
        firstMinutes:
          customerFirstMinutes,

        lastMinutes:
          customerLastMinutes,
      },

      status: "NEW",

      paymentStatus:
        paymentStatus || "PAID",

      paymentMethod:
        paymentMethod || "DEMO",

      amountPaid:
        finalTotal,

      paidAt: paidAt
        ? new Date(paidAt)
        : null,

      couponCode: requestedCouponCode,

      chefDescription:
        chefDescription || "",

      waiterDescription:
        waiterDescription || "",

      chef: {
        staffId: "",
        name: "",
        acceptedAt: null,
        readyAt: null,
        targetMinutes:
          chefDeadline,
        performance: "",
      },

      waiter: {
        staffId: "",
        name: "",
        assignedAt: null,
        servedAt: null,
        targetMinutes: 8,
        performance: "",
      },
    });

    console.log(
      "ORDER CREATED:",
      order._id
    );

    if (coupon) {
      const redeemedCoupon = await Coupon.findOneAndUpdate(
        { _id: coupon._id, redeemedAt: null },
        { $set: { redeemedAt: new Date(), redeemedOrderId: order._id } },
        { new: true }
      );
      if (!redeemedCoupon) {
        await Order.findByIdAndDelete(order._id);
        return res.status(409).json({ success: false, message: "Coupon is invalid or has already been used" });
      }
    }

    return res.status(201).json({
      success: true,
      message:
        "Order created successfully",
      order,
    });
  } catch (error) {
    console.error(
      "CREATE ORDER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to create order",
      error: error.message,
    });
  }
});

/* =========================================================
   GET ALL ORDERS
========================================================= */

router.get("/", async (req, res) => {
  try {
    const orders = await Order.find({})
      .sort({
        createdAt: -1,
      });

    return res.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error(
      "GET ORDERS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch orders",
      error: error.message,
    });
  }
});

/* =========================================================
   GET SINGLE ORDER
========================================================= */

router.get("/:id", async (req, res) => {
  try {
    const order =
      await Order.findById(
        req.params.id
      );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const completionTime = order.status === "SERVED"
      ? order.waiter?.servedAt || order.items.find((item) => item.servedAt)?.servedAt || new Date()
      : new Date();
    await ensureCompensationCoupon(order, completionTime);

    return res.json({
      success: true,
      order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch order",
      error: error.message,
    });
  }
});

/* =========================================================
   CHEF ACCEPT ORDER

   PATCH /api/orders/:id/status

   PREPARING
========================================================= */

router.patch("/:id/status", async (req, res) => {
  const session =
    await mongoose.startSession();

  try {
    const {
      status,
      staffId,
      staffName,
      staffRole,
    } = req.body;

    const role =
      normalizeRole(staffRole);

    /*
      -------------------------------------------------------
      CHEF ACCEPT
      -------------------------------------------------------
    */

    if (
      role === "chef" &&
      status === "PREPARING"
    ) {
      if (!staffId) {
        return res.status(400).json({
          success: false,
          message:
            "Chef identity is required",
        });
      }

      const preparingCount =
        await Order.countDocuments({
          items: {
            $elemMatch: {
              chefId: staffId,
              status: "PREPARING",
            },
          },
        });

      if (preparingCount >= 2) {
        return res.status(409).json({
          success: false,
          message:
            "You already have 2 active orders.",
        });
      }

      const topFive =
        await Order.find({
          status: "NEW",
        })
          .sort({
            createdAt: 1,
            _id: 1,
          })
          .limit(5)
          .select("_id");

      const allowed =
        topFive.some(
          (item) =>
            String(item._id) ===
            String(req.params.id)
        );

      if (!allowed) {
        return res.status(409).json({
          success: false,
          message:
            "This order is not currently in the top 5 NEW orders.",
        });
      }

      const now = new Date();

      await session.withTransaction(
        async () => {
          const claimedOrder =
            await Order.findOneAndUpdate(
              {
                _id: req.params.id,
                status: "NEW",

                $or: [
                  {
                    "chef.staffId": "",
                  },
                  {
                    "chef.staffId": null,
                  },
                  {
                    "chef.staffId": {
                      $exists: false,
                    },
                  },
                ],
              },
              {
                $set: {
                  status: "PREPARING",

                  "chef.staffId":
                    staffId,

                  "chef.name":
                    staffName || "",

                  "chef.acceptedAt":
                    now,

                  "chef.readyAt":
                    null,
                },
              },
              {
                new: true,
                session,
              }
            );

          if (!claimedOrder) {
            const error =
              new Error(
                "This order was already accepted by another chef."
              );

            error.statusCode = 409;

            throw error;
          }

          /*
            START ALL FOOD TIMERS.

            SERVICE ITEMS DO NOT START
            CHEF TIMERS.
          */

          claimedOrder.items.forEach(
            (item) => {
              if (
                item.serviceType ===
                "SERVICE"
              ) {
                return;
              }

              item.status =
                "PREPARING";

              item.acceptedAt =
                now;

              item.readyAt =
                null;

              item.chefId =
                staffId;

              item.chefName =
                staffName || "";
            }
          );

          await claimedOrder.save({
            session,
          });

          req.claimedOrder =
            claimedOrder;
        }
      );

      return res.json({
        success: true,
        message:
          "Order accepted by chef",
        order:
          req.claimedOrder,
      });
    }

    /*
      Whole-order READY is disabled.
    */

    if (
      role === "chef" &&
      status === "READY"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Chef must mark food items READY individually.",
      });
    }

    /*
      Waiter must use item endpoint.
    */

    if (role === "waiter") {
      return res.status(400).json({
        success: false,
        message:
          "Waiter must handle individual items.",
      });
    }

    const order =
      await Order.findById(
        req.params.id
      );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    order.status = status;

    await order.save();

    return res.json({
      success: true,
      message:
        "Order status updated",
      order,
    });
  } catch (error) {
    console.error(
      "UPDATE ORDER STATUS ERROR:",
      error
    );

    return res.status(
      error.statusCode || 500
    ).json({
      success: false,
      message:
        error.message ||
        "Failed to update order status",
    });
  } finally {
    await session.endSession();
  }
});

/* =========================================================
   WAITER TASK GROUP STATUS

   A group is the unit a waiter claims and serves. This keeps a food
   item and its FIRST/LAST service items in the same task, timestamp,
   and capacity slot.
========================================================= */

router.patch(
  "/:orderId/waiter-groups/:groupId/status",
  async (req, res) => {
    try {
      const { status, staffId, staffName, staffRole } = req.body;

      if (normalizeRole(staffRole) !== "waiter") {
        return res.status(403).json({
          success: false,
          message: "Only waiters can update waiter task groups.",
        });
      }

      if (!staffId) {
        return res.status(400).json({
          success: false,
          message: "Waiter identity is required",
        });
      }

      if (!["ON_THE_WAY", "SERVED"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Waiter task groups can only be started or served.",
        });
      }

      const order = await Order.findById(req.params.orderId);

      if (!order) {
        return res.status(404).json({ success: false, message: "Order not found" });
      }

      const groupId = decodeURIComponent(req.params.groupId);
      let groupItems = order.items.filter(
        (item) => getWaiterTaskGroup(order, item) === groupId
      );

      // Legacy documents can contain a stale persisted `waiterTaskGroup`.
      // A serve-now service task is intentionally represented by the item's
      // ID in the UI (`SERVICE_<itemId>`), so resolve that item directly when
      // the stored legacy group does not match the calculated value.
      if (groupItems.length === 0 && groupId.startsWith("SERVICE_")) {
        const serviceItemId = groupId.slice("SERVICE_".length);
        const serviceItem = order.items.find(
          (item) =>
            !isFood(item) && String(item._id) === serviceItemId
        );

        if (serviceItem) {
          groupItems = [serviceItem];
        }
      }

      if (groupItems.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Waiter task group not found",
        });
      }

      const now = new Date();

      if (status === "ON_THE_WAY") {
        const invalidFood = groupItems.find(
          (item) => isFood(item) && item.status !== "READY"
        );

        if (invalidFood) {
          return res.status(409).json({
            success: false,
            message: `Food item "${invalidFood.name}" is not ready yet.`,
          });
        }

        const foodItems = order.items.filter(isFood);
        const unavailableService = groupItems.find((item) => {
          if (isFood(item) || item.status !== "WAITING") return false;

          const preference = String(
            item.servicePreference || item.serviceGroup || "NOW"
          ).toUpperCase();
          const relatedFood = preference === "FIRST"
            ? foodItems[0]
            : preference === "LAST"
              ? foodItems.at(-1)
              : null;

          return relatedFood && !["READY", "ON_THE_WAY", "SERVED"].includes(relatedFood.status);
        });

        if (unavailableService) {
          return res.status(409).json({
            success: false,
            message: `Service item "${unavailableService.name}" is not available yet.`,
          });
        }

        const alreadyClaimed = groupItems.some(
          (item) => item.status === "ON_THE_WAY"
        );

        if (alreadyClaimed) {
          return res.status(409).json({
            success: false,
            message: "This waiter task is already active.",
          });
        }

        const activeCount = await getActiveWaiterTaskCount(staffId);
        if (activeCount >= 2) {
          return res.status(409).json({
            success: false,
            message: "You already have 2 active waiter tasks. Complete one first.",
          });
        }

        groupItems.forEach((item) => {
          item.status = "ON_THE_WAY";
          item.waiterAssignedAt = now;
          item.waiterId = staffId;
          item.waiterName = staffName || "";
          if (!isFood(item)) {
            item.whenToServe = item.whenToServe || item.servicePreference || "NOW";
          }
        });

        order.waiter.staffId = staffId;
        order.waiter.name = staffName || "";
        order.waiter.assignedAt = order.waiter.assignedAt || now;
        updateOverallOrderStatus(order);
        await order.save();

        return res.json({
          success: true,
          message: "Waiter task group assigned",
          order,
          groupId,
        });
      }

      const unclaimedItem = groupItems.find(
        (item) => item.status !== "ON_THE_WAY"
      );
      if (unclaimedItem) {
        return res.status(409).json({
          success: false,
          message: "Every item in this waiter task must be on the way before serving.",
        });
      }

      const ownedByAnotherWaiter = groupItems.find(
        (item) => item.waiterId && String(item.waiterId) !== String(staffId)
      );
      if (ownedByAnotherWaiter) {
        return res.status(403).json({
          success: false,
          message: "This waiter task belongs to another waiter.",
        });
      }

      groupItems.forEach((item) => {
        item.status = "SERVED";
        item.servedAt = now;
        item.waiterId = staffId;
        item.waiterName = staffName || item.waiterName;
      });

      updateOverallOrderStatus(order);
      if (order.items.every((item) => item.status === "SERVED")) {
        order.waiter.servedAt = now;
      }
      await order.save();
      await ensureCompensationCoupon(order, now);

      const completedOrdersToday = await todayWaiterOrderCount(staffId, now);
      for (const servedItem of groupItems) {
        const timerPoints = waiterTimerPoints(servedItem, now);
        if (timerPoints.points !== 0) {
          await addCredits({
            staffId,
            staffName,
            role: "WAITER",
            points: timerPoints.points,
            reason: timerPoints.reason,
            orderId: order._id,
            itemId: String(servedItem._id),
            elapsedSeconds: timerPoints.elapsedSeconds,
          });
        }

        if (completedOrdersToday >= 101) {
          await addCredits({
            staffId,
            staffName,
            role: "WAITER",
            points: isFood(servedItem) ? 100 : 50,
            reason: isFood(servedItem) ? "WAITER_101ST_FOOD_BONUS" : "WAITER_101ST_SERVICE_BONUS",
            orderId: order._id,
            itemId: String(servedItem._id),
          });
        }
      }

      return res.json({
        success: true,
        message: "Waiter task group marked as served",
        order,
        groupId,
      });
    } catch (error) {
      console.error("UPDATE WAITER TASK GROUP ERROR:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to update waiter task group",
        error: error.message,
      });
    }
  }
);

/* =========================================================
   INDIVIDUAL ITEM STATUS

   PATCH
   /api/orders/:orderId/items/:itemId/status

   CHEF:
     PREPARING
     READY

   WAITER:
     ON_THE_WAY
     SERVED
========================================================= */

router.patch(
  "/:orderId/items/:itemId/status",
  async (req, res) => {
    try {
      const {
        status,
        staffId,
        staffName,
        staffRole,
      } = req.body;

      const role =
        normalizeRole(staffRole);

      const order =
        await Order.findById(
          req.params.orderId
        );

      if (!order) {
        return res.status(404).json({
          success: false,
          message:
            "Order not found",
        });
      }

      const item =
        order.items.id(
          req.params.itemId
        );

      if (!item) {
        return res.status(404).json({
          success: false,
          message:
            "Order item not found",
        });
      }

      const now = new Date();

      /* =====================================================
         CHEF → PREPARING
      ===================================================== */

      if (
        role === "chef" &&
        status === "PREPARING"
      ) {
        if (isServiceItem(item)) {
          return res.status(400).json({
            success: false,
            message:
              "Water/Coke are handled by the waiter.",
          });
        }

        item.status =
          "PREPARING";

        item.acceptedAt =
          item.acceptedAt ||
          now;

        item.chefId =
          staffId ||
          item.chefId;

        item.chefName =
          staffName ||
          item.chefName;

        order.status =
          "PREPARING";

        await order.save();

        return res.json({
          success: true,
          message:
            "Food item is preparing",
          order,
          item,
        });
      }

      /* =====================================================
         CHEF → READY

         STRICT SEQUENTIAL ORDER
      ===================================================== */

      if (
        role === "chef" &&
        status === "READY"
      ) {
        if (
          item.serviceType ===
          "SERVICE"
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Water/Coke are handled by the waiter.",
          });
        }

        const selectedIndex =
          order.items.findIndex(
            (orderItem) =>
              String(
                orderItem._id
              ) ===
              String(
                req.params.itemId
              )
          );

        const foodItems = [...order.items.filter(isFood)].sort(
          (a, b) => getFoodPriorityValue(a) - getFoodPriorityValue(b)
        );

        const foodIndex =
          foodItems.findIndex(
            (foodItem) =>
              String(
                foodItem._id
              ) ===
              String(
                req.params.itemId
              )
          );

        /*
          First food item can become READY.

          Every later food item requires
          all previous food items READY.
        */

        if (foodIndex > 0) {
          const previousFood =
            foodItems
              .slice(0, foodIndex)
              .find(
                (previous) =>
                  !["READY", "ON_THE_WAY", "SERVED"].includes(previous.status)
              );

          if (previousFood) {
            return res.status(409).json({
              success: false,
              message:
                `Please finish "${previousFood.name}" first.`,
            });
          }
        }

        if (selectedIndex === -1) {
          return res.status(404).json({
            success: false,
            message:
              "Order item not found",
          });
        }

        if (!["PREPARING", "ORDERED"].includes(item.status)) {
          return res.status(409).json({
            success: false,
            message: `Food item "${item.name}" is already ${item.status.replaceAll("_", " ")}.`,
          });
        }

        item.status =
          "READY";

        item.acceptedAt =
          item.acceptedAt ||
          now;

        item.readyAt =
          now;

        item.chefId =
          staffId ||
          item.chefId;

        item.chefName =
          staffName ||
          item.chefName;

        updateOverallOrderStatus(
          order
        );

        const allFoodReady =
          foodItems.length > 0 &&
          foodItems.every(
            (foodItem) =>
              foodItem.status ===
                "READY" ||
              foodItem.status ===
                "SERVED"
          );

        if (allFoodReady) {
          order.chef.readyAt =
            now;
        }

        await order.save();

        const timerCredit = chefTimerPoints(item, now);
        if (timerCredit.points !== 0) {
          await addCredits({
            staffId: item.chefId,
            staffName: item.chefName,
            role: "CHEF",
            points: timerCredit.points,
            reason: timerCredit.reason,
            orderId: order._id,
            itemId: String(item._id),
            elapsedSeconds: timerCredit.elapsedSeconds,
          });
        }

        return res.json({
          success: true,
          message:
            "Food item marked READY",
          order,
          item,
        });
      }

      /* =====================================================
         WAITER → ON THE WAY
      ===================================================== */

      if (
        role === "waiter" &&
        status === "ON_THE_WAY"
      ) {
        if (!staffId) {
          return res.status(400).json({
            success: false,
            message:
              "Waiter identity is required",
          });
        }

        /*
          FOOD:
          must already be READY.
        */

        if (
          item.serviceType !==
            "SERVICE" &&
          item.status !==
            "READY"
        ) {
          return res.status(409).json({
            success: false,
            message:
              "This food item is not ready yet.",
          });
        }

        /*
          SERVICE:
          must be waiting
          NOW  → immediately
          FIRST → first food ready
          LAST  → last food ready
        */

        if (
          item.serviceType ===
          "SERVICE" &&
          item.status !==
          "WAITING"
        ) {
          return res.status(409).json({
            success: false,
            message:
              "This service item is not waiting to be served.",
          });
        }

        if (
          item.serviceType ===
          "SERVICE"
        ) {
          const preference =
            String(
              item.servicePreference ||
              item.serviceGroup ||
              normalizeServicePreference(
                item
              )
            )
              .trim()
              .toUpperCase();

          const foodItems =
            order.items.filter(
              (foodItem) =>
                foodItem.serviceType !==
                "SERVICE"
            );

          if (
            preference ===
            "FIRST"
          ) {
            const firstFood =
              foodItems[0];

            if (
              !firstFood ||
              ![
                "READY",
                "ON_THE_WAY",
                "SERVED",
              ].includes(
                firstFood.status
              )
            ) {
              return res.status(409).json({
                success: false,
                message:
                  "This service item is waiting for the first food preference.",
              });
            }
          }

          if (
            preference ===
            "LAST"
          ) {
            const lastFood =
              foodItems[
                foodItems.length - 1
              ];

            if (
              !lastFood ||
              ![
                "READY",
                "ON_THE_WAY",
                "SERVED",
              ].includes(
                lastFood.status
              )
            ) {
              return res.status(409).json({
                success: false,
                message:
                  "This service item is waiting for the last food preference.",
              });
            }
          }
        }

        /*
          MAXIMUM TWO ACTIVE TASKS
        */

        const activeCount =
          await getActiveWaiterTaskCount(
            staffId
          );

        if (activeCount >= 2) {
          return res.status(409).json({
            success: false,
            message:
              "You already have 2 active waiter tasks. Complete one first.",
          });
        }

        /*
          START WAITER TIMER
        */

        item.status =
          "ON_THE_WAY";

        item.waiterAssignedAt =
          now;

        item.waiterId =
          staffId;

        item.waiterName =
          staffName || "";

        /*
          Compatibility fields
        */

        order.waiter.staffId =
          staffId;

        order.waiter.name =
          staffName || "";

        order.waiter.assignedAt =
          order.waiter.assignedAt ||
          now;

        updateOverallOrderStatus(
          order
        );

        await order.save();

        return res.json({
          success: true,
          message:
            "Item assigned to waiter",
          order,
          item,
        });
      }

      /* =====================================================
         WAITER → SERVED
      ===================================================== */

      if (
        role === "waiter" &&
        status === "SERVED"
      ) {
        if (!staffId) {
          return res.status(400).json({
            success: false,
            message:
              "Waiter identity is required",
          });
        }

        if (
          item.status !==
          "ON_THE_WAY"
        ) {
          return res.status(409).json({
            success: false,
            message:
              "This item is not currently being served.",
          });
        }

        if (
          item.waiterId &&
          String(item.waiterId) !==
            String(staffId)
        ) {
          return res.status(403).json({
            success: false,
            message:
              "This item belongs to another waiter.",
          });
        }

        item.status =
          "SERVED";

        item.servedAt =
          now;

        item.waiterId =
          staffId;

        item.waiterName =
          staffName ||
          item.waiterName;

        updateOverallOrderStatus(
          order
        );

        const allServed =
          order.items.every(
            (orderItem) =>
              orderItem.status ===
              "SERVED"
          );

        if (allServed) {
          order.waiter.servedAt =
            now;
        }

        await order.save();
        await ensureCompensationCoupon(order, now);

        return res.json({
          success: true,
          message:
            "Item marked as served",
          order,
          item,
        });
      }

      return res.status(403).json({
        success: false,
        message:
          "This staff role cannot perform this item status update.",
      });
    } catch (error) {
      console.error(
        "UPDATE ITEM STATUS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update item status",
        error: error.message,
      });
    }
  }
);

export default router;
