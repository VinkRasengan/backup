#!/usr/bin/env node

/**
 * Infrastructure Fallback Starter
 * Starts Redis and RabbitMQ using alternative methods when Docker is not available
 */

import { exec  } from 'child_process';
const util = require('util');
import fs from 'fs';
import path from 'path';

const execAsync = util.promisify(exec);

class InfrastructureFallback {
  constructor() {
    this.services = {
      redis: { port: 6379, status: 'stopped' },
      rabbitmq: { port: 5672, managementPort: 15672, status: 'stopped' }
    };
  }

  async start() {
    console.log('🏗️  Starting infrastructure services (fallback mode)...');
    
    // Check if Docker is available
    const dockerAvailable = await this.checkDocker();
    
    if (dockerAvailable) {
      console.log('  🐳 Docker available, using Docker containers...');
      return await this.startWithDocker();
    } else {
      console.log('  ⚠️  Docker not available, using standalone mode...');
      return await this.startStandalone();
    }
  }

  async checkDocker() {
    try {
      await execAsync('docker --version');
      await execAsync('docker info');
      return true;
    } catch (error) {
      return false;
    }
  }

  async startWithDocker() {
    try {
      // Start Redis
      console.log('    🚀 Starting Redis container...');
      try {
        await execAsync('docker stop factcheck-redis 2>nul || echo "Redis not running"');
        await execAsync('docker rm factcheck-redis 2>nul || echo "Redis container not found"');
      } catch (e) {
        // Ignore cleanup errors
      }

      await execAsync(`docker run -d --name factcheck-redis -p 6379:6379 redis:7-alpine redis-server --requirepass antifraud123`);
      console.log('    ✅ Redis container started');
      this.services.redis.status = 'running';

      // Start RabbitMQ
      console.log('    🚀 Starting RabbitMQ container...');
      try {
        await execAsync('docker stop factcheck-rabbitmq 2>nul || echo "RabbitMQ not running"');
        await execAsync('docker rm factcheck-rabbitmq 2>nul || echo "RabbitMQ container not found"');
      } catch (e) {
        // Ignore cleanup errors
      }

      await execAsync(`docker run -d --name factcheck-rabbitmq -p 5672:5672 -p 15672:15672 -e RABBITMQ_DEFAULT_USER=factcheck -e RABBITMQ_DEFAULT_PASS=secure_password rabbitmq:3-management-alpine`);
      console.log('    ✅ RabbitMQ container started');
      this.services.rabbitmq.status = 'running';

      // Wait for services to be ready
      await this.waitForServices();
      
      return true;
    } catch (error) {
      console.log('    ❌ Docker start failed:', error.message);
      return await this.startStandalone();
    }
  }

  async startStandalone() {
    console.log('    📝 Creating standalone configuration...');
    
    // Create environment file for standalone mode
    const envConfig = `
# Infrastructure Fallback Configuration
STANDALONE_MODE=true
REDIS_ENABLED=false
RABBITMQ_ENABLED=false
EVENT_BUS_MEMORY_ONLY=true

# Event Bus will run in memory-only mode
EVENT_BUS_SERVICE_URL=http://localhost:3009
ENABLE_EVENT_DRIVEN=true
`;

    fs.writeFileSync('.env.infrastructure', envConfig);
    console.log('    ✅ Standalone configuration created');
    
    this.services.redis.status = 'standalone';
    this.services.rabbitmq.status = 'standalone';
    
    return true;
  }

  async waitForServices() {
    if (this.services.redis.status === 'running') {
      console.log('    ⏱️  Waiting for Redis...');
      await this.waitForRedis();
      console.log('    ✅ Redis ready');
    }

    if (this.services.rabbitmq.status === 'running') {
      console.log('    ⏱️  Waiting for RabbitMQ...');
      await this.waitForRabbitMQ();
      console.log('    ✅ RabbitMQ ready');
    }
  }

  async waitForRedis(timeout = 30000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        await execAsync('docker exec factcheck-redis redis-cli --no-auth-warning -a antifraud123 ping');
        return true;
      } catch (error) {
        await this.sleep(2000);
      }
    }
    
    throw new Error('Redis not ready after timeout');
  }

  async waitForRabbitMQ(timeout = 60000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        await execAsync('docker exec factcheck-rabbitmq rabbitmq-diagnostics ping');
        return true;
      } catch (error) {
        await this.sleep(3000);
      }
    }
    
    throw new Error('RabbitMQ not ready after timeout');
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async stop() {
    console.log('🛑 Stopping infrastructure services...');
    
    if (this.services.redis.status === 'running') {
      try {
        await execAsync('docker stop factcheck-redis');
        await execAsync('docker rm factcheck-redis');
        console.log('  ✅ Redis container stopped');
      } catch (error) {
        console.log('  ⚠️  Redis stop failed:', error.message);
      }
    }

    if (this.services.rabbitmq.status === 'running') {
      try {
        await execAsync('docker stop factcheck-rabbitmq');
        await execAsync('docker rm factcheck-rabbitmq');
        console.log('  ✅ RabbitMQ container stopped');
      } catch (error) {
        console.log('  ⚠️  RabbitMQ stop failed:', error.message);
      }
    }

    // Clean up standalone config
    try {
      fs.unlinkSync('.env.infrastructure');
      console.log('  ✅ Standalone configuration cleaned up');
    } catch (error) {
      // File might not exist
    }
  }

  getStatus() {
    return {
      redis: this.services.redis,
      rabbitmq: this.services.rabbitmq,
      mode: this.services.redis.status === 'running' ? 'docker' : 'standalone'
    };
  }
}

// CLI usage
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const infrastructure = new InfrastructureFallback();
  
  const command = process.argv[2] || 'start';
  
  if (command === 'start') {
    infrastructure.start()
      .then(() => {
        const status = infrastructure.getStatus();
        console.log('\n🎉 Infrastructure services ready!');
        console.log('📊 Status:', JSON.stringify(status, null, 2));
      })
      .catch(error => {
        console.error('❌ Infrastructure start failed:', error.message);
        process.exit(1);
      });
  } else if (command === 'stop') {
    infrastructure.stop()
      .then(() => {
        console.log('✅ Infrastructure services stopped');
      })
      .catch(error => {
        console.error('❌ Infrastructure stop failed:', error.message);
        process.exit(1);
      });
  } else {
    console.log('Usage: node start-infrastructure-fallback.js [start|stop]');
  }
}

export default InfrastructureFallback;
