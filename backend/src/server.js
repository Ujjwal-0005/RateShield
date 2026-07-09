const app = require("./app");
const connectDB = require("./config/database");
const { PORT } = require("./config/env");
const redisClient = require("./redis/redisClient");
require("dotenv").config();

async function startServer() {
    await connectDB();
    await redisClient.connect();

    app.listen(PORT, () => {
        console.log(`🚀 Server running on ${PORT}`);
    });

}

startServer();