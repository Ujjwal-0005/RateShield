const ApiKey = require("../models/ApiKey");
const Policy = require("../models/Policy");
const {
    generateApiKeyMaterial,
    hashKey,
    isValidApiKeyFormat,
} = require("../utils/keyGenerator");
const redisClient = require("../redis/redisClient");

function createServiceError(message, statusCode) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

function isExpired(expiresAt) {
    return Boolean(expiresAt) && new Date(expiresAt) < new Date();
}

function isDuplicateKeyError(error) {
    return Boolean(error && error.code === 11000);
}

function isActiveStatus(status) {
    return status === "active";
}

function sanitizePolicy(policy) {
    if (!policy) {
        return null;
    }

    return {
        id: policy._id,
        name: policy.name,
        algorithm: policy.algorithm,
        windowSize: policy.windowSize,
        maxRequests: policy.maxRequests,
        isActive: policy.isActive,
    };
}

function sanitizeApiKey(apiKey) {
    if (!apiKey) {
        return null;
    }

    return {
        _id: apiKey._id,
        name: apiKey.name,
        key: apiKey.key,
        maskedKey: apiKey.maskedKey,
        description: apiKey.description,
        status: apiKey.status,
        createdBy: apiKey.createdBy,
        policy: sanitizePolicy(apiKey.policy),
        keyType: apiKey.keyType,
        lastUsed: apiKey.lastUsed,
        usageCount: apiKey.usageCount,
        expiresAt: apiKey.expiresAt,
        metadata: apiKey.metadata,
        deletedAt: apiKey.deletedAt,
        createdAt: apiKey.createdAt,
        updatedAt: apiKey.updatedAt,
    };
}

function buildCacheValue(apiKey, policy) {
    return {
        apiKeyId: apiKey._id,
        keyId: apiKey._id,
        createdBy: apiKey.createdBy,
        isActive: isActiveStatus(apiKey.status),
        status: apiKey.status,
        expiresAt: apiKey.expiresAt,
        keyType: apiKey.keyType,
        usageCount: apiKey.usageCount,
        lastUsed: apiKey.lastUsed,
        metadata: apiKey.metadata,
        policy: sanitizePolicy(policy),
        key: apiKey.key,
        maskedKey: apiKey.maskedKey,
    };
}

function buildSort(sortBy = "createdAt", sortOrder = "desc") {
    return { [sortBy]: sortOrder === "asc" ? 1 : -1 };
}

function buildApiKeyQuery(filters = {}, userId, isAdmin) {
    const query = {
        status: { $ne: "deleted" },
    };

    if (!isAdmin) {
        query.createdBy = userId;
    }

    if (filters.search) {
        const safeSearch = filters.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        query.$or = [
            { name: { $regex: safeSearch, $options: "i" } },
            { description: { $regex: safeSearch, $options: "i" } },
            { key: { $regex: safeSearch, $options: "i" } },
            { maskedKey: { $regex: safeSearch, $options: "i" } },
        ];
    }

    if (filters.status) {
        query.status = filters.status;
    }

    if (filters.policyId) {
        query.policy = filters.policyId;
    }

    if (filters.keyType) {
        query.keyType = filters.keyType;
    }

    if (filters.expiresBefore || filters.expiresAfter) {
        query.expiresAt = {};

        if (filters.expiresBefore) {
            query.expiresAt.$lte = filters.expiresBefore;
        }

        if (filters.expiresAfter) {
            query.expiresAt.$gte = filters.expiresAfter;
        }
    }

    return query;
}

async function removeCachedKey(hashedKey) {
    const cacheKey = `apikey:val:${hashedKey}`;
    await redisClient.del(cacheKey);
}

async function cacheResolvedApiKey(hashedKey, apiKey, policy) {
    const cacheKey = `apikey:val:${hashedKey}`;
    const cacheValue = buildCacheValue(apiKey, policy);

    await redisClient.set(cacheKey, JSON.stringify(cacheValue), {
        EX: 3600,
    });
}

async function ensureActivePolicy(policyId) {
    const policy = await Policy.findOne({ _id: policyId, isActive: true });

    if (!policy) {
        throw createServiceError("Active policy not found", 404);
    }

    return policy;
}

async function loadApiKeyById(id, userId, isAdmin) {
    const query = isAdmin ? { _id: id } : { _id: id, createdBy: userId };
    const apiKey = await ApiKey.findOne(query)
        .select("+hashedKey")
        .populate("policy", "name algorithm windowSize maxRequests isActive");

    if (!apiKey || apiKey.status === "deleted") {
        throw createServiceError("API key not found", 404);
    }

    return apiKey;
}

async function generateAndPersistApiKey(docData, retries = 3) {
    let attempt = 0;

    while (attempt <= retries) {
        const material = generateApiKeyMaterial(docData.keyType || "live");

        try {
            const apiKey = await ApiKey.create({
                ...docData,
                key: material.publicKey,
                hashedKey: material.hashedKey,
                maskedKey: material.maskedKey,
            });

            return { apiKey, rawKey: material.rawKey };
        } catch (error) {
            if (!isDuplicateKeyError(error) || attempt === retries) {
                throw error;
            }
        }

        attempt += 1;
    }

    throw createServiceError("Unable to generate a unique API key", 500);
}

async function createApiKey({ name, description, policyId, createdBy, expiresAt, metadata, keyType }) {
    if (!createdBy) {
        throw createServiceError("createdBy is required", 400);
    }

    const policy = await ensureActivePolicy(policyId);
    const { apiKey, rawKey } = await generateAndPersistApiKey({
        name,
        description,
        createdBy,
        policy: policy._id,
        expiresAt,
        metadata,
        keyType,
        status: "active",
        usageCount: 0,
        lastUsed: null,
        deletedAt: null,
    });

    await cacheResolvedApiKey(apiKey.hashedKey, apiKey, policy);

    console.log(`[API Key] Created: ${apiKey.name} (${apiKey._id})`);

    return {
        ...sanitizeApiKey({ ...apiKey.toObject(), policy }),
        rawKey,
        policy: sanitizePolicy(policy),
    };
}

async function getApiKeys({ userId, isAdmin = false, filters = {} }) {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(Math.max(1, filters.limit || 20), 100);
    const skip = (page - 1) * limit;
    const query = buildApiKeyQuery(filters, userId, isAdmin);
    const sort = buildSort(filters.sortBy || "createdAt", filters.sortOrder || "desc");

    const [items, total] = await Promise.all([
        ApiKey.find(query)
            .populate("policy", "name algorithm windowSize maxRequests isActive")
            .sort(sort)
            .skip(skip)
            .limit(limit),
        ApiKey.countDocuments(query),
    ]);

    return {
        items: items.map((item) => sanitizeApiKey(item)),
        meta: {
            total,
            page,
            limit,
            pages: total === 0 ? 0 : Math.ceil(total / limit),
            hasNext: page * limit < total,
            hasPrevious: page > 1,
        },
    };
}

async function getApiKeyById(id, userId, isAdmin = false) {
    const apiKey = await loadApiKeyById(id, userId, isAdmin);
    return sanitizeApiKey(apiKey);
}

async function updateApiKey(id, userId, updates, isAdmin = false) {
    const apiKey = await loadApiKeyById(id, userId, isAdmin);
    const updatePayload = {};

    if (updates.name !== undefined) {
        updatePayload.name = updates.name;
    }

    if (updates.description !== undefined) {
        updatePayload.description = updates.description;
    }

    if (updates.expiresAt !== undefined) {
        updatePayload.expiresAt = updates.expiresAt;
    }

    if (updates.metadata !== undefined) {
        updatePayload.metadata = updates.metadata;
    }

    if (updates.policyId !== undefined) {
        updatePayload.policy = (await ensureActivePolicy(updates.policyId))._id;
    }

    const updatedApiKey = await ApiKey.findByIdAndUpdate(apiKey._id, updatePayload, {
        new: true,
        runValidators: true,
    })
        .select("+hashedKey")
        .populate("policy", "name algorithm windowSize maxRequests isActive");

    if (!updatedApiKey) {
        throw createServiceError("API key not found", 404);
    }

    await removeCachedKey(updatedApiKey.hashedKey);
    console.log(`[API Key] Updated: ${updatedApiKey.name} (${updatedApiKey._id})`);

    return sanitizeApiKey(updatedApiKey);
}

async function regenerateApiKey(id, userId, isAdmin = false, keyType) {
    const apiKey = await loadApiKeyById(id, userId, isAdmin);
    const policy = await ensureActivePolicy(apiKey.policy._id || apiKey.policy);
    const material = generateApiKeyMaterial(keyType || apiKey.keyType || "live");
    const previousHashedKey = apiKey.hashedKey;

    apiKey.key = material.publicKey;
    apiKey.hashedKey = material.hashedKey;
    apiKey.maskedKey = material.maskedKey;
    apiKey.status = "active";
    apiKey.keyType = keyType || apiKey.keyType || "live";
    await apiKey.save();

    await removeCachedKey(previousHashedKey);
    await cacheResolvedApiKey(apiKey.hashedKey, apiKey, policy);

    console.log(`[API Key] Regenerated: ${apiKey.name} (${apiKey._id})`);

    return {
        ...sanitizeApiKey({ ...apiKey.toObject(), policy }),
        rawKey: material.rawKey,
        policy: sanitizePolicy(policy),
    };
}

async function disableApiKey(id, userId, isAdmin = false) {
    const apiKey = await loadApiKeyById(id, userId, isAdmin);
    apiKey.status = "disabled";
    await apiKey.save();
    await removeCachedKey(apiKey.hashedKey);
    console.log(`[API Key] Disabled: ${apiKey.name} (${apiKey._id})`);
    return sanitizeApiKey(apiKey);
}

async function enableApiKey(id, userId, isAdmin = false) {
    const apiKey = await loadApiKeyById(id, userId, isAdmin);
    apiKey.status = "active";
    await apiKey.save();
    await removeCachedKey(apiKey.hashedKey);
    console.log(`[API Key] Enabled: ${apiKey.name} (${apiKey._id})`);
    return sanitizeApiKey(apiKey);
}

async function deleteApiKey(id, userId, isAdmin = false) {
    const apiKey = await loadApiKeyById(id, userId, isAdmin);
    apiKey.status = "deleted";
    apiKey.deletedAt = new Date();
    await apiKey.save();
    await removeCachedKey(apiKey.hashedKey);
    console.log(`[API Key] Deleted: ${apiKey.name} (${apiKey._id})`);
    return sanitizeApiKey(apiKey);
}

async function recordApiKeyUsage(apiKeyId) {
    return ApiKey.findByIdAndUpdate(
        apiKeyId,
        {
            $set: { lastUsed: new Date() },
            $inc: { usageCount: 1 },
        },
        { new: true }
    );
}

async function resolveApiKey(rawKey) {
    if (!rawKey || !isValidApiKeyFormat(rawKey)) {
        return null;
    }

    const hashed = hashKey(rawKey);
    const cacheKey = `apikey:val:${hashed}`;

    try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
            const cachedValue = JSON.parse(cached);

            if (isExpired(cachedValue.expiresAt)) {
                await removeCachedKey(hashed);
                return {
                    ...cachedValue,
                    status: "expired",
                    isActive: false
                };
            }

            if (cachedValue.status !== "active") {
                return {
                    ...cachedValue,
                    isActive: false
                };
            }

            if (!cachedValue.policy) {
                return {
                    ...cachedValue,
                    policyUnknown: true
                };
            }

            if (cachedValue.policy.isActive === false) {
                return {
                    ...cachedValue,
                    policyInactive: true
                };
            }

            return cachedValue;
        }
    } catch (err) {
        console.error("[API Key] Redis cache read failure, falling back to database:", err);
    }

    // Database fallback
    const keyDoc = await ApiKey.findOne({ hashedKey: hashed })
        .select("+hashedKey")
        .populate("policy", "name description algorithm windowSize maxRequests isActive");

    if (!keyDoc) {
        return null; // Invalid API key
    }

    if (keyDoc.status === "deleted" || keyDoc.status === "revoked") {
        return {
            keyId: keyDoc._id,
            status: keyDoc.status,
            isActive: false,
            userId: keyDoc.createdBy
        };
    }

    if (isExpired(keyDoc.expiresAt)) {
        keyDoc.status = "expired";
        await keyDoc.save();
        await removeCachedKey(hashed).catch(() => {});
        return {
            keyId: keyDoc._id,
            status: "expired",
            isActive: false,
            userId: keyDoc.createdBy,
            expiresAt: keyDoc.expiresAt
        };
    }

    if (keyDoc.status === "disabled") {
        return {
            keyId: keyDoc._id,
            status: "disabled",
            isActive: false,
            userId: keyDoc.createdBy
        };
    }

    if (!keyDoc.policy) {
        const resolved = buildCacheValue(keyDoc, null);
        try {
            await redisClient.set(cacheKey, JSON.stringify(resolved), { EX: 3600 });
        } catch (err) {
            console.error("[API Key] Redis cache write failure:", err);
        }
        return {
            ...resolved,
            policyUnknown: true,
            policy: null
        };
    }

    if (keyDoc.policy.isActive === false) {
        const resolved = buildCacheValue(keyDoc, keyDoc.policy);
        try {
            await redisClient.set(cacheKey, JSON.stringify(resolved), { EX: 3600 });
        } catch (err) {
            console.error("[API Key] Redis cache write failure:", err);
        }
        return {
            ...resolved,
            policyInactive: true
        };
    }

    const resolved = buildCacheValue(keyDoc, keyDoc.policy);

    try {
        await redisClient.set(cacheKey, JSON.stringify(resolved), {
            EX: 3600,
        });
    } catch (err) {
        console.error("[API Key] Redis cache write failure:", err);
    }

    return resolved;
}

module.exports = {
    createApiKey,
    getApiKeys,
    getApiKeyById,
    updateApiKey,
    regenerateApiKey,
    disableApiKey,
    enableApiKey,
    deleteApiKey,
    revokeApiKey: deleteApiKey,
    resolveApiKey,
    recordApiKeyUsage,
};