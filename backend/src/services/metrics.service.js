const redisClient = require("../redis/redisClient");

async function incrementAllowed() {
    await redisClient.incr("metrics:allowed");
}

async function incrementBlocked() {
    await redisClient.incr("metrics:blocked");
}

async function incrementRequests() {
    await redisClient.incr("metrics:requests");
}

async function getMetrics() {

    const allowed =
        Number(await redisClient.get("metrics:allowed")) || 0;

    const blocked =
        Number(await redisClient.get("metrics:blocked")) || 0;

    const total =
        Number(await redisClient.get("metrics:requests")) || 0;

    return {
        total,
        allowed,
        blocked
    };
}

module.exports = {
    incrementAllowed,
    incrementBlocked,
    incrementRequests,
    getMetrics
};