// const mongoose = require("mongoose");
// const env = require("./env");

// async function connectDB() {
//     try {

//         await mongoose.connect(env.MONGODB_URI);

//         console.log("🟢 MongoDB Connected");
//         return true;

//     } catch (error) {

//         console.warn("🟡 MongoDB unavailable, continuing without database connection");
//         console.warn(error.message);
//         return false;

//     }
// }

// module.exports = connectDB;


const mongoose = require("mongoose");
const env = require("./env");

async function connectDB() {
    try {
        console.log("🔵 Attempting to connect to:", env.MONGODB_URI); // Debug line
        
        await mongoose.connect(env.MONGODB_URI, {
            retryWrites: true,
            w: "majority",
        });

        console.log("🟢 MongoDB Connected");
        return true;

    } catch (error) {
        console.warn("🟡 MongoDB unavailable");
        console.warn("Error:", error.message);
        return false;
    }
}

module.exports = connectDB;