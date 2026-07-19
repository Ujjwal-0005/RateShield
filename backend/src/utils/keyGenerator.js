const crypto = require("crypto");

/**
 * Generates a cryptographically secure random API key with a prefix.
 * @returns {string} The raw API key, e.g. "rs_live_8f3d1b..."
 */
function generateRawKey() {
    const randomHex = crypto.randomBytes(32).toString("hex");
    return `rs_live_${randomHex}`;
}

/**
 * Hashes a raw API key using SHA-256.
 * @param {string} rawKey - The raw API key.
 * @returns {string} The SHA-256 hashed API key.
 */
function hashKey(rawKey) {
    return crypto.createHash("sha256").update(rawKey).digest("hex");
}

/**
 * Masks a raw API key, leaving only the prefix and the last 4 characters visible.
 * @param {string} rawKey - The raw API key.
 * @returns {string} The masked key, e.g. "rs_live_****1a2b"
 */
function maskKey(rawKey) {
    if (!rawKey || rawKey.length < 12) {
        return "invalid_key";
    }
    const suffix = rawKey.slice(-4);
    return `rs_live_****${suffix}`;
}

module.exports = {
    generateRawKey,
    hashKey,
    maskKey,
};
