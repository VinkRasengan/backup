#!/usr/bin/env node

/**
 * Health All - Comprehensive Health Check Script
 * Performs detailed health checks across all deployment methods
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

class UniversalHealthCheck {
  constructor() {
    this.rootDir = process.cwd();
    this.services = [
      { 
        name: 'Auth Service', 
        port: 3001, 
        healthPath: '/health',
        criticalEndpoints: ['/auth/validate', '/auth/login']
      },
      { 
        name: 'Link Service', 
        port: 3002, 
        healthPath: '/health',
        criticalEndpoints: ['/links/analyze', '/links/check']
      },
      { 
        name: 'Community Service', 
        port: 3003, 
        healthPath: '/health',
        criticalEndpoints: ['/community/posts', '/community/users']
      },
      { 
        name: 'Chat Service', 
        port: 3004, 
        healthPath: '/health',
        criticalEndpoints: ['/chat/rooms', '/chat/messages']
      },
      { 
        name: 'News Service', 
        port: 3005, 
        healthPath: '/health',
        criticalEndpoints: ['/news/articles', '/news/sources']
      },
      { 
        name: 'Admin Service', 
        port: 3006, 
        healthPath: '/health',
        criticalEndpoints: ['/admin/dashboard', '/admin/users']
      },
      { 
        name: 'API Gateway', 
        port: 8080, 
        healthPath: '/health',
        criticalEndpoints: ['/api/status', '/api/metrics']
      },
      { 
        name: 'Client', 
        port: 3000, 
        healthPath: null,
        criticalEndpoints: ['/']
      }
    ];
    this.infrastructure = [
      { name: 'Redis', port: 6379, type: 'redis' }
    ];
  }

  /**
   * Main health check function
   */
  async performHealthCheck() {
    console.log('🏥 Comprehensive Health Check - All Services');
    console.log('=' .repeat(60));

    try {
      const results = {
        infrastructure: await this.checkInfrastructure(),
        services: await this.checkServices(),
        endpoints: await this.checkCriticalEndpoints(),
        dependencies: await this.checkDependencies(),
        performance: await this.checkPerformance()
      };

      this.displayHealthReport(results);
      this.generateHealthScore(results);
    } catch (error) {
      console.error('❌ Health check failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Check infrastructure components
   */
  async checkInfrastructure() {
    console.log('🔧 Checking infrastructure...');
    const infraResults = {};

    for (const infra of this.infrastructure) {
      console.log(`  🔍 Checking ${infra.name}...`);
      
      try {
        if (infra.type === 'redis') {
          const result = await this.checkRedis(infra.port);
          infraResults[infra.name] = result;
        }
      } catch (error) {
        infraResults[infra.name] = {
          status: 'unhealthy',
          error: error.message,
          timestamp: new Date().toISOString()
        };
      }
    }

    return infraResults;
  }

  /**
   * Check Redis health
   */
  async checkRedis(port) {
    try {
      // Try to connect to Redis
      const redis = require('redis');
      const client = redis.createClient({
        host: 'localhost',
        port: port,
        password: 'antifraud123',
        connectTimeout: 5000
      });

      await client.connect();
      
      // Test basic operations
      await client.set('health_check', 'test');
      const value = await client.get('health_check');
      await client.del('health_check');
      
      const info = await client.info();
      await client.disconnect();

      return {
        status: 'healthy',
        responseTime: Date.now(),
        details: {
          connected: true,
          readWrite: value === 'test',
          memory: this.parseRedisInfo(info, 'used_memory_human'),
          uptime: this.parseRedisInfo(info, 'uptime_in_seconds')
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Parse Redis INFO output
   */
  parseRedisInfo(info, key) {
    const lines = info.split('\n');
    for (const line of lines) {
      if (line.startsWith(key + ':')) {
        return line.split(':')[1].trim();
      }
    }
    return 'unknown';
  }

  /**
   * Check service health endpoints
   */
  async checkServices() {
    console.log('🚀 Checking service health endpoints...');
    const serviceResults = {};

    for (const service of this.services) {
      console.log(`  🔍 Checking ${service.name}...`);
      
      if (service.healthPath) {
        try {
          const startTime = Date.now();
          const response = await this.httpGet(`http://localhost:${service.port}${service.healthPath}`);
          const responseTime = Date.now() - startTime;
          
          let healthData = null;
          try {
            const body = await this.getResponseBody(response);
            healthData = JSON.parse(body);
          } catch (e) {
            // Health endpoint might not return JSON
          }

          serviceResults[service.name] = {
            status: 'healthy',
            responseTime: responseTime,
            httpStatus: response.statusCode,
            details: healthData,
            timestamp: new Date().toISOString()
          };
        } catch (error) {
          serviceResults[service.name] = {
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
          };
        }
      } else {
        // For services without health endpoints (like frontend)
        try {
          const startTime = Date.now();
          const response = await this.httpGet(`http://localhost:${service.port}/`);
          const responseTime = Date.now() - startTime;
          
          serviceResults[service.name] = {
            status: 'healthy',
            responseTime: responseTime,
            httpStatus: response.statusCode,
            details: { type: 'frontend' },
            timestamp: new Date().toISOString()
          };
        } catch (error) {
          serviceResults[service.name] = {
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
          };
        }
      }
    }

    return serviceResults;
  }

  /**
   * Check critical endpoints
   */
  async checkCriticalEndpoints() {
    console.log('🎯 Checking critical endpoints...');
    const endpointResults = {};

    for (const service of this.services) {
      if (service.criticalEndpoints && service.criticalEndpoints.length > 0) {
        console.log(`  🔍 Testing ${service.name} endpoints...`);
        endpointResults[service.name] = {};

        for (const endpoint of service.criticalEndpoints) {
          try {
            const startTime = Date.now();
            const url = `http://localhost:${service.port}${endpoint}`;
            const response = await this.httpGet(url);
            const responseTime = Date.now() - startTime;

            endpointResults[service.name][endpoint] = {
              status: 'accessible',
              responseTime: responseTime,
              httpStatus: response.statusCode,
              timestamp: new Date().toISOString()
            };
          } catch (error) {
            endpointResults[service.name][endpoint] = {
              status: 'inaccessible',
              error: error.message,
              timestamp: new Date().toISOString()
            };
          }
        }
      }
    }

    return endpointResults;
  }

  /**
   * Check service dependencies
   */
  async checkDependencies() {
    console.log('🔗 Checking service dependencies...');
    const dependencyResults = {};

    // Check if services can communicate with each other
    const dependencyTests = [
      {
        from: 'API Gateway',
        to: 'Auth Service',
        endpoint: 'http://localhost:8080/api/auth/health'
      },
      {
        from: 'Community Service',
        to: 'Auth Service',
        test: 'auth_dependency'
      },
      {
        from: 'Chat Service',
        to: 'Auth Service',
        test: 'auth_dependency'
      }
    ];

    for (const test of dependencyTests) {
      try {
        if (test.endpoint) {
          const response = await this.httpGet(test.endpoint);
          dependencyResults[`${test.from} -> ${test.to}`] = {
            status: 'connected',
            httpStatus: response.statusCode,
            timestamp: new Date().toISOString()
          };
        }
      } catch (error) {
        dependencyResults[`${test.from} -> ${test.to}`] = {
          status: 'disconnected',
          error: error.message,
          timestamp: new Date().toISOString()
        };
      }
    }

    return dependencyResults;
  }

  /**
   * Check performance metrics
   */
  async checkPerformance() {
    console.log('⚡ Checking performance metrics...');
    const performanceResults = {};

    // Check system resources
    try {
      const os = require('os');
      const cpuUsage = os.loadavg();
      const memoryUsage = {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem()
      };

      performanceResults.system = {
        cpu: {
          load1min: cpuUsage[0],
          load5min: cpuUsage[1],
          load15min: cpuUsage[2]
        },
        memory: {
          total: Math.round(memoryUsage.total / 1024 / 1024 / 1024 * 100) / 100 + ' GB',
          used: Math.round(memoryUsage.used / 1024 / 1024 / 1024 * 100) / 100 + ' GB',
          free: Math.round(memoryUsage.free / 1024 / 1024 / 1024 * 100) / 100 + ' GB',
          usage: Math.round((memoryUsage.used / memoryUsage.total) * 100) + '%'
        },
        uptime: Math.round(os.uptime() / 3600 * 100) / 100 + ' hours'
      };
    } catch (error) {
      performanceResults.system = {
        error: error.message
      };
    }

    return performanceResults;
  }

  /**
   * Display comprehensive health report
   */
  displayHealthReport(results) {
    console.log('\n📋 Health Check Report');
    console.log('=' .repeat(60));

    // Infrastructure Health
    console.log('\n🔧 Infrastructure Health:');
    for (const [name, result] of Object.entries(results.infrastructure)) {
      const statusIcon = result.status === 'healthy' ? '🟢' : '🔴';
      console.log(`  ${statusIcon} ${name}: ${result.status}`);
      if (result.details) {
        console.log(`    Memory: ${result.details.memory}, Uptime: ${result.details.uptime}s`);
      }
      if (result.error) {
        console.log(`    Error: ${result.error}`);
      }
    }

    // Service Health
    console.log('\n🚀 Service Health:');
    for (const [name, result] of Object.entries(results.services)) {
      const statusIcon = result.status === 'healthy' ? '🟢' : '🔴';
      const responseTime = result.responseTime ? `(${result.responseTime}ms)` : '';
      console.log(`  ${statusIcon} ${name}: ${result.status} ${responseTime}`);
      if (result.error) {
        console.log(`    Error: ${result.error}`);
      }
    }

    // Critical Endpoints
    console.log('\n🎯 Critical Endpoints:');
    for (const [serviceName, endpoints] of Object.entries(results.endpoints)) {
      console.log(`  ${serviceName}:`);
      for (const [endpoint, result] of Object.entries(endpoints)) {
        const statusIcon = result.status === 'accessible' ? '🟢' : '🔴';
        const responseTime = result.responseTime ? `(${result.responseTime}ms)` : '';
        console.log(`    ${statusIcon} ${endpoint}: ${result.status} ${responseTime}`);
      }
    }

    // Dependencies
    if (Object.keys(results.dependencies).length > 0) {
      console.log('\n🔗 Service Dependencies:');
      for (const [dependency, result] of Object.entries(results.dependencies)) {
        const statusIcon = result.status === 'connected' ? '🟢' : '🔴';
        console.log(`  ${statusIcon} ${dependency}: ${result.status}`);
      }
    }

    // Performance
    console.log('\n⚡ System Performance:');
    if (results.performance.system && !results.performance.system.error) {
      const sys = results.performance.system;
      console.log(`  CPU Load: ${sys.cpu.load1min.toFixed(2)} (1min)`);
      console.log(`  Memory: ${sys.memory.used}/${sys.memory.total} (${sys.memory.usage})`);
      console.log(`  System Uptime: ${sys.uptime}`);
    } else {
      console.log('  ⚠️  Performance metrics unavailable');
    }
  }

  /**
   * Generate overall health score
   */
  generateHealthScore(results) {
    console.log('\n📊 Health Score Summary');
    console.log('=' .repeat(40));

    let totalChecks = 0;
    let passedChecks = 0;

    // Count infrastructure checks
    for (const result of Object.values(results.infrastructure)) {
      totalChecks++;
      if (result.status === 'healthy') passedChecks++;
    }

    // Count service checks
    for (const result of Object.values(results.services)) {
      totalChecks++;
      if (result.status === 'healthy') passedChecks++;
    }

    // Count endpoint checks
    for (const endpoints of Object.values(results.endpoints)) {
      for (const result of Object.values(endpoints)) {
        totalChecks++;
        if (result.status === 'accessible') passedChecks++;
      }
    }

    const healthScore = Math.round((passedChecks / totalChecks) * 100);
    const scoreIcon = healthScore >= 90 ? '🟢' : healthScore >= 70 ? '🟡' : '🔴';

    console.log(`${scoreIcon} Overall Health Score: ${healthScore}% (${passedChecks}/${totalChecks})`);
    
    if (healthScore >= 90) {
      console.log('🎉 Excellent! All systems are running optimally.');
    } else if (healthScore >= 70) {
      console.log('⚠️  Good, but some issues need attention.');
    } else {
      console.log('🚨 Critical issues detected. Immediate attention required.');
    }

    console.log(`\n📅 Report generated: ${new Date().toLocaleString()}`);
  }

  /**
   * Utility functions
   */
  httpGet(url) {
    return new Promise((resolve, reject) => {
      const http = require('http');
      const request = http.get(url, (response) => {
        resolve(response);
      });
      
      request.on('error', reject);
      request.setTimeout(10000, () => {
        request.destroy();
        reject(new Error('Timeout'));
      });
    });
  }

  getResponseBody(response) {
    return new Promise((resolve, reject) => {
      let body = '';
      response.on('data', chunk => body += chunk);
      response.on('end', () => resolve(body));
      response.on('error', reject);
    });
  }

  execAsync(command, options = {}) {
    return new Promise((resolve, reject) => {
      exec(command, { timeout: 10000, ...options }, (error, stdout, stderr) => {
        if (error) reject(error);
        else resolve(stdout);
      });
    });
  }
}

// Run health check
if (require.main === module) {
  const healthCheck = new UniversalHealthCheck();
  healthCheck.performHealthCheck().catch(console.error);
}

module.exports = UniversalHealthCheck;
