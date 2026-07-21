const ApiKey = require("../models/ApiKey");
const Policy = require("../models/Policy");
const { generateRawKey, hashKey, maskKey } = require("../utils/keyGenerator");
const redisClient = require("../redis/redisClient");

function isExpired(expiresAt) {
    return Boolean(expiresAt) && new Date(expiresAt) < new Date();
}

async function removeCachedKey(hashedKey) {
    const cacheKey = `apikey:val:${hashedKey}`;
    await redisClient.del(cacheKey);
}

/**
 * Creates and registers a new API key.
 */
async function createApiKey({ name, policyId, userId, expiresAt }) {
    // Verify policy exists and is active
    const policy = await Policy.findOne({ _id: policyId, isActive: true });
    if (!policy) {
        const error = new Error("Active policy not found");
        error.statusCode = 404;
        throw error;
    }

    const rawKey = generateRawKey();
    const hashed = hashKey(rawKey);
    const masked = maskKey(rawKey);

    const apiKey = new ApiKey({
        name,
        key: hashed,
        maskedKey: masked,
        user: userId,
        policy: policyId,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    });

    await apiKey.save();

    // Cache the resolved key config in Redis for fast resolution
    const cacheKey = `apikey:val:${hashed}`;
    const cacheValue = {
        keyId: apiKey._id,
        userId: userId,
        isActive: true,
        expiresAt: apiKey.expiresAt,
        policy: {
            id: policy._id,
            algorithm: policy.algorithm,
            windowSize: policy.windowSize,
            maxRequests: policy.maxRequests,
            isActive: policy.isActive,
        },
    };

    await redisClient.set(cacheKey, JSON.stringify(cacheValue), {
        EX: 3600, // Cache for 1 hour
    });

    // Return the raw key ONLY during creation
    return {
        _id: apiKey._id,
        name: apiKey.name,
        rawKey, // Client must save this immediately
        maskedKey: apiKey.maskedKey,
        policy: policy,
        isActive: apiKey.isActive,
        expiresAt: apiKey.expiresAt,
        createdAt: apiKey.createdAt,
    };
}

/**
 * Fetches all API keys for a user (masked versions).
 */
async function getApiKeys(userId, isAdmin = false) {
    const query = isAdmin ? {} : { user: userId };
    return await ApiKey.find(query)
        .populate("policy", "name algorithm maxRequests windowSize")
        .sort({ createdAt: -1 });
}

/**
 * Revokes (disables) an API key and deletes it from cache.
 */
async function revokeApiKey(id, userId, isAdmin = false) {
    const query = isAdmin ? { _id: id } : { _id: id, user: userId };
    
    // Find key to invalidate its Redis cache
    const apiKey = await ApiKey.findOne(query);
    if (!apiKey) {
        const error = new Error("API Key not found or unauthorized");
        error.statusCode = 404;
        throw error;
    }

    // Set isActive to false (revoked)
    apiKey.isActive = false;
    await apiKey.save();

    // Delete cache entry
    const cacheKey = `apikey:val:${apiKey.key}`;
    await redisClient.del(cacheKey);

    return apiKey;
}

/**
 * Resolves a raw API key (either from cache or database lookup).
 */
async function resolveApiKey(rawKey) {
    const hashed = hashKey(rawKey);
    const cacheKey = `apikey:val:${hashed}`;

    // Try cache first
    const cached = await redisClient.get(cacheKey);
    if (cached) {
        const cachedValue = JSON.parse(cached);

        if (isExpired(cachedValue.expiresAt)) {
            await removeCachedKey(hashed);
            return null;
        }

        return cachedValue;
    }

    // Database fallback
    const keyDoc = await ApiKey.findOne({ key: hashed, isActive: true })
        .populate("policy", "name description algorithm windowSize maxRequests isActive");

    if (!keyDoc) {
        return null;
    }

    if (!keyDoc.policy || keyDoc.policy.isActive === false) {
        return {
            policyInactive: true,
            keyId: keyDoc._id,
            userId: keyDoc.user,
            isActive: keyDoc.isActive,
            expiresAt: keyDoc.expiresAt,
            policy: keyDoc.policy
                ? {
                    id: keyDoc.policy._id,
                    algorithm: keyDoc.policy.algorithm,
                    windowSize: keyDoc.policy.windowSize,
                    maxRequests: keyDoc.policy.maxRequests,
                    isActive: keyDoc.policy.isActive,
                }
                : null,
        };
    }

    // Check expiration
    if (isExpired(keyDoc.expiresAt)) {
        keyDoc.isActive = false;
        await keyDoc.save();
        await removeCachedKey(hashed);
        return null;
    }

    const resolved = {
        keyId: keyDoc._id,
        userId: keyDoc.user,
        isActive: keyDoc.isActive,
        expiresAt: keyDoc.expiresAt,
        policy: {
            id: keyDoc.policy._id,
            algorithm: keyDoc.policy.algorithm,
            windowSize: keyDoc.policy.windowSize,
            maxRequests: keyDoc.policy.maxRequests,
            isActive: keyDoc.policy.isActive,
        },
    };

    // Cache it
    await redisClient.set(cacheKey, JSON.stringify(resolved), {
        EX: 3600,
    });

    return resolved;
}

module.exports = {
    createApiKey,
    getApiKeys,
    revokeApiKey,
    resolveApiKey,
};
