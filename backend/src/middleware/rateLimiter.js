const { isAllowed } =  require("../services/rateLimiter.service");
const metrics = require("../services/metrics.service");

async function  rateLimiter(req, res, next) {
    await metrics.incrementRequests();
    await metrics.incrementBlocked();
    await metrics.incrementAllowed();
    const ip = req.ip;

    const allowed =await isAllowed(ip);

    if (!allowed) {
        return res.status(429).json({
            success: false,
            message: "Too Many Requests",
        });
    }

    next();
}

module.exports = rateLimiter;






