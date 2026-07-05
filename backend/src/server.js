const createApp = require('./app');
const environment = require('./config/env');

function startServer() {
  const app = createApp();

  app.listen(environment.port, () => {
    console.log(`RateShield backend listening on port ${environment.port}`);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = {
  startServer
};