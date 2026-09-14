import express from "express";
import AssistanceRequest from "../models/AssistanceRequest.js";
import Staff from "../models/Staff.js";

const router = express.Router();

/*
  ==================================================
  CREATE ASSISTANCE REQUEST
  POST /api/assistance
  ==================================================
*/

router.post("/", async (req, res) => {
    try {
        const { customerName, tableNumber } = req.body;

        if (!customerName || !customerName.trim()) {
            return res.status(400).json({
                success: false,
                message: "Customer name is required",
            });
        }

        if (!tableNumber) {
            return res.status(400).json({
                success: false,
                message: "Table number is required",
            });
        }

        const validTables = Array.from(
            { length: 30 },
            (_, i) => String(i + 1)
        );

        if (!validTables.includes(String(tableNumber))) {
            return res.status(400).json({
                success: false,
                message: "Invalid table number",
            });
        }

        const request = await AssistanceRequest.create({
            customerName: customerName.trim(),
            tableNumber: String(tableNumber),
            status: "ACTIVE",
            requestedAt: new Date(),
        });

        return res.status(201).json({
            success: true,
            message: "Waiter assistance requested",
            request,
        });
    } catch (error) {
        console.error(
            "Create assistance request error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to create assistance request",
        });
    }
});


/*
  ==================================================
  GET ASSISTANCE REQUESTS
  GET /api/assistance
  GET /api/assistance?status=ACTIVE
  ==================================================
*/

router.get("/", async (req, res) => {
    try {
        const { status } = req.query;

        const filter = {};

        if (status) {
            filter.status =
                String(status).toUpperCase();
        }

        const requests =
            await AssistanceRequest.find(filter)
                .sort({
                    requestedAt: -1,
                    _id: -1,
                })
                .lean();

        /*
          --------------------------------------------------
          REMOVE ACCEPTED ASSISTANCE AFTER 8 MINUTES
          --------------------------------------------------
        */

        const now = Date.now();

        const visibleRequests =
            requests.filter((request) => {
                if (
                    request.status !== "ACCEPTED" ||
                    !request.acceptedAt
                ) {
                    return true;
                }

                const acceptedTime =
                    new Date(
                        request.acceptedAt
                    ).getTime();

                const elapsed =
                    now - acceptedTime;

                // 8 minutes
                const eightMinutes =
                    8 * 60 * 1000;

                return elapsed < eightMinutes;
            });

        return res.json({
            success: true,
            requests: visibleRequests,
        });
    } catch (error) {
        console.error(
            "Get assistance requests error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch assistance requests",
        });
    }
});


/*
  ==================================================
  ACCEPT ASSISTANCE REQUEST
  PATCH /api/assistance/:id/accept
  ==================================================

  RULES:

  1. Only a waiter can accept.
  2. Waiter must be active.
  3. Waiter can only have one task.
  4. Assistance becomes the waiter's task.
  5. The 5-minute waiting period starts here.
*/

router.patch("/:id/accept", async (req, res) => {
    try {
        const { id } = req.params;

        const {
            staffId,
            staffName,
            staffRole,
        } = req.body;

        const normalizedRole =
            String(staffRole || "")
                .trim()
                .toLowerCase();

        if (normalizedRole !== "waiter") {
            return res.status(403).json({
                success: false,
                message:
                    "Only waiters can accept assistance requests",
            });
        }

        if (!staffId) {
            return res.status(400).json({
                success: false,
                message:
                    "Waiter identity is required",
            });
        }

        /*
          --------------------------------------------------
          STEP 1: ATOMICALLY LOCK WAITER
          --------------------------------------------------
        */

        const waiter =
            await Staff.findOneAndUpdate(
                {
                    _id: staffId,
                    role: "WAITER",
                    active: true,

                    // Waiter must have no current task
                    waiterTask: "",
                },
                {
                    $set: {
                        waiterTask: "ASSISTANCE",
                    },
                },
                {
                    new: true,
                }
            );

        if (!waiter) {
            return res.status(409).json({
                success: false,
                message:
                    "You already have an active task. Complete it before accepting assistance.",
            });
        }

        /*
          --------------------------------------------------
          STEP 2: ACCEPT ASSISTANCE
          --------------------------------------------------
        */

        const now = new Date();

        const request =
            await AssistanceRequest.findOneAndUpdate(
                {
                    _id: id,

                    // Request must still be available
                    status: "ACTIVE",
                },
                {
                    $set: {
                        status: "ACCEPTED",

                        acceptedAt: now,

                        acceptedBy:
                            staffName || staffId,

                        acceptedById:
                            staffId,
                    },
                },
                {
                    new: true,
                }
            );

        /*
          --------------------------------------------------
          ACCEPTANCE FAILED
          --------------------------------------------------
        */

        if (!request) {
            /*
              The waiter was locked above, so release the lock
              because the assistance could not be accepted.
            */

            await Staff.findOneAndUpdate(
                {
                    _id: staffId,
                    waiterTask: "ASSISTANCE",
                },
                {
                    $set: {
                        waiterTask: "",
                    },
                }
            );

            return res.status(409).json({
                success: false,
                message:
                    "This assistance request was already accepted or completed.",
            });
        }

        console.log(
            "ASSISTANCE ACCEPTED:",
            request._id,
            "Waiter:",
            staffName,
            "Waiter ID:",
            staffId
        );

        return res.json({
            success: true,
            message:
                "Assistance request accepted",
            request,
        });
    } catch (error) {
        console.error(
            "Accept assistance request error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to accept assistance request",
        });
    }
});


/*
  ==================================================
  COMPLETE ASSISTANCE REQUEST
  PATCH /api/assistance/:id/complete
  ==================================================
*/

router.patch(
    "/:id/complete",
    async (req, res) => {
        try {
            const { id } = req.params;

            const {
                staffId,
                staffName,
                staffRole,
            } = req.body;

            const normalizedRole =
                String(staffRole || "")
                    .trim()
                    .toLowerCase();

            if (normalizedRole !== "waiter") {
                return res.status(403).json({
                    success: false,
                    message:
                        "Only waiters can complete assistance requests",
                });
            }

            if (!staffId) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Waiter identity is required",
                });
            }

            /*
              --------------------------------------------------
              ONLY THE WAITER WHO ACCEPTED IT CAN COMPLETE IT
              --------------------------------------------------
            */

            const request =
                await AssistanceRequest.findOneAndUpdate(
                    {
                        _id: id,

                        status: "ACCEPTED",

                        acceptedBy:
                            staffName || staffId,
                    },
                    {
                        $set: {
                            status: "COMPLETED",

                            completedAt:
                                new Date(),

                            completedBy:
                                staffName || staffId,
                        },
                    },
                    {
                        new: true,
                    }
                );

            if (!request) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Assistance request not found, not accepted by you, or already completed",
                });
            }

            /*
              --------------------------------------------------
              RELEASE WAITER TASK
              --------------------------------------------------
            */

            await Staff.findOneAndUpdate(
                {
                    _id: staffId,

                    // Only release an assistance task
                    waiterTask: "ASSISTANCE",
                },
                {
                    $set: {
                        waiterTask: "",
                    },
                }
            );

            return res.json({
                success: true,
                message:
                    "Assistance request completed",
                request,
            });
        } catch (error) {
            console.error(
                "Complete assistance request error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to complete assistance request",
            });
        }
    }
);


export default router;