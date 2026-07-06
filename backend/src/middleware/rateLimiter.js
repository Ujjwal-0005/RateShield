const { isAllowed } = require("../services/rateLimiter.service");

function rateLimiter(req, res, next) {
    const ip = req.ip;

    const allowed = isAllowed(ip);

    if (!allowed) {
        return res.status(429).json({
            success: false,
            message: "Too Many Requests",
        });
    }

    next();
}

module.exports = rateLimiter;