const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const healthRoutes = require("./routes/health.routes");
const logger = require("./middleware/logger");
const rateLimiter = require("./middleware/rateLimiter");
const metricsRoutes = require("./routes/metrics.routes");
const authRoutes = require("./routes/auth.routes");
const policyRoutes = require("./routes/policy.routes");
const apiKeyRoutes = require("./routes/apiKey.routes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// Security and utility middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(logger);

// Register metrics before rate limiter to prevent rate limiting dashboard actions
app.use("/metrics", metricsRoutes);

// Apply core Rate Limiter (handles API Key authentication & rate limiting)
app.use(rateLimiter);

// Dashboard Management Routes
app.use("/auth", authRoutes);
app.use("/policies", policyRoutes);
app.use("/api-keys", apiKeyRoutes);

// Public Health Check Route
app.use("/health", healthRoutes);

// Protected Client Route for testing rate limiting
app.get("/api/resource", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Request allowed! You have hit a protected RateShield API endpoint.",
        data: {
            clientId: req.clientId,
            keyId: req.keyId,
            policy: {
                algorithm: req.policy.algorithm,
                maxRequests: req.policy.maxRequests,
                windowSize: req.policy.windowSize,
            },
        },
    });
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
