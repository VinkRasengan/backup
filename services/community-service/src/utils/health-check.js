/**
 * Health Check utility for community-service
 * Provides health monitoring and status checks
 */

const logger = require('./logger');

// Load environment variables from root .env
require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });

class HealthCheck {
  constructor(serviceName = 'community-service') {
    this.serviceName = serviceName;
    this.checks = new Map();
    this.status = 'healthy';
    this.lastCheck = null;
  }

  // Add a health check
  addCheck(name, checkFunction, options = {}) {
    this.checks.set(name, {
      name,
      check: checkFunction,
      timeout: options.timeout || 5000,
      critical: options.critical !== false,
      lastResult: null,
      lastRun: null
    });
  }

  // Run all health checks
  async runChecks() {
    const results = {};
    let overallStatus = 'healthy';

    for (const [name, checkConfig] of this.checks) {
      try {
        const startTime = Date.now();
        const result = await Promise.race([
          checkConfig.check(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Health check timeout')), checkConfig.timeout)
          )
        ]);

        const duration = Date.now() - startTime;
        
        results[name] = {
          status: 'healthy',
          duration: `${duration}ms`,
          result,
          timestamp: new Date().toISOString()
        };

        checkConfig.lastResult = results[name];
        checkConfig.lastRun = new Date();

      } catch (error) {
        results[name] = {
          status: 'unhealthy',
          error: error.message,
          timestamp: new Date().toISOString()
        };

        checkConfig.lastResult = results[name];
        checkConfig.lastRun = new Date();

        if (checkConfig.critical) {
          overallStatus = 'unhealthy';
        }

        logger.error(`Health check failed: ${name}`, { error: error.message });
      }
    }

    this.status = overallStatus;
    this.lastCheck = new Date();

    return {
      service: this.serviceName,
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks: results
    };
  }

  // Express middleware for health endpoint
  middleware() {
    return async (req, res) => {
      try {
        const healthStatus = await this.runChecks();
        const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
        res.status(statusCode).json(healthStatus);
      } catch (error) {
        logger.error('Health check middleware error', { error: error.message });
        res.status(500).json({
          service: this.serviceName,
          status: 'error',
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    };
  }
}

// Common health checks
const commonChecks = {
  // Memory usage check
  memory: () => {
    const usage = process.memoryUsage();
    const totalMB = Math.round(usage.rss / 1024 / 1024);
    
    if (totalMB > 512) { // Alert if using more than 512MB
      throw new Error(`High memory usage: ${totalMB}MB`);
    }
    
    return { memoryUsage: `${totalMB}MB` };
  },

  // Uptime check
  uptime: () => {
    const uptimeSeconds = process.uptime();
    return { uptime: `${Math.floor(uptimeSeconds)}s` };
  },

  // Environment check
  environment: () => {
    return {
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development'
    };
  }
};

module.exports = {
  HealthCheck,
  commonChecks
};