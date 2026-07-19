const redisClient = require("../redis/redisClient");

// Redis Lua script for atomic Token Bucket rate limiting
const TOKEN_BUCKET_LUA = `
local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local refill_rate = tonumber(ARGV[2])
local now = tonumber(ARGV[3])
local ttl = tonumber(ARGV[4])
local cost = tonumber(ARGV[5] or 1)

-- HMGET returns array of values
local data = redis.call('HMGET', key, 'tokens', 'last_updated')
local tokens = tonumber(data[1])
local last_updated = tonumber(data[2])

if not tokens then
    -- Initialize the bucket if it does not exist
    tokens = capacity
    last_updated = now
else
    -- Refill tokens based on time elapsed
    local elapsed = now - last_updated
    if elapsed > 0 then
        local refilled = elapsed * refill_rate
        tokens = math.min(capacity, tokens + refilled)
        last_updated = now
    end
end

local allowed = 0
if tokens >= cost then
    tokens = tokens - cost
    allowed = 1
end

-- Save the new bucket state
redis.call('HMSET', key, 'tokens', tokens, 'last_updated', last_updated)
redis.call('EXPIRE', key, ttl)

return {allowed, math.floor(tokens)}
`;

/**
 * Checks if a request is allowed under the rate limiting policy.
 * @param {string} keyId - Unique key identifier (e.g. API key ID).
 * @param {Object} policy - Policy configuration object.
 * @returns {Promise<Object>} Object containing { allowed, limit, remaining, reset }
 */
async function checkRateLimit(keyId, policy) {
    const { algorithm, windowSize, maxRequests } = policy;
    const now = Date.now();

    // Log time-series telemetry for analytics charts (expires in 24 hours)
    const tsKey = `metrics:time_series:${keyId}`;
    await redisClient.zAdd(tsKey, { score: now, value: now.toString() });
    await redisClient.expire(tsKey, 86400);

    if (algorithm === "fixed") {
        // Fixed Window Counter implementation
        const windowTimestamp = Math.floor(now / 1000 / windowSize);
        const key = `rate:fixed:${keyId}:${windowTimestamp}`;

        const current = await redisClient.incr(key);
        if (current === 1) {
            await redisClient.expire(key, windowSize);
        }

        const allowed = current <= maxRequests;
        const remaining = Math.max(0, maxRequests - current);
        const reset = (windowTimestamp + 1) * windowSize; // Epoch timestamp in seconds

        return { allowed, limit: maxRequests, remaining, reset };
    } 
    
    if (algorithm === "token_bucket") {
        // Token Bucket implementation via Lua Script
        const key = `rate:token:${keyId}`;
        
        // Calculate refill rate as tokens per millisecond
        // If policy has custom tokenBucketRate, use it, otherwise default to maxRequests / windowSize
        const ratePerSec = policy.tokenBucketRate || (maxRequests / windowSize);
        const refillRatePerMs = ratePerSec / 1000;
        
        const ttl = windowSize * 2; // Keep state longer than window size

        const result = await redisClient.eval(TOKEN_BUCKET_LUA, {
            keys: [key],
            arguments: [
                maxRequests.toString(),
                refillRatePerMs.toString(),
                now.toString(),
                ttl.toString(),
                "1" // cost
            ]
        });

        const allowed = result[0] === 1;
        const remaining = result[1];
        const reset = Math.ceil((now + (windowSize * 1000)) / 1000);

        return { allowed, limit: maxRequests, remaining, reset };
    } 
    
    // Default to Sliding Window Log (highly accurate sliding log)
    const key = `rate:sliding:${keyId}`;
    const windowStart = now - (windowSize * 1000);

    // Multi pipeline execution for sliding window cleanup and check
    const multi = redisClient.multi();
    multi.zRemRangeByScore(key, 0, windowStart);
    multi.zCard(key);
    const [_, count] = await multi.exec();

    let allowed = false;
    if (count < maxRequests) {
        allowed = true;
        await redisClient.zAdd(key, { score: now, value: now.toString() });
    }
    await redisClient.expire(key, windowSize);

    const currentCount = allowed ? count + 1 : count;
    const remaining = Math.max(0, maxRequests - currentCount);
    const reset = Math.ceil((now + (windowSize * 1000)) / 1000);

    return { allowed, limit: maxRequests, remaining, reset };
}

module.exports = {
    checkRateLimit,
};