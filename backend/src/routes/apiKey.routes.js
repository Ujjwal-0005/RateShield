const express = require("express");
const router = express.Router();
const apiKeyController = require("../controllers/apiKey.controller");
const { authenticateToken } = require("../middleware/auth");
const { validateApiKeyCreate } = require("../validators/apiKey.validator");

// Apply authentication to all API key routes
router.use(authenticateToken);

router.post("/", validateApiKeyCreate, apiKeyController.createApiKey);
router.get("/", apiKeyController.getApiKeys);
router.delete("/:id", apiKeyController.revokeApiKey);

module.exports = router;
