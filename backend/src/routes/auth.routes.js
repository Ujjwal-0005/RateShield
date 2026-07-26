const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { authenticateToken } = require("../middleware/auth");
const {
    validateRegister,
    validateLogin,
    validateRefreshToken,
    validateUpdateProfile,
    validateChangePassword,
} = require("../validators/auth.validator");

// Public Authentication Routes
router.post("/register", validateRegister, authController.register);
router.post("/login", validateLogin, authController.login);
router.post("/refresh", validateRefreshToken, authController.refresh);

// Protected Admin Routes (Requires valid JWT Access Token)
router.use(authenticateToken);

router.get("/me", authController.getMe);
router.put("/profile", validateUpdateProfile, authController.updateProfile);
router.patch("/change-password", validateChangePassword, authController.changePassword);
router.post("/logout", authController.logout);
router.patch("/deactivate", authController.deactivateAccount);

module.exports = router;
