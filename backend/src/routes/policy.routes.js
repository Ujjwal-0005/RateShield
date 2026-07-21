const express = require("express");
const router = express.Router();
const policyController = require("../controllers/policy.controller");
const { authenticateToken } = require("../middleware/auth");
const {
	validatePolicyCreate,
	validatePolicyUpdate,
	validatePolicyId,
	validatePolicyQuery,
} = require("../validators/policy.validator");

// Apply authentication to all policy routes
router.use(authenticateToken);

router.get("/", validatePolicyQuery, policyController.getPolicies);
router.post("/", validatePolicyCreate, policyController.createPolicy);
router.get("/:id", validatePolicyId, policyController.getPolicyById);
router.put("/:id", validatePolicyId, validatePolicyUpdate, policyController.updatePolicy);
router.patch("/:id/activate", validatePolicyId, policyController.activatePolicy);
router.patch("/:id/deactivate", validatePolicyId, policyController.deactivatePolicy);
router.delete("/:id", validatePolicyId, policyController.deletePolicy);

module.exports = router;
