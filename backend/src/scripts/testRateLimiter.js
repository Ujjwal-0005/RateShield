const mongoose = require("mongoose");

// Mock mongoose.connect before importing models or app
mongoose.connect = async () => {
    console.log("🟢 Mocked: MongoDB Connected");
    return true;
};
mongoose.disconnect = async () => {
    console.log("🟢 Mocked: MongoDB Disconnected");
};

// Mock database tables/collections in memory
const mockUsers = [];
const mockPolicies = [];
const mockApiKeys = [];

function populatePolicy(apiKeyDoc) {
    if (apiKeyDoc && apiKeyDoc.policy) {
        const policyDoc = mockPolicies.find(p => p._id.toString() === apiKeyDoc.policy.toString());
        apiKeyDoc.policy = policyDoc || null;
    }
    return apiKeyDoc;
}

// Intercept User Model
const User = require("../models/User");
User.findOne = async (query) => {
    return mockUsers.find(u => u.email === query.email) || null;
};
User.findById = async (id) => {
    return mockUsers.find(u => u._id.toString() === id.toString()) || null;
};
User.create = async (data) => {
    const doc = new User({ ...data, _id: new mongoose.Types.ObjectId() });
    mockUsers.push(doc);
    return doc;
};
User.deleteOne = async (query) => {
    const idx = mockUsers.findIndex(u => u._id.toString() === query._id.toString());
    if (idx !== -1) mockUsers.splice(idx, 1);
    return { deletedCount: 1 };
};

// Intercept Policy Model
const Policy = require("../models/Policy");
Policy.deleteMany = async (query) => {
    if (query && query.name && query.name.$in) {
        const names = query.name.$in;
        for (let i = mockPolicies.length - 1; i >= 0; i--) {
            if (names.includes(mockPolicies[i].name)) {
                mockPolicies.splice(i, 1);
            }
        }
    }
    return { deletedCount: mockPolicies.length };
};
Policy.create = async (data) => {
    const doc = { ...data, _id: new mongoose.Types.ObjectId() };
    mockPolicies.push(doc);
    return doc;
};

// Intercept ApiKey Model
const ApiKey = require("../models/ApiKey");
ApiKey.deleteMany = async (query) => {
    if (query && query.createdBy) {
        for (let i = mockApiKeys.length - 1; i >= 0; i--) {
            if (mockApiKeys[i].createdBy.toString() === query.createdBy.toString()) {
                mockApiKeys.splice(i, 1);
            }
        }
    }
    return { deletedCount: mockApiKeys.length };
};
ApiKey.create = async (data) => {
    const doc = {
        ...data,
        _id: new mongoose.Types.ObjectId(),
        save: async function() {
            const idx = mockApiKeys.findIndex(k => k._id.toString() === this._id.toString());
            if (idx !== -1) mockApiKeys[idx] = this;
            return this;
        },
        toObject: function() {
            return this;
        }
    };
    mockApiKeys.push(doc);
    return doc;
};
ApiKey.findOne = (query) => {
    let keyDoc;
    if (query.hashedKey) {
        keyDoc = mockApiKeys.find(k => k.hashedKey === query.hashedKey);
    } else if (query.key) {
        keyDoc = mockApiKeys.find(k => k.key === query.key);
    } else if (query._id) {
        keyDoc = mockApiKeys.find(k => k._id.toString() === query._id.toString());
    }
    
    const chain = {
        select: function() { return this; },
        populate: async function() {
            if (!keyDoc) return null;
            const copy = { ...keyDoc };
            populatePolicy(copy);
            return copy;
        }
    };
    
    chain.then = function(resolve) {
        if (!keyDoc) return resolve(null);
        const copy = { ...keyDoc };
        populatePolicy(copy);
        resolve(copy);
    };
    
    return chain;
};
ApiKey.findByIdAndUpdate = async (id, update) => {
    const keyDoc = mockApiKeys.find(k => k._id.toString() === id.toString());
    if (keyDoc) {
        if (update.$set) Object.assign(keyDoc, update.$set);
        if (update.$inc) {
            for (const k in update.$inc) {
                keyDoc[k] = (keyDoc[k] || 0) + update.$inc[k];
            }
        }
    }
    return keyDoc;
};

// Now import database connection, redis, app, and run the tests
const redisClient = require("../redis/redisClient");
const connectDB = require("../config/database");
const app = require("../app");
const { hashKey } = require("../utils/keyGenerator");
const http = require("http");

async function runTests() {
    console.log("🚀 Starting Rate Limiter Engine Integration Tests...");

    // Connect to DB (mocked) and Redis (live)
    await connectDB();
    await redisClient.connect();

    // Start server on a dynamic port
    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    const baseUrl = `http://localhost:${port}`;
    console.log(`\n🟢 Test server listening on ${baseUrl}`);

    // Create a mock user
    let user = await User.findOne({ email: "test_limiter@rateshield.com" });
    if (!user) {
        user = await User.create({
            name: "Test User",
            email: "test_limiter@rateshield.com",
            password: "Password123!",
            role: "admin",
            isActive: true
        });
    }

    // Clean any prior test policies
    await Policy.deleteMany({ name: { $in: ["Test Sliding", "Test Fixed", "Test Token Bucket", "Inactive Policy", "Test Concurrent"] } });
    
    // Create new test policies
    const slidingPolicy = await Policy.create({
        name: "Test Sliding",
        description: "Sliding window policy for testing",
        algorithm: "sliding",
        windowSize: 10,
        maxRequests: 3,
        isActive: true
    });

    const fixedPolicy = await Policy.create({
        name: "Test Fixed",
        description: "Fixed window policy for testing",
        algorithm: "fixed",
        windowSize: 10,
        maxRequests: 3,
        isActive: true
    });

    const tokenPolicy = await Policy.create({
        name: "Test Token Bucket",
        description: "Token bucket policy for testing",
        algorithm: "token_bucket",
        windowSize: 10,
        maxRequests: 3,
        isActive: true
    });

    const inactivePolicy = await Policy.create({
        name: "Inactive Policy",
        description: "Inactive policy for testing",
        algorithm: "sliding",
        windowSize: 10,
        maxRequests: 3,
        isActive: false
    });

    const { generateRawKey } = require("../utils/keyGenerator");

    // Helper to generate and insert an API key
    async function createTestKey(name, policyId, status = "active") {
        const rawKey = generateRawKey("live");
        const hashed = hashKey(rawKey);
        const masked = `${rawKey.substring(0, 7)}...${rawKey.substring(rawKey.length - 4)}`;
        const apiKeyDoc = await ApiKey.create({
            name,
            key: rawKey,
            hashedKey: hashed,
            maskedKey: masked,
            status,
            createdBy: user._id,
            policy: policyId,
            keyType: "live"
        });
        return { rawKey, apiKeyDoc };
    }

    const { rawKey: slidingKey } = await createTestKey("Sliding Key", slidingPolicy._id);
    const { rawKey: fixedKey } = await createTestKey("Fixed Key", fixedPolicy._id);
    const { rawKey: tokenKey } = await createTestKey("Token Key", tokenPolicy._id);
    const { rawKey: inactivePolicyKey } = await createTestKey("Inactive Policy Key", inactivePolicy._id);
    const { rawKey: disabledKey } = await createTestKey("Disabled Key", slidingPolicy._id, "disabled");
    const { rawKey: expiredKey } = await createTestKey("Expired Key", slidingPolicy._id, "expired");

    // Flush Redis before testing
    await redisClient.flushDb();

    console.log("\n--- TEST CASE 1: MISSING API KEY ---");
    {
        const res = await fetch(`${baseUrl}/api/resource`);
        const body = await res.json();
        console.log(`Status: ${res.status}`);
        console.log("Body:", body);
        if (res.status !== 401 || !body.message.includes("missing")) {
            throw new Error("Test Case 1 Failed");
        }
        console.log("✅ Case 1 Passed!");
    }

    console.log("\n--- TEST CASE 2: INVALID API KEY ---");
    {
        const res = await fetch(`${baseUrl}/api/resource`, { headers: { "x-api-key": "invalid_format_key" } });
        const body = await res.json();
        console.log(`Status: ${res.status}`);
        console.log("Body:", body);
        if (res.status !== 401 || !body.message.includes("Invalid API Key")) {
            throw new Error("Test Case 2 Failed");
        }
        console.log("✅ Case 2 Passed!");
    }

    console.log("\n--- TEST CASE 3: DISABLED API KEY ---");
    {
        const res = await fetch(`${baseUrl}/api/resource`, { headers: { "x-api-key": disabledKey } });
        const body = await res.json();
        console.log(`Status: ${res.status}`);
        console.log("Body:", body);
        if (res.status !== 403 || !body.message.includes("disabled")) {
            throw new Error("Test Case 3 Failed");
        }
        console.log("✅ Case 3 Passed!");
    }

    console.log("\n--- TEST CASE 4: EXPIRED API KEY ---");
    {
        const res = await fetch(`${baseUrl}/api/resource`, { headers: { "x-api-key": expiredKey } });
        const body = await res.json();
        console.log(`Status: ${res.status}`);
        console.log("Body:", body);
        if (res.status !== 403 || !body.message.includes("expired")) {
            throw new Error("Test Case 4 Failed");
        }
        console.log("✅ Case 4 Passed!");
    }

    console.log("\n--- TEST CASE 5: INACTIVE POLICY ---");
    {
        const res = await fetch(`${baseUrl}/api/resource`, { headers: { "x-api-key": inactivePolicyKey } });
        const body = await res.json();
        console.log(`Status: ${res.status}`);
        console.log("Body:", body);
        if (res.status !== 403 || !body.message.includes("inactive")) {
            throw new Error("Test Case 5 Failed");
        }
        console.log("✅ Case 5 Passed!");
    }

    console.log("\n--- TEST CASE 6: SLIDING WINDOW LIMITS ---");
    {
        // Limit: 3 requests per 10 seconds
        for (let i = 1; i <= 3; i++) {
            const res = await fetch(`${baseUrl}/api/resource`, { headers: { "x-api-key": slidingKey } });
            const body = await res.json();
            console.log(`Req ${i} Status: ${res.status} | Limit: ${res.headers.get("X-RateLimit-Limit")} | Remaining: ${res.headers.get("X-RateLimit-Remaining")} | Reset: ${res.headers.get("X-RateLimit-Reset")}`);
            if (res.status !== 200) {
                throw new Error(`Sliding Window Request ${i} should be allowed`);
            }
        }

        // 4th request should be blocked
        const res = await fetch(`${baseUrl}/api/resource`, { headers: { "x-api-key": slidingKey } });
        const body = await res.json();
        console.log(`Req 4 Status: ${res.status} | Remaining: ${res.headers.get("X-RateLimit-Remaining")} | Retry-After: ${res.headers.get("Retry-After")}`);
        console.log("Body:", body);
        if (res.status !== 429 || res.headers.get("Retry-After") === null) {
            throw new Error("Sliding Window 4th Request should be blocked with 429 and Retry-After header");
        }
        console.log("✅ Case 6 Passed!");
    }

    console.log("\n--- TEST CASE 7: FIXED WINDOW LIMITS ---");
    {
        // Limit: 3 requests per 10 seconds
        for (let i = 1; i <= 3; i++) {
            const res = await fetch(`${baseUrl}/api/resource`, { headers: { "x-api-key": fixedKey } });
            console.log(`Req ${i} Status: ${res.status} | Limit: ${res.headers.get("X-RateLimit-Limit")} | Remaining: ${res.headers.get("X-RateLimit-Remaining")} | Reset: ${res.headers.get("X-RateLimit-Reset")}`);
            if (res.status !== 200) {
                throw new Error(`Fixed Window Request ${i} should be allowed`);
            }
        }

        // 4th request should be blocked
        const res = await fetch(`${baseUrl}/api/resource`, { headers: { "x-api-key": fixedKey } });
        const body = await res.json();
        console.log(`Req 4 Status: ${res.status} | Remaining: ${res.headers.get("X-RateLimit-Remaining")} | Retry-After: ${res.headers.get("Retry-After")}`);
        console.log("Body:", body);
        if (res.status !== 429 || res.headers.get("Retry-After") === null) {
            throw new Error("Fixed Window 4th Request should be blocked with 429");
        }
        console.log("✅ Case 7 Passed!");
    }

    console.log("\n--- TEST CASE 8: TOKEN BUCKET LIMITS ---");
    {
        // Limit: 3 requests per 10 seconds
        for (let i = 1; i <= 3; i++) {
            const res = await fetch(`${baseUrl}/api/resource`, { headers: { "x-api-key": tokenKey } });
            console.log(`Req ${i} Status: ${res.status} | Limit: ${res.headers.get("X-RateLimit-Limit")} | Remaining: ${res.headers.get("X-RateLimit-Remaining")}`);
            if (res.status !== 200) {
                throw new Error(`Token Bucket Request ${i} should be allowed`);
            }
        }

        // 4th request should be blocked
        const res = await fetch(`${baseUrl}/api/resource`, { headers: { "x-api-key": tokenKey } });
        const body = await res.json();
        console.log(`Req 4 Status: ${res.status} | Remaining: ${res.headers.get("X-RateLimit-Remaining")} | Retry-After: ${res.headers.get("Retry-After")}`);
        console.log("Body:", body);
        if (res.status !== 429 || res.headers.get("Retry-After") === null) {
            throw new Error("Token Bucket 4th Request should be blocked with 429");
        }
        console.log("✅ Case 8 Passed!");
    }

    console.log("\n--- TEST CASE 9: POLICY SWITCHING ---");
    {
        // Switch slidingKey to tokenPolicy
        const apiKeyDoc = await ApiKey.findOne({ key: slidingKey });
        apiKeyDoc.policy = tokenPolicy._id;
        await apiKeyDoc.save();

        // Remove from Redis apikey cache to force DB refresh on next request
        await redisClient.del(`apikey:val:${hashKey(slidingKey)}`);

        // Check rate limiter: should now run Token Bucket instead of Sliding Window
        const res = await fetch(`${baseUrl}/api/resource`, { headers: { "x-api-key": slidingKey } });
        const body = await res.json();
        console.log("Allowed Algorithm in Response:", body.data.policy.algorithm);
        if (body.data.policy.algorithm !== "token_bucket") {
            throw new Error("Policy switching did not change the algorithm in execution");
        }
        console.log("✅ Case 9 Passed!");
    }

    console.log("\n--- TEST CASE 10: CONCURRENT REQUESTS ---");
    {
        // Generate a new key and policy for concurrent testing
        const concurrentPolicy = await Policy.create({
            name: "Test Concurrent",
            description: "Concurrent policy for testing",
            algorithm: "sliding",
            windowSize: 10,
            maxRequests: 5,
            isActive: true
        });
        const { rawKey: concurrentKey } = await createTestKey("Concurrent Key", concurrentPolicy._id);

        // Fire 10 requests concurrently
        const requests = Array.from({ length: 10 }).map(() => 
            fetch(`${baseUrl}/api/resource`, { headers: { "x-api-key": concurrentKey } })
        );
        const responses = await Promise.all(requests);
        const statuses = responses.map((r) => r.status);
        console.log("Concurrent Request Statuses:", statuses);

        const allowedCount = statuses.filter((s) => s === 200).length;
        const blockedCount = statuses.filter((s) => s === 429).length;
        console.log(`Allowed: ${allowedCount}, Blocked: ${blockedCount}`);

        if (allowedCount !== 5) {
            throw new Error(`Expected exactly 5 allowed requests, got ${allowedCount}`);
        }
        console.log("✅ Case 10 Passed!");
    }

    console.log("\n--- TEST CASE 11: METRICS VERIFICATION ---");
    {
        const jwt = require("jsonwebtoken");
        const { JWT_SECRET } = require("../config/env");
        const adminToken = jwt.sign({ id: user._id, email: user.email, role: "admin" }, JWT_SECRET);

        const res = await fetch(`${baseUrl}/metrics`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        const body = await res.json();
        console.log("Aggregated Metrics:", body.data);
        if (!body.success || body.data.total === 0 || body.data.activeKeys === 0) {
            throw new Error("Metrics verification failed or returned empty values");
        }
        console.log("✅ Case 11 Passed!");
    }

    // Clean up test database records
    await ApiKey.deleteMany({ createdBy: user._id });
    await Policy.deleteMany({ name: { $in: ["Test Sliding", "Test Fixed", "Test Token Bucket", "Inactive Policy", "Test Concurrent"] } });
    await User.deleteOne({ _id: user._id });

    // Close server and connections
    server.close();
    await redisClient.disconnect();
    await mongoose.disconnect();
    console.log("\n⭐️ ALL TEST CASES PASSED SUCCESSFULLY!");
}

runTests().catch((error) => {
    console.error("❌ TEST RUNNER FAILED:", error);
    process.exit(1);
});
