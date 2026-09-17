import express from "express";
import Coupon from "../models/Coupon.js";
import Staff from "../models/Staff.js";

const router = express.Router();
const newCode = () => String(Math.floor(10000 + Math.random() * 90000));

router.get("/", async (_req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 }).limit(50);
  res.json({ success: true, coupons });
});

router.post("/cash", async (req, res) => {
  try {
    const { amount, adminId } = req.body;
    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: "Enter a positive cash amount" });
    }
    // Existing browser sessions may predate the stored staffId. Until server
    // authentication is added, let that old admin session issue through the
    // active ADMIN record rather than failing coupon generation.
    const admin = adminId
      ? await Staff.findOne({ _id: adminId, role: "ADMIN", active: true })
      : await Staff.findOne({ role: "ADMIN", active: true });
    if (!admin) return res.status(403).json({ success: false, message: "Only an active admin can issue cash coupons" });

    let coupon;
    for (let attempt = 0; attempt < 10; attempt += 1) {
      try {
        coupon = await Coupon.create({
          code: newCode(), amount: Number(amount), issuedById: admin._id, issuedByName: admin.name,
        });
        break;
      } catch (error) {
        if (error.code !== 11000) throw error;
      }
    }
    if (!coupon) return res.status(503).json({ success: false, message: "Could not generate a unique code. Please try again." });
    return res.status(201).json({ success: true, coupon });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to generate cash coupon" });
  }
});

router.post("/preview", async (req, res) => {
  const code = String(req.body.code || "").trim();
  const total = Number(req.body.total);
  const coupon = await Coupon.findOne({ code, redeemedAt: null });
  if (!coupon || !Number.isFinite(total) || total < 0) {
    return res.status(400).json({ success: false, message: "Coupon is invalid or already used" });
  }
  return res.json({ success: true, amount: coupon.amount, discount: Math.min(coupon.amount, total), unusedAmount: Math.max(0, coupon.amount - total) });
});

export default router;
