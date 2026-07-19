const Policy = require("../models/Policy");
const ApiKey = require("../models/ApiKey");
const redisClient = require("../redis/redisClient");

/**
 * Creates a new rate limiting policy.
 */
async function createPolicy(data) {
    const policy = new Policy(data);
    return await policy.save();
}

/**
 * Returns all policies created by a specific user.
 */
async function getPolicies(userId, isAdmin = false) {
    const query = isAdmin ? {} : { createdBy: userId };
    return await Policy.find(query).sort({ createdAt: -1 });
}

/**
 * Fetches a single policy by ID.
 */
async function getPolicyById(id) {
    const policy = await Policy.findById(id);
    if (!policy) {
        const error = new Error("Policy not found");
        error.statusCode = 404;
        throw error;
    }
    return policy;
}

/**
 * Invalidates Redis cache for all API keys associated with a policy ID.
 */
async function invalidatePolicyCache(policyId) {
    try {
        const keys = await ApiKey.find({ policy: policyId });
        for (const keyDoc of keys) {
            const cacheKey = `apikey:val:${keyDoc.key}`;
            await redisClient.del(cacheKey);
        }
    } catch (err) {
        console.error("Failed to invalidate cache for policy keys:", err);
    }
}

/**
 * Updates a rate limiting policy and invalidates associated API Key caches.
 */
async function updatePolicy(id, userId, updates, isAdmin = false) {
    const query = isAdmin ? { _id: id } : { _id: id, createdBy: userId };
    
    const policy = await Policy.findOneAndUpdate(query, updates, { new: true, runValidators: true });
    
    if (!policy) {
        const error = new Error("Policy not found or unauthorized");
        error.statusCode = 404;
        throw error;
    }

    // Invalidate Redis cache for all keys using this policy
    await invalidatePolicyCache(id);

    return policy;
}

/**
 * Deletes a rate limiting policy.
 */
async function deletePolicy(id, userId, isAdmin = false) {
    // Check if the policy is in use by any API keys
    const inUse = await ApiKey.exists({ policy: id });
    if (inUse) {
        const error = new Error("Cannot delete policy: It is currently assigned to active API keys");
        error.statusCode = 400;
        throw error;
    }

    const query = isAdmin ? { _id: id } : { _id: id, createdBy: userId };
    const policy = await Policy.findOneAndDelete(query);

    if (!policy) {
        const error = new Error("Policy not found or unauthorized");
        error.statusCode = 404;
        throw error;
    }

    return policy;
}

module.exports = {
    createPolicy,
    getPolicies,
    getPolicyById,
    updatePolicy,
    deletePolicy,
};
