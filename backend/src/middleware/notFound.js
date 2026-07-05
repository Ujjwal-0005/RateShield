function notFound(request, response) {
  response.status(404).json({
    error: 'Route not found',
    path: request.originalUrl
  });
}

module.exports = notFound;