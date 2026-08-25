import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import dns from "node:dns";
import orderRoutes from "./routes/orders.js";
import staffRoutes from "./routes/staff.js";
import feedbackRoutes from "./routes/feedback.js";

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
  .then(() => {
    console.log("MongoDB connected successfully");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(
        `Backend running on http://0.0.0.0:${PORT}`
      );
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error.message);
  });