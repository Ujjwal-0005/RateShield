// const dotenv = require('dotenv');

// dotenv.config();

// function requiredEnv(name) {
//   const value = process.env[name];

//   if (value === undefined || value === '') {
//     throw new Error(`Missing required environment variable: ${name}`);
//   }

//   return value;
// }

// function loadEnvironment() {
//   const portValue = requiredEnv('PORT');
//   const port = Number(portValue);

//   if (!Number.isInteger(port) || port <= 0) {
//     throw new Error('PORT must be a positive integer');
//   }

//   return {
//     nodeEnv: requiredEnv('NODE_ENV'),
//     port,
//     apiPrefix: requiredEnv('API_PREFIX')
//   };
// }

// module.exports = loadEnvironment();


require("dotenv").config();

module.exports = {
    PORT: process.env.PORT,
    NODE_ENV: process.env.NODE_ENV,
    REDIS_HOST: process.env.REDIS_HOST,
    REDIS_PORT: process.env.REDIS_PORT,
    REDIS_PASSWORD: process.env.REDIS_PASSWORD,
};