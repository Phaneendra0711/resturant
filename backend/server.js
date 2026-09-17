import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import orderRoutes from "./routes/orders.js";
import staffRoutes from "./routes/staff.js";
import feedbackRoutes from "./routes/feedback.js";
import assistanceRoutes from "./routes/assistance.js";
import couponRoutes from "./routes/coupons.js";

dotenv.config({ path: "./backend/.env" });

console.log(
  "Mongo URI loaded:",
  process.env.MONGO_URI ? "YES" : "NO"
);

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());

/* =========================
   API ROUTES
========================= */

app.use("/api/orders", orderRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/assistance", assistanceRoutes);
app.use("/api/coupons", couponRoutes);

/* =========================
   BASIC ROUTE
========================= */

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Restaurant Management API is running",
  });
});

/* =========================
   PORT
========================= */

const PORT = process.env.PORT || 5000;

/* =========================
   MONGODB CHECK
========================= */

if (!process.env.MONGO_URI) {
  console.error(
    "❌ ERROR: MONGO_URI is missing from backend/.env"
  );

  process.exit(1);
}

/* =========================
   MONGODB CONNECTION
========================= */

mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000,
    socketTimeoutMS: 45000,

    // Helps avoid IPv6/network routing problems
    family: 4,
  })
  .then(() => {
    console.log("=================================");
    console.log("✅ MongoDB connected successfully");
    console.log("=================================");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(
        `🚀 Backend running on http://localhost:${PORT}`
      );

      console.log(
        `📦 Orders API: http://localhost:${PORT}/api/orders`
      );

      console.log(
        `👨‍🍳 Staff API: http://localhost:${PORT}/api/staff`
      );

      console.log(
        `🔔 Assistance API: http://localhost:${PORT}/api/assistance`
      );
    });
  })
  .catch((error) => {
    console.error("=================================");
    console.error("❌ MongoDB connection failed");
    console.error("=================================");

    console.error("Error name:", error.name);
    console.error("Error message:", error.message);

    if (error.reason) {
      console.error("Connection reason:", error.reason);
    }

    if (error.cause) {
      console.error("Underlying error:", error.cause);
    }

    console.error(
      "\nCheck your MongoDB Atlas connection, network access, and MONGO_URI."
    );

    process.exit(1);
  });
