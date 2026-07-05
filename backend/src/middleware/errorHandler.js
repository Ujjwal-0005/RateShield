function errorHandler(error, request, response, next) {
  console.error(error);

  const statusCode = error.statusCode || 500;
  const message = statusCode === 500 ? 'Internal server error' : error.message;

  response.status(statusCode).json({
    error: message
  });
}

module.exports = errorHandler;