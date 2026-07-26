const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordStrengthRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{6,}$/;

/**
 * Validator middleware for Admin Registration
 */
function validateRegister(req, res, next) {
    const { name, email, password, role } = req.body;

    if (!name || typeof name !== "string" || name.trim().length < 2) {
        return res.status(400).json({
            success: false,
            message: "Validation Error: Name is required and must be at least 2 characters long.",
        });
    }

    if (!email || !emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            message: "Validation Error: A valid email address is required.",
        });
    }

    if (!password || !passwordStrengthRegex.test(password)) {
        return res.status(400).json({
            success: false,
            message: "Validation Error: Password must be at least 6 characters long and include both letters and numbers.",
        });
    }

    if (role && !["user", "admin", "superadmin"].includes(role)) {
        return res.status(400).json({
            success: false,
            message: "Validation Error: Role must be 'user', 'admin', or 'superadmin'.",
        });
    }

    next();
}

/**
 * Validator middleware for Admin Login
 */
function validateLogin(req, res, next) {
    const { email, password } = req.body;

    if (!email || !emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            message: "Validation Error: A valid email address is required.",
        });
    }

    if (!password || typeof password !== "string" || password.length === 0) {
        return res.status(400).json({
            success: false,
            message: "Validation Error: Password is required.",
        });
    }

    next();
}

/**
 * Validator middleware for Refresh Token request
 */
function validateRefreshToken(req, res, next) {
    const { refreshToken } = req.body;

    if (!refreshToken || typeof refreshToken !== "string") {
        return res.status(400).json({
            success: false,
            message: "Validation Error: Refresh token is required.",
        });
    }

    next();
}

/**
 * Validator middleware for Profile Update
 */
function validateUpdateProfile(req, res, next) {
    const { name, email } = req.body;

    if (!name && !email) {
        return res.status(400).json({
            success: false,
            message: "Validation Error: At least one field (name or email) must be provided to update profile.",
        });
    }

    if (name && (typeof name !== "string" || name.trim().length < 2)) {
        return res.status(400).json({
            success: false,
            message: "Validation Error: Name must be at least 2 characters long.",
        });
    }

    if (email && !emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            message: "Validation Error: A valid email address is required.",
        });
    }

    next();
}

/**
 * Validator middleware for Password Change
 */
function validateChangePassword(req, res, next) {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword) {
        return res.status(400).json({
            success: false,
            message: "Validation Error: Current password is required.",
        });
    }

    if (!newPassword || !passwordStrengthRegex.test(newPassword)) {
        return res.status(400).json({
            success: false,
            message: "Validation Error: New password must be at least 6 characters long and include both letters and numbers.",
        });
    }

    if (currentPassword === newPassword) {
        return res.status(400).json({
            success: false,
            message: "Validation Error: New password must be different from current password.",
        });
    }

    next();
}

module.exports = {
    validateRegister,
    validateLogin,
    validateRefreshToken,
    validateUpdateProfile,
    validateChangePassword,
};
