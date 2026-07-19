const apiKeyService = require("../services/apiKey.service");

/**
 * Generate a new API key for the user
 */
async function createApiKey(req, res, next) {
    try {
        const { name, policyId, expiresAt } = req.body;
        const userId = req.user.id;

        const result = await apiKeyService.createApiKey({
            name,
            policyId,
            userId,
            expiresAt,
        });

        res.status(201).json({
            success: true,
            message: "API Key created successfully. Please store this key safely as it will not be shown again.",
            data: result,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Fetch all API keys for the user
 */
async function getApiKeys(req, res, next) {
    try {
        const userId = req.user.id;
        const isAdmin = req.user.role === "admin";
        
        const keys = await apiKeyService.getApiKeys(userId, isAdmin);

        res.status(200).json({
            success: true,
            data: keys,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Revoke (disable) an API key
 */
async function revokeApiKey(req, res, next) {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const isAdmin = req.user.role === "admin";

        const key = await apiKeyService.revokeApiKey(id, userId, isAdmin);

        res.status(200).json({
            success: true,
            message: "API Key revoked successfully",
            data: key,
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createApiKey,
    getApiKeys,
    revokeApiKey,
};
