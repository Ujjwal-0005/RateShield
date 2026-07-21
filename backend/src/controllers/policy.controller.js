const policyService = require("../services/policy.service");

/**
 * Create a new policy
 */
async function createPolicy(req, res, next) {
    try {
        const policy = await policyService.createPolicy(req.validatedPolicyBody);

        res.status(201).json({
            success: true,
            message: "Policy created successfully",
            data: policy,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get all policies for the logged-in user
 */
async function getPolicies(req, res, next) {
    try {
        const result = await policyService.getPolicies(req.validatedPolicyQuery || {});

        res.status(200).json({
            success: true,
            data: result.items,
            meta: result.meta,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get a policy by ID
 */
async function getPolicyById(req, res, next) {
    try {
        const { id } = req.params;
        const policy = await policyService.getPolicyById(id);

        res.status(200).json({
            success: true,
            data: policy,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Update a policy
 */
async function updatePolicy(req, res, next) {
    try {
        const { id } = req.params;
        const updatedPolicy = await policyService.updatePolicy(id, req.validatedPolicyBody);

        res.status(200).json({
            success: true,
            message: "Policy updated successfully",
            data: updatedPolicy,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Delete a policy
 */
async function deletePolicy(req, res, next) {
    try {
        const { id } = req.params;
        await policyService.deletePolicy(id);

        res.status(200).json({
            success: true,
            message: "Policy deleted successfully",
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Activate a policy
 */
async function activatePolicy(req, res, next) {
    try {
        const { id } = req.params;
        const policy = await policyService.activatePolicy(id);

        res.status(200).json({
            success: true,
            message: "Policy activated successfully",
            data: policy,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Deactivate a policy
 */
async function deactivatePolicy(req, res, next) {
    try {
        const { id } = req.params;
        const policy = await policyService.deactivatePolicy(id);

        res.status(200).json({
            success: true,
            message: "Policy deactivated successfully",
            data: policy,
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createPolicy,
    getPolicies,
    getPolicyById,
    updatePolicy,
    deletePolicy,
    activatePolicy,
    deactivatePolicy,
};
