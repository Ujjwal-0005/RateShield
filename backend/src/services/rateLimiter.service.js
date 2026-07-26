const { getAlgorithm } = require("./algorithms");
const redisClient = require("../redis/redisClient");

/**
 * Checks if a request is allowed under the rate limiting policy.
 * Resolves the algorithm dynamically and executes it.
 * @param {string} keyId - Unique key identifier (e.g. API key ID).
 * @param {Object} policy - Policy configuration object.
 * @returns {Promise<Object>} Object containing { allowed, limit, remaining, reset }
 */
async function checkRateLimit(keyId, policy) {
    const { algorithm, windowSize, maxRequests } = policy;
    const now = Date.now();

    // Log time-series telemetry for analytics charts (expires in 24 hours)
    const tsKey = `metrics:time_series:${keyId}`;
    try {
        await redisClient.zAdd(tsKey, { score: now, value: now.toString() });
        await redisClient.expire(tsKey, 86400);
    } catch (err) {
        console.error(`[Rate Limiter] Failed to record time-series metrics:`, err.message);
    }

    // Resolve algorithm module and execute rate limit check
    const algo = getAlgorithm(algorithm);
    return algo.check(keyId, { windowSize, maxRequests });
}

module.exports = {
    checkRateLimit,
};