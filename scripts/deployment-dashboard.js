#!/usr/bin/env node

/**
 * Production Deployment Dashboard
 * Real-time monitoring dashboard for production services
 */

const axios = require('axios');
const fs = require('fs');

class DeploymentDashboard {
  constructor() {
    this.services = {
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
    
    this.status = {};
    this.history = [];
  }

  async checkServiceStatus(serviceName, url) {
    const startTime = Date.now();
    
    try {
      const healthUrl = serviceName === 'frontend' ? url : `${url}/health`;
      const response = await axios.get(healthUrl, { 
        timeout: 5000,
        validateStatus: (status) => status < 500
      });
      
      const responseTime = Date.now() - startTime;
      
      return {
        service: serviceName,
        status: 'online',
        httpStatus: response.status,
        responseTime,
        uptime: response.data?.uptime || null,
        lastCheck: new Date().toISOString(),
        url: healthUrl
      };
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        service: serviceName,
        status: 'offline',
        httpStatus: error.response?.status || 'timeout',
        responseTime,
        error: error.message,
        lastCheck: new Date().toISOString(),
        url: serviceName === 'frontend' ? url : `${url}/health`
      };
    }
  }

  async updateAllStatuses() {
    const promises = Object.entries(this.services).map(([name, url]) =>
      this.checkServiceStatus(name, url)
    );
    
    const results = await Promise.all(promises);
    
    // Update current status
    results.forEach(result => {
      this.status[result.service] = result;
    });
    
    // Add to history
    this.history.push({
      timestamp: new Date().toISOString(),
      snapshot: { ...this.status }
    });
    
    // Keep only last 100 entries
    if (this.history.length > 100) {
      this.history = this.history.slice(-100);
    }
    
    return results;
  }

  getSystemOverview() {
    const services = Object.values(this.status);
    const online = services.filter(s => s.status === 'online').length;
    const offline = services.filter(s => s.status === 'offline').length;
    const total = services.length;
    
    const avgResponseTime = services
      .filter(s => s.status === 'online')
      .reduce((sum, s) => sum + s.responseTime, 0) / online || 0;
    
    return {
      total,
      online,
      offline,
      uptime: ((online / total) * 100).toFixed(1),
      avgResponseTime: Math.round(avgResponseTime),
      lastUpdate: new Date().toISOString()
    };
  }

  printDashboard() {
    console.clear();
    
    const overview = this.getSystemOverview();
    
    // Header
    console.log('🚀 FactCheck Platform - Production Dashboard');
    console.log('=' .repeat(60));
    console.log(`📊 System Status: ${overview.uptime}% (${overview.online}/${overview.total} services online)`);
    console.log(`⚡ Avg Response Time: ${overview.avgResponseTime}ms`);
    console.log(`🕐 Last Update: ${new Date().toLocaleTimeString()}`);
    console.log('=' .repeat(60));
    
    // Service status
    Object.values(this.status).forEach(service => {
      const statusIcon = service.status === 'online' ? '🟢' : '🔴';
      const statusColor = service.status === 'online' ? '\x1b[32m' : '\x1b[31m';
      const resetColor = '\x1b[0m';
      
      const serviceName = service.service.toUpperCase().padEnd(20);
      const status = service.status.toUpperCase().padEnd(8);
      const responseTime = `${service.responseTime}ms`.padEnd(8);
      const httpStatus = String(service.httpStatus).padEnd(6);
      
      console.log(`${statusIcon} ${statusColor}${serviceName}${resetColor} ${status} ${responseTime} ${httpStatus}`);
      
      if (service.uptime) {
        console.log(`   Uptime: ${service.uptime}s`);
      }
      
      if (service.error) {
        console.log(`   Error: ${service.error}`);
      }
    });
    
    // Quick links
    console.log('\n🔗 Quick Links:');
    console.log('   Frontend: https://factcheck-frontend-production.onrender.com');
    console.log('   API Gateway: https://factcheck-api-gateway-production.onrender.com');
    console.log('   Health Check: https://factcheck-api-gateway-production.onrender.com/info');
    
    // Instructions
    console.log('\n⌨️  Commands:');
    console.log('   Press Ctrl+C to exit');
    console.log('   Dashboard updates every 30 seconds');
  }

  async generateReport() {
    const overview = this.getSystemOverview();
    const timestamp = new Date().toISOString();
    
    const report = {
      timestamp,
      overview,
      services: this.status,
      history: this.history.slice(-10) // Last 10 snapshots
    };
    
    const filename = `deployment-report-${timestamp.split('T')[0]}.json`;
    
    try {
      fs.writeFileSync(filename, JSON.stringify(report, null, 2));
      console.log(`\n📄 Report saved: ${filename}`);
    } catch (error) {
      console.error(`❌ Failed to save report: ${error.message}`);
    }
    
    return report;
  }

  async checkCriticalEndpoints() {
    const criticalTests = [
      {
        name: 'Frontend Load Test',
        url: 'https://factcheck-frontend-production.onrender.com',
        expected: 200
      },
      {
        name: 'API Gateway Health',
        url: 'https://factcheck-api-gateway-production.onrender.com/health',
        expected: 200
      },
      {
        name: 'API Gateway Info',
        url: 'https://factcheck-api-gateway-production.onrender.com/info',
        expected: 200
      },
      {
        name: 'CORS Test',
        url: 'https://factcheck-api-gateway-production.onrender.com/test-cors',
        expected: 200
      },
      {
        name: 'Auth Service',
        url: 'https://factcheck-auth-production.onrender.com/health',
        expected: 200
      }
    ];
    
    console.log('\n🧪 Running Critical Endpoint Tests...');
    
    for (const test of criticalTests) {
      try {
        const response = await axios.get(test.url, { timeout: 10000 });
        const status = response.status === test.expected ? '✅' : '❌';
        console.log(`${status} ${test.name}: ${response.status}`);
      } catch (error) {
        console.log(`❌ ${test.name}: ${error.response?.status || 'timeout'}`);
      }
    }
  }

  async runContinuousMonitoring() {
    console.log('🔄 Starting continuous monitoring...\n');
    
    // Initial check
    await this.updateAllStatuses();
    this.printDashboard();
    
    // Set up interval
    const interval = setInterval(async () => {
      try {
        await this.updateAllStatuses();
        this.printDashboard();
      } catch (error) {
        console.error('❌ Monitoring error:', error.message);
      }
    }, 30000); // Update every 30 seconds
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n\n🛑 Stopping monitoring...');
      clearInterval(interval);
      this.generateReport();
      process.exit(0);
    });
    
    return interval;
  }

  async runSingleCheck() {
    console.log('🔍 Running single health check...\n');
    
    await this.updateAllStatuses();
    this.printDashboard();
    
    await this.checkCriticalEndpoints();
    
    const overview = this.getSystemOverview();
    
    console.log('\n📊 Summary:');
    console.log(`   System Uptime: ${overview.uptime}%`);
    console.log(`   Services Online: ${overview.online}/${overview.total}`);
    console.log(`   Average Response Time: ${overview.avgResponseTime}ms`);
    
    if (overview.offline > 0) {
      console.log('\n🚨 Offline Services:');
      Object.values(this.status)
        .filter(s => s.status === 'offline')
        .forEach(s => console.log(`   • ${s.service}: ${s.error}`));
    }
    
    return overview.uptime === '100.0';
  }
}

async function main() {
  const dashboard = new DeploymentDashboard();
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🚀 Production Deployment Dashboard

Usage: node scripts/deployment-dashboard.js [options]

Options:
  --monitor, -m    Start continuous monitoring (default)
  --check, -c      Run single health check
  --report, -r     Generate status report
  --critical       Test critical endpoints only
  --help, -h       Show this help message

Examples:
  node scripts/deployment-dashboard.js --monitor
  node scripts/deployment-dashboard.js --check
  node scripts/deployment-dashboard.js --report
    `);
    process.exit(0);
  }
  
  try {
    if (args.includes('--check') || args.includes('-c')) {
      const isHealthy = await dashboard.runSingleCheck();
      process.exit(isHealthy ? 0 : 1);
    } else if (args.includes('--report') || args.includes('-r')) {
      await dashboard.updateAllStatuses();
      await dashboard.generateReport();
    } else if (args.includes('--critical')) {
      await dashboard.checkCriticalEndpoints();
    } else {
      // Default: continuous monitoring
      await dashboard.runContinuousMonitoring();
    }
  } catch (error) {
    console.error('💥 Dashboard error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { DeploymentDashboard };
