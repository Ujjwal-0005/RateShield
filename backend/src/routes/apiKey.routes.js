const express = require("express");
const router = express.Router();
const apiKeyController = require("../controllers/apiKey.controller");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");
const {
	validateApiKeyCreate,
	validateApiKeyUpdate,
	validateApiKeyRegenerate,
	validateApiKeyId,
	validateApiKeyQuery,
} = require("../validators/apiKey.validator");

// Require authentication and admin role for all API key management endpoints
router.use(authenticateToken);
router.use(authorizeRoles("admin", "superadmin"));

router.get("/", validateApiKeyQuery, apiKeyController.getApiKeys);
router.post("/", validateApiKeyCreate, apiKeyController.createApiKey);
router.get("/:id", validateApiKeyId, apiKeyController.getApiKeyById);
router.put("/:id", validateApiKeyId, validateApiKeyUpdate, apiKeyController.updateApiKey);
router.patch("/:id/disable", validateApiKeyId, apiKeyController.disableApiKey);
router.patch("/:id/enable", validateApiKeyId, apiKeyController.enableApiKey);
router.patch("/:id/regenerate", validateApiKeyId, validateApiKeyRegenerate, apiKeyController.regenerateApiKey);
router.delete("/:id", validateApiKeyId, apiKeyController.revokeApiKey);

module.exports = router;
