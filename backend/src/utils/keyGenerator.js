const crypto = require("crypto");

const API_KEY_FORMAT = /^rs_(live|test)_[a-f0-9]{64}$/i;

/**
 * Generates a cryptographically secure public key identifier.
 * This is safe to expose in dashboards and logs.
 */
function generatePublicKeyId(keyType = "live") {
    const randomHex = crypto.randomBytes(12).toString("hex");
    return `rs_${keyType}_${randomHex}`;
}

/**
 * Generates a cryptographically secure raw API key.
 * The value is shown once and never stored in plaintext.
 */
function generateRawKey(keyType = "live") {
    const randomHex = crypto.randomBytes(32).toString("hex");
    return `rs_${keyType}_${randomHex}`;
}

/**
 * Builds all key material needed for persistence and one-time display.
 */
function generateApiKeyMaterial(keyType = "live") {
    const rawKey = generateRawKey(keyType);
    const publicKey = generatePublicKeyId(keyType);

    return {
        rawKey,
        publicKey,
        hashedKey: hashKey(rawKey),
        maskedKey: maskKey(rawKey),
    };
}

/**
 * Hashes a raw API key using SHA-256.
 */
function hashKey(rawKey) {
    return crypto.createHash("sha256").update(rawKey).digest("hex");
}

/**
 * Masks a raw API key, leaving only the prefix and the last 4 characters visible.
 */
function maskKey(rawKey) {
    if (!rawKey || rawKey.length < 12) {
        return "invalid_key";
    }

    const suffix = rawKey.slice(-4);
    const prefix = rawKey.startsWith("rs_test_") ? "rs_test" : "rs_live";

    return `${prefix}_****${suffix}`;
}

/**
 * Checks whether a string matches the expected raw API key format.
 */
function isValidApiKeyFormat(apiKey) {
    return API_KEY_FORMAT.test(apiKey);
}

module.exports = {
    generatePublicKeyId,
    generateRawKey,
    generateApiKeyMaterial,
    hashKey,
    maskKey,
    isValidApiKeyFormat,
};
