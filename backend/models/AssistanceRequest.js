import mongoose from "mongoose";

const assistanceRequestSchema = new mongoose.Schema(
    {
        customerName: {
            type: String,
            required: true,
            trim: true,
        },

        tableNumber: {
            type: String,
            required: true,
            enum: Array.from({ length: 30 }, (_, i) => String(i + 1)),
        },

        status: {
            type: String,
            enum: ["ACTIVE", "ACCEPTED", "COMPLETED"],
            default: "ACTIVE",
        },

        requestedAt: {
            type: Date,
            default: Date.now,
        },

        acceptedAt: {
            type: Date,
            default: null,
        },

        acceptedBy: {
            type: String,
            default: "",
        },

        acceptedById: {
            type: String,
            default: "",
        },
        completedAt: {
            type: Date,
            default: null,
        },

        completedBy: {
            type: String,
            default: "",
        },
    },
    { timestamps: true }
);

const AssistanceRequest = mongoose.model(
    "AssistanceRequest",
    assistanceRequestSchema
);

export default AssistanceRequest;