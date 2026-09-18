import Staff from "../models/Staff.js";
import StaffSession from "../models/StaffSession.js";
import CreditTransaction from "../models/CreditTransaction.js";
import Order from "../models/Order.js";
import AssistanceRequest from "../models/AssistanceRequest.js";

export const startOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

/* =========================================================
   BASIC CREDIT TRANSACTION
========================================================= */

export async function addCredits({
  staffId,
  staffName = "",
  role,
  points,
  reason,
  orderId = null,
  itemId = "",
  assistanceId = null,
  elapsedSeconds = 0,
}) {
  if (!staffId || !points) return null;

  try {
    const transaction = await CreditTransaction.create({
      staffId,
      staffName,
      role: String(role).toUpperCase(),
      points,
      reason,
      orderId,
      itemId: String(itemId || ""),
      assistanceId,
      elapsedSeconds,
    });

    await Staff.findByIdAndUpdate(staffId, {
      $inc: {
        creditPoints: points,
      },
    });

    return transaction;
  } catch (error) {
    if (error.code === 11000) {
      return null;
    }

    throw error;
  }
};

/* =========================================================
   CHEF IDLE PENALTY
========================================================= */

const CHEF_IDLE_DELAY_SECONDS = 30;
const CHEF_IDLE_POINTS_PER_SECOND = 1;

export async function applyChefIdlePenalty({
  staffId,
  now = new Date(),
} = {}) {
  if (!staffId) {
    return {
      active: false,
      seconds: 0,
    };
  }

  const staff = await Staff.findById(staffId).select(
    "name role creditPoints chefIdleSince chefPenaltyStartedAt"
  );

  if (!staff || staff.role !== "CHEF") {
    return {
      active: false,
      seconds: 0,
    };
  }

  const activeSession = await StaffSession.findOne({
    staffId: String(staffId),
    logoutAt: null,
  }).sort({
    loginAt: -1,
  });

  if (!activeSession) {
    return {
      active: false,
      seconds: 0,
    };
  }

  const hasNewOrder = await Order.exists({
    status: "NEW",
  });

  const hasPreparingOrder = await Order.exists({
    items: {
      $elemMatch: {
        chefId: String(staffId),
        status: "PREPARING",
      },
    },
  });

  if (!hasNewOrder || hasPreparingOrder) {
    if (staff.chefIdleSince) {
      await Staff.findByIdAndUpdate(staffId, {
        $set: {
          chefIdleSince: null,
          chefPenaltyStartedAt: null,
        },
      });
    }

    return {
      active: false,
      seconds: 0,
    };
  }

  if (!staff.chefIdleSince) {
    await Staff.findByIdAndUpdate(staffId, {
      $set: {
        chefIdleSince: now,
        chefPenaltyStartedAt: null,
      },
    });

    return {
      active: false,
      seconds: 0,
    };
  }

  const elapsedSeconds = Math.max(
    0,
    Math.floor(
      (new Date(now).getTime() -
        new Date(staff.chefIdleSince).getTime()) /
        1000
    )
  );

  if (!staff.chefPenaltyStartedAt) {
    const penaltyStartedAt = new Date(
      new Date(staff.chefIdleSince).getTime() +
        CHEF_IDLE_DELAY_SECONDS * 1000
    );

    if (
      new Date(now).getTime() <
      penaltyStartedAt.getTime()
    ) {
      return {
        active: false,
        seconds: elapsedSeconds,
      };
    }

    await Staff.findByIdAndUpdate(staffId, {
      $set: {
        chefPenaltyStartedAt: penaltyStartedAt,
      },
    });

    return {
      active: true,
      seconds: 0,
      points: 0,
    };
  }

  const penaltyElapsedSeconds = Math.max(
    0,
    Math.floor(
      (new Date(now).getTime() -
        new Date(
          staff.chefPenaltyStartedAt
        ).getTime()) /
        1000
    )
  );

  if (penaltyElapsedSeconds <= 0) {
    return {
      active: true,
      seconds: 0,
      points: 0,
    };
  }

  const points =
    -penaltyElapsedSeconds *
    CHEF_IDLE_POINTS_PER_SECOND;

  const creditedUntil = new Date(
    new Date(
      staff.chefPenaltyStartedAt
    ).getTime() +
      penaltyElapsedSeconds * 1000
  );

  await addCredits({
    staffId,
    staffName: staff.name,
    role: "CHEF",
    points,
    reason: "CHEF_IDLE_PENALTY",
    elapsedSeconds: penaltyElapsedSeconds,
  });

  await Staff.findByIdAndUpdate(staffId, {
    $set: {
      chefIdleSince: creditedUntil,
      chefPenaltyStartedAt: creditedUntil,
    },
  });

  return {
    active: true,
    seconds: penaltyElapsedSeconds,
    points,
  };
}

/* =========================================================
   WAITER READY-WORK DETECTION
========================================================= */

const isServiceItem = (item) => {
  const serviceType = String(
    item?.serviceType || ""
  ).toUpperCase();

  const name = String(
    item?.name || ""
  )
    .trim()
    .toUpperCase();

  const category = String(
    item?.category || ""
  )
    .trim()
    .toUpperCase();

  if (serviceType === "SERVICE") {
    return true;
  }

  if (
    category === "BEVERAGES" ||
    category === "BEVERAGE"
  ) {
    return [
      "WATER BOTTLE",
      "COKE",
      "COCA COLA",
    ].includes(name);
  }

  return [
    "WATER BOTTLE",
    "COKE",
    "COCA COLA",
  ].includes(name);
};

const isFoodItem = (item) =>
  !isServiceItem(item);

const servicePreference = (item) =>
  String(
    item?.servicePreference ||
      item?.serviceGroup ||
      item?.preference ||
      "NOW"
  )
    .trim()
    .toUpperCase();

/* =========================================================
   CHECK WHETHER A SERVICE ITEM IS READY
========================================================= */

const serviceItemIsReady = (
  order,
  serviceItem
) => {
  if (!isServiceItem(serviceItem)) {
    return false;
  }

  if (serviceItem.status !== "WAITING") {
    return false;
  }

  const preference =
    servicePreference(serviceItem);

  if (
    preference === "NOW" ||
    preference === ""
  ) {
    return true;
  }

  const foodItems =
    order.items.filter(isFoodItem);

  if (preference === "FIRST") {
    const firstFood = foodItems[0];

    return Boolean(
      firstFood &&
        [
          "READY",
          "ON_THE_WAY",
          "SERVED",
        ].includes(firstFood.status)
    );
  }

  if (preference === "LAST") {
    const lastFood =
      foodItems[foodItems.length - 1];

    return Boolean(
      lastFood &&
        [
          "READY",
          "ON_THE_WAY",
          "SERVED",
        ].includes(lastFood.status)
    );
  }

  return true;
};

/* =========================================================
   CHECK READY ITEMS

   Ready work includes:

   FOOD
   SERVICE
   ASSISTANCE
========================================================= */

const waiterHasReadyWork = async () => {
  const orders = await Order.find({
    "items.status": {
      $in: [
        "READY",
        "WAITING",
      ],
    },
  }).select("items");

  for (const order of orders) {
    for (const item of order.items) {
      if (
        isFoodItem(item) &&
        item.status === "READY"
      ) {
        return true;
      }

      if (
        isServiceItem(item) &&
        serviceItemIsReady(
          order,
          item
        )
      ) {
        return true;
      }
    }
  }

  /* Assistance itself counts as ready work. */
  const assistanceExists =
    await AssistanceRequest.exists({
      status: "ACTIVE",
    });

  return Boolean(
    assistanceExists
  );
};

/* =========================================================
   WAITER ACTIVE INDIVIDUAL TASK COUNT
========================================================= */

const getWaiterActiveTaskCount =
  async (staffId) => {
    const orders = await Order.find({
      items: {
        $elemMatch: {
          status: "ON_THE_WAY",
          waiterId: String(staffId),
        },
      },
    }).select("items");

    const groups = new Set();

    orders.forEach((order) => {
      order.items.forEach((item) => {
        if (
          item.status !==
            "ON_THE_WAY" ||
          String(
            item.waiterId || ""
          ) !==
            String(staffId)
        ) {
          return;
        }

        const preference =
          servicePreference(item);

        let groupId;

        if (
          isServiceItem(item) &&
          preference === "NOW"
        ) {
          groupId =
            `SERVICE_${String(
              item._id
            )}`;
        } else {
          groupId =
            item.waiterTaskGroup ||
            String(item._id);
        }

        groups.add(
          `${String(order._id)}:${groupId}`
        );
      });
    });

    const assistanceCount =
      await AssistanceRequest.countDocuments({
        status: "ACCEPTED",
        acceptedById: String(staffId),
      });

    return (
      groups.size +
      assistanceCount
    );
  };

/* =========================================================
   WAITER IDLE PENALTY

   RULE:

   Waiter logged in
       ↓
   Ready work exists
       ↓
   Individual active tasks = 0
       ↓
   wait 30 seconds
       ↓
   -1 point / second
========================================================= */

const WAITER_IDLE_DELAY_SECONDS = 30;
const WAITER_IDLE_POINTS_PER_SECOND = 1;

export async function applyWaiterIdlePenalty({
  staffId,
  now = new Date(),
} = {}) {
  if (!staffId) {
    return {
      active: false,
      seconds: 0,
    };
  }

  const staff = await Staff.findById(
    staffId
  ).select(
    "name role creditPoints"
  );

  if (
    !staff ||
    staff.role !== "WAITER"
  ) {
    return {
      active: false,
      seconds: 0,
    };
  }

  /* =======================================================
     LOGIN → LOGOUT WINDOW
  ======================================================= */

  const activeSession =
    await StaffSession.findOne({
      staffId: String(staffId),
      loginAt: {
        $lte: now,
      },
      logoutAt: null,
    }).sort({
      loginAt: -1,
    });

  if (!activeSession) {
    return {
      active: false,
      seconds: 0,
    };
  }

  /* =======================================================
     READY WORK
  ======================================================= */

  const hasReadyWork =
    await waiterHasReadyWork();

  /* =======================================================
     ACTIVE TASKS
  ======================================================= */

  const activeTaskCount =
    await getWaiterActiveTaskCount(
      staffId
    );

  /* =======================================================
     NO READY WORK OR ACTIVE TASK EXISTS

     RESET IDLE TIMER
  ======================================================= */

  if (
    !hasReadyWork ||
    activeTaskCount > 0
  ) {
    if (
      activeSession.waiterIdleSince ||
      activeSession.waiterPenaltyStartedAt
    ) {
      activeSession.waiterIdleSince =
        null;

      activeSession.waiterPenaltyStartedAt =
        null;

      await activeSession.save();
    }

    return {
      active: false,
      seconds: 0,
    };
  }

  /* =======================================================
     START 30 SECOND GRACE TIMER
  ======================================================= */

  if (
    !activeSession.waiterIdleSince
  ) {
    activeSession.waiterIdleSince =
      now;

    activeSession.waiterPenaltyStartedAt =
      null;

    await activeSession.save();

    return {
      active: false,
      seconds: 0,
    };
  }

  const elapsedSeconds =
    Math.max(
      0,
      Math.floor(
        (new Date(now).getTime() -
          new Date(
            activeSession.waiterIdleSince
          ).getTime()) /
          1000
      )
    );

  /* =======================================================
     30 SECOND GRACE PERIOD
  ======================================================= */

  if (
    !activeSession.waiterPenaltyStartedAt
  ) {
    const penaltyStartedAt =
      new Date(
        new Date(
          activeSession.waiterIdleSince
        ).getTime() +
          WAITER_IDLE_DELAY_SECONDS *
            1000
      );

    if (
      new Date(now).getTime() <
      penaltyStartedAt.getTime()
    ) {
      return {
        active: false,
        seconds: elapsedSeconds,
      };
    }

    activeSession.waiterPenaltyStartedAt =
      penaltyStartedAt;

    await activeSession.save();

    return {
      active: true,
      seconds: 0,
      points: 0,
    };
  }

  /* =======================================================
     DEDUCT 1 POINT / SECOND
  ======================================================= */

  const penaltyElapsedSeconds =
    Math.max(
      0,
      Math.floor(
        (new Date(now).getTime() -
          new Date(
            activeSession.waiterPenaltyStartedAt
          ).getTime()) /
          1000
      )
    );

  if (
    penaltyElapsedSeconds <= 0
  ) {
    return {
      active: true,
      seconds: 0,
      points: 0,
    };
  }

  const points =
    -penaltyElapsedSeconds *
    WAITER_IDLE_POINTS_PER_SECOND;

  const creditedUntil =
    new Date(
      new Date(
        activeSession.waiterPenaltyStartedAt
      ).getTime() +
        penaltyElapsedSeconds *
          1000
    );

  await addCredits({
    staffId,
    staffName: staff.name,
    role: "WAITER",
    points,
    reason: "WAITER_IDLE_PENALTY",
    elapsedSeconds:
      penaltyElapsedSeconds,
  });

  activeSession.waiterIdleSince =
    creditedUntil;

  activeSession.waiterPenaltyStartedAt =
    creditedUntil;

  await activeSession.save();

  return {
    active: true,
    seconds:
      penaltyElapsedSeconds,
    points,
  };
};

/* =========================================================
   DAILY WAITER INDIVIDUAL TASK COUNT
========================================================= */

export async function todayWaiterIndividualTaskCount(
  staffId
) {
  const start =
    startOfToday();

  return CreditTransaction.countDocuments({
    staffId,
    createdAt: {
      $gte: start,
    },
    reason: {
      $in: [
        "WAITER_FOOD_SERVED_BONUS",
        "WAITER_SERVICE_SERVED_BONUS",
        "WAITER_ASSISTANCE_BONUS",
      ],
    },
  });
}

/* =========================================================
   WAITER 100 / 50 COMPLETION BONUS

   First 100 individual tasks per day:

   FOOD       = +100
   SERVICE    = +50
   ASSISTANCE = +50

   No bonus after 100.
========================================================= */

export async function awardWaiterCompletionBonus({
  staffId,
  staffName = "",
  orderId = null,
  itemId = "",
  assistanceId = null,
  taskType,
} = {}) {
  if (!staffId) {
    return null;
  }

  const completedCount =
    await todayWaiterIndividualTaskCount(staffId);

  // BONUS ACTIVATES ONLY AFTER 100 TASKS ARE COMPLETED
  if (completedCount < 100) {
    return null;
  }

  let points = 0;
  let reason = "";

  if (taskType === "FOOD") {
    points = 100;
    reason = "WAITER_FOOD_100_LIMIT_BONUS";
  }

  if (taskType === "SERVICE") {
    points = 50;
    reason = "WAITER_SERVICE_100_LIMIT_BONUS";
  }

  if (taskType === "ASSISTANCE") {
    points = 50;
    reason = "WAITER_ASSISTANCE_100_LIMIT_BONUS";
  }

  if (!points) {
    return null;
  }

  return addCredits({
    staffId,
    staffName,
    role: "WAITER",
    points,
    reason,
    orderId,
    itemId,
    assistanceId,
  });
}

/* =========================================================
   LEGACY COMPATIBILITY
========================================================= */

export async function todayWaiterOrderCount(
  staffId,
  now = new Date()
) {
  return Order.countDocuments({
    status: "SERVED",
    items: {
      $elemMatch: {
        waiterId: String(staffId),
        servedAt: {
          $gte: startOfToday(),
          $lte: now,
        },
      },
    },
  });
}

export async function todayFoodServedCount(
  staffId
) {
  return CreditTransaction.countDocuments({
    staffId,
    reason: "WAITER_FOOD_SERVED",
    createdAt: {
      $gte: startOfToday(),
    },
  });
}