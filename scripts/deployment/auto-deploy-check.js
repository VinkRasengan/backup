#!/usr/bin/env node

/**
 * Auto Deploy & Health Check Script
 * Automatically deploys all services with Docker and performs comprehensive health checks
 */

import { exec, spawn  } from 'child_process';
const util = require('util');
const http = require('http');

const execAsync = util.promisify(exec);

class AutoDeployChecker {
  constructor() {
    // Use fast deployment (without Link Service due to Puppeteer build time)
    this.composeFile = 'docker-compose.fast.yml';

    this.services = [
      { name: 'Event Bus Service', port: 3009, path: '/health', container: 'factcheck-event-bus-fast' },
      { name: 'Auth Service', port: 3001, path: '/health', container: 'factcheck-auth-fast' },
      { name: 'Link Service', port: 3002, path: '/health', container: 'factcheck-link-fast' },
      { name: 'Community Service', port: 3003, path: '/health', container: 'factcheck-community-fast' },
      { name: 'Chat Service', port: 3004, path: '/health', container: 'factcheck-chat-fast' },
      { name: 'News Service', port: 3005, path: '/health', container: 'factcheck-news-fast' },
      { name: 'Admin Service', port: 3006, path: '/health', container: 'factcheck-admin-fast' },
      { name: 'API Gateway', port: 8080, path: '/health', container: 'factcheck-gateway-fast' },
      { name: 'Frontend Client', port: 3000, path: '/', container: 'factcheck-client-fast', isClient: true }
    ];

    this.infrastructure = [
      { name: 'Redis', port: 6379, container: 'factcheck-redis-fast' },
      { name: 'RabbitMQ', port: 5672, container: 'factcheck-rabbitmq-fast' },
      { name: 'RabbitMQ Management', port: 15672, container: 'factcheck-rabbitmq-fast' }
    ];
  }

  async run() {
    console.log('🚀 Starting Auto Deploy & Health Check...');
    console.log('=' .repeat(60));

    try {
      // Step 1: Stop existing containers
      await this.stopExistingContainers();

      // Step 2: Deploy all services
      await this.deployAllServices();

      // Step 3: Wait for services to be ready
      await this.waitForServicesReady();

      // Step 4: Perform comprehensive health checks
      await this.performHealthChecks();

      // Step 5: Show final summary
      await this.showFinalSummary();

    } catch (error) {
      console.error('❌ Auto deploy failed:', error.message);
      process.exit(1);
    }
  }

  async stopExistingContainers() {
    console.log('\n🛑 Stopping existing containers...');
    try {
      await execAsync(`docker compose -f ${this.composeFile} down`);
      console.log('  ✅ Existing containers stopped');
    } catch (error) {
      console.log('  ⚠️  No existing containers to stop');
    }
  }

  async deployAllServices() {
    console.log('\n🏗️  Deploying all services with Docker...');
    
    return new Promise((resolve, reject) => {
      const deployProcess = spawn('docker', ['compose', '-f', this.composeFile, 'up', '--build', '-d'], {
        stdio: 'inherit'
      });

      deployProcess.on('close', (code) => {
        if (code === 0) {
          console.log('  ✅ All services deployed successfully');
          resolve();
        } else {
          reject(new Error(`Deploy failed with code ${code}`));
        }
      });

      deployProcess.on('error', (error) => {
        reject(error);
      });
    });
  }

  async waitForServicesReady() {
    console.log('\n⏱️  Waiting for services to be ready...');
    
    // Wait for containers to start
    await this.sleep(10000);
    
    // Check container status
    const containers = await this.getContainerStatus();
    console.log(`  📊 Found ${containers.length} containers`);
    
    // Wait additional time for health checks
    console.log('  ⏳ Waiting for health checks...');
    await this.sleep(30000);
  }

  async getContainerStatus() {
    try {
      const { stdout } = await execAsync('docker ps --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"');
      const lines = stdout.trim().split('\n').slice(1); // Remove header
      return lines.filter(line => line.includes('factcheck-'));
    } catch (error) {
      return [];
    }
  }

  async performHealthChecks() {
    console.log('\n🔍 Performing comprehensive health checks...');
    
    const results = {
      infrastructure: [],
      services: [],
      client: null
    };

    // Check infrastructure
    console.log('\n📡 Infrastructure Health Checks:');
    for (const infra of this.infrastructure) {
      const status = await this.checkContainerHealth(infra.container);
      results.infrastructure.push({ ...infra, status });
      console.log(`  ${status.healthy ? '✅' : '❌'} ${infra.name}: ${status.message}`);
    }

    // Check services
    console.log('\n🔧 Services Health Checks:');
    for (const service of this.services) {
      if (service.isClient) continue;
      
      const status = await this.checkServiceHealth(service);
      results.services.push({ ...service, status });
      console.log(`  ${status.healthy ? '✅' : '❌'} ${service.name}: ${status.message}`);
    }

    // Check client
    console.log('\n🌐 Client Health Check:');
    const clientService = this.services.find(s => s.isClient);
    const clientStatus = await this.checkServiceHealth(clientService);
    results.client = { ...clientService, status: clientStatus };
    console.log(`  ${clientStatus.healthy ? '✅' : '❌'} ${clientService.name}: ${clientStatus.message}`);

    return results;
  }

  async checkContainerHealth(containerName) {
    try {
      const { stdout } = await execAsync(`docker inspect ${containerName} --format='{{.State.Health.Status}}'`);
      const healthStatus = stdout.trim();
      
      if (healthStatus === 'healthy') {
        return { healthy: true, message: 'Container healthy' };
      } else if (healthStatus === 'starting') {
        return { healthy: false, message: 'Container starting...' };
      } else {
        const { stdout: status } = await execAsync(`docker inspect ${containerName} --format='{{.State.Status}}'`);
        return { healthy: status.trim() === 'running', message: `Container ${status.trim()}` };
      }
    } catch (error) {
      return { healthy: false, message: 'Container not found' };
    }
  }

  async checkServiceHealth(service) {
    try {
      const response = await this.httpGet(`http://localhost:${service.port}${service.path}`);
      return { healthy: true, message: `HTTP ${response.statusCode} - Service responding` };
    } catch (error) {
      // Check if container is running
      const containerStatus = await this.checkContainerHealth(service.container);
      if (!containerStatus.healthy) {
        return { healthy: false, message: `Container issue: ${containerStatus.message}` };
      }
      return { healthy: false, message: `HTTP error: ${error.message}` };
    }
  }

  async httpGet(url) {
    return new Promise((resolve, reject) => {
      const req = http.get(url, (res) => {
        resolve({ statusCode: res.statusCode });
      });
      
      req.on('error', reject);
      req.setTimeout(5000, () => {
        req.destroy();
        reject(new Error('Timeout'));
      });
    });
  }

  async showFinalSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 FINAL DEPLOYMENT SUMMARY');
    console.log('='.repeat(60));

    // Show container status
    const containers = await this.getContainerStatus();
    console.log(`\n🐳 Docker Containers (${containers.length}):`);
    containers.forEach(container => {
      console.log(`  📦 ${container}`);
    });

    // Show access URLs
    console.log('\n🌐 Service Access URLs:');
    this.services.forEach(service => {
      const url = `http://localhost:${service.port}${service.isClient ? '' : service.path}`;
      console.log(`  🔗 ${service.name}: ${url}`);
    });

    console.log('\n🎯 Infrastructure URLs:');
    console.log('  🔗 Redis: localhost:6379');
    console.log('  🔗 RabbitMQ: localhost:5672');
    console.log('  🔗 RabbitMQ Management: http://localhost:15672');

    console.log('\n📋 Quick Commands:');
    console.log('  📊 View logs: npm run deploy:dev:logs');
    console.log('  🛑 Stop all: npm run deploy:dev:stop');
    console.log('  🔄 Restart: npm run deploy:dev');

    console.log('\n🎉 Auto deployment completed!');
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const checker = new AutoDeployChecker();
  checker.run().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

export default AutoDeployChecker;
