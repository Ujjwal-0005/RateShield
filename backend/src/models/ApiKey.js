const mongoose = require("mongoose");

const apiKeySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "API key name is required"],
            trim: true,
        },
        key: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        hashedKey: {
            type: String,
            required: true,
            unique: true,
            select: false,
        },
        maskedKey: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
            default: "",
        },
        status: {
            type: String,
            enum: ["active", "disabled", "revoked", "deleted", "expired"],
            default: "active",
            index: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "API key must belong to a user"],
            index: true,
        },
        policy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Policy",
            required: [true, "API key must be linked to a policy"],
            index: true,
        },
        keyType: {
            type: String,
            enum: ["live", "test"],
            default: "live",
            index: true,
        },
        lastUsed: {
            type: Date,
            default: null,
        },
        usageCount: {
            type: Number,
            default: 0,
            min: 0,
        },
        expiresAt: {
            type: Date,
            default: null,
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
        deletedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

apiKeySchema.index({ key: 1 }, { unique: true });
apiKeySchema.index({ hashedKey: 1 }, { unique: true });
apiKeySchema.index({ createdBy: 1, status: 1, createdAt: -1 });
apiKeySchema.index({ policy: 1, status: 1, createdAt: -1 });
apiKeySchema.index({ name: "text", description: "text", key: "text" });

module.exports = mongoose.model("ApiKey", apiKeySchema);
