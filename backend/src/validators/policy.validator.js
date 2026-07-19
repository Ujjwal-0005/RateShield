/**
 * Validator middleware for Policy requests
 */
function validatePolicyCreate(req, res, next) {
    const { name, algorithm, windowSize, maxRequests, tokenBucketRate } = req.body;

    if (!name || typeof name !== "string" || name.trim() === "") {
        return res.status(400).json({ success: false, message: "Policy name is required" });
    }

    if (algorithm && !["fixed", "sliding", "token_bucket"].includes(algorithm)) {
        return res.status(400).json({
            success: false,
            message: "Algorithm must be fixed, sliding, or token_bucket",
        });
    }

    if (windowSize === undefined || typeof windowSize !== "number" || windowSize < 1) {
        return res.status(400).json({
            success: false,
            message: "Window size is required and must be a number >= 1 (in seconds)",
        });
    }

    if (maxRequests === undefined || typeof maxRequests !== "number" || maxRequests < 1) {
        return res.status(400).json({
            success: false,
            message: "Max requests is required and must be a number >= 1",
        });
    }

    if (algorithm === "token_bucket" && tokenBucketRate !== undefined) {
        if (typeof tokenBucketRate !== "number" || tokenBucketRate <= 0) {
            return res.status(400).json({
                success: false,
                message: "tokenBucketRate must be a positive number",
            });
        }
    }

    next();
}

function validatePolicyUpdate(req, res, next) {
    const { name, algorithm, windowSize, maxRequests, tokenBucketRate, isActive } = req.body;

    if (name !== undefined && (typeof name !== "string" || name.trim() === "")) {
        return res.status(400).json({ success: false, message: "Policy name cannot be empty" });
    }

    if (algorithm !== undefined && !["fixed", "sliding", "token_bucket"].includes(algorithm)) {
        return res.status(400).json({
            success: false,
            message: "Algorithm must be fixed, sliding, or token_bucket",
        });
    }

    if (windowSize !== undefined && (typeof windowSize !== "number" || windowSize < 1)) {
        return res.status(400).json({
            success: false,
            message: "Window size must be a number >= 1 (in seconds)",
        });
    }

    if (maxRequests !== undefined && (typeof maxRequests !== "number" || maxRequests < 1)) {
        return res.status(400).json({
            success: false,
            message: "Max requests must be a number >= 1",
        });
    }

    if (tokenBucketRate !== undefined && (typeof tokenBucketRate !== "number" || tokenBucketRate <= 0)) {
        return res.status(400).json({
            success: false,
            message: "tokenBucketRate must be a positive number",
        });
    }

    if (isActive !== undefined && typeof isActive !== "boolean") {
        return res.status(400).json({
            success: false,
            message: "isActive must be a boolean",
        });
    }

    next();
}

module.exports = {
    validatePolicyCreate,
    validatePolicyUpdate,
};
