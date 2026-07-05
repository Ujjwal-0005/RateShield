const express = require('express');
const helmet = require('helmet');

const environment = require('./config/env');
const routes = require('./routes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(express.json());

  app.get('/', (request, response) => {
    response.status(200).json({
      service: 'RateShield backend',
      status: 'running',
      environment: environment.nodeEnv
    });
  });

  app.use(environment.apiPrefix, routes);
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;