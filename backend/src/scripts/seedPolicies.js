const mongoose = require("mongoose");
const connectDB = require("../config/database");
const Policy = require("../models/Policy");

const policies = [
    {
        name: "Free",
        description: "Starter policy for low-volume clients",
        algorithm: "sliding",
        windowSize: 3600,
        maxRequests: 100,
        isActive: true,
    },
    {
        name: "Premium",
        description: "Balanced policy for production client workloads",
        algorithm: "sliding",
        windowSize: 3600,
        maxRequests: 1000,
        isActive: true,
    },
    {
        name: "Enterprise",
        description: "High-capacity policy for enterprise integrations",
        algorithm: "sliding",
        windowSize: 3600,
        maxRequests: Number.MAX_SAFE_INTEGER,
        isActive: true,
    },
];

async function upsertPolicy(policyInput) {
    const existing = await Policy.findOne({ name: policyInput.name }).select("_id");
    const policy = await Policy.findOneAndUpdate(
        { name: policyInput.name },
        { $set: policyInput },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    if (existing) {
        console.log(`[Seed] Updated policy: ${policy.name}`);
    } else {
        console.log(`[Seed] Inserted policy: ${policy.name}`);
    }

    return policy;
}

async function seedPolicies() {
    const connected = await connectDB();

    if (!connected) {
        throw new Error("MongoDB connection is required for policy seeding");
    }

    for (const policy of policies) {
        await upsertPolicy(policy);
    }

    await mongoose.disconnect();
    console.log("[Seed] Policy seeding complete");
}

seedPolicies().catch(async (error) => {
    console.error("[Seed] Policy seeding failed:", error.message);
    await mongoose.disconnect().catch(() => {});
    process.exitCode = 1;
});