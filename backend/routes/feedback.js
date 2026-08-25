import express from "express";
import Feedback from "../models/Feedback.js";

const router = express.Router();


// CREATE FEEDBACK
// POST /api/feedback

router.post("/", async (req, res) => {
    try {
        const {
            orderId,
            overallRating,
            foodRating,
            serviceRating,
            comment,
        } = req.body;

        if (!orderId || !overallRating) {
            return res.status(400).json({
                success: false,
                message: "Order ID and overall rating are required",
            });
        }

        const existingFeedback =
            await Feedback.findOne({ orderId });

        if (existingFeedback) {
            return res.status(409).json({
                success: false,
                message: "Feedback already submitted for this order",
            });
        }

        const feedback = await Feedback.create({
            orderId,
            overallRating,
            foodRating,
            serviceRating,
            comment: comment || "",
        });

        res.status(201).json({
            success: true,
            message: "Feedback submitted successfully",
            feedback,
        });

    } catch (error) {
        console.error(
            "Create feedback error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to submit feedback",
            error: error.message,
        });
    }
});


// GET ALL FEEDBACK
// GET /api/feedback

router.get("/", async (req, res) => {
    try {
        const feedbacks =
            await Feedback.find()
                .sort({ createdAt: -1 });

        res.json({
            success: true,
            feedbacks,
        });

    } catch (error) {
        console.error(
            "Get feedback error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to fetch feedback",
            error: error.message,
        });
    }
});


export default router;