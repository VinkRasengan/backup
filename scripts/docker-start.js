#!/usr/bin/env node
/**
 * Simple Docker Start Script
 * Starts all services with Docker Compose for development
 */

const { exec } = require('child_process');
const util = require('util');
const path = require('path');

const execAsync = util.promisify(exec);

class DockerStarter {
  constructor() {
    this.rootDir = path.resolve(__dirname, '..');
    this.composeFile = 'docker-compose.dev.yml';
  }

  /**
   * Main start method
   */
  async start() {
    console.log('🐳 Starting FactCheck Platform with Docker...\n');
    
    try {
      // Step 1: Check Docker
      await this.checkDocker();
      
      // Step 2: Check environment
      await this.checkEnvironment();

      // Step 3: Copy environment to services
      await this.copyEnvironmentToServices();

      // Step 4: Start services
      await this.startServices();
      
      // Step 5: Wait for services to be ready
      await this.waitForServices();

      // Step 6: Show access information
      this.showAccessInfo();

      // Step 7: Setup graceful shutdown
      this.setupGracefulShutdown();
      
    } catch (error) {
      console.error('❌ Failed to start:', error.message);
      console.log('\n🔧 Troubleshooting:');
      console.log('• Make sure Docker is running');
      console.log('• Try: npm run setup:full');
      console.log('• Check: npm run health');
      process.exit(1);
    }
  }

  /**
   * Check Docker availability
   */
  async checkDocker() {
    console.log('1. 🔍 Checking Docker...');
    
    try {
      await execAsync('docker info', { timeout: 10000 });
      console.log('  ✅ Docker is running');
    } catch (error) {
      throw new Error('Docker is not running. Please start Docker Desktop.');
    }
  }

  /**
   * Check environment setup
   */
  async checkEnvironment() {
    console.log('2. 🔧 Checking environment...');
    
    const fs = require('fs');
    const envPath = path.join(this.rootDir, '.env');
    
    if (!fs.existsSync(envPath)) {
      throw new Error('.env file not found. Please run: npm run setup:full');
    }
    
    console.log('  ✅ Environment file exists');
  }

  /**
   * Copy environment file to all services and client
   */
  async copyEnvironmentToServices() {
    console.log('3. 📋 Copying environment to services...');

    const fs = require('fs');
    const envPath = path.join(this.rootDir, '.env');

    if (!fs.existsSync(envPath)) {
      console.log('  ⚠️  .env file not found, skipping copy');
      return;
    }

    // Get all service directories
    const servicesDir = path.join(this.rootDir, 'services');
    const clientDir = path.join(this.rootDir, 'client');

    let copiedCount = 0;

    // Copy to services
    if (fs.existsSync(servicesDir)) {
      const services = fs.readdirSync(servicesDir).filter(item => {
        const servicePath = path.join(servicesDir, item);
        return fs.statSync(servicePath).isDirectory() &&
               fs.existsSync(path.join(servicePath, 'package.json'));
      });

      for (const service of services) {
        const serviceEnvPath = path.join(servicesDir, service, '.env');
        try {
          fs.copyFileSync(envPath, serviceEnvPath);
          copiedCount++;
        } catch (error) {
          // Ignore copy errors during start
        }
      }
    }

    // Copy to client
    if (fs.existsSync(clientDir)) {
      const clientEnvPath = path.join(clientDir, '.env');
      try {
        fs.copyFileSync(envPath, clientEnvPath);
        copiedCount++;
      } catch (error) {
        // Ignore copy errors during start
      }
    }

    console.log(`  ✅ Environment copied to ${copiedCount} locations`);
  }

  /**
   * Start Docker services
   */
  async startServices() {
    console.log('4. 🚀 Starting all services...');
    console.log('  ⏱️  This may take a moment...\n');
    
    try {
      // Stop any existing containers first
      console.log('  🛑 Stopping existing containers...');
      await execAsync(`docker-compose -f ${this.composeFile} down --remove-orphans`, { 
        cwd: this.rootDir,
        timeout: 60000 
      });
      
      // Start all services
      console.log('  🚀 Starting all services...');
      const command = `docker-compose -f ${this.composeFile} up -d`;
      
      // Show real-time output
      const child = exec(command, { cwd: this.rootDir, timeout: 300000 });
      
      child.stdout.on('data', (data) => {
        process.stdout.write(data);
      });
      
      child.stderr.on('data', (data) => {
        process.stderr.write(data);
      });
      
      await new Promise((resolve, reject) => {
        child.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Docker compose failed with code ${code}`));
          }
        });
        
        child.on('error', reject);
      });
      
      console.log('\n  ✅ All services started successfully!');
      
    } catch (error) {
      throw new Error(`Failed to start services: ${error.message}`);
    }
  }

  /**
   * Wait for services to be ready
   */
  async waitForServices() {
    console.log('5. ⏳ Waiting for services to be ready...');
    
    const services = [
      { name: 'Redis', url: 'http://localhost:6379', timeout: 30000 },
      { name: 'API Gateway', url: 'http://localhost:8080/health', timeout: 60000 },
      { name: 'Frontend', url: 'http://localhost:3000', timeout: 90000 }
    ];
    
    for (const service of services) {
      console.log(`  ⏳ Waiting for ${service.name}...`);
      await this.waitForService(service.name, service.url, service.timeout);
      console.log(`  ✅ ${service.name} is ready`);
    }
    
    console.log('  ✅ All services are ready!');
  }

  /**
   * Wait for a specific service
   */
  async waitForService(name, url, timeout = 60000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        if (name === 'Redis') {
          // Check Redis with docker command
          await execAsync('docker exec factcheck-redis redis-cli ping', { timeout: 5000 });
          return;
        } else {
          // Check HTTP services
          const axios = require('axios');
          await axios.get(url, { timeout: 5000 });
          return;
        }
      } catch (error) {
        // Service not ready yet, wait and retry
        await this.sleep(2000);
      }
    }
    
    console.log(`  ⚠️  ${name} may not be fully ready (timeout reached)`);
  }

  /**
   * Show access information
   */
  showAccessInfo() {
    console.log('\n🎉 FactCheck Platform is running!');
    console.log('\n🌐 Access Points:');
    console.log('  🖥️  Frontend:          http://localhost:3000');
    console.log('  🔌 API Gateway:       http://localhost:8080');
    console.log('  🔐 Auth Service:      http://localhost:3001');
    console.log('  🔗 Link Service:      http://localhost:3002');
    console.log('  👥 Community Service: http://localhost:3003');
    console.log('  💬 Chat Service:      http://localhost:3004');
    console.log('  📰 News Service:      http://localhost:3005');
    console.log('  ⚙️  Admin Service:     http://localhost:3006');
    console.log('  🔴 Redis:             localhost:6379');
    console.log('  📊 Prometheus:        http://localhost:9090');
    console.log('  📈 Grafana:           http://localhost:3010 (admin/admin123)');
    
    console.log('\n🛠️  Management Commands:');
    console.log('  📋 View logs:         npm run logs');
    console.log('  📊 Check status:      npm run status');
    console.log('  🔄 Restart:           npm restart');
    console.log('  🛑 Stop all:          npm stop');
    
    console.log('\n💡 Tips:');
    console.log('  • All data is persisted in Docker volumes');
    console.log('  • Edit .env file to change configuration');
    console.log('  • Use Ctrl+C to stop all services');
    
    console.log('\n✨ Happy coding! Press Ctrl+C to stop all services.');
  }

  /**
   * Setup graceful shutdown
   */
  setupGracefulShutdown() {
    const shutdown = async () => {
      console.log('\n\n🛑 Shutting down services...');
      
      try {
        await execAsync(`docker-compose -f ${this.composeFile} down`, { 
          cwd: this.rootDir,
          timeout: 60000 
        });
        console.log('✅ All services stopped successfully');
      } catch (error) {
        console.log('⚠️  Error during shutdown:', error.message);
      }
      
      process.exit(0);
    };
    
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Start if called directly
if (require.main === module) {
  const starter = new DockerStarter();
  starter.start().catch(console.error);
}

module.exports = DockerStarter;
