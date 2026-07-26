const User = require("../models/User");
const jwt = require("jsonwebtoken");
const {
    JWT_SECRET,
    JWT_EXPIRES_IN,
    JWT_REFRESH_SECRET,
    JWT_REFRESH_EXPIRES_IN,
} = require("../config/env");

/**
 * Generates Access and Refresh tokens for an admin user.
 */
function generateTokens(user) {
    const accessToken = jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
        { id: user._id },
        JWT_REFRESH_SECRET,
        { expiresIn: JWT_REFRESH_EXPIRES_IN }
    );

    return { token: accessToken, refreshToken };
}

/**
 * Registers a new Admin user.
 */
async function registerUser({ name, email, password, role }) {
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
        const error = new Error("Email is already registered");
        error.statusCode = 400;
        throw error;
    }

    const user = new User({
        name,
        email,
        password,
        role: role || "admin",
    });

    const { token, refreshToken } = generateTokens(user);
    user.refreshToken = refreshToken;
    await user.save();

    console.log(`[Auth Audit] Admin Registered | ID: ${user._id} | Email: ${user.email} | Role: ${user.role}`);

    return {
        user,
        token,
        refreshToken,
    };
}

/**
 * Authenticates an Admin user and returns access/refresh tokens.
 */
async function loginUser({ email, password }) {
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password +refreshToken");
    if (!user) {
        console.warn(`[Auth Audit] Login Failed (User not found) | Email: ${email}`);
        const error = new Error("Invalid email or password");
        error.statusCode = 401;
        throw error;
    }

    if (!user.isActive) {
        console.warn(`[Auth Audit] Login Failed (Account deactivated) | Email: ${email}`);
        const error = new Error("Access denied: Your account has been deactivated.");
        error.statusCode = 403;
        throw error;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        console.warn(`[Auth Audit] Login Failed (Incorrect password) | Email: ${email}`);
        const error = new Error("Invalid email or password");
        error.statusCode = 401;
        throw error;
    }

    const { token, refreshToken } = generateTokens(user);

    user.lastLogin = new Date();
    user.refreshToken = refreshToken;
    await user.save();

    console.log(`[Auth Audit] Login Success | UserID: ${user._id} | Role: ${user.role}`);

    return {
        user,
        token,
        refreshToken,
    };
}

/**
 * Rotates tokens using a valid refresh token.
 */
async function refreshAccessToken(refreshTokenStr) {
    if (!refreshTokenStr) {
        const error = new Error("Refresh token is required");
        error.statusCode = 400;
        throw error;
    }

    let decoded;
    try {
        decoded = jwt.verify(refreshTokenStr, JWT_REFRESH_SECRET);
    } catch (err) {
        console.warn(`[Auth Audit] Refresh Failed (Invalid or Expired Refresh Token)`);
        const error = new Error("Invalid or expired refresh token");
        error.statusCode = 401;
        throw error;
    }

    const user = await User.findById(decoded.id).select("+refreshToken");
    if (!user || !user.isActive || user.refreshToken !== refreshTokenStr) {
        console.warn(`[Auth Audit] Refresh Failed (Token mismatch or user inactive) | UserID: ${decoded.id}`);
        const error = new Error("Invalid refresh token session");
        error.statusCode = 401;
        throw error;
    }

    const { token, refreshToken: newRefreshToken } = generateTokens(user);
    user.refreshToken = newRefreshToken;
    await user.save();

    console.log(`[Auth Audit] Token Refreshed | UserID: ${user._id}`);

    return {
        user,
        token,
        refreshToken: newRefreshToken,
    };
}

/**
 * Revokes refresh token and logs out the user.
 */
async function logoutUser(userId) {
    const user = await User.findById(userId);
    if (user) {
        user.refreshToken = null;
        await user.save();
    }
    console.log(`[Auth Audit] Logout Success | UserID: ${userId}`);
    return { success: true, message: "Logged out successfully" };
}

/**
 * Fetches current authenticated user profile.
 */
async function getCurrentUser(userId) {
    const user = await User.findById(userId);
    if (!user || !user.isActive) {
        const error = new Error("User not found or inactive");
        error.statusCode = 404;
        throw error;
    }
    return user;
}

/**
 * Updates admin user profile details.
 */
async function updateProfile(userId, { name, email }) {
    const user = await User.findById(userId);
    if (!user || !user.isActive) {
        const error = new Error("User not found or inactive");
        error.statusCode = 404;
        throw error;
    }

    if (email && email.toLowerCase() !== user.email) {
        const existingEmail = await User.findOne({ email: email.toLowerCase() });
        if (existingEmail) {
            const error = new Error("Email is already taken by another account");
            error.statusCode = 400;
            throw error;
        }
        user.email = email.toLowerCase();
    }

    if (name) {
        user.name = name;
    }

    await user.save();
    console.log(`[Auth Audit] Profile Updated | UserID: ${user._id}`);
    return user;
}

/**
 * Updates admin user password.
 */
async function changePassword(userId, { currentPassword, newPassword }) {
    const user = await User.findById(userId).select("+password");
    if (!user || !user.isActive) {
        const error = new Error("User not found or inactive");
        error.statusCode = 404;
        throw error;
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
        const error = new Error("Incorrect current password");
        error.statusCode = 400;
        throw error;
    }

    user.password = newPassword;
    user.passwordChangedAt = new Date();
    user.refreshToken = null; // Revoke current session on password change
    await user.save();

    console.log(`[Auth Audit] Password Changed | UserID: ${user._id}`);
    return { success: true, message: "Password updated successfully. Please log in again." };
}

/**
 * Deactivates an admin account.
 */
async function deactivateAccount(userId) {
    const user = await User.findById(userId);
    if (!user) {
        const error = new Error("User not found");
        error.statusCode = 404;
        throw error;
    }

    user.isActive = false;
    user.refreshToken = null;
    await user.save();

    console.log(`[Auth Audit] Account Deactivated | UserID: ${user._id}`);
    return { success: true, message: "Account deactivated successfully" };
}

module.exports = {
    generateTokens,
    registerUser,
    loginUser,
    refreshAccessToken,
    logoutUser,
    getCurrentUser,
    updateProfile,
    changePassword,
    deactivateAccount,
};
