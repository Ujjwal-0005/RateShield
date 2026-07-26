const mongoose = require("mongoose");

const KEY_TYPES = ["live", "test"];
const STATUS_TYPES = ["active", "disabled", "revoked", "deleted", "expired"];
const SORT_FIELDS = ["createdAt", "updatedAt", "name", "status", "usageCount", "lastUsed", "expiresAt"];

function sendValidationError(res, message, errors) {
    return res.status(422).json({
        success: false,
        message,
        errors,
    });
}

function normalizeText(value) {
    if (typeof value !== "string") {
        return undefined;
    }

    const trimmedValue = value.trim();
    return trimmedValue === "" ? undefined : trimmedValue;
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

function parseJsonObject(value) {
    if (value === undefined || value === null || value === "") {
        return undefined;
    }

    if (typeof value === "object" && !Array.isArray(value)) {
        return value;
    }

    if (typeof value !== "string") {
        return undefined;
    }

    try {
        const parsedValue = JSON.parse(value);
        return parsedValue && typeof parsedValue === "object" && !Array.isArray(parsedValue)
            ? parsedValue
            : undefined;
    } catch {
        return undefined;
    }
}

function validateObjectId(value, fieldName, errors) {
    if (value === undefined) {
        return undefined;
    }

    if (!mongoose.Types.ObjectId.isValid(value)) {
        errors.push(`${fieldName} must be a valid ObjectId`);
        return undefined;
    }

    return value;
}

function validateDateValue(value, fieldName, errors, { futureOnly = false } = {}) {
    if (value === undefined) {
        return undefined;
    }

    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
        errors.push(`${fieldName} must be a valid date`);
        return undefined;
    }

    if (futureOnly && parsedDate <= new Date()) {
        errors.push(`${fieldName} must be in the future`);
        return undefined;
    }

    return parsedDate;
}

function validateApiKeyBody(body, { partial = false, allowStatus = false } = {}) {
    const errors = [];
    const validated = {};

    if (body.name !== undefined) {
        const name = normalizeText(body.name);
        if (!name) {
            errors.push("API key name must be a non-empty string");
        } else {
            validated.name = name;
        }
    } else if (!partial) {
        errors.push("API key name is required");
    }

    if (body.description !== undefined) {
        const description = normalizeText(body.description);
        if (description === undefined && body.description !== "") {
            errors.push("Description must be a string");
        } else if (description !== undefined) {
            validated.description = description;
        }
    }

    if (body.policyId !== undefined) {
        const policyId = validateObjectId(body.policyId, "policyId", errors);
        if (policyId) {
            validated.policyId = policyId;
        }
    } else if (!partial) {
        errors.push("policyId is required");
    }

    if (body.expiresAt !== undefined) {
        const expiresAt = validateDateValue(body.expiresAt, "expiresAt", errors, { futureOnly: true });
        if (expiresAt) {
            validated.expiresAt = expiresAt;
        }
    }

    if (body.metadata !== undefined) {
        const metadata = parseJsonObject(body.metadata);
        if (metadata === undefined) {
            errors.push("metadata must be a JSON object");
        } else {
            validated.metadata = metadata;
        }
    }

    if (body.keyType !== undefined) {
        const keyType = normalizeText(body.keyType);
        if (!keyType || !KEY_TYPES.includes(keyType)) {
            errors.push(`keyType must be one of: ${KEY_TYPES.join(", ")}`);
        } else {
            validated.keyType = keyType;
        }
    } else if (!partial) {
        validated.keyType = "live";
    }

    if (allowStatus && body.status !== undefined) {
        const status = normalizeText(body.status);
        if (!status || !STATUS_TYPES.includes(status)) {
            errors.push(`status must be one of: ${STATUS_TYPES.join(", ")}`);
        } else {
            validated.status = status;
        }
    }

    return { errors, validated };
}

/**
 * Validator middleware for API key creation requests
 */
function validateApiKeyCreate(req, res, next) {
    const { errors, validated } = validateApiKeyBody(req.body);

    if (errors.length > 0) {
        return sendValidationError(res, "API key validation failed", errors);
    }

    req.validatedApiKeyBody = validated;
    next();
}

function validateApiKeyUpdate(req, res, next) {
    const { errors, validated } = validateApiKeyBody(req.body, { partial: true });

    if (validated.keyType !== undefined) {
        errors.push("keyType cannot be updated directly; use regeneration instead");
    }

    if (Object.keys(validated).length === 0) {
        errors.push("At least one API key field must be provided for update");
    }

    if (errors.length > 0) {
        return sendValidationError(res, "API key validation failed", errors);
    }

    req.validatedApiKeyBody = validated;
    next();
}

function validateApiKeyRegenerate(req, res, next) {
    const { errors, validated } = validateApiKeyBody(req.body, { partial: true });

    if (Object.keys(validated).some((field) => field !== "keyType")) {
        errors.push("Only keyType may be supplied when regenerating an API key");
    }

    if (errors.length > 0) {
        return sendValidationError(res, "API key validation failed", errors);
    }

    req.validatedApiKeyBody = validated;
    next();
}

function validateApiKeyId(req, res, next) {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return sendValidationError(res, "Invalid API key id", ["The provided API key id is not a valid ObjectId"]);
    }

    next();
}

function validateApiKeyQuery(req, res, next) {
    const errors = [];
    const validated = {};
    const { search, status, policyId, keyType, page, limit, sortBy, sortOrder, expiresBefore, expiresAfter } = req.query;

    if (search !== undefined) {
        const normalizedSearch = normalizeText(search);
        if (!normalizedSearch) {
            errors.push("search must be a non-empty string");
        } else {
            validated.search = normalizedSearch;
        }
    }

    if (status !== undefined) {
        const normalizedStatus = normalizeText(status);
        if (!normalizedStatus || !STATUS_TYPES.includes(normalizedStatus)) {
            errors.push(`status filter must be one of: ${STATUS_TYPES.join(", ")}`);
        } else {
            validated.status = normalizedStatus;
        }
    }

    if (policyId !== undefined) {
        const validatedPolicyId = validateObjectId(policyId, "policyId", errors);
        if (validatedPolicyId) {
            validated.policyId = validatedPolicyId;
        }
    }

    if (keyType !== undefined) {
        const normalizedKeyType = normalizeText(keyType);
        if (!normalizedKeyType || !KEY_TYPES.includes(normalizedKeyType)) {
            errors.push(`keyType filter must be one of: ${KEY_TYPES.join(", ")}`);
        } else {
            validated.keyType = normalizedKeyType;
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

    if (expiresBefore !== undefined) {
        const parsed = validateDateValue(expiresBefore, "expiresBefore", errors);
        if (parsed) {
            validated.expiresBefore = parsed;
        }
    }

    if (expiresAfter !== undefined) {
        const parsed = validateDateValue(expiresAfter, "expiresAfter", errors);
        if (parsed) {
            validated.expiresAfter = parsed;
        }
    }

    req.validatedApiKeyQuery = validated;

    if (errors.length > 0) {
        return sendValidationError(res, "API key query validation failed", errors);
    }

    next();
}

module.exports = {
    validateApiKeyCreate,
    validateApiKeyUpdate,
    validateApiKeyRegenerate,
    validateApiKeyId,
    validateApiKeyQuery,
};
