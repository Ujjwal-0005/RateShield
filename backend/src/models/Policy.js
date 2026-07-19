const mongoose = require("mongoose");

const policySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Policy name is required"],
            unique: true,
            trim: true,
        },
        description: {
            type: String,
        },
        algorithm: {
            type: String,
            enum: ["fixed", "sliding", "token_bucket"],
            default: "sliding",
        },
        windowSize: {
            type: Number,
            required: [true, "Window size in seconds is required"],
            min: [1, "Window size must be at least 1 second"],
        },
        maxRequests: {
            type: Number,
            required: [true, "Max requests is required"],
            min: [1, "Max requests must be at least 1"],
        },
        tokenBucketRate: {
            type: Number, // Tokens per second refilled (optional, otherwise defaults to maxRequests / windowSize)
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Policy must belong to a user"],
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Policy", policySchema);
