const mongoose = require("mongoose");
const env = require("./env");

async function connectDB() {
    try {
        await mongoose.connect(env.MONGODB_URI, {
            retryWrites: true,
            w: "majority",
        });

        console.log("🟢 MongoDB Connected");
        return true;

    } catch (error) {
        console.warn("🟡 MongoDB unavailable, continuing without database connection");
        console.warn("Error:", error.message);
        return false;
    }
}

module.exports = connectDB;