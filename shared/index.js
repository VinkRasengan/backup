
// Shared utilities for FactCheck Platform
module.exports = {
  // Utils
  Logger: require('./utils/logger'),
  HealthCheck: require('./utils/health-check').HealthCheck,
  commonChecks: require('./utils/health-check').commonChecks,
  ResponseFormatter: require('./utils/response'),
  CircuitBreaker: require('./utils/circuitBreaker'),
  
  // Middleware
  authMiddleware: require('./middleware/auth'),
  errorHandler: require('./middleware/errorHandler'),
  rateLimiter: require('./middleware/rateLimiter')
};
