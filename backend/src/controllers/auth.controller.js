const authService = require("../services/auth.service");

/**
 * Handle Admin Registration
 */
async function register(req, res, next) {
    try {
        const { name, email, password, role } = req.body;
        const result = await authService.registerUser({ name, email, password, role });

        res.status(201).json({
            success: true,
            message: "Admin registered successfully",
            data: result,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Handle Admin Login
 */
async function login(req, res, next) {
    try {
        const { email, password } = req.body;
        const result = await authService.loginUser({ email, password });

        res.status(200).json({
            success: true,
            message: "Login successful",
            data: result,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Handle Token Refresh
 */
async function refresh(req, res, next) {
    try {
        const { refreshToken } = req.body;
        const result = await authService.refreshAccessToken(refreshToken);

        res.status(200).json({
            success: true,
            message: "Token refreshed successfully",
            data: result,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Handle Admin Logout
 */
async function logout(req, res, next) {
    try {
        const userId = req.user.id;
        const result = await authService.logoutUser(userId);

        res.status(200).json({
            success: true,
            message: result.message,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Fetch authenticated Admin profile
 */
async function getMe(req, res, next) {
    try {
        const userId = req.user.id;
        const user = await authService.getCurrentUser(userId);

        res.status(200).json({
            success: true,
            data: user,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Update Admin Profile
 */
async function updateProfile(req, res, next) {
    try {
        const userId = req.user.id;
        const { name, email } = req.body;
        const updatedUser = await authService.updateProfile(userId, { name, email });

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: updatedUser,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Change Admin Password
 */
async function changePassword(req, res, next) {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;
        const result = await authService.changePassword(userId, { currentPassword, newPassword });

        res.status(200).json({
            success: true,
            message: result.message,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Deactivate Admin Account
 */
async function deactivateAccount(req, res, next) {
    try {
        const userId = req.user.id;
        const result = await authService.deactivateAccount(userId);

        res.status(200).json({
            success: true,
            message: result.message,
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    register,
    login,
    refresh,
    logout,
    getMe,
    updateProfile,
    changePassword,
    deactivateAccount,
};
