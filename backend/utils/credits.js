import Staff from "../models/Staff.js";
import CreditTransaction from "../models/CreditTransaction.js";
import Order from "../models/Order.js";
import AssistanceRequest from "../models/AssistanceRequest.js";

export const startOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

export async function addCredits({ staffId, staffName = "", role, points, reason, orderId = null, itemId = "", assistanceId = null, elapsedSeconds = 0 }) {
  if (!staffId || points === 0) return null;

  try {
    const transaction = await CreditTransaction.create({
      staffId, staffName, role: String(role).toUpperCase(), points, reason,
      orderId, itemId: String(itemId || ""), assistanceId, elapsedSeconds,
    });
    await Staff.findByIdAndUpdate(staffId, { $inc: { creditPoints: points } });
    return transaction;
  } catch (error) {
    // Duplicate completion requests must not award points twice.
    if (error.code === 11000) return null;
    throw error;
  }
}

const CHEF_IDLE_PENALTY_DELAY_SECONDS = 30;
const CHEF_IDLE_PENALTY_PER_SECOND = 1;
const WAITER_IDLE_PENALTY_DELAY_SECONDS = 30;
const WAITER_IDLE_PENALTY_PER_SECOND = 1;

export async function applyChefIdlePenalty({ staffId, now = new Date() } = {}) {
  if (!staffId) return { active: false, seconds: 0 };

  const staff = await Staff.findById(staffId).select("name role onlineAt creditPoints chefIdleSince chefPenaltyStartedAt");

  if (!staff || staff.role !== "CHEF") return { active: false, seconds: 0 };

  if (!staff.onlineAt) {
    if (staff.chefIdleSince) {
      await Staff.findByIdAndUpdate(staffId, { $set: { chefIdleSince: null, chefPenaltyStartedAt: null } });
    }
    return { active: false, seconds: 0 };
  }

  const hasSharedNewOrderQueue = await Order.exists({
    status: "NEW",
    $or: [
      { "chef.staffId": { $in: [null, "", undefined] } },
      { "chef.staffId": { $ne: String(staffId) } },
    ],
  });

  const hasPreparingOrdersForThisChef = await Order.exists({
    $or: [
      { "chef.staffId": String(staffId), status: "PREPARING" },
      {
        items: {
          $elemMatch: {
            chefId: String(staffId),
            status: "PREPARING",
          },
        },
      },
    ],
  });

  if (!hasSharedNewOrderQueue || hasPreparingOrdersForThisChef) {
    if (staff.chefIdleSince) {
      await Staff.findByIdAndUpdate(staffId, { $set: { chefIdleSince: null, chefPenaltyStartedAt: null } });
    }
    return { active: false, seconds: 0 };
  }

  if (!staff.chefIdleSince) {
    await Staff.findByIdAndUpdate(staffId, { $set: { chefIdleSince: now, chefPenaltyStartedAt: null } });
    return { active: false, seconds: 0 };
  }

  const elapsedSeconds = Math.max(
    0,
    Math.floor((new Date(now).getTime() - new Date(staff.chefIdleSince).getTime()) / 1000)
  );

  if (!staff.chefPenaltyStartedAt) {
    const penaltyStartedAt = new Date(
      new Date(staff.chefIdleSince).getTime() + CHEF_IDLE_PENALTY_DELAY_SECONDS * 1000
    );
    if (new Date(now).getTime() < penaltyStartedAt.getTime()) {
      return { active: false, seconds: elapsedSeconds };
    }
    await Staff.findByIdAndUpdate(staffId, { $set: { chefPenaltyStartedAt: penaltyStartedAt } });
    return { active: true, seconds: 0, points: 0 };
  }

  const penaltyElapsedSeconds = Math.max(
    0,
    Math.floor((new Date(now).getTime() - new Date(staff.chefPenaltyStartedAt).getTime()) / 1000)
  );
  if (penaltyElapsedSeconds === 0) {
    return { active: true, seconds: 0, points: 0 };
  }

  const points = -(penaltyElapsedSeconds * CHEF_IDLE_PENALTY_PER_SECOND);
  const creditedUntil = new Date(
    new Date(staff.chefPenaltyStartedAt).getTime() + penaltyElapsedSeconds * 1000
  );

  await addCredits({
    staffId,
    staffName: staff.name,
    role: staff.role,
    points,
    reason: "CHEF_IDLE_PENALTY",
    elapsedSeconds: penaltyElapsedSeconds,
  });

  await Staff.findByIdAndUpdate(staffId, { $set: { chefIdleSince: creditedUntil, chefPenaltyStartedAt: creditedUntil } });

  return { active: true, seconds: penaltyElapsedSeconds, points };
}

export async function applyWaiterIdlePenalty({ staffId, now = new Date() } = {}) {
  if (!staffId) return { active: false, seconds: 0 };

  const staff = await Staff.findById(staffId).select("name role onlineAt waiterIdleSince waiterPenaltyStartedAt");
  if (!staff || staff.role !== "WAITER") return { active: false, seconds: 0 };

  if (!staff.onlineAt) {
    if (staff.waiterIdleSince) {
      await Staff.findByIdAndUpdate(staffId, { $set: { waiterIdleSince: null, waiterPenaltyStartedAt: null } });
    }
    return { active: false, seconds: 0 };
  }

  const candidateOrders = await Order.find({
    "items.status": { $in: ["READY", "WAITING"] },
  }).select("items");
  const hasReadyWork = candidateOrders.some((order) => {
    const foodItems = order.items.filter((item) => String(item.serviceType || "FOOD").toUpperCase() !== "SERVICE");
    return order.items.some((item) => {
      if (item.status === "READY") return true;
      if (item.status !== "WAITING" || String(item.serviceType || "").toUpperCase() !== "SERVICE") return false;

      const preference = String(item.servicePreference || item.serviceGroup || item.preference || "NOW").toUpperCase();
      if (preference === "NOW" || preference === "") return true;
      const relatedFood = preference.includes("LAST") ? foodItems.at(-1) : foodItems[0];
      return Boolean(relatedFood && ["READY", "ON_THE_WAY", "SERVED"].includes(relatedFood.status));
    });
  });
  const hasPendingAssistance = await AssistanceRequest.exists({
    status: "ACTIVE",
  });

  const hasActiveTask = await Order.exists({
    items: {
      $elemMatch: {
        status: "ON_THE_WAY",
        waiterId: String(staffId),
      },
    },
  }) || await AssistanceRequest.exists({
    status: "ACCEPTED",
    acceptedById: String(staffId),
  });

  if ((!hasReadyWork && !hasPendingAssistance) || hasActiveTask) {
    if (staff.waiterIdleSince) {
      await Staff.findByIdAndUpdate(staffId, { $set: { waiterIdleSince: null, waiterPenaltyStartedAt: null } });
    }
    return { active: false, seconds: 0 };
  }

  if (!staff.waiterIdleSince) {
    await Staff.findByIdAndUpdate(staffId, { $set: { waiterIdleSince: now, waiterPenaltyStartedAt: null } });
    return { active: false, seconds: 0 };
  }

  const elapsedSeconds = Math.max(
    0,
    Math.floor((new Date(now).getTime() - new Date(staff.waiterIdleSince).getTime()) / 1000)
  );

  if (!staff.waiterPenaltyStartedAt) {
    const penaltyStartedAt = new Date(
      new Date(staff.waiterIdleSince).getTime() + WAITER_IDLE_PENALTY_DELAY_SECONDS * 1000
    );
    if (new Date(now).getTime() < penaltyStartedAt.getTime()) {
      return { active: false, seconds: elapsedSeconds };
    }
    await Staff.findByIdAndUpdate(staffId, { $set: { waiterPenaltyStartedAt: penaltyStartedAt } });
    return { active: true, seconds: 0, points: 0 };
  }

  const penaltyElapsedSeconds = Math.max(
    0,
    Math.floor((new Date(now).getTime() - new Date(staff.waiterPenaltyStartedAt).getTime()) / 1000)
  );
  if (penaltyElapsedSeconds === 0) {
    return { active: true, seconds: 0, points: 0 };
  }

  const points = -(penaltyElapsedSeconds * WAITER_IDLE_PENALTY_PER_SECOND);
  const creditedUntil = new Date(
    new Date(staff.waiterPenaltyStartedAt).getTime() + penaltyElapsedSeconds * 1000
  );

  await addCredits({
    staffId,
    staffName: staff.name,
    role: staff.role,
    points,
    reason: "WAITER_IDLE_PENALTY",
    elapsedSeconds: penaltyElapsedSeconds,
  });

  await Staff.findByIdAndUpdate(staffId, { $set: { waiterIdleSince: creditedUntil, waiterPenaltyStartedAt: creditedUntil } });
  return { active: true, seconds: penaltyElapsedSeconds, points };
}

export async function todayWaiterOrderCount(staffId, now = new Date()) {
  return Order.countDocuments({
    status: "SERVED",
    items: {
      $elemMatch: {
        waiterId: String(staffId),
        servedAt: { $gte: startOfToday(), $lte: now },
      },
    },
  });
}

export async function todayFoodServedCount(staffId) {
  return CreditTransaction.countDocuments({
    staffId,
    reason: "WAITER_FOOD_SERVED",
    createdAt: { $gte: startOfToday() },
  });
}
