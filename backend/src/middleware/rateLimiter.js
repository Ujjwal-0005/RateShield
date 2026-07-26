const apiKeyService = require("../services/apiKey.service");
const rateLimiterService = require("../services/rateLimiter.service");
const metrics = require("../services/metrics.service");

// Routes that do not require API key rate limiting
const EXEMPT_ROUTES = ["/health", "/metrics", "/auth", "/policies", "/api-keys"];

function isExempt(path) {
    return EXEMPT_ROUTES.some((route) => path === route || path.startsWith(`${route}/`));
}

/**
 * Reusable Rate Limiting Middleware
 * Processes: API Key Auth -> Policy Resolution -> Algorithm Selection -> Redis Check -> Headers & Metrics -> Continue
 */
async function rateLimiter(req, res, next) {
    const startTime = process.hrtime();
    const path = req.path;

    // Bypass rate limiting forexempt system paths
    if (isExempt(path)) {
        return next();
    }

    const apiKey = req.headers["x-api-key"] || req.query.apiKey;

    // 1. Handle missing API Key
    if (!apiKey) {
        await metrics.incrementRequests();
        await metrics.incrementBlocked();

        console.log(`[Rate Limiter] Blocked Request: Missing API Key | Path: ${path} | RemoteIP: ${req.ip}`);

        return res.status(401).json({
            success: false,
            message: "Authentication failed: API Key is missing. Pass it in the 'x-api-key' header.",
        });
    }

    let resolvedKey = null;
    try {
        // Resolve key & policy details (hits Redis cache or falls back to Mongo)
        resolvedKey = await apiKeyService.resolveApiKey(apiKey);
    } catch (error) {
        console.error(`[Rate Limiter] Database or cache error resolving API Key:`, error.message);
        metrics.incrementRedisErrors();
        
        return res.status(500).json({
            success: false,
            message: "Internal server error: Database or cache failure while authenticating API Key.",
        });
    }

    // 2. Handle invalid API Key
    if (!resolvedKey) {
        await metrics.incrementRequests();
        await metrics.incrementBlocked();

        console.log(`[Rate Limiter] Blocked Request: Invalid API Key | Key: ${apiKey.substring(0, 8)}... | Path: ${path}`);

        return res.status(401).json({
            success: false,
            message: "Authentication failed: Invalid API Key.",
        });
    }

    const keyId = resolvedKey.keyId || resolvedKey.apiKeyId;
    const maskedKey = resolvedKey.maskedKey || "unknown";

    // 3. Handle revoked or deleted API Key
    if (resolvedKey.status === "revoked" || resolvedKey.status === "deleted") {
        await metrics.incrementRequests();
        await metrics.incrementBlocked();

        console.log(`[Rate Limiter] Blocked Request: Revoked/Deleted API Key | Key: ${maskedKey} | Status: ${resolvedKey.status}`);

        return res.status(401).json({
            success: false,
            message: `Authentication failed: API Key has been ${resolvedKey.status}.`,
        });
    }

    // 4. Handle disabled API Key
    if (resolvedKey.status === "disabled") {
        await metrics.incrementRequests();
        await metrics.incrementBlocked();

        console.log(`[Rate Limiter] Blocked Request: Disabled API Key | Key: ${maskedKey}`);

        return res.status(403).json({
            success: false,
            message: "Access denied: API Key is disabled.",
        });
    }

    // 5. Handle expired API Key
    if (resolvedKey.status === "expired") {
        await metrics.incrementRequests();
        await metrics.incrementBlocked();

        console.log(`[Rate Limiter] Blocked Request: Expired API Key | Key: ${maskedKey}`);

        return res.status(403).json({
            success: false,
            message: "Access denied: API Key has expired.",
        });
    }

    // 6. Handle Unknown Policy
    if (resolvedKey.policyUnknown || !resolvedKey.policy) {
        await metrics.incrementRequests();
        await metrics.incrementBlocked();

        console.log(`[Rate Limiter] Blocked Request: Unknown Policy | Key: ${maskedKey}`);

        return res.status(404).json({
            success: false,
            message: "Access denied: The policy assigned to this API Key was not found.",
        });
    }

    // 7. Handle Inactive Policy
    if (resolvedKey.policyInactive || resolvedKey.policy.isActive === false) {
        await metrics.incrementRequests();
        await metrics.incrementBlocked();

        console.log(`[Rate Limiter] Blocked Request: Inactive Policy | Key: ${maskedKey} | Policy: ${resolvedKey.policy.name}`);

        return res.status(403).json({
            success: false,
            message: "Access denied: The policy assigned to this API Key is inactive.",
        });
    }

    // 8. Execute Rate Limiter Engine
    try {
        const policy = resolvedKey.policy;
        const rateLimitResult = await rateLimiterService.checkRateLimit(
            keyId.toString(),
            policy
        );

        // Calculate processing time in milliseconds (high-resolution)
        const diff = process.hrtime(startTime);
        const processingTimeMs = (diff[0] * 1000) + (diff[1] / 1000000);

        // Update overall request metrics
        await metrics.recordRequest({
            keyId,
            allowed: rateLimitResult.allowed,
            algorithm: policy.algorithm,
            processingTimeMs
        });

        // Append rate limit headers
        res.setHeader("X-RateLimit-Limit", rateLimitResult.limit);
        res.setHeader("X-RateLimit-Remaining", rateLimitResult.remaining);
        res.setHeader("X-RateLimit-Reset", rateLimitResult.reset);

        // 9. Handle Blocked Request (HTTP 429)
        if (!rateLimitResult.allowed) {
            const retryAfter = Math.max(1, Math.ceil(rateLimitResult.reset - (Date.now() / 1000)));
            res.setHeader("Retry-After", retryAfter);

            console.log(`[Rate Limiter] Blocked Request: Rate Limit Exceeded | Key: ${maskedKey} | Policy: ${policy.name} | Algorithm: ${policy.algorithm} | Limit: ${rateLimitResult.limit} | Remaining: ${rateLimitResult.remaining} | Reset: ${rateLimitResult.reset} | Retry-After: ${retryAfter}s`);

            return res.status(429).json({
                success: false,
                message: "Too Many Requests: Rate limit exceeded.",
                limit: rateLimitResult.limit,
                remaining: rateLimitResult.remaining,
                reset: new Date(rateLimitResult.reset * 1000).toISOString(),
            });
        }

        // 10. Log Allowed Request
        console.log(`[Rate Limiter] Allowed Request | Key: ${maskedKey} | Policy: ${policy.name} | Algorithm: ${policy.algorithm} | Limit: ${rateLimitResult.limit} | Remaining: ${rateLimitResult.remaining} | Duration: ${processingTimeMs.toFixed(3)}ms`);

        // Attach client info to req for downstream usage
        req.clientId = resolvedKey.userId;
        req.keyId = keyId;
        req.policy = policy;

        next();
    } catch (error) {
        console.error("[Rate Limiter] Engine execution failure:", error.message);
        metrics.incrementRedisErrors();

        res.status(500).json({
            success: false,
            message: "Internal server error: Rate limiter engine execution failure.",
        });
    }
}

module.exports = rateLimiter;
