import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import dns from "node:dns";
import orderRoutes from "./routes/orders.js";
import staffRoutes from "./routes/staff.js";
import feedbackRoutes from "./routes/feedback.js";
import assistanceRoutes from "./routes/assistance.js";
import Staff from "./models/Staff.js";

dns.setServers([
  "8.8.8.8",
  "1.1.1.1"
]);

dotenv.config({ path: "./backend/.env" });

console.log("Mongo URI loaded:", process.env.MONGO_URI ? "YES" : "NO");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/orders", orderRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/assistance", assistanceRoutes);

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Restaurant Management API is running",
  });
});

if (!process.env.MONGO_URI) {
  console.error("ERROR: MONGO_URI is missing from backend/.env");
  process.exit(1);
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB connected successfully");

    // Automatically initialize waiterTask for old waiter accounts.
    // Only missing/null values are changed.
    // Existing ORDER or ASSISTANCE values are NOT overwritten.
    try {
      const result = await Staff.updateMany(
        {
          role: "WAITER",
          $or: [
            { waiterTask: { $exists: false } },
            { waiterTask: null },
          ],
        },
        {
          $set: {
            waiterTask: "",
          },
        }
      );

      console.log(
        `Waiter task initialization complete. Updated: ${result.modifiedCount}`
      );
    } catch (error) {
      console.error(
        "Waiter task initialization error:",
        error
      );
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(
        `Backend running on http://0.0.0.0:${PORT}`
      );
    });
  })
  .catch((error) => {
    console.error(
      "MongoDB connection error:",
      error.message
    );
  });