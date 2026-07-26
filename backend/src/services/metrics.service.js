const redisClient = require("../redis/redisClient");

// In-memory counter for Redis errors (since Redis might be unreachable)
let localRedisErrors = 0;

async function incrementAllowed() {
    try {
        await redisClient.incr("metrics:allowed");
    } catch (err) {
        localRedisErrors++;
    }
}

async function incrementBlocked() {
    try {
        await redisClient.incr("metrics:blocked");
    } catch (err) {
        localRedisErrors++;
    }
}

async function incrementRequests() {
    try {
        await redisClient.incr("metrics:requests");
    } catch (err) {
        localRedisErrors++;
    }
}

/**
 * Atomic recording of request telemetry and performance metrics.
 * @param {Object} param0 - Request metadata.
 * @param {string} param0.keyId - API key identifier.
 * @param {boolean} param0.allowed - Whether request was permitted.
 * @param {string} param0.algorithm - Name of the algorithm executed.
 * @param {number} param0.processingTimeMs - Request execution duration in milliseconds.
 */
async function recordRequest({ keyId, allowed, algorithm, processingTimeMs }) {
    const now = Date.now();
    const minuteKey = `metrics:rpm:${Math.floor(now / 60000)}`;
    const multi = redisClient.multi();

    // Increment overall requests
    multi.incr("metrics:requests");

    // Increment allowed/blocked
    if (allowed) {
        multi.incr("metrics:allowed");
    } else {
        multi.incr("metrics:blocked");
    }

    // Track active key (using Set)
    if (keyId) {
        multi.sAdd("metrics:active_keys", keyId.toString());
    }

    // Track Requests Per Minute (RPM)
    multi.incr(minuteKey);
    multi.expire(minuteKey, 120); // 2 minutes TTL

    // Track algorithm usage
    if (algorithm) {
        multi.hIncrBy("metrics:algorithms", algorithm, 1);
    }

    // Track average processing time (sum and count)
    if (processingTimeMs !== undefined) {
        // Store in microseconds to avoid floating point precision issues in Redis
        multi.incrBy("metrics:total_processing_time", Math.round(processingTimeMs * 1000));
        multi.incr("metrics:total_processed_requests");
    }

    try {
        await multi.exec();
    } catch (err) {
        console.error("Failed to record metrics in Redis:", err);
        localRedisErrors++;
    }
}

function incrementRedisErrors() {
    localRedisErrors++;
}

/**
 * Returns comprehensive aggregated gateway metrics.
 * @returns {Promise<Object>} Object containing all tracked metrics.
 */
async function getMetrics() {
    try {
        const now = Date.now();
        const currentMinute = Math.floor(now / 60000);
        const rpmKey = `metrics:rpm:${currentMinute}`;

        const multi = redisClient.multi();
        multi.get("metrics:requests");
        multi.get("metrics:allowed");
        multi.get("metrics:blocked");
        multi.sCard("metrics:active_keys");
        multi.get(rpmKey);
        multi.hGetAll("metrics:algorithms");
        multi.get("metrics:total_processing_time");
        multi.get("metrics:total_processed_requests");

        const results = await multi.exec();
        
        const total = Number(results[0]) || 0;
        const allowed = Number(results[1]) || 0;
        const blocked = Number(results[2]) || 0;
        const activeKeys = Number(results[3]) || 0;
        const rpm = Number(results[4]) || 0;
        const algorithms = results[5] || {};
        const totalProcTime = Number(results[6]) || 0;
        const totalProcReqs = Number(results[7]) || 0;

        const averageProcessingTimeMs = totalProcReqs > 0
            ? (totalProcTime / totalProcReqs) / 1000
            : 0;

        return {
            total,
            allowed,
            blocked,
            activeKeys,
            requestsPerMinute: rpm,
            algorithmUsage: algorithms,
            averageProcessingTimeMs,
            redisErrors: localRedisErrors
        };
    } catch (err) {
        console.error("Failed to retrieve metrics from Redis:", err);
        localRedisErrors++;
        return {
            total: 0,
            allowed: 0,
            blocked: 0,
            activeKeys: 0,
            requestsPerMinute: 0,
            algorithmUsage: {},
            averageProcessingTimeMs: 0,
            redisErrors: localRedisErrors
        };
    }
}

module.exports = {
    incrementAllowed,
    incrementBlocked,
    incrementRequests,
    recordRequest,
    incrementRedisErrors,
    getMetrics
};