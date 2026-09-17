import Staff from "../models/Staff.js";
import CreditTransaction from "../models/CreditTransaction.js";

export const startOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

export async function addCredits({ staffId, staffName = "", role, points, reason, orderId = null, itemId = "", assistanceId = null, elapsedSeconds = 0 }) {
  if (!staffId || !points) return null;

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

export async function todayFoodServedCount(staffId) {
  return CreditTransaction.countDocuments({
    staffId,
    reason: "WAITER_FOOD_SERVED",
    createdAt: { $gte: startOfToday() },
  });
}
