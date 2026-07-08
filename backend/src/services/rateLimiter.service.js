// const requests = new Map();

// const WINDOW_SIZE = 60 * 1000; // 60 seconds
// const MAX_REQUESTS = 5;

// function isAllowed(ip) {
//     const now = Date.now();

//     const user = requests.get(ip);

//     if (!user) {
//         requests.set(ip, {
//             count: 1,
//             startTime: now,
//         });

//         return true;
//     }

//     const timePassed = now - user.startTime;

//     if (timePassed > WINDOW_SIZE) {
//         requests.set(ip, {
//             count: 1,
//             startTime: now,
//         });

//         return true;
//     }

//     if (user.count >= MAX_REQUESTS) {
//         return false;
//     }

//     user.count++;

//     return true;
// }

// module.exports = {
//     isAllowed,
// };

//fixed window
// const redisClient = require("../redis/redisClient");

// const WINDOW_SIZE = 60;
// const MAX_REQUESTS = 5;

// async function isAllowed(ip) {

//     const key = `rate_limit:${ip}`;

//     const requests = await redisClient.incr(key);

//     if (requests === 1) {
//         await redisClient.expire(key, WINDOW_SIZE);
//     }

//     return requests <= MAX_REQUESTS;
// }

// module.exports = {
//     isAllowed,
// };




//slidding window algo replacing the previous fixed window algo 
const redisClient = require("../redis/redisClient");


const WINDOW_SIZE = 60; // seconds
const MAX_REQUESTS = 5;

async function isAllowed(ip) {

    const key = `rate_limit:${ip}`;

    const now = Date.now();

    const windowStart = now - WINDOW_SIZE * 1000;

    // Remove requests older than 60 seconds
    await redisClient.zRemRangeByScore(key, 0, windowStart);

    // Count remaining requests
    const requestCount = await redisClient.zCard(key);

    if (requestCount >= MAX_REQUESTS) {
        return false;
    }

    // Store current request
    await redisClient.zAdd(key, {
        score: now,
        value: now.toString()
    });

    // Auto cleanup
    await redisClient.expire(key, WINDOW_SIZE);

    return true;

}

module.exports = {
    isAllowed
};