const Policy = require("../models/Policy");
const ApiKey = require("../models/ApiKey");
const redisClient = require("../redis/redisClient");

const SORT_FIELD_MAP = new Set(["createdAt", "updatedAt", "name", "algorithm", "windowSize", "maxRequests", "isActive"]);

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function createServiceError(message, statusCode) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

function logPolicyAction(action, policy) {
    console.log(`[Policy] ${action}: ${policy.name} (${policy._id})`);
}

function buildPolicyQuery(filters = {}) {
    const query = {};

    if (filters.algorithm) {
        query.algorithm = filters.algorithm;
    }

    if (filters.isActive !== undefined) {
        query.isActive = filters.isActive;
    }

    if (filters.search) {
        const safeSearch = escapeRegex(filters.search);
        query.$or = [
            { name: { $regex: safeSearch, $options: "i" } },
            { description: { $regex: safeSearch, $options: "i" } },
        ];
    }

    return query;
}

function buildSort(sortBy = "createdAt", sortOrder = "desc") {
    const direction = sortOrder === "asc" ? 1 : -1;
    return { [SORT_FIELD_MAP.has(sortBy) ? sortBy : "createdAt"]: direction };
}

/**
 * Creates a new rate limiting policy.
 */
async function createPolicy(data) {
    const policy = await Policy.create(data);
    logPolicyAction("Created", policy);
    return policy;
}

/**
 * Returns all policies with filtering, sorting, and pagination.
 */
async function getPolicies(filters = {}) {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(Math.max(1, filters.limit || 20), 100);
    const skip = (page - 1) * limit;
    const query = buildPolicyQuery(filters);
    const sort = buildSort(filters.sortBy, filters.sortOrder);

    const [items, total] = await Promise.all([
        Policy.find(query).sort(sort).skip(skip).limit(limit),
        Policy.countDocuments(query),
    ]);

    return {
        items,
        meta: {
            total,
            page,
            limit,
            pages: total === 0 ? 0 : Math.ceil(total / limit),
            hasNext: page * limit < total,
            hasPrevious: page > 1,
        },
    };
}

/**
 * Fetches a single policy by ID.
 */
async function getPolicyById(id) {
    const policy = await Policy.findById(id);
    if (!policy) {
        throw createServiceError("Policy not found", 404);
    }

    logPolicyAction("Read", policy);
    return policy;
}

/**
 * Invalidates Redis cache for all API keys associated with a policy ID.
 */
async function invalidatePolicyCache(policyId) {
    try {
        const keys = await ApiKey.find({ policy: policyId }).select("key");

        if (keys.length === 0) {
            return;
        }

        await Promise.all(keys.map((keyDoc) => redisClient.del(`apikey:val:${keyDoc.key}`)));
    } catch (err) {
        console.error("Failed to invalidate policy-linked API key cache:", err.message);
    }
}

/**
 * Updates a rate limiting policy and invalidates associated API Key caches.
 */
async function updatePolicyById(id, updates, action = "Updated") {
    const existingPolicy = await Policy.findById(id);

    if (!existingPolicy) {
        throw createServiceError("Policy not found", 404);
    }

    const updatedPolicy = await Policy.findByIdAndUpdate(id, { ...updates }, {
        new: true,
        runValidators: true,
    });

    if (!updatedPolicy) {
        throw createServiceError("Policy not found", 404);
    }

    await invalidatePolicyCache(id);
    logPolicyAction(action, updatedPolicy);
    return updatedPolicy;
}

/**
 * Updates a rate limiting policy.
 */
async function updatePolicy(id, updates) {
    return updatePolicyById(id, updates, "Updated");
}

/**
 * Activates a policy.
 */
async function activatePolicy(id) {
    return updatePolicyById(id, { isActive: true }, "Activated");
}

/**
 * Deactivates a policy.
 */
async function deactivatePolicy(id) {
    return updatePolicyById(id, { isActive: false }, "Deactivated");
}

/**
 * Deletes a rate limiting policy.
 */
async function deletePolicy(id) {
    const inUse = await ApiKey.exists({ policy: id });
    if (inUse) {
        throw createServiceError("Cannot delete policy while API keys reference it", 409);
    }

    const policy = await Policy.findByIdAndDelete(id);

    if (!policy) {
        throw createServiceError("Policy not found", 404);
    }

    logPolicyAction("Deleted", policy);
    return policy;
}

module.exports = {
    createPolicy,
    getPolicies,
    getPolicyById,
    updatePolicy,
    deletePolicy,
    activatePolicy,
    deactivatePolicy,
};
