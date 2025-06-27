
// Shared utilities for FactCheck Platform
const fs = require('fs');
const path = require('path');

// Helper function to safely require modules
function safeRequire(modulePath, fallback = null) {
  try {
    return require(modulePath);
  } catch (error) {
    console.warn(`Warning: Could not load ${modulePath}, using fallback`);
    return fallback;
  }
}

module.exports = {
  // Core Utils (always available)
  Logger: require('./utils/logger'),
  HealthCheck: require('./utils/health-check').HealthCheck,
  commonChecks: require('./utils/health-check').commonChecks,
  ResponseFormatter: require('./utils/response'),

  // Optional Utils
  CircuitBreaker: safeRequire('./utils/circuitBreaker'),
  EnvLoader: safeRequire('./utils/env-loader'),
  QueryOptimizer: safeRequire('./utils/queryOptimizer'),

  // Middleware (with fallbacks)
  authMiddleware: safeRequire('./middleware/auth'),
  metricsMiddleware: safeRequire('./middleware/metrics')
};
