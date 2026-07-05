function getHealthStatus(request, response) {
  response.status(200).json({
    status: 'ok',
    service: 'RateShield backend',
    timestamp: new Date().toISOString()
  });
}

module.exports = {
  getHealthStatus
};