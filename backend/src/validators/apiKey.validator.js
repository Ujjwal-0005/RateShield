const mongoose = require("mongoose");

/**
 * Validator middleware for API key creation requests
 */
function validateApiKeyCreate(req, res, next) {
    const { name, policyId, expiresAt } = req.body;

    if (!name || typeof name !== "string" || name.trim() === "") {
        return res.status(400).json({ success: false, message: "Key name is required" });
    }

    if (!policyId) {
        return res.status(400).json({ success: false, message: "Policy ID is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(policyId)) {
        return res.status(400).json({ success: false, message: "Invalid Policy ID format" });
    }

    if (expiresAt) {
        const date = new Date(expiresAt);
        if (isNaN(date.getTime())) {
            return res.status(400).json({ success: false, message: "Invalid expiration date" });
        }
        if (date < new Date()) {
            return res.status(400).json({ success: false, message: "Expiration date must be in the future" });
        }
    }

    next();
}

module.exports = {
    validateApiKeyCreate,
};
