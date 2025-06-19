/**
 * Auth Service Redundancy Manager
 * Manages multiple Auth Service instances and provides failover capabilities
 */

const LocalTokenValidator = require('./localTokenValidator');
const circuitBreakerService = require('../../../api-gateway/src/services/circuitBreaker');

class AuthRedundancyManager {
  constructor(options = {}) {
    this.authInstances = options.authInstances || [
      { url: process.env.AUTH_SERVICE_URL || 'http://localhost:3001', priority: 1, healthy: true },
      { url: process.env.AUTH_SERVICE_URL_BACKUP || 'http://localhost:3011', priority: 2, healthy: true }
    ];
    
    this.localValidator = new LocalTokenValidator(options.localValidator);
    this.healthCheckInterval = options.healthCheckInterval || 30000; // 30 seconds
    this.failoverTimeout = options.failoverTimeout || 5000; // 5 seconds
    this.maxRetries = options.maxRetries || 3;
    this.currentPrimaryIndex = 0;
    this.healthCheckTimer = null;
    
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      failovers: 0,
      localValidations: 0,
      instanceStats: new Map()
    };

    this.initializeInstanceStats();
    this.startHealthChecks();
  }

  /**
   * Initialize statistics for each instance
   */
  initializeInstanceStats() {
    this.authInstances.forEach((instance, index) => {
      this.stats.instanceStats.set(index, {
        requests: 0,
        successes: 0,
        failures: 0,
        lastSuccess: null,
        lastFailure: null,
        consecutiveFailures: 0
      });
    });
  }

  /**
   * Get the current primary Auth Service instance
   */
  getPrimaryInstance() {
    // Find the highest priority healthy instance
    const healthyInstances = this.authInstances
      .map((instance, index) => ({ ...instance, index }))
      .filter(instance => instance.healthy)
      .sort((a, b) => a.priority - b.priority);

    if (healthyInstances.length === 0) {
      throw new Error('No healthy Auth Service instances available');
    }

    return healthyInstances[0];
  }

  /**
   * Validate token with redundancy and failover
   */
  async validateToken(token, options = {}) {
    this.stats.totalRequests++;

    try {
      // Try local validation first (fastest)
      if (options.allowLocal !== false) {
        const localResult = await this.localValidator.validateToken(token);
        if (localResult.valid) {
          this.stats.successfulRequests++;
          this.stats.localValidations++;
          return {
            ...localResult,
            source: 'local_validator'
          };
        }
      }

      // Try Auth Service instances with failover
      const result = await this.executeWithFailover('validateToken', { token });
      
      if (result.success) {
        this.stats.successfulRequests++;
        return {
          valid: true,
          user: result.data.user,
          source: `auth_service_${result.instanceIndex}`,
          instanceUrl: this.authInstances[result.instanceIndex].url
        };
      } else {
        this.stats.failedRequests++;
        return {
          valid: false,
          reason: result.error,
          source: 'all_instances_failed'
        };
      }

    } catch (error) {
      this.stats.failedRequests++;
      console.error('Token validation error:', error);
      return {
        valid: false,
        reason: error.message,
        source: 'error'
      };
    }
  }

  /**
   * Execute operation with failover across Auth Service instances
   */
  async executeWithFailover(operation, params) {
    const healthyInstances = this.authInstances
      .map((instance, index) => ({ ...instance, index }))
      .filter(instance => instance.healthy)
      .sort((a, b) => a.priority - b.priority);

    if (healthyInstances.length === 0) {
      return {
        success: false,
        error: 'No healthy Auth Service instances available'
      };
    }

    let lastError = null;

    for (const instance of healthyInstances) {
      try {
        const result = await this.executeOperation(instance, operation, params);
        
        // Update instance stats
        const instanceStats = this.stats.instanceStats.get(instance.index);
        instanceStats.requests++;
        instanceStats.successes++;
        instanceStats.lastSuccess = new Date();
        instanceStats.consecutiveFailures = 0;

        return {
          success: true,
          data: result,
          instanceIndex: instance.index,
          instanceUrl: instance.url
        };

      } catch (error) {
        lastError = error;
        
        // Update instance stats
        const instanceStats = this.stats.instanceStats.get(instance.index);
        instanceStats.requests++;
        instanceStats.failures++;
        instanceStats.lastFailure = new Date();
        instanceStats.consecutiveFailures++;

        // Mark instance as unhealthy if too many consecutive failures
        if (instanceStats.consecutiveFailures >= 3) {
          this.authInstances[instance.index].healthy = false;
          console.warn(`Auth Service instance marked unhealthy: ${instance.url}`);
        }

        console.warn(`Auth Service instance failed: ${instance.url}`, error.message);
        
        // Continue to next instance
        continue;
      }
    }

    // All instances failed
    this.stats.failovers++;
    return {
      success: false,
      error: lastError?.message || 'All Auth Service instances failed'
    };
  }

  /**
   * Execute operation on specific Auth Service instance
   */
  async executeOperation(instance, operation, params) {
    const timeout = this.failoverTimeout;
    
    switch (operation) {
      case 'validateToken':
        return await circuitBreakerService.execute('auth', {
          method: 'POST',
          url: `${instance.url}/auth/verify`,
          headers: {
            'Content-Type': 'application/json'
          },
          data: { token: params.token },
          timeout
        });

      case 'getUserInfo':
        return await circuitBreakerService.execute('auth', {
          method: 'GET',
          url: `${instance.url}/users/${params.userId}`,
          headers: {
            'Authorization': `Bearer ${params.token}`
          },
          timeout
        });

      case 'refreshToken':
        return await circuitBreakerService.execute('auth', {
          method: 'POST',
          url: `${instance.url}/auth/refresh`,
          headers: {
            'Content-Type': 'application/json'
          },
          data: { refreshToken: params.refreshToken },
          timeout
        });

      case 'healthCheck':
        return await circuitBreakerService.execute('auth', {
          method: 'GET',
          url: `${instance.url}/health`,
          timeout: 3000
        });

      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }

  /**
   * Get user information with failover
   */
  async getUserInfo(userId, token) {
    this.stats.totalRequests++;

    try {
      // Try cache first
      const cachedUser = await this.localValidator.tokenCache.getCachedUser(userId);
      if (cachedUser) {
        this.stats.successfulRequests++;
        return {
          success: true,
          user: cachedUser,
          source: 'cache'
        };
      }

      // Try Auth Service instances
      const result = await this.executeWithFailover('getUserInfo', { userId, token });
      
      if (result.success) {
        this.stats.successfulRequests++;
        
        // Cache the result
        await this.localValidator.tokenCache.cacheToken(token, result.data.user);
        
        return {
          success: true,
          user: result.data.user,
          source: `auth_service_${result.instanceIndex}`
        };
      } else {
        this.stats.failedRequests++;
        return {
          success: false,
          error: result.error
        };
      }

    } catch (error) {
      this.stats.failedRequests++;
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Refresh token with failover
   */
  async refreshToken(refreshToken) {
    this.stats.totalRequests++;

    try {
      const result = await this.executeWithFailover('refreshToken', { refreshToken });
      
      if (result.success) {
        this.stats.successfulRequests++;
        return {
          success: true,
          tokens: result.data,
          source: `auth_service_${result.instanceIndex}`
        };
      } else {
        this.stats.failedRequests++;
        return {
          success: false,
          error: result.error
        };
      }

    } catch (error) {
      this.stats.failedRequests++;
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Start health checks for all Auth Service instances
   */
  startHealthChecks() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    this.healthCheckTimer = setInterval(async () => {
      await this.performHealthChecks();
    }, this.healthCheckInterval);

    console.log('Auth Service health checks started');
  }

  /**
   * Perform health checks on all instances
   */
  async performHealthChecks() {
    const healthCheckPromises = this.authInstances.map(async (instance, index) => {
      try {
        await this.executeOperation(instance, 'healthCheck', {});
        
        // Mark as healthy
        if (!instance.healthy) {
          instance.healthy = true;
          console.log(`Auth Service instance recovered: ${instance.url}`);
        }
        
        // Reset consecutive failures
        const instanceStats = this.stats.instanceStats.get(index);
        instanceStats.consecutiveFailures = 0;
        
      } catch (error) {
        // Mark as unhealthy
        if (instance.healthy) {
          instance.healthy = false;
          console.warn(`Auth Service instance failed health check: ${instance.url}`);
        }
      }
    });

    await Promise.allSettled(healthCheckPromises);
  }

  /**
   * Add Auth Service instance
   */
  addInstance(url, priority = 10) {
    const newInstance = { url, priority, healthy: true };
    this.authInstances.push(newInstance);
    
    const index = this.authInstances.length - 1;
    this.stats.instanceStats.set(index, {
      requests: 0,
      successes: 0,
      failures: 0,
      lastSuccess: null,
      lastFailure: null,
      consecutiveFailures: 0
    });

    console.log(`Auth Service instance added: ${url}`);
  }

  /**
   * Remove Auth Service instance
   */
  removeInstance(url) {
    const index = this.authInstances.findIndex(instance => instance.url === url);
    if (index !== -1) {
      this.authInstances.splice(index, 1);
      this.stats.instanceStats.delete(index);
      console.log(`Auth Service instance removed: ${url}`);
    }
  }

  /**
   * Get redundancy status
   */
  getStatus() {
    const healthyInstances = this.authInstances.filter(instance => instance.healthy);
    
    return {
      instances: this.authInstances.map((instance, index) => ({
        url: instance.url,
        priority: instance.priority,
        healthy: instance.healthy,
        stats: this.stats.instanceStats.get(index)
      })),
      totalInstances: this.authInstances.length,
      healthyInstances: healthyInstances.length,
      primaryInstance: healthyInstances.length > 0 ? healthyInstances[0].url : null,
      stats: {
        ...this.stats,
        instanceStats: undefined // Don't include in summary
      },
      localValidator: this.localValidator.getStats()
    };
  }

  /**
   * Force failover to next instance
   */
  forceFailover() {
    if (this.authInstances.length > 1) {
      this.currentPrimaryIndex = (this.currentPrimaryIndex + 1) % this.authInstances.length;
      this.stats.failovers++;
      console.log(`Forced failover to instance: ${this.authInstances[this.currentPrimaryIndex].url}`);
    }
  }

  /**
   * Stop health checks
   */
  stopHealthChecks() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
      console.log('Auth Service health checks stopped');
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    const status = this.getStatus();
    
    return {
      status: status.healthyInstances > 0 ? 'healthy' : 'unhealthy',
      redundancy: status,
      localValidator: await this.localValidator.healthCheck()
    };
  }

  /**
   * Disconnect
   */
  async disconnect() {
    this.stopHealthChecks();
    await this.localValidator.disconnect();
  }
}

module.exports = AuthRedundancyManager;
