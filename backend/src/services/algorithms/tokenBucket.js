const redisClient = require("../../redis/redisClient");

const TOKEN_BUCKET_LUA = `
local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local refill_rate = tonumber(ARGV[2])
local now = tonumber(ARGV[3])
local ttl = tonumber(ARGV[4])
local cost = tonumber(ARGV[5] or 1)

local data = redis.call('HMGET', key, 'tokens', 'last_updated')
local tokens = tonumber(data[1])
local last_updated = tonumber(data[2])

if not tokens then
    tokens = capacity
    last_updated = now
else
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

redis.call('HSET', key, 'tokens', tokens, 'last_updated', last_updated)
redis.call('EXPIRE', key, ttl)

return {allowed, math.floor(tokens)}
`;

/**
 * Token Bucket Algorithm (Atomic via Lua Script)
 */
async function check(keyId, options) {
    const { windowSize, maxRequests } = options;
    const now = Date.now();
    const key = `rate:token:${keyId}`;

    const ratePerSec = maxRequests / windowSize;
    const refillRatePerMs = ratePerSec / 1000;
    const ttl = windowSize * 2;

    const result = await redisClient.eval(TOKEN_BUCKET_LUA, {
        keys: [key],
        arguments: [
            maxRequests.toString(),
            refillRatePerMs.toString(),
            now.toString(),
            ttl.toString(),
            "1"
        ]
    });

    const allowed = result[0] === 1;
    const remaining = result[1];
    const reset = Math.ceil((now + (windowSize * 1000)) / 1000);

    return { allowed, limit: maxRequests, remaining, reset };
}

module.exports = { check };
