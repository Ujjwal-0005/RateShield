const mongoose = require("mongoose");

const apiKeySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Key name is required"],
            trim: true,
        },
        key: {
            type: String,
            required: true,
            unique: true, // Stores SHA-256 hash of the API key
        },
        maskedKey: {
            type: String,
            required: true, // Safe version to show in UI, e.g. "rs_live_****1234"
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Key must belong to a user"],
        },
        policy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Policy",
            required: [true, "Key must be linked to a policy"],
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        expiresAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Indexing key hash for extremely fast database lookups if cache misses
apiKeySchema.index({ key: 1 });

module.exports = mongoose.model("ApiKey", apiKeySchema);
