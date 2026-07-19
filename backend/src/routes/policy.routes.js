const express = require("express");
const router = express.Router();
const policyController = require("../controllers/policy.controller");
const { authenticateToken } = require("../middleware/auth");
const { validatePolicyCreate, validatePolicyUpdate } = require("../validators/policy.validator");

// Apply authentication to all policy routes
router.use(authenticateToken);

router.post("/", validatePolicyCreate, policyController.createPolicy);
router.get("/", policyController.getPolicies);
router.get("/:id", policyController.getPolicyById);
router.put("/:id", validatePolicyUpdate, policyController.updatePolicy);
router.delete("/:id", policyController.deletePolicy);

module.exports = router;
