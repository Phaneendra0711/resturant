import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
    {
        orderId: {
            type: String,
            required: true,
            unique: true,
        },

        overallRating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },

        foodRating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
        },

        serviceRating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
        },

        comment: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

const Feedback = mongoose.model(
    "Feedback",
    feedbackSchema
);

export default Feedback;