const authService = require("../services/auth.service");

/**
 * Handle user registration
 */
async function register(req, res, next) {
    try {
        const { email, password, role } = req.body;
        const result = await authService.registerUser({ email, password, role });

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: result,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Handle user login
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

module.exports = {
    register,
    login,
};
