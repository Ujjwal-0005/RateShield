const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { JWT_SECRET } = require("../config/env");

/**
 * Middleware to verify Admin JWT access token and attach user object to request.
 */
async function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer <TOKEN>

    if (!token) {
        console.warn(`[Auth Middleware] Missing Authorization Token | Path: ${req.path} | RemoteIP: ${req.ip}`);
        return res.status(401).json({
            success: false,
            message: "Access Denied: No token provided. Pass Bearer token in Authorization header.",
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        // Fetch user from DB to ensure account is still active and valid
        const user = await User.findById(decoded.id);

        if (!user) {
            console.warn(`[Auth Middleware] User Not Found for Token | UserID: ${decoded.id}`);
            return res.status(401).json({
                success: false,
                message: "Authentication failed: User account no longer exists.",
            });
        }

        if (!user.isActive) {
            console.warn(`[Auth Middleware] Deactivated Account Access Attempt | UserID: ${user._id}`);
            return res.status(403).json({
                success: false,
                message: "Access denied: Account has been deactivated.",
            });
        }

        // Check if user changed password after the token was issued
        if (user.changedPasswordAfter(decoded.iat)) {
            console.warn(`[Auth Middleware] Password Changed After Token Issued | UserID: ${user._id}`);
            return res.status(401).json({
                success: false,
                message: "Authentication failed: Password recently changed. Please log in again.",
            });
        }

        req.user = user;
        next();
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            console.warn(`[Auth Middleware] Expired Token Access Attempt | Path: ${req.path}`);
            return res.status(401).json({
                success: false,
                message: "Access Denied: Token has expired.",
            });
        }

        console.warn(`[Auth Middleware] Invalid Token | Path: ${req.path} | Error: ${err.message}`);
        return res.status(401).json({
            success: false,
            message: "Access Denied: Invalid authentication token.",
        });
    }
}

/**
 * Middleware to enforce Role-Based Access Control (RBAC).
 */
function authorizeRoles(...roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            console.warn(`[Auth Middleware] Unauthorized Role Access Attempt | UserID: ${req.user?._id} | Role: ${req.user?.role} | Required: ${roles.join(", ")}`);
            return res.status(403).json({
                success: false,
                message: `Access Denied: Requires one of the following roles: [${roles.join(", ")}]`,
            });
        }
        next();
    };
}

module.exports = {
    authenticateToken,
    authenticateAdmin: authenticateToken,
    authorizeRoles,
    authorizeRole: authorizeRoles,
};
