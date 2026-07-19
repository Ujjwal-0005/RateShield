const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/env");

/**
 * Middleware to verify user JWT token and attach user payload to the request.
 */
function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer <TOKEN>

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Access Denied: No token provided",
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({
            success: false,
            message: "Access Denied: Invalid or expired token",
        });
    }
}

/**
 * Optional middleware to check for roles (e.g. admin)
 */
function authorizeRoles(...roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: "Access Denied: You do not have permission to perform this action",
            });
        }
        next();
    };
}

module.exports = {
    authenticateToken,
    authorizeRoles,
};
