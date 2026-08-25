import express from "express";
import bcrypt from "bcryptjs";
import Staff from "../models/Staff.js";

const router = express.Router();

/*
  STAFF LOGIN
  POST /api/staff/login
*/

router.post("/login", async (req, res) => {
  try {
    const {
      username,
      password,
    } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Username and password are required",
      });
    }

    const staff =
      await Staff.findOne({
        username:
          username
            .toLowerCase()
            .trim(),
      });

    if (!staff) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid username or password",
      });
    }

    if (!staff.active) {
      return res.status(403).json({
        success: false,
        message:
          "This staff account is disabled",
      });
    }

    const passwordMatch =
      await bcrypt.compare(
        password,
        staff.passwordHash
      );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid username or password",
      });
    }

    res.json({
      success: true,
      message: "Login successful",

      staff: {
        _id: staff._id,
        name: staff.name,
        username: staff.username,
        role: staff.role,
        active: staff.active,
      },
    });
  } catch (error) {
    console.error(
      "Staff login error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
});


/*
  CREATE STAFF
  POST /api/staff
*/

router.post("/", async (req, res) => {
  try {
    const {
      name,
      username,
      password,
      role,
    } = req.body;

    if (
      !name ||
      !username ||
      !password ||
      !role
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, username, password and role are required",
      });
    }

    const allowedRoles = [
      "ADMIN",
      "CHEF",
      "WAITER",
    ];

    if (
      !allowedRoles.includes(role)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid staff role",
      });
    }

    const existingStaff =
      await Staff.findOne({
        username:
          username
            .toLowerCase()
            .trim(),
      });

    if (existingStaff) {
      return res.status(409).json({
        success: false,
        message:
          "Username already exists",
      });
    }

    const passwordHash =
      await bcrypt.hash(
        password,
        10
      );

    const staff =
      await Staff.create({
        name: name.trim(),

        username:
          username
            .toLowerCase()
            .trim(),

        passwordHash,

        role,
      });

    res.status(201).json({
      success: true,
      message:
        "Staff created successfully",

      staff: {
        _id: staff._id,
        name: staff.name,
        username: staff.username,
        role: staff.role,
        active: staff.active,
        createdAt:
          staff.createdAt,
      },
    });
  } catch (error) {
    console.error(
      "Create staff error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to create staff",
      error: error.message,
    });
  }
});


/*
  GET ALL STAFF
  GET /api/staff
*/

router.get("/", async (req, res) => {
  try {
    const staff =
      await Staff.find()
        .select("-passwordHash")
        .sort({
          createdAt: -1,
        });

    res.json({
      success: true,
      staff,
    });
  } catch (error) {
    console.error(
      "Get staff error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch staff",
      error: error.message,
    });
  }
});


/*
  ENABLE / DISABLE STAFF
  PATCH /api/staff/:id/status
*/

router.patch(
  "/:id/status",
  async (req, res) => {
    try {
      const { active } =
        req.body;

      if (
        typeof active !==
        "boolean"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Active must be true or false",
        });
      }

      const existingStaff =
        await Staff.findById(
          req.params.id
        );

      if (!existingStaff) {
        return res.status(404).json({
          success: false,
          message:
            "Staff member not found",
        });
      }

      // ======================================
      // PROTECT ADMIN ACCOUNT
      // ======================================

      if (
        existingStaff.role ===
        "ADMIN"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Admin accounts cannot be disabled or enabled",
        });
      }

      const staff =
        await Staff.findByIdAndUpdate(
          req.params.id,
          { active },
          {
            new: true,
            runValidators: true,
          }
        ).select(
          "-passwordHash"
        );

      res.json({
        success: true,
        message:
          "Staff status updated",
        staff,
      });
    } catch (error) {
      console.error(
        "Update staff status error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to update staff status",
        error: error.message,
      });
    }
  }
);


/*
  CHANGE PASSWORD
  PATCH /api/staff/:id/password
*/

router.patch(
  "/:id/password",
  async (req, res) => {
    try {
      const { password } =
        req.body;

      if (
        !password ||
        password.trim().length <
        4
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Password must contain at least 4 characters",
        });
      }

      const passwordHash =
        await bcrypt.hash(
          password,
          10
        );

      const staff =
        await Staff.findByIdAndUpdate(
          req.params.id,
          {
            passwordHash,
          },
          {
            new: true,
            runValidators: true,
          }
        ).select(
          "-passwordHash"
        );

      if (!staff) {
        return res.status(404).json({
          success: false,
          message:
            "Staff member not found",
        });
      }

      res.json({
        success: true,
        message:
          "Staff password updated successfully",
        staff,
      });
    } catch (error) {
      console.error(
        "Change staff password error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to change staff password",
        error: error.message,
      });
    }
  }
);


/*
  DELETE STAFF
  DELETE /api/staff/:id
*/

router.delete(
  "/:id",
  async (req, res) => {
    try {
      const existingStaff =
        await Staff.findById(
          req.params.id
        );

      if (!existingStaff) {
        return res.status(404).json({
          success: false,
          message:
            "Staff member not found",
        });
      }

      // ======================================
      // PROTECT ADMIN ACCOUNT
      // ======================================

      if (
        existingStaff.role ===
        "ADMIN"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Admin accounts cannot be removed",
        });
      }

      await Staff.findByIdAndDelete(
        req.params.id
      );

      res.json({
        success: true,
        message:
          "Staff deleted successfully",
      });
    } catch (error) {
      console.error(
        "Delete staff error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to delete staff",
        error: error.message,
      });
    }
  }
);


export default router;