const express = require("express");
const router = express.Router();
const policyController = require("../controllers/policy.controller");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");
const {
	validatePolicyCreate,
	validatePolicyUpdate,
	validatePolicyId,
	validatePolicyQuery,
} = require("../validators/policy.validator");

// Require authentication and admin role for all policy management endpoints
router.use(authenticateToken);
router.use(authorizeRoles("admin", "superadmin"));

router.get("/", validatePolicyQuery, policyController.getPolicies);
router.post("/", validatePolicyCreate, policyController.createPolicy);
router.get("/:id", validatePolicyId, policyController.getPolicyById);
router.put("/:id", validatePolicyId, validatePolicyUpdate, policyController.updatePolicy);
router.patch("/:id/activate", validatePolicyId, policyController.activatePolicy);
router.patch("/:id/deactivate", validatePolicyId, policyController.deactivatePolicy);
router.delete("/:id", validatePolicyId, policyController.deletePolicy);

module.exports = router;
