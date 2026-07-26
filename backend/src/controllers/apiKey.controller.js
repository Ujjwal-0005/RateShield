const apiKeyService = require("../services/apiKey.service");

/**
 * Generate a new API key for the user
 */
async function createApiKey(req, res, next) {
    try {
        const result = await apiKeyService.createApiKey({
            ...req.validatedApiKeyBody,
            createdBy: req.user.id,
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
        const isAdmin = req.user.role === "admin";

        const result = await apiKeyService.getApiKeys({
            userId: req.user.id,
            isAdmin,
            filters: req.validatedApiKeyQuery || {},
        });

        res.status(200).json({
            success: true,
            data: result.items,
            meta: result.meta,
        });
    } catch (error) {
        next(error);
    }
}

async function getApiKeyById(req, res, next) {
    try {
        const isAdmin = req.user.role === "admin";
        const key = await apiKeyService.getApiKeyById(req.params.id, req.user.id, isAdmin);

        res.status(200).json({
            success: true,
            data: key,
        });
    } catch (error) {
        next(error);
    }
}

async function updateApiKey(req, res, next) {
    try {
        const isAdmin = req.user.role === "admin";
        const key = await apiKeyService.updateApiKey(req.params.id, req.user.id, req.validatedApiKeyBody, isAdmin);

        res.status(200).json({
            success: true,
            message: "API Key updated successfully",
            data: key,
        });
    } catch (error) {
        next(error);
    }
}

async function regenerateApiKey(req, res, next) {
    try {
        const isAdmin = req.user.role === "admin";
        const key = await apiKeyService.regenerateApiKey(
            req.params.id,
            req.user.id,
            isAdmin,
            req.validatedApiKeyBody?.keyType
        );

        res.status(200).json({
            success: true,
            message: "API Key regenerated successfully. Store the new rawKey immediately.",
            data: key,
        });
    } catch (error) {
        next(error);
    }
}

async function disableApiKey(req, res, next) {
    try {
        const isAdmin = req.user.role === "admin";
        const key = await apiKeyService.disableApiKey(req.params.id, req.user.id, isAdmin);

        res.status(200).json({
            success: true,
            message: "API Key disabled successfully",
            data: key,
        });
    } catch (error) {
        next(error);
    }
}

async function enableApiKey(req, res, next) {
    try {
        const isAdmin = req.user.role === "admin";
        const key = await apiKeyService.enableApiKey(req.params.id, req.user.id, isAdmin);

        res.status(200).json({
            success: true,
            message: "API Key enabled successfully",
            data: key,
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
        const isAdmin = req.user.role === "admin";

        const key = await apiKeyService.deleteApiKey(id, req.user.id, isAdmin);

        res.status(200).json({
            success: true,
            message: "API Key deleted successfully",
            data: key,
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createApiKey,
    getApiKeys,
    getApiKeyById,
    updateApiKey,
    regenerateApiKey,
    disableApiKey,
    enableApiKey,
    revokeApiKey,
};
