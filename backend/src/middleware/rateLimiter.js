const apiKeyService = require("../services/apiKey.service");
const rateLimiterService = require("../services/rateLimiter.service");
const metrics = require("../services/metrics.service");

// Routes that do not require API key rate limiting
const EXEMPT_ROUTES = ["/health", "/metrics", "/auth", "/policies", "/api-keys"];

function isExempt(path) {
    return EXEMPT_ROUTES.some((route) => path === route || path.startsWith(`${route}/`));
}

async function rateLimiter(req, res, next) {
    const path = req.path;

    // Bypass API Key rate limiter for dashboard, health, metrics and auth endpoints
    if (isExempt(path)) {
        return next();
    }

    const apiKey = req.headers["x-api-key"] || req.query.apiKey;

    if (!apiKey) {
        // Track unauthenticated blocked request
        await metrics.incrementRequests();
        await metrics.incrementBlocked();
        return res.status(401).json({
            success: false,
            message: "Authentication failed: API Key is missing. Pass it in the 'x-api-key' header.",
        });
    }

    try {
        // Resolve key & policy details (hits Redis cache or falls back to Mongo)
        const resolvedKey = await apiKeyService.resolveApiKey(apiKey);

        if (!resolvedKey || !resolvedKey.isActive) {
            await metrics.incrementRequests();
            await metrics.incrementBlocked();
            return res.status(401).json({
                success: false,
                message: "Authentication failed: Invalid or inactive API Key.",
            });
        }

        if (resolvedKey.policyInactive || resolvedKey.policy?.isActive === false) {
            await metrics.incrementRequests();
            await metrics.incrementBlocked();
            return res.status(403).json({
                success: false,
                message: "Access denied: the policy assigned to this API Key is inactive.",
            });
        }

        // Check rate limiting status in Redis
        const rateLimitResult = await rateLimiterService.checkRateLimit(
            resolvedKey.keyId.toString(),
            resolvedKey.policy
        );

        // Update overall request metrics
        await metrics.incrementRequests();
        if (rateLimitResult.allowed) {
            await metrics.incrementAllowed();
        } else {
            await metrics.incrementBlocked();
        }

        // Append rate limit headers
        res.setHeader("X-RateLimit-Limit", rateLimitResult.limit);
        res.setHeader("X-RateLimit-Remaining", rateLimitResult.remaining);
        res.setHeader("X-RateLimit-Reset", rateLimitResult.reset);

        if (!rateLimitResult.allowed) {
            return res.status(429).json({
                success: false,
                message: "Too Many Requests: Rate limit exceeded.",
                limit: rateLimitResult.limit,
                remaining: rateLimitResult.remaining,
                reset: new Date(rateLimitResult.reset * 1000).toISOString(),
            });
        }

        // Attach client info to req for downstream usage
        req.clientId = resolvedKey.userId;
        req.keyId = resolvedKey.keyId;
        req.policy = resolvedKey.policy;

        next();
    } catch (error) {
        console.error("Error in rateLimiter middleware:", error);
        // Fail open or closed based on production needs. Here we return 500.
        res.status(500).json({
            success: false,
            message: "Internal server error during rate limiting validation.",
        });
    }
}

module.exports = rateLimiter;
