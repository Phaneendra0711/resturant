import express from "express";
import bcrypt from "bcryptjs";
import Staff from "../models/Staff.js";
import CreditTransaction from "../models/CreditTransaction.js";
import StaffSession from "../models/StaffSession.js";

const router = express.Router();

/* =========================================================
   STAFF LOGIN
========================================================= */

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required",
      });
    }

    const staff = await Staff.findOne({
      username: username.trim().toLowerCase(),
    });

    if (!staff) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    if (!staff.active) {
      return res.status(403).json({
        success: false,
        message: "This staff account is disabled",
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      staff.passwordHash
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    staff.onlineAt = new Date();
    await staff.save();
    await StaffSession.create({ staffId: staff._id, role: staff.role, loginAt: staff.onlineAt });

    return res.json({
      success: true,
      staff: {
        _id: staff._id,
        name: staff.name,
        username: staff.username,
        role: staff.role,
        active: staff.active,
        creditPoints: staff.creditPoints,
      },
    });
  } catch (error) {
    console.error("Staff login error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
});

router.get("/:id/credits", async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id).select("name role creditPoints");
    if (!staff) return res.status(404).json({ success: false, message: "Staff member not found" });
    const transactions = await CreditTransaction.find({ staffId: staff._id }).sort({ createdAt: -1 }).limit(50);
    return res.json({ success: true, creditPoints: staff.creditPoints, transactions });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch credits" });
  }
});

router.patch("/:id/logout", async (req, res) => {
  try {
    await Staff.findByIdAndUpdate(req.params.id, { $set: { onlineAt: null } });
    await StaffSession.findOneAndUpdate(
      { staffId: req.params.id, logoutAt: null },
      { $set: { logoutAt: new Date() } },
      { sort: { loginAt: -1 } }
    );
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to record logout" });
  }
});


/* =========================================================
   CREATE STAFF
========================================================= */

router.post("/", async (req, res) => {
  try {
    const {
      name,
      username,
      password,
      role,
      active = true,
    } = req.body;

    if (!name || !username || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Name, username, password and role are required",
      });
    }

    const normalizedRole = role.toUpperCase();

    if (!["ADMIN", "CHEF", "WAITER"].includes(normalizedRole)) {
      return res.status(400).json({
        success: false,
        message: "Invalid staff role",
      });
    }

    const normalizedUsername =
      username.trim().toLowerCase();

    const existingStaff = await Staff.findOne({
      username: normalizedUsername,
    });

    if (existingStaff) {
      return res.status(409).json({
        success: false,
        message: "Username already exists",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const staff = await Staff.create({
      name: name.trim(),
      username: normalizedUsername,
      passwordHash,
      role: normalizedRole,
      active: Boolean(active),

      // New waiter task system
      waiterTasks: [],
    });

    return res.status(201).json({
      success: true,
      message: "Staff created successfully",
      staff: {
        _id: staff._id,
        name: staff.name,
        username: staff.username,
        role: staff.role,
        active: staff.active,
        waiterTasks: staff.waiterTasks,
      },
    });
  } catch (error) {
    console.error("Create staff error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Username already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create staff",
    });
  }
});


/* =========================================================
   GET ALL STAFF
========================================================= */

router.get("/", async (req, res) => {
  try {
    const staff = await Staff.find()
      .select("-passwordHash")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      staff,
    });
  } catch (error) {
    console.error("Get staff error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch staff",
    });
  }
});


/* =========================================================
   UPDATE STAFF ACTIVE STATUS
========================================================= */

router.patch("/:id/status", async (req, res) => {
  try {
    const { active } = req.body;

    if (typeof active !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Active must be true or false",
      });
    }

    const staff = await Staff.findById(req.params.id);

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff member not found",
      });
    }

    // Prevent disabling the last admin
    if (staff.role === "ADMIN" && active === false) {
      const activeAdmins = await Staff.countDocuments({
        role: "ADMIN",
        active: true,
      });

      if (activeAdmins <= 1) {
        return res.status(400).json({
          success: false,
          message: "Cannot disable the last active admin",
        });
      }
    }

    staff.active = active;

    await staff.save();

    return res.json({
      success: true,
      message: active
        ? "Staff account enabled"
        : "Staff account disabled",
      staff: {
        _id: staff._id,
        name: staff.name,
        username: staff.username,
        role: staff.role,
        active: staff.active,
      },
    });
  } catch (error) {
    console.error("Update staff status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update staff status",
    });
  }
});


/* =========================================================
   CHANGE STAFF PASSWORD
========================================================= */

router.patch("/:id/password", async (req, res) => {
  try {
    const { password } = req.body;

    if (!password || password.length < 4) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 4 characters",
      });
    }

    const staff = await Staff.findById(req.params.id);

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff member not found",
      });
    }

    staff.passwordHash = await bcrypt.hash(password, 10);

    await staff.save();

    return res.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to change password",
    });
  }
});


/* =========================================================
   DELETE STAFF
========================================================= */

router.delete("/:id", async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff member not found",
      });
    }

    // Prevent deleting the last admin
    if (staff.role === "ADMIN") {
      const adminCount = await Staff.countDocuments({
        role: "ADMIN",
      });

      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: "Cannot delete the last admin",
        });
      }
    }

    await Staff.findByIdAndDelete(req.params.id);

    return res.json({
      success: true,
      message: "Staff deleted successfully",
    });
  } catch (error) {
    console.error("Delete staff error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete staff",
    });
  }
});


export default router;
