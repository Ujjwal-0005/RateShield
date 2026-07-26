const express = require("express");
const router = express.Router();
const { getMetrics } = require("../controllers/metrics.controller");
const { authenticateToken } = require("../middleware/auth");

// Require authentication for system metrics
router.get("/", authenticateToken, getMetrics);

module.exports = router;