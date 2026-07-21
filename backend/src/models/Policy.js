const mongoose = require("mongoose");

const policySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Policy name is required"],
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        algorithm: {
            type: String,
            enum: ["sliding", "fixed", "token_bucket"],
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
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

policySchema.index({ name: 1 }, { unique: true });
policySchema.index({ isActive: 1, algorithm: 1, createdAt: -1 });
policySchema.index({ name: "text", description: "text" });

module.exports = mongoose.model("Policy", policySchema);
