/**
 * Service Registry
 * Manages service discovery, health checks, and load balancing
 */

const logger = require('../utils/logger');
const circuitBreakerService = require('./circuitBreaker');

class ServiceRegistry {
  constructor() {
    this.services = new Map();
    this.healthCheckInterval = 30000; // 30 seconds
    this.healthCheckTimer = null;
    this.loadBalancingStrategy = 'round-robin';
    this.serviceCounters = new Map();
    
    this.initializeServices();
    this.startHealthChecks();
  }

  /**
   * Initialize services from environment variables
   */
  initializeServices() {
    const serviceConfigs = [
      {
        name: 'auth',
        url: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
        healthPath: '/health',
        timeout: 10000,
        retries: 3,
        priority: 1, // High priority - critical service
        dependencies: []
      },
      {
        name: 'link',
        url: process.env.LINK_SERVICE_URL || 'http://localhost:3002',
        healthPath: '/health',
        timeout: 15000,
        retries: 2,
        priority: 2,
        dependencies: ['auth']
      },
      {
        name: 'community',
        url: process.env.COMMUNITY_SERVICE_URL || 'http://localhost:3003',
        healthPath: '/health',
        timeout: 10000,
        retries: 2,
        priority: 2,
        dependencies: ['auth']
      },
      {
        name: 'chat',
        url: process.env.CHAT_SERVICE_URL || 'http://localhost:3004',
        healthPath: '/health',
        timeout: 10000,
        retries: 2,
        priority: 3,
        dependencies: ['auth']
      },
      {
        name: 'news',
        url: process.env.NEWS_SERVICE_URL || 'http://localhost:3005',
        healthPath: '/health',
        timeout: 10000,
        retries: 2,
        priority: 3,
        dependencies: ['auth']
      },
      {
        name: 'admin',
        url: process.env.ADMIN_SERVICE_URL || 'http://localhost:3006',
        healthPath: '/health',
        timeout: 10000,
        retries: 2,
        priority: 4, // Lower priority
        dependencies: ['auth', 'link', 'community', 'news']
      }
    ];

    serviceConfigs.forEach(config => {
      this.registerService(config);
    });

    logger.info('Service registry initialized', {
      totalServices: this.services.size,
      services: Array.from(this.services.keys())
    });
  }

  /**
   * Register a service
   */
  registerService(config) {
    const service = {
      ...config,
      instances: [{ url: config.url, healthy: true, lastCheck: null }],
      status: 'unknown',
      lastHealthCheck: null,
      consecutiveFailures: 0,
      totalRequests: 0,
      successfulRequests: 0,
      averageResponseTime: 0
    };

    this.services.set(config.name, service);
    this.serviceCounters.set(config.name, 0);

    logger.info('Service registered', {
      name: config.name,
      url: config.url,
      priority: config.priority
    });
  }

  /**
   * Get service configuration
   */
  getService(serviceName) {
    return this.services.get(serviceName);
  }

  /**
   * Get healthy instance of a service
   */
  getHealthyInstance(serviceName) {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service ${serviceName} not found`);
    }

    const healthyInstances = service.instances.filter(instance => instance.healthy);
    
    if (healthyInstances.length === 0) {
      throw new Error(`No healthy instances available for service ${serviceName}`);
    }

    // Load balancing
    return this.selectInstance(serviceName, healthyInstances);
  }

  /**
   * Select instance based on load balancing strategy
   */
  selectInstance(serviceName, instances) {
    switch (this.loadBalancingStrategy) {
      case 'round-robin':
        const counter = this.serviceCounters.get(serviceName) || 0;
        const selectedInstance = instances[counter % instances.length];
        this.serviceCounters.set(serviceName, counter + 1);
        return selectedInstance;
      
      case 'random':
        return instances[Math.floor(Math.random() * instances.length)];
      
      case 'least-connections':
        // For now, just use round-robin
        return this.selectInstance(serviceName, instances);
      
      default:
        return instances[0];
    }
  }

  /**
   * Mark service instance as unhealthy
   */
  markUnhealthy(serviceName, instanceUrl) {
    const service = this.services.get(serviceName);
    if (service) {
      const instance = service.instances.find(inst => inst.url === instanceUrl);
      if (instance) {
        instance.healthy = false;
        instance.lastCheck = new Date();
        service.consecutiveFailures++;
        
        logger.warn('Service instance marked as unhealthy', {
          service: serviceName,
          instance: instanceUrl,
          consecutiveFailures: service.consecutiveFailures
        });
      }
    }
  }

  /**
   * Mark service instance as healthy
   */
  markHealthy(serviceName, instanceUrl) {
    const service = this.services.get(serviceName);
    if (service) {
      const instance = service.instances.find(inst => inst.url === instanceUrl);
      if (instance) {
        instance.healthy = true;
        instance.lastCheck = new Date();
        service.consecutiveFailures = 0;
        service.status = 'healthy';
        
        logger.info('Service instance marked as healthy', {
          service: serviceName,
          instance: instanceUrl
        });
      }
    }
  }

  /**
   * Start periodic health checks
   */
  startHealthChecks() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    this.healthCheckTimer = setInterval(async () => {
      await this.performHealthChecks();
    }, this.healthCheckInterval);

    logger.info('Health checks started', {
      interval: this.healthCheckInterval
    });
  }

  /**
   * Stop health checks
   */
  stopHealthChecks() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
      logger.info('Health checks stopped');
    }
  }

  /**
   * Perform health checks on all services
   */
  async performHealthChecks() {
    const healthCheckPromises = Array.from(this.services.entries()).map(
      async ([serviceName, service]) => {
        try {
          await this.checkServiceHealth(serviceName, service);
        } catch (error) {
          logger.error('Health check failed', {
            service: serviceName,
            error: error.message
          });
        }
      }
    );

    await Promise.allSettled(healthCheckPromises);
  }

  /**
   * Check health of a specific service
   */
  async checkServiceHealth(serviceName, service) {
    const startTime = Date.now();
    
    try {
      const response = await circuitBreakerService.execute(serviceName, {
        method: 'GET',
        url: `${service.url}${service.healthPath}`,
        timeout: 5000
      });

      const responseTime = Date.now() - startTime;
      
      if (response.status === 200) {
        this.markHealthy(serviceName, service.url);
        this.updateMetrics(serviceName, true, responseTime);
      } else {
        this.markUnhealthy(serviceName, service.url);
        this.updateMetrics(serviceName, false, responseTime);
      }
    } catch (error) {
      this.markUnhealthy(serviceName, service.url);
      this.updateMetrics(serviceName, false, Date.now() - startTime);
    }

    service.lastHealthCheck = new Date();
  }

  /**
   * Update service metrics
   */
  updateMetrics(serviceName, success, responseTime) {
    const service = this.services.get(serviceName);
    if (service) {
      service.totalRequests++;
      
      if (success) {
        service.successfulRequests++;
      }
      
      // Calculate rolling average response time
      service.averageResponseTime = 
        ((service.averageResponseTime * (service.totalRequests - 1)) + responseTime) / 
        service.totalRequests;
    }
  }

  /**
   * Get service registry status
   */
  getStatus() {
    const status = {};
    
    for (const [serviceName, service] of this.services) {
      status[serviceName] = {
        status: service.status,
        instances: service.instances.length,
        healthyInstances: service.instances.filter(inst => inst.healthy).length,
        lastHealthCheck: service.lastHealthCheck,
        consecutiveFailures: service.consecutiveFailures,
        totalRequests: service.totalRequests,
        successfulRequests: service.successfulRequests,
        successRate: service.totalRequests > 0 ? 
          (service.successfulRequests / service.totalRequests * 100).toFixed(2) + '%' : 'N/A',
        averageResponseTime: Math.round(service.averageResponseTime) + 'ms',
        priority: service.priority,
        dependencies: service.dependencies
      };
    }
    
    return status;
  }

  /**
   * Get services by priority
   */
  getServicesByPriority() {
    return Array.from(this.services.entries())
      .sort(([, a], [, b]) => a.priority - b.priority)
      .map(([name]) => name);
  }

  /**
   * Check if service dependencies are healthy
   */
  areDependenciesHealthy(serviceName) {
    const service = this.services.get(serviceName);
    if (!service || !service.dependencies.length) {
      return true;
    }

    return service.dependencies.every(depName => {
      const depService = this.services.get(depName);
      return depService && depService.status === 'healthy';
    });
  }
}

module.exports = new ServiceRegistry();
