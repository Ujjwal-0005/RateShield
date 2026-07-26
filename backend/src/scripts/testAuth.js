const mongoose = require("mongoose");
const redisClient = require("../redis/redisClient");
const connectDB = require("../config/database");
const app = require("../app");
const User = require("../models/User");
const http = require("http");
const bcrypt = require("bcryptjs");

// Mock database store in memory for offline resilience
const mockUsers = [];

User.findOne = (query) => {
    let userDoc = null;
    if (query.email) {
        userDoc = mockUsers.find(u => u.email.toLowerCase() === query.email.toLowerCase());
    }
    const chain = {
        select: function() { return this; },
        then: function(resolve) { resolve(userDoc || null); }
    };
    return chain;
};

User.findById = (id) => {
    const userDoc = mockUsers.find(u => u._id.toString() === id.toString());
    const chain = {
        select: function() { return this; },
        then: function(resolve) { resolve(userDoc || null); }
    };
    return chain;
};

User.deleteOne = async (query) => {
    const idx = mockUsers.findIndex(u => u._id.toString() === query._id.toString());
    if (idx !== -1) mockUsers.splice(idx, 1);
    return { deletedCount: 1 };
};

User.prototype.save = async function() {
    if (this.password && !this.password.startsWith("$2a$") && !this.password.startsWith("$2b$")) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    const idx = mockUsers.findIndex(u => u._id.toString() === this._id.toString());
    if (idx !== -1) {
        mockUsers[idx] = this;
    } else {
        mockUsers.push(this);
    }
    return this;
};

async function runTests() {
    console.log("🚀 Starting Admin Authentication Integration Tests...");

    await connectDB();
    await redisClient.connect();

    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    const baseUrl = `http://localhost:${port}`;
    console.log(`\n🟢 Test server listening on ${baseUrl}`);

    const testEmail = "admin_test@rateshield.io";
    const testPassword = "SecurePass123!";
    let accessToken = null;
    let refreshToken = null;

    console.log("\n--- TEST CASE 1: ADMIN REGISTRATION ---");
    {
        const res = await fetch(`${baseUrl}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: "Test Admin",
                email: testEmail,
                password: testPassword,
                role: "admin",
            }),
        });
        const body = await res.json();
        console.log(`Status: ${res.status}`);
        console.log("Body:", body);
        if (res.status !== 201 || !body.data.token) {
            throw new Error("Test Case 1 Failed: Admin Registration");
        }
        accessToken = body.data.token;
        refreshToken = body.data.refreshToken;
        console.log("✅ Case 1 Passed!");
    }

    console.log("\n--- TEST CASE 2: ADMIN LOGIN ---");
    {
        const res = await fetch(`${baseUrl}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: testEmail,
                password: testPassword,
            }),
        });
        const body = await res.json();
        console.log(`Status: ${res.status}`);
        if (res.status !== 200 || !body.data.token) {
            throw new Error("Test Case 2 Failed: Admin Login");
        }
        accessToken = body.data.token;
        refreshToken = body.data.refreshToken;
        console.log("✅ Case 2 Passed!");
    }

    console.log("\n--- TEST CASE 3: LOGIN FAILURE (INVALID PASSWORD) ---");
    {
        const res = await fetch(`${baseUrl}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: testEmail,
                password: "WrongPassword999",
            }),
        });
        const body = await res.json();
        console.log(`Status: ${res.status}`);
        console.log("Body:", body);
        if (res.status !== 401 || body.success !== false) {
            throw new Error("Test Case 3 Failed: Incorrect Password Rejection");
        }
        console.log("✅ Case 3 Passed!");
    }

    console.log("\n--- TEST CASE 4: FETCH CURRENT ADMIN PROFILE (/auth/me) ---");
    {
        const res = await fetch(`${baseUrl}/auth/me`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        const body = await res.json();
        console.log(`Status: ${res.status}`);
        console.log("Body:", body);
        if (res.status !== 200 || body.data.email !== testEmail) {
            throw new Error("Test Case 4 Failed: Get Profile");
        }
        console.log("✅ Case 4 Passed!");
    }

    console.log("\n--- TEST CASE 5: REJECT UNAUTHENTICATED ACCESS ---");
    {
        const res = await fetch(`${baseUrl}/auth/me`);
        const body = await res.json();
        console.log(`Status: ${res.status}`);
        if (res.status !== 401) {
            throw new Error("Test Case 5 Failed: Missing Token Protection");
        }
        console.log("✅ Case 5 Passed!");
    }

    console.log("\n--- TEST CASE 6: REJECT MALFORMED TOKEN ---");
    {
        const res = await fetch(`${baseUrl}/auth/me`, {
            headers: { Authorization: "Bearer malformed.invalid.token" },
        });
        const body = await res.json();
        console.log(`Status: ${res.status}`);
        if (res.status !== 401) {
            throw new Error("Test Case 6 Failed: Invalid Token Rejection");
        }
        console.log("✅ Case 6 Passed!");
    }

    console.log("\n--- TEST CASE 7: UPDATE PROFILE ---");
    {
        const res = await fetch(`${baseUrl}/auth/profile`, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ name: "Updated Admin Name" }),
        });
        const body = await res.json();
        console.log(`Status: ${res.status}`);
        console.log("Body:", body);
        if (res.status !== 200 || body.data.name !== "Updated Admin Name") {
            throw new Error("Test Case 7 Failed: Profile Update");
        }
        console.log("✅ Case 7 Passed!");
    }

    console.log("\n--- TEST CASE 8: TOKEN REFRESH FLOW ---");
    {
        const res = await fetch(`${baseUrl}/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken }),
        });
        const body = await res.json();
        console.log(`Status: ${res.status}`);
        if (res.status !== 200 || !body.data.token) {
            throw new Error("Test Case 8 Failed: Token Refresh");
        }
        accessToken = body.data.token;
        refreshToken = body.data.refreshToken;
        console.log("✅ Case 8 Passed!");
    }

    console.log("\n--- TEST CASE 9: CHANGE PASSWORD ---");
    {
        const newPass = "NewSecurePassword456!";
        const res = await fetch(`${baseUrl}/auth/change-password`, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                currentPassword: testPassword,
                newPassword: newPass,
            }),
        });
        const body = await res.json();
        console.log(`Status: ${res.status}`);
        console.log("Body:", body);
        if (res.status !== 200) {
            throw new Error("Test Case 9 Failed: Password Change");
        }

        // Login with new password
        const loginRes = await fetch(`${baseUrl}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: testEmail,
                password: newPass,
            }),
        });
        const loginBody = await loginRes.json();
        if (loginRes.status !== 200 || !loginBody.data.token) {
            throw new Error("Test Case 9 Failed: Login with New Password");
        }
        accessToken = loginBody.data.token;
        refreshToken = loginBody.data.refreshToken;
        console.log("✅ Case 9 Passed!");
    }

    console.log("\n--- TEST CASE 10: LOGOUT FLOW ---");
    {
        const res = await fetch(`${baseUrl}/auth/logout`, {
            method: "POST",
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        const body = await res.json();
        console.log(`Status: ${res.status}`);
        if (res.status !== 200) {
            throw new Error("Test Case 10 Failed: Logout");
        }

        // Verify refresh token no longer works
        const refreshRes = await fetch(`${baseUrl}/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken }),
        });
        if (refreshRes.status !== 401) {
            throw new Error("Test Case 10 Failed: Revoked Refresh Token Reuse Rejection");
        }
        console.log("✅ Case 10 Passed!");
    }

    // Clean up
    server.close();
    await redisClient.disconnect();
    await mongoose.disconnect();
    console.log("\n⭐️ ALL AUTH INTEGRATION TEST CASES PASSED!");
}

runTests().catch((error) => {
    console.error("❌ AUTH TEST RUNNER FAILED:", error);
    process.exit(1);
});
