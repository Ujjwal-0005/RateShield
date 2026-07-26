const redisClient = require("../../redis/redisClient");

const FIXED_WINDOW_LUA = `
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local window = tonumber(ARGV[2])

local current = redis.call('INCR', key)
if current == 1 then
    redis.call('EXPIRE', key, window)
end

local allowed = 0
if current <= limit then
    allowed = 1
end

return {allowed, current}
`;

/**
 * Fixed Window Counter Algorithm (Atomic via Lua Script)
 */
async function check(keyId, options) {
    const { windowSize, maxRequests } = options;
    const now = Date.now();
    const windowTimestamp = Math.floor(now / 1000 / windowSize);
    const key = `rate:fixed:${keyId}:${windowTimestamp}`;

    const result = await redisClient.eval(FIXED_WINDOW_LUA, {
        keys: [key],
        arguments: [maxRequests.toString(), windowSize.toString()]
    });

    const allowed = result[0] === 1;
    const current = result[1];
    const remaining = Math.max(0, maxRequests - current);
    const reset = (windowTimestamp + 1) * windowSize;

    return { allowed, limit: maxRequests, remaining, reset };
}

module.exports = { check };
