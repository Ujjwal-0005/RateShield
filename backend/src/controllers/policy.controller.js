const policyService = require("../services/policy.service");

/**
 * Create a new policy
 */
async function createPolicy(req, res, next) {
    try {
        const { name, description, algorithm, windowSize, maxRequests, tokenBucketRate } = req.body;
        const createdBy = req.user.id;

        const policy = await policyService.createPolicy({
            name,
            description,
            algorithm,
            windowSize,
            maxRequests,
            tokenBucketRate,
            createdBy,
        });

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
        const userId = req.user.id;
        const isAdmin = req.user.role === "admin";
        
        const policies = await policyService.getPolicies(userId, isAdmin);

        res.status(200).json({
            success: true,
            data: policies,
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
        const userId = req.user.id;
        const isAdmin = req.user.role === "admin";
        
        const updatedPolicy = await policyService.updatePolicy(id, userId, req.body, isAdmin);

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
        const userId = req.user.id;
        const isAdmin = req.user.role === "admin";

        await policyService.deletePolicy(id, userId, isAdmin);

        res.status(200).json({
            success: true,
            message: "Policy deleted successfully",
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
};
