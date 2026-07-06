const app = require("./app");

const { PORT } = require("./config/env");
const redisClient = require("./redis/redisClient");

async function startServer() {

    await redisClient.connect();

    app.listen(PORT, () => {
        console.log(`🚀 Server running on ${PORT}`);
    });

}

startServer();