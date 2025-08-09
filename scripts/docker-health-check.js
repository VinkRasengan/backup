#!/usr/bin/env node
/**
 * Docker Health Check Script
 * Checks the health of all Docker services
 */

import { exec  } from 'child_process';
const util = require('util');

const execAsync = util.promisify(exec);

class DockerHealthChecker {
  constructor() {
    this.composeFile = 'docker-compose.dev.yml';
    this.services = [
      { name: 'Frontend', container: 'factcheck-frontend', url: 'http://localhost:3000' },
      { name: 'API Gateway', container: 'factcheck-api-gateway', url: 'http://localhost:8080/health' },
      { name: 'Auth Service', container: 'factcheck-auth-service', url: 'http://localhost:3001/health' },
      { name: 'Link Service', container: 'factcheck-link-service', url: 'http://localhost:3002/health' },
      { name: 'Community Service', container: 'factcheck-community-service', url: 'http://localhost:3003/health' },
      { name: 'Chat Service', container: 'factcheck-chat-service', url: 'http://localhost:3004/health' },
      { name: 'News Service', container: 'factcheck-news-service', url: 'http://localhost:3005/health' },
      { name: 'Admin Service', container: 'factcheck-admin-service', url: 'http://localhost:3006/health' },
      { name: 'Redis', container: 'factcheck-redis', check: 'redis' },
      { name: 'Prometheus', container: 'factcheck-prometheus', url: 'http://localhost:9090' },
      { name: 'Grafana', container: 'factcheck-grafana', url: 'http://localhost:3010' }
    ];
  }

  /**
   * Main health check method
   */
  async check() {
    console.log('🏥 Docker Health Check\n');
    
    try {
      // Check if Docker is running
      await this.checkDocker();
      
      // Check container status
      await this.checkContainers();
      
      // Check service health
      await this.checkServiceHealth();
      
      console.log('\n✅ Health check completed!');
      
    } catch (error) {
      console.error('❌ Health check failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Check Docker availability
   */
  async checkDocker() {
    console.log('🐳 Checking Docker...');
    
    try {
      await execAsync('docker --version', { timeout: 5000 });
      await execAsync('docker-compose --version', { timeout: 5000 });
      console.log('  ✅ Docker is available');
    } catch (error) {
      throw new Error('Docker is not available');
    }
  }

  /**
   * Check container status
   */
  async checkContainers() {
    console.log('\n📦 Container Status:');
    
    try {
      const { stdout } = await execAsync(`docker-compose -f ${this.composeFile} ps`, { timeout: 10000 });
      
      if (stdout.includes('Up')) {
        console.log('  ✅ Containers are running');
        console.log(stdout);
      } else {
        console.log('  ⚠️  No containers running');
      }
      
    } catch (error) {
      console.log('  ❌ Could not check container status');
    }
  }

  /**
   * Check service health
   */
  async checkServiceHealth() {
    console.log('\n🏥 Service Health:');
    
    let healthyCount = 0;
    
    for (const service of this.services) {
      try {
        let isHealthy = false;
        
        if (service.url) {
          isHealthy = await this.checkUrl(service.url);
        } else if (service.check === 'redis') {
          isHealthy = await this.checkRedis();
        }
        
        if (isHealthy) {
          console.log(`  ✅ ${service.name}: Healthy`);
          healthyCount++;
        } else {
          console.log(`  ❌ ${service.name}: Not responding`);
        }
        
      } catch (error) {
        console.log(`  ❌ ${service.name}: Error - ${error.message}`);
      }
    }
    
    console.log(`\n📊 Health Summary: ${healthyCount}/${this.services.length} services healthy`);
  }

  /**
   * Check URL health
   */
  async checkUrl(url) {
    try {
      const axios = require('axios');
      const response = await axios.get(url, { timeout: 5000 });
      return response.status === 200 || response.status === 503;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check Redis health
   */
  async checkRedis() {
    try {
      const command = 'docker exec factcheck-redis redis-cli -a antifraud123 ping';
      const { stdout } = await execAsync(command, { timeout: 5000 });
      return stdout.includes('PONG');
    } catch (error) {
      return false;
    }
  }
}

// Run health check
const checker = new DockerHealthChecker();
checker.check().catch(console.error);
