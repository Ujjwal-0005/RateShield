const express = require("express");

const healthRoutes = require("./routes/health.routes");
const logger = require("./middleware/logger");

const app = express();

app.use(express.json());
app.use (logger);
app.use("/health", healthRoutes);

module.exports = app;
