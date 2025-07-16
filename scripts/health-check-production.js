#!/usr/bin/env node

/**
 * Production Health Check Script
 * Monitors all production services on Render and reports their status
 */

const axios = require('axios');
const fs = require('fs');

// Production service URLs
const PRODUCTION_SERVICES = {
  'auth-service': 'https://factcheck-auth-production.onrender.com',
  'link-service': 'https://factcheck-link-production.onrender.com',
  'community-service': 'https://factcheck-community-production.onrender.com',
  'chat-service': 'https://factcheck-chat-production.onrender.com',
  'news-service': 'https://factcheck-news-production.onrender.com',
  'admin-service': 'https://factcheck-admin-production.onrender.com',
  'phishtank-service': 'https://factcheck-phishtank-production.onrender.com',
  'criminalip-service': 'https://factcheck-criminalip-production.onrender.com',
  'api-gateway': 'https://factcheck-api-gateway-production.onrender.com',
  'frontend': 'https://factcheck-frontend-production.onrender.com'
};

class ProductionHealthChecker {
  constructor() {
    this.results = [];
    this.timeout = 10000; // 10 seconds timeout
  }

  async checkService(serviceName, baseUrl) {
    const startTime = Date.now();
    
    try {
      // For frontend, just check if it loads
      const healthUrl = serviceName === 'frontend' ? baseUrl : `${baseUrl}/health`;
      
      const response = await axios.get(healthUrl, {
        timeout: this.timeout,
        validateStatus: (status) => status < 500 // Accept 4xx but not 5xx
      });

      const responseTime = Date.now() - startTime;
      
      const result = {
        service: serviceName,
        url: healthUrl,
        status: 'healthy',
        httpStatus: response.status,
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString()
      };

      // For backend services, check the health response format
      if (serviceName !== 'frontend' && response.data) {
        result.serviceInfo = {
          uptime: response.data.uptime,
          environment: response.data.environment,
          version: response.data.version
        };
      }

      this.results.push(result);
      return result;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      const result = {
        service: serviceName,
        url: serviceName === 'frontend' ? baseUrl : `${baseUrl}/health`,
        status: 'unhealthy',
        httpStatus: error.response?.status || 'timeout',
        responseTime: `${responseTime}ms`,
        error: error.message,
        timestamp: new Date().toISOString()
      };

      this.results.push(result);
      return result;
    }
  }

  async checkAllServices() {
    console.log('🔍 Checking production services health...\n');
    
    const promises = Object.entries(PRODUCTION_SERVICES).map(([serviceName, url]) =>
      this.checkService(serviceName, url)
    );

    await Promise.all(promises);
    return this.results;
  }

  printHealthReport() {
    console.log('=' .repeat(80));
    console.log('📊 PRODUCTION HEALTH CHECK REPORT');
    console.log('=' .repeat(80));
    console.log(`🕐 Timestamp: ${new Date().toISOString()}`);
    console.log(`📈 Total Services: ${this.results.length}`);
    
    const healthy = this.results.filter(r => r.status === 'healthy');
    const unhealthy = this.results.filter(r => r.status === 'unhealthy');
    
    console.log(`✅ Healthy: ${healthy.length}`);
    console.log(`❌ Unhealthy: ${unhealthy.length}`);
    console.log(`📊 Success Rate: ${((healthy.length / this.results.length) * 100).toFixed(1)}%\n`);

    // Detailed service status
    this.results.forEach(result => {
      const statusIcon = result.status === 'healthy' ? '✅' : '❌';
      const statusColor = result.status === 'healthy' ? '\x1b[32m' : '\x1b[31m';
      const resetColor = '\x1b[0m';
      
      console.log(`${statusIcon} ${statusColor}${result.service.toUpperCase()}${resetColor}`);
      console.log(`   URL: ${result.url}`);
      console.log(`   Status: ${result.httpStatus} (${result.responseTime})`);
      
      if (result.serviceInfo) {
        console.log(`   Uptime: ${result.serviceInfo.uptime}s`);
        console.log(`   Environment: ${result.serviceInfo.environment}`);
      }
      
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      console.log();
    });

    // Summary recommendations
    if (unhealthy.length > 0) {
      console.log('🚨 ISSUES DETECTED:');
      unhealthy.forEach(result => {
        console.log(`   • ${result.service}: ${result.error || 'Service unavailable'}`);
      });
      console.log();
      
      console.log('💡 TROUBLESHOOTING STEPS:');
      console.log('   1. Check Render dashboard for service status');
      console.log('   2. Review service logs for errors');
      console.log('   3. Verify environment variables are set correctly');
      console.log('   4. Check if services are sleeping (free tier)');
      console.log('   5. Restart services if necessary');
      console.log();
    }

    // Performance insights
    const avgResponseTime = this.results
      .filter(r => r.status === 'healthy')
      .reduce((sum, r) => sum + parseInt(r.responseTime), 0) / healthy.length;
    
    if (healthy.length > 0) {
      console.log(`⚡ Average Response Time: ${avgResponseTime.toFixed(0)}ms`);
      
      const slowServices = this.results
        .filter(r => r.status === 'healthy' && parseInt(r.responseTime) > 2000);
      
      if (slowServices.length > 0) {
        console.log('🐌 Slow Services (>2s):');
        slowServices.forEach(service => {
          console.log(`   • ${service.service}: ${service.responseTime}`);
        });
      }
    }
  }

  async saveReport(filename = 'health-check-report.json') {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.results.length,
        healthy: this.results.filter(r => r.status === 'healthy').length,
        unhealthy: this.results.filter(r => r.status === 'unhealthy').length,
        successRate: ((this.results.filter(r => r.status === 'healthy').length / this.results.length) * 100).toFixed(1)
      },
      services: this.results
    };

    try {
      fs.writeFileSync(filename, JSON.stringify(report, null, 2));
      console.log(`📄 Report saved to: ${filename}`);
    } catch (error) {
      console.error(`❌ Failed to save report: ${error.message}`);
    }
  }

  async checkCriticalEndpoints() {
    console.log('🔍 Checking critical API endpoints...\n');
    
    const criticalEndpoints = [
      {
        name: 'API Gateway Info',
        url: 'https://factcheck-api-gateway-production.onrender.com/info'
      },
      {
        name: 'API Gateway CORS Test',
        url: 'https://factcheck-api-gateway-production.onrender.com/test-cors'
      },
      {
        name: 'Auth Service Health',
        url: 'https://factcheck-auth-production.onrender.com/health'
      },
      {
        name: 'Community Service Health',
        url: 'https://factcheck-community-production.onrender.com/health'
      }
    ];

    for (const endpoint of criticalEndpoints) {
      try {
        const response = await axios.get(endpoint.url, { timeout: this.timeout });
        console.log(`✅ ${endpoint.name}: ${response.status} (${response.statusText})`);
      } catch (error) {
        console.log(`❌ ${endpoint.name}: ${error.response?.status || 'timeout'} (${error.message})`);
      }
    }
    console.log();
  }

  getOverallStatus() {
    const healthy = this.results.filter(r => r.status === 'healthy').length;
    const total = this.results.length;
    const successRate = (healthy / total) * 100;

    if (successRate === 100) return 'excellent';
    if (successRate >= 90) return 'good';
    if (successRate >= 70) return 'warning';
    return 'critical';
  }
}

async function main() {
  const checker = new ProductionHealthChecker();
  
  try {
    // Check all services
    await checker.checkAllServices();
    
    // Check critical endpoints
    await checker.checkCriticalEndpoints();
    
    // Print report
    checker.printHealthReport();
    
    // Save report
    await checker.saveReport();
    
    // Exit with appropriate code
    const status = checker.getOverallStatus();
    const exitCode = status === 'critical' ? 1 : 0;
    
    console.log(`🎯 Overall Status: ${status.toUpperCase()}`);
    console.log(`🚪 Exit Code: ${exitCode}`);
    
    process.exit(exitCode);
    
  } catch (error) {
    console.error('💥 Health check failed:', error.message);
    process.exit(1);
  }
}

// CLI options
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
🏥 Production Health Check Tool

Usage: node scripts/health-check-production.js [options]

Options:
  --help, -h     Show this help message
  --json         Output results in JSON format only
  --save         Save report to file
  --critical     Check only critical endpoints

Examples:
  node scripts/health-check-production.js
  node scripts/health-check-production.js --json
  node scripts/health-check-production.js --save
  `);
  process.exit(0);
}

if (require.main === module) {
  main();
}

module.exports = { ProductionHealthChecker };
