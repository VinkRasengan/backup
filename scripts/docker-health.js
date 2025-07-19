#!/usr/bin/env node
/**
 * Docker Health Check Script
 * Checks the health and status of all Docker services
 */

const { exec } = require('child_process');
const util = require('util');
const path = require('path');

const execAsync = util.promisify(exec);

class DockerHealthChecker {
  constructor() {
    this.rootDir = path.resolve(__dirname, '..');
    this.composeFile = 'docker-compose.dev.yml';
    this.services = [
      { name: 'Frontend', container: 'factcheck-frontend', url: 'http://localhost:3000', port: 3000 },
      { name: 'API Gateway', container: 'factcheck-api-gateway', url: 'http://localhost:8080/health', port: 8080 },
      { name: 'Auth Service', container: 'factcheck-auth-service', url: 'http://localhost:3001/health', port: 3001 },
      { name: 'Link Service', container: 'factcheck-link-service', url: 'http://localhost:3002/health', port: 3002 },
      { name: 'Community Service', container: 'factcheck-community-service', url: 'http://localhost:3003/health', port: 3003 },
      { name: 'Chat Service', container: 'factcheck-chat-service', url: 'http://localhost:3004/health', port: 3004 },
      { name: 'News Service', container: 'factcheck-news-service', url: 'http://localhost:3005/health', port: 3005 },
      { name: 'Admin Service', container: 'factcheck-admin-service', url: 'http://localhost:3006/health', port: 3006 },
      { name: 'Redis', container: 'factcheck-redis', port: 6379 },
      { name: 'Prometheus', container: 'factcheck-prometheus', url: 'http://localhost:9090', port: 9090 },
      { name: 'Grafana', container: 'factcheck-grafana', url: 'http://localhost:3010', port: 3010 }
    ];
  }

  /**
   * Main health check method
   */
  async check() {
    console.log('🏥 FactCheck Platform - Docker Health Check');
    console.log('============================================\n');
    
    try {
      // Step 1: Check Docker
      await this.checkDocker();
      
      // Step 2: Check containers
      await this.checkContainers();
      
      // Step 3: Check services
      await this.checkServices();
      
      // Step 4: Check resources
      await this.checkResources();
      
      // Step 5: Show summary
      this.showSummary();
      
    } catch (error) {
      console.error('❌ Health check failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Check Docker availability
   */
  async checkDocker() {
    console.log('1. 🐳 Docker Status:');
    
    try {
      const { stdout } = await execAsync('docker version --format "{{.Server.Version}}"', { timeout: 10000 });
      console.log(`  ✅ Docker Engine: v${stdout.trim()}`);
      
      const { stdout: composeVersion } = await execAsync('docker-compose --version', { timeout: 5000 });
      console.log(`  ✅ Docker Compose: ${composeVersion.trim()}`);
      
      await execAsync('docker info', { timeout: 10000 });
      console.log('  ✅ Docker daemon is running');
      
    } catch (error) {
      throw new Error('Docker is not available or not running');
    }
  }

  /**
   * Check container status
   */
  async checkContainers() {
    console.log('\n2. 📦 Container Status:');
    
    const results = {
      running: 0,
      stopped: 0,
      missing: 0,
      unhealthy: 0
    };
    
    for (const service of this.services) {
      try {
        const { stdout } = await execAsync(
          `docker inspect ${service.container} --format "{{.State.Status}}"`,
          { timeout: 5000 }
        );
        
        const status = stdout.trim();
        
        if (status === 'running') {
          console.log(`  ✅ ${service.name.padEnd(20)} - Running`);
          results.running++;
        } else {
          console.log(`  ⚠️  ${service.name.padEnd(20)} - ${status}`);
          results.stopped++;
        }
        
      } catch (error) {
        console.log(`  ❌ ${service.name.padEnd(20)} - Not found`);
        results.missing++;
      }
    }
    
    console.log(`\n  📊 Summary: ${results.running} running, ${results.stopped} stopped, ${results.missing} missing`);
    this.containerResults = results;
  }

  /**
   * Check service health
   */
  async checkServices() {
    console.log('\n3. 🌐 Service Health:');
    
    const axios = require('axios').default;
    const results = {
      healthy: 0,
      unhealthy: 0,
      unreachable: 0
    };
    
    for (const service of this.services) {
      if (service.url) {
        try {
          const response = await axios.get(service.url, { 
            timeout: 5000,
            validateStatus: () => true // Accept any status code
          });
          
          if (response.status >= 200 && response.status < 400) {
            console.log(`  ✅ ${service.name.padEnd(20)} - HTTP ${response.status}`);
            results.healthy++;
          } else {
            console.log(`  ⚠️  ${service.name.padEnd(20)} - HTTP ${response.status}`);
            results.unhealthy++;
          }
          
        } catch (error) {
          if (error.code === 'ECONNREFUSED') {
            console.log(`  ❌ ${service.name.padEnd(20)} - Connection refused`);
          } else {
            console.log(`  ❌ ${service.name.padEnd(20)} - ${error.message}`);
          }
          results.unreachable++;
        }
      } else if (service.name === 'Redis') {
        // Special check for Redis
        try {
          await execAsync('docker exec factcheck-redis redis-cli ping', { timeout: 5000 });
          console.log(`  ✅ ${service.name.padEnd(20)} - PONG`);
          results.healthy++;
        } catch (error) {
          console.log(`  ❌ ${service.name.padEnd(20)} - No response`);
          results.unreachable++;
        }
      }
    }
    
    console.log(`\n  📊 Summary: ${results.healthy} healthy, ${results.unhealthy} unhealthy, ${results.unreachable} unreachable`);
    this.serviceResults = results;
  }

  /**
   * Check system resources
   */
  async checkResources() {
    console.log('\n4. 💾 Resource Usage:');
    
    try {
      // Docker system info
      const { stdout: systemInfo } = await execAsync('docker system df', { timeout: 10000 });
      console.log('  📊 Docker disk usage:');
      console.log(systemInfo.split('\n').map(line => `    ${line}`).join('\n'));
      
      // Container resource usage
      const { stdout: stats } = await execAsync(
        'docker stats --no-stream --format "table {{.Container}}\\t{{.CPUPerc}}\\t{{.MemUsage}}"',
        { timeout: 10000 }
      );
      
      if (stats.trim()) {
        console.log('\n  🔧 Container resource usage:');
        console.log(stats.split('\n').map(line => `    ${line}`).join('\n'));
      }
      
    } catch (error) {
      console.log('  ⚠️  Could not retrieve resource information');
    }
  }

  /**
   * Show health summary
   */
  showSummary() {
    console.log('\n5. 📋 Health Summary:');
    
    const totalContainers = this.services.length;
    const runningContainers = this.containerResults?.running || 0;
    const healthyServices = this.serviceResults?.healthy || 0;
    
    // Overall health score
    const containerHealth = (runningContainers / totalContainers) * 100;
    const serviceHealth = this.serviceResults ? 
      (healthyServices / (this.serviceResults.healthy + this.serviceResults.unhealthy + this.serviceResults.unreachable)) * 100 : 0;
    
    const overallHealth = (containerHealth + serviceHealth) / 2;
    
    console.log(`  📊 Container Health: ${containerHealth.toFixed(1)}% (${runningContainers}/${totalContainers})`);
    console.log(`  🌐 Service Health: ${serviceHealth.toFixed(1)}%`);
    console.log(`  🏥 Overall Health: ${overallHealth.toFixed(1)}%`);
    
    if (overallHealth >= 90) {
      console.log('\n  ✅ System is healthy! 🎉');
    } else if (overallHealth >= 70) {
      console.log('\n  ⚠️  System has some issues but is mostly functional');
    } else {
      console.log('\n  ❌ System has significant issues');
    }
    
    // Show recommendations
    this.showRecommendations();
  }

  /**
   * Show recommendations
   */
  showRecommendations() {
    console.log('\n6. 💡 Recommendations:');
    
    const runningContainers = this.containerResults?.running || 0;
    const totalContainers = this.services.length;
    
    if (runningContainers === 0) {
      console.log('  🚀 No containers running. Start with: npm start');
    } else if (runningContainers < totalContainers) {
      console.log('  🔄 Some containers are not running. Try: npm restart');
    }
    
    if (this.serviceResults?.unreachable > 0) {
      console.log('  ⏳ Some services are unreachable. They may still be starting up.');
      console.log('     Wait a moment and run: npm run health');
    }
    
    console.log('\n  🛠️  Useful commands:');
    console.log('    • npm start          - Start all services');
    console.log('    • npm stop           - Stop all services');
    console.log('    • npm restart        - Restart all services');
    console.log('    • npm run logs       - View service logs');
    console.log('    • npm run status     - Quick status check');
  }

  /**
   * Quick status check
   */
  async quickStatus() {
    console.log('📊 Quick Status Check\n');
    
    try {
      const { stdout } = await execAsync(
        'docker ps --filter "name=factcheck" --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"',
        { timeout: 10000 }
      );
      
      if (stdout.trim()) {
        console.log('🐳 Running Containers:');
        console.log(stdout);
      } else {
        console.log('❌ No containers running');
        console.log('💡 Start with: npm start');
      }
      
    } catch (error) {
      console.log('❌ Could not check status:', error.message);
    }
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
const quickMode = args.includes('--quick') || args.includes('-q');

// Run health check if called directly
if (require.main === module) {
  const checker = new DockerHealthChecker();
  
  if (quickMode) {
    checker.quickStatus().catch(console.error);
  } else {
    checker.check().catch(console.error);
  }
}

module.exports = DockerHealthChecker;
