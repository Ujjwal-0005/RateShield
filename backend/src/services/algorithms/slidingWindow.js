const crypto = require("crypto");
const redisClient = require("../../redis/redisClient");

const SLIDING_WINDOW_LUA = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
local member = ARGV[4]
local clearBefore = now - window

redis.call('ZREMRANGEBYSCORE', key, 0, clearBefore)
local current_requests = redis.call('ZCARD', key)

local allowed = 0
if current_requests < limit then
    redis.call('ZADD', key, now, member)
    allowed = 1
    current_requests = current_requests + 1
end

redis.call('EXPIRE', key, math.ceil(window / 1000))

return {allowed, current_requests}
`;

/**
 * Sliding Window Log Algorithm (Atomic via Lua Script)
 */
async function check(keyId, options) {
    const { windowSize, maxRequests } = options;
    const now = Date.now();
    const key = `rate:sliding:${keyId}`;
    const windowMs = windowSize * 1000;
    const uniqueMember = crypto.randomUUID();

    const result = await redisClient.eval(SLIDING_WINDOW_LUA, {
        keys: [key],
        arguments: [
            now.toString(),
            windowMs.toString(),
            maxRequests.toString(),
            uniqueMember
        ]
    });

    const allowed = result[0] === 1;
    const current = result[1];
    const remaining = Math.max(0, maxRequests - current);

    // Calculate reset time based on the oldest request in the window
    const oldest = await redisClient.zRangeWithScores(key, 0, 0);
    const reset = oldest.length > 0 
        ? Math.ceil((oldest[0].score + windowMs) / 1000) 
        : Math.ceil((now + windowMs) / 1000);

    return { allowed, limit: maxRequests, remaining, reset };
}

module.exports = { check };
