const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/env");

/**
 * Signs a JWT token for the user.
 */
function generateToken(user) {
    return jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: "24h" }
    );
}

/**
 * Registers a new user.
 */
async function registerUser({ email, password, role }) {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        const error = new Error("Email is already registered");
        error.statusCode = 400;
        throw error;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({
        email,
        password: hashedPassword,
        role: role || "user",
    });

    await user.save();

    const token = generateToken(user);

    return {
        user,
        token,
    };
}

/**
 * Authenticates a user and returns a token.
 */
async function loginUser({ email, password }) {
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
        const error = new Error("Invalid email or password");
        error.statusCode = 401;
        throw error;
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        const error = new Error("Invalid email or password");
        error.statusCode = 401;
        throw error;
    }

    const token = generateToken(user);

    return {
        user,
        token,
    };
}

module.exports = {
    registerUser,
    loginUser,
};
