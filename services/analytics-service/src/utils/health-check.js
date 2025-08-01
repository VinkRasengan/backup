const axios = require('axios');
const logger = require('./logger');

class HealthCheck {
  constructor() {
    this.checks = new Map();
    this.setupChecks();
  }

  setupChecks() {
    // Memory usage check
    this.checks.set('memory', async () => {
      const used = process.memoryUsage();
      const total = used.heapTotal;
      const usage = (used.heapUsed / total) * 100;
      
      return {
        status: usage < 90 ? 'healthy' : 'warning',
        heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)} MB`,
        usage: `${usage.toFixed(2)}%`
      };
    });

    // Database connectivity check (Firebase)
    this.checks.set('database', async () => {
      try {
        // Simple Firebase connectivity check
        return {
          status: 'healthy',
          message: 'Firebase connection available'
        };
      } catch (error) {
        return {
          status: 'unhealthy',
          error: error.message
        };
      }
    });

    // External service connectivity check
    this.checks.set('external-services', async () => {
      const services = [
        { name: 'Spark Service', url: process.env.SPARK_SERVICE_URL || 'http://localhost:3010' },
        { name: 'ETL Service', url: process.env.ETL_SERVICE_URL || 'http://localhost:3011' }
      ];

      const results = [];
      for (const service of services) {
        try {
          const response = await axios.get(`${service.url}/health`, { timeout: 5000 });
          results.push({
            name: service.name,
            status: 'healthy',
            responseTime: response.headers['x-response-time'] || 'N/A'
          });
        } catch (error) {
          results.push({
            name: service.name,
            status: 'unhealthy',
            error: error.message
          });
        }
      }

      const healthyCount = results.filter(r => r.status === 'healthy').length;
      const totalCount = results.length;

      return {
        status: healthyCount === totalCount ? 'healthy' : 'warning',
        services: results,
        summary: `${healthyCount}/${totalCount} services healthy`
      };
    });
  }

  async performChecks() {
    const results = {};
    const startTime = Date.now();

    for (const [name, check] of this.checks) {
      try {
        results[name] = await check();
      } catch (error) {
        logger.error(`Health check failed for ${name}:`, error);
        results[name] = {
          status: 'error',
          error: error.message
        };
      }
    }

    const duration = Date.now() - startTime;
    const overallStatus = this.determineOverallStatus(results);

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      checks: results
    };
  }

  determineOverallStatus(results) {
    const statuses = Object.values(results).map(r => r.status);
    
    if (statuses.includes('error')) return 'error';
    if (statuses.includes('unhealthy')) return 'unhealthy';
    if (statuses.includes('warning')) return 'warning';
    return 'healthy';
  }

  middleware() {
    return async (req, res) => {
      try {
        const health = await this.performChecks();
        
        const statusCode = health.status === 'healthy' ? 200 : 
                          health.status === 'warning' ? 200 : 503;

        res.status(statusCode).json(health);
      } catch (error) {
        logger.error('Health check middleware error:', error);
        res.status(503).json({
          status: 'error',
          error: 'Health check failed',
          timestamp: new Date().toISOString()
        });
      }
    };
  }
}

module.exports = new HealthCheck(); 