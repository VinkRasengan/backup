/**
 * Health Checker for Event Bus Service
 */

const logger = require('./logger');

class HealthChecker {
  constructor() {
    this.checks = new Map();
    this.lastHealthCheck = null;
    this.healthStatus = 'unknown';
    
    logger.info('Health checker initialized');
  }

  /**
   * Register a health check
   */
  registerCheck(name, checkFunction, options = {}) {
    this.checks.set(name, {
      name,
      checkFunction,
      timeout: options.timeout || 5000,
      critical: options.critical || false,
      lastResult: null,
      lastCheck: null
    });
    
    logger.info('Health check registered', { name, critical: options.critical });
  }

  /**
   * Run a single health check
   */
  async runCheck(checkName) {
    const check = this.checks.get(checkName);
    if (!check) {
      throw new Error(`Health check '${checkName}' not found`);
    }

    const startTime = Date.now();
    
    try {
      // Run check with timeout
      const result = await Promise.race([
        check.checkFunction(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Health check timeout')), check.timeout)
        )
      ]);

      const duration = Date.now() - startTime;
      
      check.lastResult = {
        status: 'healthy',
        result,
        duration,
        timestamp: new Date().toISOString()
      };
      
      check.lastCheck = Date.now();
      
      logger.debug('Health check passed', { 
        name: checkName, 
        duration,
        result 
      });
      
      return check.lastResult;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      check.lastResult = {
        status: 'unhealthy',
        error: error.message,
        duration,
        timestamp: new Date().toISOString()
      };
      
      check.lastCheck = Date.now();
      
      logger.warn('Health check failed', { 
        name: checkName, 
        error: error.message,
        duration 
      });
      
      return check.lastResult;
    }
  }

  /**
   * Run all health checks
   */
  async runAllChecks() {
    const results = {};
    const startTime = Date.now();
    
    logger.info('Running all health checks');
    
    // Run all checks in parallel
    const checkPromises = Array.from(this.checks.keys()).map(async (checkName) => {
      try {
        const result = await this.runCheck(checkName);
        results[checkName] = result;
      } catch (error) {
        results[checkName] = {
          status: 'error',
          error: error.message,
          timestamp: new Date().toISOString()
        };
      }
    });
    
    await Promise.all(checkPromises);
    
    // Determine overall health status
    const criticalChecks = Array.from(this.checks.values()).filter(check => check.critical);
    const failedCriticalChecks = criticalChecks.filter(check => 
      check.lastResult && check.lastResult.status !== 'healthy'
    );
    
    const allChecks = Array.from(this.checks.values());
    const failedChecks = allChecks.filter(check => 
      check.lastResult && check.lastResult.status !== 'healthy'
    );
    
    let overallStatus = 'healthy';
    if (failedCriticalChecks.length > 0) {
      overallStatus = 'unhealthy';
    } else if (failedChecks.length > 0) {
      overallStatus = 'degraded';
    }
    
    const totalDuration = Date.now() - startTime;
    
    this.lastHealthCheck = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      duration: totalDuration,
      checks: results,
      summary: {
        total: allChecks.length,
        healthy: allChecks.length - failedChecks.length,
        unhealthy: failedChecks.length,
        critical_failed: failedCriticalChecks.length
      }
    };
    
    this.healthStatus = overallStatus;
    
    logger.info('Health check completed', {
      status: overallStatus,
      duration: totalDuration,
      summary: this.lastHealthCheck.summary
    });
    
    return this.lastHealthCheck;
  }

  /**
   * Get last health check result
   */
  getLastHealthCheck() {
    return this.lastHealthCheck;
  }

  /**
   * Get current health status
   */
  getHealthStatus() {
    return this.healthStatus;
  }

  /**
   * Get specific check result
   */
  getCheckResult(checkName) {
    const check = this.checks.get(checkName);
    return check ? check.lastResult : null;
  }

  /**
   * Remove a health check
   */
  removeCheck(checkName) {
    const removed = this.checks.delete(checkName);
    if (removed) {
      logger.info('Health check removed', { name: checkName });
    }
    return removed;
  }

  /**
   * List all registered checks
   */
  listChecks() {
    return Array.from(this.checks.keys());
  }

  /**
   * Basic health endpoint response
   */
  async getHealthResponse() {
    const healthCheck = await this.runAllChecks();
    
    return {
      status: healthCheck.status,
      timestamp: healthCheck.timestamp,
      service: 'event-bus-service',
      version: '1.0.0',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      checks: healthCheck.summary
    };
  }
}

module.exports = HealthChecker;
