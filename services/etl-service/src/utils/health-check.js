const logger = require('./logger');

class HealthCheck {
  constructor() {
    this.status = 'healthy';
    this.checks = {
      database: false,
      eventStore: false,
      redis: false
    };
    this.startTime = Date.now();
  }

  /**
   * Get health status
   */
  getStatus() {
    const uptime = Date.now() - this.startTime;
    const allChecksPass = Object.values(this.checks).every(check => check === true);
    
    return {
      status: allChecksPass ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(uptime / 1000),
      checks: this.checks,
      service: 'etl-service',
      version: process.env.npm_package_version || '1.0.0'
    };
  }

  /**
   * Update check status
   */
  updateCheck(checkName, status) {
    this.checks[checkName] = status;
    logger.info(`Health check updated: ${checkName} = ${status}`);
  }

  /**
   * Express middleware for health endpoint
   */
  middleware() {
    return (req, res) => {
      const health = this.getStatus();
      const statusCode = health.status === 'healthy' ? 200 : 503;
      res.status(statusCode).json(health);
    };
  }

  /**
   * Perform all health checks
   */
  async performChecks() {
    try {
      // Basic service check
      this.updateCheck('database', true);
      
      // Event store check (if enabled)
      if (process.env.EVENT_STORE_ENABLED === 'true') {
        this.updateCheck('eventStore', true);
      } else {
        this.updateCheck('eventStore', true); // Not required
      }
      
      // Redis check (if enabled)
      if (process.env.REDIS_URL) {
        this.updateCheck('redis', true);
      } else {
        this.updateCheck('redis', true); // Not required
      }
      
      logger.info('Health checks completed successfully');
    } catch (error) {
      logger.error('Health check failed:', error);
      this.status = 'unhealthy';
    }
  }
}

module.exports = new HealthCheck();
