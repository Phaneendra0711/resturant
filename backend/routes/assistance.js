import express from "express";
import AssistanceRequest from "../models/AssistanceRequest.js";
import Staff from "../models/Staff.js";

const router = express.Router();


/*
==================================================
GET ALL ASSISTANCE REQUESTS
GET /api/assistance
==================================================
*/

router.get("/", async (req, res) => {
  try {
    const requests =
      await AssistanceRequest.find()
        .sort({
          createdAt: -1,
        });

    return res.json({
      success: true,
      requests,
    });

  } catch (error) {
    console.error(
      "Get assistance requests error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch assistance requests",
      error:
        error.message,
    });
  }
});


/*
==================================================
CREATE ASSISTANCE REQUEST
POST /api/assistance
==================================================
*/

router.post("/", async (req, res) => {
  try {

    const {
      customerName,
      tableNumber,
      message,
    } = req.body;


    const request =
      await AssistanceRequest.create({
        customerName:
          customerName || "Customer",

        tableNumber:
          tableNumber || "",

        message:
          message || "",

        status:
          "ACTIVE",

        acceptedById:
          null,

        acceptedByName:
          "",

        acceptedAt:
          null,

        completedAt:
          null,
      });


    return res.status(201).json({
      success: true,

      message:
        "Assistance request created",

      request,
    });

  } catch (error) {

    console.error(
      "Create assistance error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Failed to create assistance request",

      error:
        error.message,
    });
  }
});


/*
==================================================
ACCEPT ASSISTANCE
PATCH /api/assistance/:id/accept
==================================================

RULES:

1. Waiter must be active.
2. Maximum 2 active waiter tasks.
3. Assistance consumes ONE task slot.
4. There is NO 5-minute restriction.
5. Timer starts at acceptedAt.
6. Timer target = 8 minutes.
7. Assistance remains active until waiter
   presses PROBLEM SORTED.
==================================================
*/

router.patch(
  "/:id/accept",
  async (req, res) => {

    try {

      const {
        staffId,
        staffName,
        staffRole,
      } = req.body;


      if (
        String(staffRole || "")
          .trim()
          .toLowerCase() !==
        "waiter"
      ) {
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
      VERIFY WAITER
      --------------------------------------------------
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

          message:
            "Waiter not found or inactive",
        });
      }


      /*
      --------------------------------------------------
      COUNT ACTIVE TASKS
      --------------------------------------------------

      We count:

      FOOD
      WATER
      ASSISTANCE

      together.

      Maximum = 2.
      --------------------------------------------------
      */

      const activeFoodWaterTasks =
        await getActiveServiceTasks(
          staffId
        );


      const activeAssistanceTasks =
        await AssistanceRequest.countDocuments({
          status: "ACCEPTED",

          acceptedById:
            staffId,
        });


      const activeTaskCount =
        activeFoodWaterTasks +
        activeAssistanceTasks;


      if (
        activeTaskCount >= 2
      ) {
        return res.status(409).json({
          success: false,

          message:
            "You already have 2 active tasks. Finish one before accepting another.",
        });
      }


      /*
      --------------------------------------------------
      ATOMIC CLAIM
      --------------------------------------------------
      */

      const now =
        new Date();


      const request =
        await AssistanceRequest.findOneAndUpdate(
          {
            _id:
              req.params.id,

            status:
              "ACTIVE",
          },

          {
            $set: {
              status:
                "ACCEPTED",

              acceptedById:
                staffId,

              acceptedByName:
                staffName || "",

              acceptedAt:
                now,

              completedAt:
                null,
            },
          },

          {
            new: true,
          }
        );


      if (!request) {
        return res.status(409).json({
          success: false,

          message:
            "This assistance request was already accepted or completed.",
        });
      }


      console.log(
        "🔔 ASSISTANCE ACCEPTED:",
        request._id,

        "WAITER:",
        staffName,

        "START:",
        now
      );


      return res.json({
        success: true,

        message:
          "Assistance request accepted",

        request,
      });

    } catch (error) {

      console.error(
        "Accept assistance error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Failed to accept assistance request",

        error:
          error.message,
      });
    }
  }
);


/*
==================================================
COMPLETE ASSISTANCE
PATCH /api/assistance/:id/complete
==================================================

BUTTON:

    PROBLEM SORTED

Timer stops when completed.

IMPORTANT:

It does NOT automatically disappear
when 8 minutes passes.

The waiter must explicitly complete it.
==================================================
*/

router.patch(
  "/:id/complete",
  async (req, res) => {

    try {

      const {
        staffId,
        staffRole,
      } = req.body;


      if (
        String(staffRole || "")
          .trim()
          .toLowerCase() !==
        "waiter"
      ) {
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
      COMPLETE ONLY IF THIS WAITER OWNS IT
      --------------------------------------------------
      */

      const now =
        new Date();


      const request =
        await AssistanceRequest.findOneAndUpdate(
          {
            _id:
              req.params.id,

            status:
              "ACCEPTED",

            acceptedById:
              staffId,
          },

          {
            $set: {
              status:
                "COMPLETED",

              completedAt:
                now,
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
            "Active assistance request not found for this waiter.",
        });
      }


      console.log(
        "✅ ASSISTANCE COMPLETED:",
        request._id,

        "WAITER:",
        staffId,

        "COMPLETED:",
        now
      );


      return res.json({
        success: true,

        message:
          "Problem marked as sorted",

        request,
      });

    } catch (error) {

      console.error(
        "Complete assistance error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Failed to complete assistance request",

        error:
          error.message,
      });
    }
  }
);


/*
==================================================
HELPER
==================================================

Count active FOOD + WATER tasks belonging
to a waiter.

Food:
    item.status = ON_THE_WAY

Water/Coke:
    same item-level system

Assistance is counted separately.
==================================================
*/

async function getActiveServiceTasks(
  staffId
) {

  const orders =
    await import(
      "../models/Order.js"
    ).then(
      (module) =>
        module.default.find({
          "items.status":
            "ON_THE_WAY",

          "items.waiterId":
            staffId,
        }).select("items")
    );


  const activeGroups = new Set();


  orders.forEach(
    (order) => {

      order.items.forEach(
        (item) => {

          if (
            item.status ===
              "ON_THE_WAY" &&

            String(
              item.waiterId || ""
            ) ===
              String(staffId)
          ) {
            const preference = String(
              item.servicePreference || item.serviceGroup || ""
            ).toUpperCase();

            const groupId =
              item.serviceType === "SERVICE" && preference === "NOW"
                ? `SERVICE_${item._id}`
                : item.waiterTaskGroup || item._id;

            activeGroups.add(
              `${order._id}:${groupId}`
            );
          }

        }
      );

    }
  );


  return activeGroups.size;
}


export default router;
