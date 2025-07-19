#!/usr/bin/env node
/**
 * Full Docker Deployment Script
 * Starts all services including frontend and monitoring via Docker Compose
 */

const { spawn, exec } = require('child_process');
const util = require('util');
const os = require('os');

const execAsync = util.promisify(exec);

class FullDockerStarter {
  constructor() {
    this.isWindows = os.platform() === 'win32';
    this.composeFile = 'docker-compose.dev.yml';
  }

  /**
   * Main start method
   */
  async start() {
    console.log('🐳 Starting FactCheck Platform with Full Docker Stack...\n');
    
    try {
      // Step 1: Check Docker
      await this.checkDocker();
      
      // Step 2: Stop existing containers
      await this.stopExistingContainers();
      
      // Step 3: Start all services with Docker Compose
      await this.startDockerServices();
      
      // Step 4: Wait for services to be ready
      await this.waitForServices();
      
      // Step 5: Show access points
      this.showAccessPoints();
      
      // Step 6: Setup graceful shutdown
      this.setupGracefulShutdown();
      
    } catch (error) {
      console.error('❌ Failed to start platform:', error.message);
      await this.cleanup();
      process.exit(1);
    }
  }

  /**
   * Check if Docker is available
   */
  async checkDocker() {
    console.log('🔍 Checking Docker...');
    
    try {
      await execAsync('docker --version', { timeout: 10000 });
      await execAsync('docker-compose --version', { timeout: 10000 });
      console.log('  ✅ Docker and Docker Compose are available');
    } catch (error) {
      throw new Error('Docker or Docker Compose is not installed or not running');
    }
  }

  /**
   * Stop existing containers
   */
  async stopExistingContainers() {
    console.log('🛑 Stopping existing containers...');
    
    try {
      await execAsync(`docker-compose -f ${this.composeFile} down`, { timeout: 30000 });
      console.log('  ✅ Existing containers stopped');
    } catch (error) {
      console.log('  ⚠️  No existing containers to stop');
    }
  }

  /**
   * Start Docker services
   */
  async startDockerServices() {
    console.log('🚀 Starting all services with Docker Compose...');
    console.log('  📦 This may take a few minutes for the first build...\n');
    
    try {
      const command = `docker-compose -f ${this.composeFile} up --build -d`;
      console.log(`  🔧 Running: ${command}`);
      
      const { stdout, stderr } = await execAsync(command, { timeout: 300000 }); // 5 minutes timeout
      
      if (stderr && !stderr.includes('warning') && !stderr.includes('WARNING')) {
        console.warn('  ⚠️  Docker warnings:', stderr);
      }
      
      console.log('  ✅ All Docker services started successfully');
      
    } catch (error) {
      throw new Error(`Failed to start Docker services: ${error.message}`);
    }
  }

  /**
   * Wait for services to be ready
   */
  async waitForServices() {
    console.log('⏳ Waiting for key services to be ready...');

    const keyServices = [
      { name: 'Redis', check: () => this.checkRedis() },
      { name: 'API Gateway', url: 'http://localhost:8080/health' }
    ];

    const maxWaitTime = 60000; // 1 minute total
    const checkInterval = 3000; // 3 seconds
    const startTime = Date.now();
    let lastReadyCount = -1;

    while (Date.now() - startTime < maxWaitTime) {
      let readyCount = 0;

      for (const service of keyServices) {
        try {
          if (service.url) {
            const response = await this.checkUrl(service.url);
            if (response) readyCount++;
          } else if (service.check) {
            const result = await service.check();
            if (result) readyCount++;
          }
        } catch (error) {
          // Service not ready yet
        }
      }

      // Show progress only when count changes
      if (readyCount !== lastReadyCount) {
        console.log(`  📊 ${readyCount}/${keyServices.length} key services ready`);
        lastReadyCount = readyCount;
      }

      if (readyCount === keyServices.length) {
        console.log('  ✅ Key services are ready!');
        console.log('  ⏳ Other services may still be starting in the background...');
        return;
      }

      process.stdout.write('.');
      await this.sleep(checkInterval);
    }

    console.log('\n  ⚠️  Timeout reached. Services may still be starting...');
  }

  /**
   * Check URL availability
   */
  async checkUrl(url) {
    try {
      const axios = require('axios');
      const response = await axios.get(url, { timeout: 3000 });
      return response.status === 200 || response.status === 503;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check Redis connectivity
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

  /**
   * Show access points
   */
  showAccessPoints() {
    console.log('\n🎉 FactCheck Platform started successfully!\n');
    
    console.log('📊 Access Points:');
    console.log('  🌐 Frontend:          http://localhost:3000');
    console.log('  🚪 API Gateway:       http://localhost:8080');
    console.log('  👤 Auth Service:      http://localhost:3001');
    console.log('  🔗 Link Service:      http://localhost:3002');
    console.log('  💬 Community Service: http://localhost:3003');
    console.log('  💭 Chat Service:      http://localhost:3004');
    console.log('  📰 News Service:      http://localhost:3005');
    console.log('  ⚙️  Admin Service:     http://localhost:3006');
    console.log('');
    console.log('📈 Monitoring:');
    console.log('  📊 Prometheus:        http://localhost:9090');
    console.log('  📈 Grafana:           http://localhost:3010 (admin/admin123)');
    console.log('');
    console.log('🔧 Infrastructure:');
    console.log('  🔴 Redis:             localhost:6379');
    console.log('');
    console.log('🛠️  Management Commands:');
    console.log('  📋 View all logs:     docker-compose -f docker-compose.dev.yml logs -f');
    console.log('  📋 View service logs: docker-compose -f docker-compose.dev.yml logs -f [service-name]');
    console.log('  🔄 Restart service:   docker-compose -f docker-compose.dev.yml restart [service-name]');
    console.log('  🛑 Stop all:          npm run stop');
    console.log('');
    console.log('✨ Platform is running. Press Ctrl+C to stop all services.');
  }

  /**
   * Setup graceful shutdown
   */
  setupGracefulShutdown() {
    const cleanup = async () => {
      console.log('\n🧹 Shutting down services...');
      await this.cleanup();
      process.exit(0);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);

    // Keep process alive but allow it to exit naturally
    console.log('\n💡 Press Ctrl+C to stop all services, or close this terminal.');
    console.log('💡 Services will continue running in Docker containers.');

    // Don't keep process alive indefinitely - let it exit after showing info
    setTimeout(() => {
      console.log('\n✨ Platform startup completed. Services are running in Docker.');
      console.log('💡 Use "npm stop" or "npm run docker:stop" to stop services.');
      process.exit(0);
    }, 5000);
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    try {
      console.log('  🛑 Stopping Docker containers...');
      await execAsync(`docker-compose -f ${this.composeFile} down`, { timeout: 30000 });
      console.log('  ✅ All services stopped');
    } catch (error) {
      console.log('  ⚠️  Error during cleanup:', error.message);
    }
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Start the platform
const starter = new FullDockerStarter();
starter.start().catch(console.error);
