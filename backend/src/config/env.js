require("dotenv").config();

function parseIntegerEnv(name, defaultValue) {
    const rawValue = process.env[name];

    if (rawValue === undefined || rawValue === "") {
        return defaultValue;
    }

    const parsedValue = Number(rawValue);
    if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
        throw new Error(`${name} must be a positive integer`);
    }

    return parsedValue;
}

function requiredEnv(name) {
    const value = process.env[name];

    if (value === undefined || value === "") {
        throw new Error(`Missing required environment variable: ${name}`);
    }

    return value;
}

const nodeEnv = process.env.NODE_ENV || "development";
const isProduction = nodeEnv === "production";

const config = {
    NODE_ENV: nodeEnv,
    PORT: parseIntegerEnv("PORT", 5000),
    REDIS_HOST: process.env.REDIS_HOST || "localhost",
    REDIS_PORT: parseIntegerEnv("REDIS_PORT", 6379),
    REDIS_PASSWORD: process.env.REDIS_PASSWORD || "",
    MONGODB_URI: requiredEnv("MONGODB_URI"),
    JWT_SECRET: process.env.JWT_SECRET || (isProduction ? "" : "rateshield_secret_key_12345"),
};

if (!config.JWT_SECRET) {
    throw new Error("Missing required environment variable: JWT_SECRET");
}

module.exports = Object.freeze(config);