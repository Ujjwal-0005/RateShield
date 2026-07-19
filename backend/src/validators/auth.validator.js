/**
 * Validator middleware for Authentication requests
 */
function validateRegister(req, res, next) {
    const { email, password } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: "Email is required" });
    }

    if (!password) {
        return res.status(400).json({ success: false, message: "Password is required" });
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ success: false, message: "Invalid email format" });
    }

    if (password.length < 6) {
        return res.status(400).json({
            success: false,
            message: "Password must be at least 6 characters long",
        });
    }

    next();
}

function validateLogin(req, res, next) {
    const { email, password } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: "Email is required" });
    }

    if (!password) {
        return res.status(400).json({ success: false, message: "Password is required" });
    }

    next();
}

module.exports = {
    validateRegister,
    validateLogin,
};
