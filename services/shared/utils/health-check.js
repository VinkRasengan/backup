/**
 * Shared health check utilities for microservices
 * Provides standardized health check endpoints and monitoring
 */

class HealthCheck {
  constructor(serviceName) {
    this.serviceName = serviceName || process.env.SERVICE_NAME || 'unknown-service';
    this.checks = new Map();
    this.startTime = Date.now();
  }

  /**
   * Add a health check
   */
  addCheck(name, checkFunction) {
    this.checks.set(name, checkFunction);
  }

  /**
   * Remove a health check
   */
  removeCheck(name) {
    this.checks.delete(name);
  }

  /**
   * Run all health checks
   */
  async runChecks() {
    const results = {
      service: this.serviceName,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      checks: {}
    };

    let overallHealthy = true;

    for (const [name, checkFunction] of this.checks) {
      try {
        const startTime = Date.now();
        const result = await Promise.race([
          checkFunction(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Health check timeout')), 5000)
          )
        ]);

        results.checks[name] = {
          status: 'healthy',
          responseTime: Date.now() - startTime,
          details: result || 'OK'
        };
      } catch (error) {
        overallHealthy = false;
        results.checks[name] = {
          status: 'unhealthy',
          error: error.message,
          responseTime: Date.now() - startTime
        };
      }
    }

    results.status = overallHealthy ? 'healthy' : 'unhealthy';
    return results;
  }

  /**
   * Express middleware for health check endpoint
   */
  middleware() {
    return async (req, res) => {
      try {
        const results = await this.runChecks();
        const statusCode = results.status === 'healthy' ? 200 : 503;
        
        res.status(statusCode).json(results);
      } catch (error) {
        res.status(500).json({
          service: this.serviceName,
          status: 'error',
          timestamp: new Date().toISOString(),
          error: error.message
        });
      }
    };
  }

  /**
   * Simple liveness probe (always returns OK if service is running)
   */
  liveness() {
    return (req, res) => {
      res.status(200).json({
        service: this.serviceName,
        status: 'alive',
        timestamp: new Date().toISOString(),
        uptime: Date.now() - this.startTime
      });
    };
  }

  /**
   * Readiness probe (checks if service is ready to handle requests)
   */
  readiness() {
    return async (req, res) => {
      try {
        const results = await this.runChecks();
        const statusCode = results.status === 'healthy' ? 200 : 503;
        
        res.status(statusCode).json({
          service: this.serviceName,
          status: results.status === 'healthy' ? 'ready' : 'not ready',
          timestamp: new Date().toISOString(),
          checks: results.checks
        });
      } catch (error) {
        res.status(503).json({
          service: this.serviceName,
          status: 'not ready',
          timestamp: new Date().toISOString(),
          error: error.message
        });
      }
    };
  }
}

/**
 * Common health check functions
 */
const commonChecks = {
  /**
   * Database connection check
   */
  database: (db) => {
    return async () => {
      if (!db) {
        throw new Error('Database not initialized');
      }
      
      // For Firestore
      if (db.collection) {
        await db.collection('health_check').limit(1).get();
        return 'Database connection OK';
      }
      
      // For other databases, implement specific checks
      throw new Error('Unknown database type');
    };
  },

  /**
   * Redis connection check
   */
  redis: (redisClient) => {
    return async () => {
      if (!redisClient) {
        throw new Error('Redis client not initialized');
      }
      
      await redisClient.ping();
      return 'Redis connection OK';
    };
  },

  /**
   * External service check
   */
  externalService: (serviceName, url) => {
    return async () => {
      const axios = require('axios');
      
      try {
        const response = await axios.get(url, { timeout: 3000 });
        return `${serviceName} is reachable (${response.status})`;
      } catch (error) {
        throw new Error(`${serviceName} is unreachable: ${error.message}`);
      }
    };
  },

  /**
   * Memory usage check
   */
  memory: (maxMemoryMB = 512) => {
    return async () => {
      const memUsage = process.memoryUsage();
      const memUsageMB = memUsage.heapUsed / 1024 / 1024;
      
      if (memUsageMB > maxMemoryMB) {
        throw new Error(`Memory usage too high: ${memUsageMB.toFixed(2)}MB > ${maxMemoryMB}MB`);
      }
      
      return `Memory usage OK: ${memUsageMB.toFixed(2)}MB`;
    };
  },

  /**
   * Disk space check
   */
  diskSpace: (path = '/', minFreeGB = 1) => {
    return async () => {
      const fs = require('fs').promises;
      
      try {
        const stats = await fs.statfs(path);
        const freeGB = (stats.bavail * stats.bsize) / (1024 * 1024 * 1024);
        
        if (freeGB < minFreeGB) {
          throw new Error(`Low disk space: ${freeGB.toFixed(2)}GB < ${minFreeGB}GB`);
        }
        
        return `Disk space OK: ${freeGB.toFixed(2)}GB free`;
      } catch (error) {
        throw new Error(`Disk space check failed: ${error.message}`);
      }
    };
  }
};

module.exports = {
  HealthCheck,
  commonChecks
};
