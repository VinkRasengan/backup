/**
 * Advanced Circuit Breaker Service
 * Implements circuit breaker pattern with fallback strategies
 */

const CircuitBreaker = require('opossum');
const axios = require('axios');
const logger = require('../utils/logger');

class CircuitBreakerService {
  constructor() {
    this.breakers = new Map();
    this.fallbackStrategies = new Map();
    this.metrics = new Map();
    
    // Default circuit breaker options
    this.defaultOptions = {
      timeout: 10000, // 10 seconds
      errorThresholdPercentage: 50, // Open circuit if 50% of requests fail
      resetTimeout: 30000, // 30 seconds before trying again
      rollingCountTimeout: 10000, // 10 second rolling window
      rollingCountBuckets: 10, // Number of buckets in rolling window
      volumeThreshold: 10, // Minimum number of requests before circuit can open
      capacity: 2, // Number of concurrent requests allowed
      errorFilter: (err) => {
        // Don't count 4xx errors as failures (except 429)
        return err.code === 'ECONNREFUSED' || 
               err.code === 'ETIMEDOUT' || 
               err.code === 'ENOTFOUND' ||
               (err.response && err.response.status >= 500) ||
               (err.response && err.response.status === 429);
      }
    };
  }

  /**
   * Get or create circuit breaker for a service
   */
  getBreaker(serviceName, options = {}) {
    if (!this.breakers.has(serviceName)) {
      const breakerOptions = { ...this.defaultOptions, ...options };
      const breaker = new CircuitBreaker(this.createServiceCall(serviceName), breakerOptions);
      
      // Set up event listeners
      this.setupBreakerEvents(breaker, serviceName);
      
      this.breakers.set(serviceName, breaker);
      this.initializeMetrics(serviceName);
    }
    
    return this.breakers.get(serviceName);
  }

  /**
   * Create service call function
   */
  createServiceCall(serviceName) {
    return async (requestConfig) => {
      const startTime = Date.now();
      
      try {
        logger.info(`Circuit breaker calling ${serviceName}`, {
          url: requestConfig.url,
          method: requestConfig.method
        });
        
        const response = await axios(requestConfig);
        
        // Update success metrics
        this.updateMetrics(serviceName, 'success', Date.now() - startTime);
        
        return response;
      } catch (error) {
        // Update failure metrics
        this.updateMetrics(serviceName, 'failure', Date.now() - startTime);
        
        logger.error(`Circuit breaker call failed for ${serviceName}`, {
          error: error.message,
          status: error.response?.status,
          duration: Date.now() - startTime
        });
        
        throw error;
      }
    };
  }

  /**
   * Set up circuit breaker event listeners
   */
  setupBreakerEvents(breaker, serviceName) {
    breaker.on('open', () => {
      logger.warn(`Circuit breaker OPENED for ${serviceName}`);
      this.updateMetrics(serviceName, 'circuit_open');
    });

    breaker.on('halfOpen', () => {
      logger.info(`Circuit breaker HALF-OPEN for ${serviceName}`);
      this.updateMetrics(serviceName, 'circuit_half_open');
    });

    breaker.on('close', () => {
      logger.info(`Circuit breaker CLOSED for ${serviceName}`);
      this.updateMetrics(serviceName, 'circuit_close');
    });

    breaker.on('fallback', (result) => {
      logger.info(`Circuit breaker FALLBACK executed for ${serviceName}`);
      this.updateMetrics(serviceName, 'fallback_executed');
    });

    breaker.on('reject', () => {
      logger.warn(`Circuit breaker REJECTED request for ${serviceName}`);
      this.updateMetrics(serviceName, 'request_rejected');
    });
  }

  /**
   * Initialize metrics for a service
   */
  initializeMetrics(serviceName) {
    this.metrics.set(serviceName, {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      circuitOpens: 0,
      circuitCloses: 0,
      fallbackExecutions: 0,
      requestsRejected: 0,
      averageResponseTime: 0,
      lastUpdated: new Date()
    });
  }

  /**
   * Update metrics
   */
  updateMetrics(serviceName, type, duration = 0) {
    const metrics = this.metrics.get(serviceName);
    if (!metrics) return;

    switch (type) {
      case 'success':
        metrics.totalRequests++;
        metrics.successfulRequests++;
        metrics.averageResponseTime = this.calculateAverageResponseTime(
          metrics.averageResponseTime,
          duration,
          metrics.totalRequests
        );
        break;
      case 'failure':
        metrics.totalRequests++;
        metrics.failedRequests++;
        metrics.averageResponseTime = this.calculateAverageResponseTime(
          metrics.averageResponseTime,
          duration,
          metrics.totalRequests
        );
        break;
      case 'circuit_open':
        metrics.circuitOpens++;
        break;
      case 'circuit_close':
        metrics.circuitCloses++;
        break;
      case 'fallback_executed':
        metrics.fallbackExecutions++;
        break;
      case 'request_rejected':
        metrics.requestsRejected++;
        break;
    }

    metrics.lastUpdated = new Date();
  }

  /**
   * Calculate rolling average response time
   */
  calculateAverageResponseTime(currentAvg, newDuration, totalRequests) {
    return ((currentAvg * (totalRequests - 1)) + newDuration) / totalRequests;
  }

  /**
   * Register fallback strategy for a service
   */
  registerFallback(serviceName, fallbackFn) {
    this.fallbackStrategies.set(serviceName, fallbackFn);
    
    const breaker = this.getBreaker(serviceName);
    breaker.fallback(fallbackFn);
  }

  /**
   * Execute request with circuit breaker
   */
  async execute(serviceName, requestConfig, fallbackData = null) {
    const breaker = this.getBreaker(serviceName);
    
    try {
      return await breaker.fire(requestConfig);
    } catch (error) {
      // If circuit is open and we have fallback data, return it
      if (breaker.opened && fallbackData) {
        logger.info(`Using fallback data for ${serviceName}`);
        return { data: fallbackData, fromFallback: true };
      }
      
      throw error;
    }
  }

  /**
   * Get circuit breaker status for all services
   */
  getStatus() {
    const status = {};
    
    for (const [serviceName, breaker] of this.breakers) {
      const metrics = this.metrics.get(serviceName);
      
      status[serviceName] = {
        state: breaker.opened ? 'OPEN' : breaker.halfOpen ? 'HALF_OPEN' : 'CLOSED',
        stats: breaker.stats,
        metrics: metrics,
        isEnabled: breaker.enabled
      };
    }
    
    return status;
  }

  /**
   * Reset circuit breaker for a service
   */
  reset(serviceName) {
    const breaker = this.breakers.get(serviceName);
    if (breaker) {
      breaker.close();
      this.initializeMetrics(serviceName);
      logger.info(`Circuit breaker reset for ${serviceName}`);
    }
  }

  /**
   * Disable circuit breaker for a service
   */
  disable(serviceName) {
    const breaker = this.breakers.get(serviceName);
    if (breaker) {
      breaker.disable();
      logger.info(`Circuit breaker disabled for ${serviceName}`);
    }
  }

  /**
   * Enable circuit breaker for a service
   */
  enable(serviceName) {
    const breaker = this.breakers.get(serviceName);
    if (breaker) {
      breaker.enable();
      logger.info(`Circuit breaker enabled for ${serviceName}`);
    }
  }

  /**
   * Get health check for all services
   */
  async healthCheck() {
    const health = {};
    
    for (const [serviceName] of this.breakers) {
      try {
        const response = await this.execute(serviceName, {
          method: 'GET',
          url: `${this.getServiceUrl(serviceName)}/health`,
          timeout: 5000
        });
        
        health[serviceName] = {
          status: 'healthy',
          responseTime: response.data?.responseTime || 'unknown'
        };
      } catch (error) {
        health[serviceName] = {
          status: 'unhealthy',
          error: error.message
        };
      }
    }
    
    return health;
  }

  /**
   * Get service URL from environment
   */
  getServiceUrl(serviceName) {
    const urlMap = {
      'auth': process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
      'link': process.env.LINK_SERVICE_URL || 'http://localhost:3002',
      'community': process.env.COMMUNITY_SERVICE_URL || 'http://localhost:3003',
      'chat': process.env.CHAT_SERVICE_URL || 'http://localhost:3004',
      'news': process.env.NEWS_SERVICE_URL || 'http://localhost:3005',
      'admin': process.env.ADMIN_SERVICE_URL || 'http://localhost:3006'
    };
    
    return urlMap[serviceName] || `http://localhost:3000`;
  }
}

module.exports = new CircuitBreakerService();
