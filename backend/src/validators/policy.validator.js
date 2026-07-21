const mongoose = require("mongoose");

const ALGORITHMS = ["sliding", "fixed", "token_bucket"];
const SORT_FIELDS = ["createdAt", "updatedAt", "name", "algorithm", "windowSize", "maxRequests", "isActive"];

function sendValidationError(res, message, details) {
    return res.status(422).json({
        success: false,
        message,
        errors: details,
    });
}

function parseInteger(value) {
    if (value === undefined || value === null || value === "") {
        return undefined;
    }

    const parsedValue = Number(value);
    if (!Number.isInteger(parsedValue)) {
        return undefined;
    }

    return parsedValue;
}

function parseBoolean(value) {
    if (value === undefined || value === null || value === "") {
        return undefined;
    }

    if (typeof value === "boolean") {
        return value;
    }

    if (value === "true") {
        return true;
    }

    if (value === "false") {
        return false;
    }

    return undefined;
}

function normalizeText(value) {
    if (typeof value !== "string") {
        return undefined;
    }

    const trimmedValue = value.trim();
    return trimmedValue === "" ? undefined : trimmedValue;
}

function validatePolicyBody(body, { partial = false } = {}) {
    const errors = [];
    const validated = {};

    if (body.name !== undefined) {
        const name = normalizeText(body.name);
        if (!name) {
            errors.push("Policy name must be a non-empty string");
        } else {
            validated.name = name;
        }
    } else if (!partial) {
        errors.push("Policy name is required");
    }

    if (body.description !== undefined) {
        const description = normalizeText(body.description);
        if (description === undefined && body.description !== "") {
            errors.push("Description must be a string");
        } else if (description !== undefined) {
            validated.description = description;
        }
    }

    if (body.algorithm !== undefined) {
        const algorithm = normalizeText(body.algorithm);
        if (!algorithm || !ALGORITHMS.includes(algorithm)) {
            errors.push(`Algorithm must be one of: ${ALGORITHMS.join(", ")}`);
        } else {
            validated.algorithm = algorithm;
        }
    } else if (!partial) {
        validated.algorithm = "sliding";
    }

    if (body.windowSize !== undefined) {
        const windowSize = parseInteger(body.windowSize);
        if (windowSize === undefined || windowSize < 1) {
            errors.push("Window size must be a positive integer");
        } else {
            validated.windowSize = windowSize;
        }
    } else if (!partial) {
        errors.push("Window size is required");
    }

    if (body.maxRequests !== undefined) {
        const maxRequests = parseInteger(body.maxRequests);
        if (maxRequests === undefined || maxRequests < 1) {
            errors.push("Max requests must be a positive integer");
        } else {
            validated.maxRequests = maxRequests;
        }
    } else if (!partial) {
        errors.push("Max requests is required");
    }

    if (body.isActive !== undefined) {
        const isActive = parseBoolean(body.isActive);
        if (isActive === undefined) {
            errors.push("isActive must be a boolean");
        } else {
            validated.isActive = isActive;
        }
    }

    return { errors, validated };
}

function validatePolicyCreate(req, res, next) {
    const { errors, validated } = validatePolicyBody(req.body);

    if (errors.length > 0) {
        return sendValidationError(res, "Policy validation failed", errors);
    }

    req.validatedPolicyBody = validated;
    next();
}

function validatePolicyUpdate(req, res, next) {
    const { errors, validated } = validatePolicyBody(req.body, { partial: true });

    if (Object.keys(validated).length === 0) {
        errors.push("At least one policy field must be provided for update");
    }

    if (errors.length > 0) {
        return sendValidationError(res, "Policy validation failed", errors);
    }

    req.validatedPolicyBody = validated;
    next();
}

function validatePolicyId(req, res, next) {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return sendValidationError(res, "Invalid policy id", ["The provided policy id is not a valid ObjectId"]);
    }

    next();
}

function validatePolicyQuery(req, res, next) {
    const errors = [];
    const validated = {};
    const { search, algorithm, isActive, page, limit, sortBy, sortOrder } = req.query;

    if (search !== undefined) {
        const normalizedSearch = normalizeText(search);
        if (normalizedSearch === undefined) {
            errors.push("Search must be a non-empty string");
        } else {
            validated.search = normalizedSearch;
        }
    }

    if (algorithm !== undefined) {
        const normalizedAlgorithm = normalizeText(algorithm);
        if (!normalizedAlgorithm || !ALGORITHMS.includes(normalizedAlgorithm)) {
            errors.push(`Algorithm filter must be one of: ${ALGORITHMS.join(", ")}`);
        } else {
            validated.algorithm = normalizedAlgorithm;
        }
    }

    if (isActive !== undefined) {
        const normalizedIsActive = parseBoolean(isActive);
        if (normalizedIsActive === undefined) {
            errors.push("isActive query parameter must be true or false");
        } else {
            validated.isActive = normalizedIsActive;
        }
    }

    if (page !== undefined) {
        const normalizedPage = parseInteger(page);
        if (normalizedPage === undefined || normalizedPage < 1) {
            errors.push("page must be a positive integer");
        } else {
            validated.page = normalizedPage;
        }
    }

    if (limit !== undefined) {
        const normalizedLimit = parseInteger(limit);
        if (normalizedLimit === undefined || normalizedLimit < 1 || normalizedLimit > 100) {
            errors.push("limit must be a positive integer between 1 and 100");
        } else {
            validated.limit = normalizedLimit;
        }
    }

    if (sortBy !== undefined) {
        const normalizedSortBy = normalizeText(sortBy);
        if (!normalizedSortBy || !SORT_FIELDS.includes(normalizedSortBy)) {
            errors.push(`sortBy must be one of: ${SORT_FIELDS.join(", ")}`);
        } else {
            validated.sortBy = normalizedSortBy;
        }
    }

    if (sortOrder !== undefined) {
        const normalizedSortOrder = normalizeText(sortOrder)?.toLowerCase();
        if (!["asc", "desc"].includes(normalizedSortOrder)) {
            errors.push("sortOrder must be asc or desc");
        } else {
            validated.sortOrder = normalizedSortOrder;
        }
    }

    req.validatedPolicyQuery = validated;

    if (errors.length > 0) {
        return sendValidationError(res, "Policy query validation failed", errors);
    }

    next();
}

module.exports = {
    validatePolicyCreate,
    validatePolicyUpdate,
    validatePolicyId,
    validatePolicyQuery,
};
