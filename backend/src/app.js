const express = require("express");

const healthRoutes = require("./routes/health.routes");
const logger = require("./middleware/logger");
const rateLimiter = require("./middleware/rateLimiter");
const app = express();

app.use(express.json());
app.use (logger);
app.use(rateLimiter);
app.use("/health", healthRoutes);

module.exports = app;
