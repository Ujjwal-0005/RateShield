const { createClient } = require("redis");
const env = require("../config/env");

const redisClient = createClient({
    socket: {
        host: env.REDIS_HOST,
        port: env.REDIS_PORT,
    },
    password: env.REDIS_PASSWORD || undefined,
});

redisClient.on("connect", () => {
    console.log("🟢 Redis Connected");
});

redisClient.on("error", (err) => {
    console.error("Redis Error:", err);
});

module.exports = redisClient;