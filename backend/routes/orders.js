import express from "express";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import Staff from "../models/Staff.js";
import AssistanceRequest from "../models/AssistanceRequest.js";

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
      chefDescription,
      waiterDescription,
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

      items: items.map((item) => ({
        name: item.name,
        category: item.category || "",
        price: item.price,
        quantity: item.quantity,
        image: item.image || "",
      })),

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

      chefDescription: chefDescription || "",

      waiterDescription: waiterDescription || "",

      // =========================
      // STAFF
      // =========================

      chef: {
        staffId: "",
        name: "",
        acceptedAt: null,
        readyAt: null,
        targetMinutes: 15,
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
  const session = await mongoose.startSession();

  try {
    const {
      status,
      staffId,
      staffName,
      staffRole,
    } = req.body;

    const normalizedStaffRole =
      String(staffRole || "")
        .trim()
        .toLowerCase();

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

    /*
      ==================================================
      CHEF ACCEPT ORDER
      ==================================================

      Rules:

      1. Order must still be NEW.
      2. Order must be one of the oldest 5 NEW orders.
      3. Chef must have fewer than 2 PREPARING orders.
      4. Order must not already belong to another chef.
      5. Successful chef gets ownership of the order.
    */

    if (
      normalizedStaffRole === "chef" &&
      status === "PREPARING"
    ) {
      if (!staffId) {
        return res.status(400).json({
          success: false,
          message: "Chef identity is required",
        });
      }

      await session.withTransaction(async () => {

        /*
          --------------------------------------------
          STEP 1: CHECK CHEF'S CURRENT PREPARING COUNT
          --------------------------------------------
        */

        const preparingCount =
          await Order.countDocuments({
            status: "PREPARING",
            "chef.staffId": staffId,
          }).session(session);

        if (preparingCount >= 2) {
          const error = new Error(
            "You already have 2 orders in preparation"
          );

          error.statusCode = 409;

          throw error;
        }

        /*
          --------------------------------------------
          STEP 2: GET OLDEST 5 NEW ORDERS
          --------------------------------------------
        */

        const oldestFive =
          await Order.find({
            status: "NEW",
          })
            .sort({
              createdAt: 1,
              _id: 1,
            })
            .limit(5)
            .session(session);

        /*
          --------------------------------------------
          STEP 3: CHECK WHETHER THIS ORDER IS
                  INSIDE THE FIFO TOP 5
          --------------------------------------------
        */

        const requestedOrderId =
          String(req.params.id);

        const isInFifoQueue =
          oldestFive.some(
            (order) =>
              String(order._id) ===
              requestedOrderId
          );

        if (!isInFifoQueue) {
          const error = new Error(
            "This order is outside the oldest 5 FIFO queue"
          );

          error.statusCode = 409;

          throw error;
        }

        /*
          --------------------------------------------
          STEP 4: CLAIM THE ORDER ATOMICALLY
          --------------------------------------------
        */

        const now = new Date();

        const claimedOrder =
          await Order.findOneAndUpdate(
            {
              _id: req.params.id,

              // Order must still be NEW
              status: "NEW",

              // Nobody else should own it
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

                "chef.performance":
                  "",
              },
            },
            {
              new: true,
              session,
            }
          );

        if (!claimedOrder) {
          const error = new Error(
            "This order was already accepted by another chef"
          );

          error.statusCode = 409;

          throw error;
        }

        /*
          --------------------------------------------
          SAVE SUCCESS RESULT
          --------------------------------------------
        */

        req.claimedOrder =
          claimedOrder;
      });

      console.log(
        "CHEF ACCEPTED ORDER:",
        req.claimedOrder._id,
        "Chef:",
        staffName,
        "Chef ID:",
        staffId
      );

      return res.json({
        success: true,
        message: "Order accepted successfully",
        order: req.claimedOrder,
      });
    }


    /*
      ==================================================
      CHEF MARK READY
      ==================================================
    */

    if (
      staffRole === "chef" &&
      status === "READY"
    ) {
      if (!staffId) {
        return res.status(400).json({
          success: false,
          message: "Chef identity is required",
        });
      }

      const now = new Date();

      const order =
        await Order.findOneAndUpdate(
          {
            _id: req.params.id,

            // Must still be preparing
            status: "PREPARING",

            // Only the chef who owns it can finish it
            "chef.staffId": staffId,
          },
          {
            $set: {
              status: "READY",

              "chef.readyAt":
                now,
            },
          },
          {
            new: true,
          }
        );

      if (!order) {
        return res.status(409).json({
          success: false,
          message:
            "This order is not assigned to you or is no longer preparing",
        });
      }

      console.log(
        "CHEF MARKED READY:",
        order._id,
        "Chef:",
        staffName,
        "Chef ID:",
        staffId
      );

      return res.json({
        success: true,
        message: "Order marked as ready",
        order,
      });
    }


    /*
      ==================================================
      WAITER ACCEPT ORDER
      ==================================================
    
      RULES:
    
      1. Waiter must have a valid identity.
      2. Waiter can have only ONE active task.
      3. The active task can be an ORDER or ASSISTANCE.
      4. Only the top 3 READY orders can be accepted.
      5. Waiter task is locked atomically using Staff.waiterTask.
    */

    if (
      normalizedStaffRole === "waiter" &&
      status === "ON_THE_WAY"
    ) {
      if (!staffId) {
        return res.status(400).json({
          success: false,
          message: "Waiter identity is required",
        });
      }

      try {
        /*
          ==================================================
          STEP 1: CHECK WAITER CURRENT TASK
          ==================================================
        */

        const waiter =
          await Staff.findOne({
            _id: staffId,
            role: "WAITER",
            active: true,
          });

        if (!waiter) {
          return res.status(404).json({
            success: false,
            message: "Waiter not found or inactive",
          });
        }

        /*
          --------------------------------------------------
          NO CURRENT TASK
          --------------------------------------------------
        */

        if (!waiter.waiterTask) {
          const lockedWaiter =
            await Staff.findOneAndUpdate(
              {
                _id: staffId,
                role: "WAITER",
                active: true,
                $or: [
                  { waiterTask: "" },
                  { waiterTask: null },
                  { waiterTask: { $exists: false } },
                ],
              },
              {
                $set: {
                  waiterTask: "ORDER",
                },
              },
              {
                new: true,
              }
            );

          if (!lockedWaiter) {
            return res.status(409).json({
              success: false,
              message:
                "You already have an active task. Complete it before accepting another order.",
            });
          }
        }

        /*
          ==================================================
          CURRENT TASK = ASSISTANCE
          ==================================================
      
          Assistance blocks the waiter for 5 minutes.
      
          After 5 minutes:
          - waiter may accept an order
          - assistance remains visible until 8 minutes
        */

        else if (
          waiter.waiterTask === "ASSISTANCE"
        ) {
          const assistance =
            await mongoose.model(
              "AssistanceRequest"
            ).findOne({
              status: "ACCEPTED",
              acceptedById: staffId,
            });

          /*
            ------------------------------------------------
            NO ACTIVE ASSISTANCE FOUND
            ------------------------------------------------
          */

          if (!assistance) {
            const unlockedWaiter =
              await Staff.findOneAndUpdate(
                {
                  _id: staffId,
                  waiterTask: "ASSISTANCE",
                },
                {
                  $set: {
                    waiterTask: "",
                  },
                },
                {
                  new: true,
                }
              );

            if (!unlockedWaiter) {
              return res.status(409).json({
                success: false,
                message:
                  "Unable to update waiter task",
              });
            }

            /*
              Try to claim the waiter again.
            */

            const lockedWaiter =
              await Staff.findOneAndUpdate(
                {
                  _id: staffId,
                  role: "WAITER",
                  active: true,
                  waiterTask: "",
                },
                {
                  $set: {
                    waiterTask: "ORDER",
                  },
                },
                {
                  new: true,
                }
              );

            if (!lockedWaiter) {
              return res.status(409).json({
                success: false,
                message:
                  "You already have an active task.",
              });
            }
          } else {
            /*
              ------------------------------------------------
              CHECK 5-MINUTE RULE
              ------------------------------------------------
            */

            const acceptedAt =
              assistance.acceptedAt
                ? new Date(
                  assistance.acceptedAt
                ).getTime()
                : 0;

            const elapsed =
              Date.now() - acceptedAt;

            const fiveMinutes =
              5 * 60 * 1000;

            if (elapsed < fiveMinutes) {
              return res.status(409).json({
                success: false,
                message:
                  "You must complete 5 minutes of assistance before accepting an order.",
              });
            }

            /*
              ------------------------------------------------
              5 MINUTES PASSED
              ------------------------------------------------
      
              The waiter can now switch from:
      
              ASSISTANCE → ORDER
      
              The assistance request itself remains
              ACCEPTED and visible until 8 minutes.
            */

            const switchedWaiter =
              await Staff.findOneAndUpdate(
                {
                  _id: staffId,
                  role: "WAITER",
                  active: true,
                  waiterTask: "ASSISTANCE",
                },
                {
                  $set: {
                    waiterTask: "ORDER",
                  },
                },
                {
                  new: true,
                }
              );

            if (!switchedWaiter) {
              return res.status(409).json({
                success: false,
                message:
                  "You already have another active task.",
              });
            }
          }
        }

        /*
          ==================================================
          CURRENT TASK = ORDER
          ==================================================
        */

        else if (
          waiter.waiterTask === "ORDER"
        ) {
          /*
            ==================================================
            VERIFY THAT THE WAITER REALLY OWNS AN ACTIVE ORDER
            ==================================================
        
            waiterTask can become stale if the browser/server was
            closed or an older order was removed/changed.
        
            Only block the waiter if an actual ON_THE_WAY order
            belongs to this waiter.
          */

          const activeOrder = await Order.findOne({
            status: "ON_THE_WAY",
            "waiter.staffId": staffId,
          });

          if (activeOrder) {
            return res.status(409).json({
              success: false,
              message:
                "You already have an accepted order. Serve it before accepting another order.",
            });
          }

          /*
            No real active order exists.
        
            Therefore the ORDER task is stale.
            Automatically clear it.
          */

          console.log(
            "CLEARING STALE WAITER ORDER TASK:",
            staffId
          );

          await Staff.findOneAndUpdate(
            {
              _id: staffId,
              role: "WAITER",
              active: true,
              waiterTask: "ORDER",
            },
            {
              $set: {
                waiterTask: "",
              },
            }
          );

          /*
            Continue normally.
            The waiter is now considered free.
          */
        }

        /*
          ==================================================
          STEP 2: GET TOP 3 READY ORDERS
          ==================================================
        */

        const topThreeReadyOrders =
          await Order.find({
            status: "READY",
          })
            .sort({
              "chef.readyAt": 1,
              createdAt: 1,
              _id: 1,
            })
            .limit(3);

        const requestedOrderId =
          String(req.params.id);

        const isTopThree =
          topThreeReadyOrders.some(
            (readyOrder) =>
              String(readyOrder._id) ===
              requestedOrderId
          );

        if (!isTopThree) {
          /*
            If we changed the waiter from ASSISTANCE
            to ORDER but the requested order is not
            top 3, restore the assistance task.
          */

          const currentWaiter =
            await Staff.findOne({
              _id: staffId,
            });

          if (
            currentWaiter &&
            currentWaiter.waiterTask === "ORDER"
          ) {
            const assistance =
              await mongoose.model(
                "AssistanceRequest"
              ).findOne({
                status: "ACCEPTED",
                acceptedById: staffId,
              });

            if (assistance) {
              const acceptedAt =
                new Date(
                  assistance.acceptedAt
                ).getTime();

              const elapsed =
                Date.now() - acceptedAt;

              if (
                elapsed <
                8 * 60 * 1000
              ) {
                await Staff.findOneAndUpdate(
                  {
                    _id: staffId,
                    waiterTask: "ORDER",
                  },
                  {
                    $set: {
                      waiterTask: "ASSISTANCE",
                    },
                  }
                );
              } else {
                await Staff.findOneAndUpdate(
                  {
                    _id: staffId,
                    waiterTask: "ORDER",
                  },
                  {
                    $set: {
                      waiterTask: "",
                    },
                  }
                );
              }
            } else {
              await Staff.findOneAndUpdate(
                {
                  _id: staffId,
                  waiterTask: "ORDER",
                },
                {
                  $set: {
                    waiterTask: "",
                  },
                }
              );
            }
          }

          return res.status(409).json({
            success: false,
            message:
              "This order is not currently in the top 3 READY orders.",
          });
        }

        /*
          ==================================================
          STEP 3: CLAIM READY ORDER
          ==================================================
        */

        const now = new Date();

        const order =
          await Order.findOneAndUpdate(
            {
              _id: req.params.id,

              status: "READY",

              $or: [
                {
                  "waiter.staffId": "",
                },
                {
                  "waiter.staffId": null,
                },
                {
                  "waiter.staffId": {
                    $exists: false,
                  },
                },
              ],
            },
            {
              $set: {
                status: "ON_THE_WAY",

                "waiter.staffId":
                  staffId,

                "waiter.name":
                  staffName || "",

                "waiter.assignedAt":
                  now,

                "waiter.servedAt":
                  null,
              },
            },
            {
              new: true,
            }
          );

        /*
          ==================================================
          CLAIM FAILED
          ==================================================
        */

        if (!order) {
          /*
            We obtained the ORDER lock but failed to
            claim the actual order.
      
            Check whether the waiter still has an
            accepted assistance request.
          */

          const assistance =
            await mongoose.model(
              "AssistanceRequest"
            ).findOne({
              status: "ACCEPTED",
              acceptedById: staffId,
            });

          if (assistance) {
            const acceptedAt =
              new Date(
                assistance.acceptedAt
              ).getTime();

            const elapsed =
              Date.now() - acceptedAt;

            if (
              elapsed <
              8 * 60 * 1000
            ) {
              await Staff.findOneAndUpdate(
                {
                  _id: staffId,
                  waiterTask: "ORDER",
                },
                {
                  $set: {
                    waiterTask: "ASSISTANCE",
                  },
                }
              );
            } else {
              await Staff.findOneAndUpdate(
                {
                  _id: staffId,
                  waiterTask: "ORDER",
                },
                {
                  $set: {
                    waiterTask: "",
                  },
                }
              );
            }
          } else {
            await Staff.findOneAndUpdate(
              {
                _id: staffId,
                waiterTask: "ORDER",
              },
              {
                $set: {
                  waiterTask: "",
                },
              }
            );
          }

          return res.status(409).json({
            success: false,
            message:
              "This order was already assigned to another waiter or is no longer ready",
          });
        }

        /*
          ==================================================
          SUCCESS
          ==================================================
        */

        console.log(
          "WAITER ACCEPTED ORDER:",
          order._id,
          "Waiter:",
          staffName,
          "Waiter ID:",
          staffId
        );

        return res.json({
          success: true,
          message:
            "Order assigned to waiter successfully",
          order,
        });
      } catch (error) {
        console.error(
          "Waiter accept order error:",
          error
        );

        const statusCode =
          error.statusCode || 500;

        return res.status(statusCode).json({
          success: false,
          message:
            error.message ||
            "Failed to accept order",
        });
      }
    }

    /*
      ==================================================
      WAITER MARK SERVED
      ==================================================
    */

    if (
      normalizedStaffRole === "waiter" &&
      status === "SERVED"
    ) {
      if (!staffId) {
        return res.status(400).json({
          success: false,
          message: "Waiter identity is required",
        });
      }

      /*
        --------------------------------------------------
        ONLY THE WAITER WHO OWNS THE ORDER
        CAN MARK IT AS SERVED
        --------------------------------------------------
      */

      const now = new Date();

      const order =
        await Order.findOneAndUpdate(
          {
            _id: req.params.id,

            // Order must still be on the way
            status: "ON_THE_WAY",

            // Current waiter MUST own the order
            "waiter.staffId": staffId,
          },

          {
            $set: {
              status: "SERVED",

              "waiter.servedAt":
                now,
            },
          },

          {
            new: true,
          }
        );

      /*
        --------------------------------------------------
        OWNERSHIP CHECK FAILED
        --------------------------------------------------
      */

      if (!order) {
        return res.status(409).json({
          success: false,
          message:
            "You cannot serve this order because it is assigned to another waiter or is no longer on the way",
        });
      }
      // ==================================================
      // RELEASE WAITER ORDER LOCK
      // ==================================================

      const releasedWaiter =
        await Staff.findOneAndUpdate(
          {
            _id: staffId,
            waiterTask: "ORDER",
          },
          {
            $set: {
              waiterTask: "",
            },
          },
          {
            new: true,
          }
        );

      if (!releasedWaiter) {
        console.error(
          "WARNING: Order was served but waiter task could not be released"
        );
      }

      console.log(
        "WAITER MARKED SERVED:",
        order._id,
        "Waiter:",
        staffName,
        "Waiter ID:",
        staffId
      );

      return res.json({
        success: true,
        message:
          "Order marked as served",
        order,
      });
    }


    /*
      ==================================================
      SECURITY: SERVED CAN ONLY BE DONE BY OWNER
      ==================================================
    */

    if (status === "SERVED") {
      return res.status(403).json({
        success: false,
        message:
          "Only the assigned waiter can mark this order as served",
      });
    }

    /*
      ==================================================
      OTHER STATUS UPDATES
      ==================================================
    */

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

    console.log(
      "ORDER UPDATED:",
      order._id,
      status,
      staffRole,
      staffName
    );

    return res.json({
      success: true,
      message:
        "Order status updated",
      order,
    });

  } catch (error) {

    console.error(
      "Update order status error:",
      error
    );

    const statusCode =
      error.statusCode || 500;

    return res.status(statusCode).json({
      success: false,
      message:
        error.message ||
        "Failed to update order status",
    });

  } finally {
    await session.endSession();
  }
});


export default router;