const apiKeyService = require("../services/apiKey.service");
const { isValidApiKeyFormat } = require("../utils/keyGenerator");

function authenticateApiKey(req, res, next) {
    return (async () => {
        const apiKey = req.headers["x-api-key"];

        if (!apiKey) {
            console.log("[API Key] Authentication failure: missing x-api-key header");
            return res.status(401).json({
                success: false,
                message: "Authentication failed: API Key is missing.",
            });
        }

        if (!isValidApiKeyFormat(apiKey)) {
            console.log("[API Key] Authentication failure: invalid API key format");
            return res.status(400).json({
                success: false,
                message: "Authentication failed: API Key format is invalid.",
            });
        }

        const resolvedKey = await apiKeyService.resolveApiKey(apiKey);

        if (!resolvedKey) {
            console.log("[API Key] Authentication failure: invalid key");
            return res.status(401).json({
                success: false,
                message: "Authentication failed: Invalid API Key.",
            });
        }

        if (resolvedKey.status === "disabled") {
            console.log("[API Key] Authentication failure: disabled key");
            return res.status(403).json({
                success: false,
                message: "Access denied: API Key is disabled.",
            });
        }

        if (resolvedKey.status === "expired") {
            console.log("[API Key] Authentication failure: expired key");
            return res.status(403).json({
                success: false,
                message: "Access denied: API Key has expired.",
            });
        }

        if (resolvedKey.status === "revoked" || resolvedKey.status === "deleted") {
            console.log("[API Key] Authentication failure: revoked/deleted key");
            return res.status(401).json({
                success: false,
                message: "Authentication failed: API Key has been revoked or deleted.",
            });
        }

        if (resolvedKey.policyUnknown) {
            console.log("[API Key] Authentication failure: policy not found");
            return res.status(404).json({
                success: false,
                message: "Access denied: The policy assigned to this API Key was not found.",
            });
        }

        if (resolvedKey.policyInactive || resolvedKey.policy?.isActive === false) {
            console.log("[API Key] Authentication failure: inactive policy");
            return res.status(403).json({
                success: false,
                message: "Access denied: The policy assigned to this API Key is inactive.",
            });
        }

        await apiKeyService.recordApiKeyUsage(resolvedKey.apiKeyId || resolvedKey.keyId);

        req.apiKey = resolvedKey;
        req.policy = resolvedKey.policy;

        console.log(`[API Key] Authentication success: ${resolvedKey.key || resolvedKey.maskedKey || resolvedKey.apiKeyId}`);
        next();
    })().catch((error) => {
        console.error("[API Key] Authentication error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Internal server error during API key authentication.",
        });
    });
}

module.exports = {
    authenticateApiKey,
};