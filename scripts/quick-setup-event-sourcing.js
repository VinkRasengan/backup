#!/usr/bin/env node
/**
 * Quick Event Sourcing Setup Script
 * Fast setup for Event Sourcing development
 */

const { spawn, exec } = require('child_process');
const util = require('util');
const os = require('os');
const fs = require('fs');

const execAsync = util.promisify(exec);

class QuickEventSourcingSetup {
  constructor() {
    this.steps = [
      { name: 'Environment Check', fn: () => this.checkEnvironment() },
      { name: 'Install Dependencies', fn: () => this.installDependencies() },
      { name: 'Start Infrastructure', fn: () => this.startInfrastructure() },
      { name: 'Wait for Infrastructure', fn: () => this.waitForInfrastructure() },
      { name: 'Start Core Services', fn: () => this.startCoreServices() },
      { name: 'Verify Setup', fn: () => this.verifySetup() }
    ];
    
    this.currentStep = 0;
  }

  /**
   * Run complete setup
   */
  async setup() {
    console.log('🚀 Quick Event Sourcing Setup Starting...\n');
    console.log('This will set up the complete Event Sourcing environment:\n');
    console.log('  📦 Install Event Sourcing dependencies');
    console.log('  🏗️  Start Redis and KurrentDB');
    console.log('  🚀 Start Community Service with Event Sourcing');
    console.log('  🔍 Verify everything is working\n');

    try {
      for (const step of this.steps) {
        await this.runStep(step);
      }

      console.log('\n🎉 Event Sourcing Setup Complete!');
      this.printSuccessInfo();
      
    } catch (error) {
      console.error(`\n❌ Setup failed at step "${this.steps[this.currentStep].name}":`, error.message);
      console.log('\n💡 Troubleshooting:');
      console.log('  - Make sure Docker Desktop is running');
      console.log('  - Check if ports 6379, 2113, 3003 are available');
      console.log('  - Run "npm run health:event-sourcing" to check status');
      process.exit(1);
    }
  }

  /**
   * Run individual setup step
   */
  async runStep(step) {
    console.log(`📋 Step ${this.currentStep + 1}/${this.steps.length}: ${step.name}...`);
    
    try {
      await step.fn();
      console.log(`  ✅ ${step.name} completed\n`);
    } catch (error) {
      console.error(`  ❌ ${step.name} failed:`, error.message);
      throw error;
    }
    
    this.currentStep++;
  }

  /**
   * Check environment prerequisites
   */
  async checkEnvironment() {
    console.log('  🔍 Checking prerequisites...');
    
    // Check Node.js
    try {
      const { stdout } = await execAsync('node --version');
      console.log(`    ✅ Node.js: ${stdout.trim()}`);
    } catch (error) {
      throw new Error('Node.js not found. Please install Node.js');
    }

    // Check npm
    try {
      const { stdout } = await execAsync('npm --version');
      console.log(`    ✅ npm: ${stdout.trim()}`);
    } catch (error) {
      throw new Error('npm not found. Please install npm');
    }

    // Check Docker
    try {
      const { stdout } = await execAsync('docker --version');
      console.log(`    ✅ Docker: ${stdout.trim()}`);
    } catch (error) {
      throw new Error('Docker not found. Please install Docker Desktop');
    }

    // Check Docker Compose
    try {
      const { stdout } = await execAsync('docker-compose --version');
      console.log(`    ✅ Docker Compose: ${stdout.trim()}`);
    } catch (error) {
      console.log('    ⚠️  Docker Compose not found, trying docker compose...');
      try {
        const { stdout } = await execAsync('docker compose version');
        console.log(`    ✅ Docker Compose: ${stdout.trim()}`);
      } catch (error2) {
        throw new Error('Docker Compose not found. Please install Docker Compose');
      }
    }

    // Check .env file
    if (!fs.existsSync('.env')) {
      throw new Error('.env file not found. Please create .env file from .env.example');
    }
    console.log('    ✅ .env file exists');

    // Check docker-compose.yml
    if (!fs.existsSync('docker-compose.yml')) {
      throw new Error('docker-compose.yml not found');
    }
    console.log('    ✅ docker-compose.yml exists');
  }

  /**
   * Install Event Sourcing dependencies
   */
  async installDependencies() {
    console.log('  📦 Installing Event Sourcing dependencies...');
    
    // Install root dependencies
    try {
      await execAsync('npm install', { timeout: 120000 });
      console.log('    ✅ Root dependencies installed');
    } catch (error) {
      throw new Error(`Failed to install root dependencies: ${error.message}`);
    }

    // Install Community Service dependencies (main Event Sourcing service)
    try {
      await execAsync('cd services/community-service && npm install', { timeout: 120000 });
      console.log('    ✅ Community Service dependencies installed');
    } catch (error) {
      throw new Error(`Failed to install Community Service dependencies: ${error.message}`);
    }

    // Install Event Sourcing specific packages
    try {
      await execAsync('cd services/community-service && npm install @eventstore/db-client uuid lodash', { timeout: 60000 });
      console.log('    ✅ Event Sourcing packages installed');
    } catch (error) {
      console.log('    ⚠️  Event Sourcing packages may already be installed');
    }
  }

  /**
   * Start infrastructure
   */
  async startInfrastructure() {
    console.log('  🏗️  Starting Event Sourcing infrastructure...');
    
    try {
      const { stdout, stderr } = await execAsync('docker-compose up -d redis kurrentdb', { timeout: 120000 });
      
      if (stderr && !stderr.includes('warning')) {
        console.log('    ⚠️  Docker warnings:', stderr);
      }
      
      console.log('    ✅ Redis and KurrentDB containers started');
      
    } catch (error) {
      throw new Error(`Failed to start infrastructure: ${error.message}`);
    }
  }

  /**
   * Wait for infrastructure to be ready
   */
  async waitForInfrastructure() {
    console.log('  ⏳ Waiting for infrastructure to be ready...');
    
    const maxWaitTime = 60000; // 1 minute
    const checkInterval = 3000; // 3 seconds
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      let redisReady = false;
      let kurrentReady = false;
      
      // Check Redis
      try {
        const { stdout } = await execAsync('redis-cli -h localhost -p 6379 -a antifraud123 ping', { timeout: 5000 });
        redisReady = stdout.trim() === 'PONG';
      } catch (error) {
        // Redis not ready
      }
      
      // Check KurrentDB
      try {
        const axios = require('axios');
        const response = await axios.get('http://localhost:2113/info', { timeout: 5000 });
        kurrentReady = response.status === 200;
      } catch (error) {
        // KurrentDB not ready
      }
      
      if (redisReady && kurrentReady) {
        console.log('    ✅ Redis: Ready');
        console.log('    ✅ KurrentDB: Ready');
        return;
      }
      
      process.stdout.write('.');
      await this.sleep(checkInterval);
    }
    
    throw new Error('Infrastructure failed to become ready within timeout');
  }

  /**
   * Start core services
   */
  async startCoreServices() {
    console.log('  🚀 Starting Community Service with Event Sourcing...');
    
    // Kill any existing process on port 3003
    try {
      const { stdout } = await execAsync('netstat -ano | findstr :3003', { timeout: 5000 });
      if (stdout.trim()) {
        const lines = stdout.trim().split('\n');
        for (const line of lines) {
          const parts = line.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          if (pid && !isNaN(pid)) {
            await execAsync(`taskkill /PID ${pid} /F`);
            console.log('    🔄 Killed existing process on port 3003');
          }
        }
      }
    } catch (error) {
      // No existing process
    }

    // Start Community Service
    return new Promise((resolve, reject) => {
      const process = spawn('npm', ['run', 'start:community'], {
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: true,
        detached: false
      });

      let serviceStarted = false;
      const timeout = setTimeout(() => {
        if (!serviceStarted) {
          reject(new Error('Community Service failed to start within timeout'));
        }
      }, 45000);

      process.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('started on port') || output.includes('🚀')) {
          if (!serviceStarted) {
            console.log('    ✅ Community Service started on port 3003');
            serviceStarted = true;
            clearTimeout(timeout);
            resolve();
          }
        }
      });

      process.stderr.on('data', (data) => {
        const error = data.toString();
        if (!error.includes('warning') && !error.includes('deprecated')) {
          console.error('    ⚠️  Community Service:', error.trim());
        }
      });

      process.on('exit', (code) => {
        if (code !== 0 && !serviceStarted) {
          reject(new Error(`Community Service exited with code ${code}`));
        }
      });
    });
  }

  /**
   * Verify setup
   */
  async verifySetup() {
    console.log('  🔍 Verifying Event Sourcing setup...');
    
    // Wait a bit for service to fully initialize
    await this.sleep(5000);
    
    try {
      const axios = require('axios');
      
      // Check basic health
      const healthResponse = await axios.get('http://localhost:3003/health', { timeout: 10000 });
      console.log('    ✅ Community Service: Basic health OK');
      
      // Check Event Sourcing health
      try {
        const esHealthResponse = await axios.get('http://localhost:3003/health/event-sourcing', { timeout: 10000 });
        console.log('    ✅ Event Sourcing: Health check OK');
        
        const status = esHealthResponse.data.status;
        if (status === 'healthy') {
          console.log('    🎉 Event Sourcing: Fully operational!');
        } else {
          console.log(`    ⚠️  Event Sourcing: Status is ${status}`);
        }
      } catch (error) {
        console.log('    ⚠️  Event Sourcing health check failed, but service is running');
      }
      
      // Check CQRS stats
      try {
        const cqrsResponse = await axios.get('http://localhost:3003/stats/cqrs', { timeout: 5000 });
        const stats = cqrsResponse.data.data;
        console.log(`    ✅ CQRS: ${stats.enabled ? 'Enabled' : 'Disabled'} (${stats.commandHandlers} commands, ${stats.queryHandlers} queries)`);
      } catch (error) {
        console.log('    ⚠️  CQRS stats not available');
      }
      
    } catch (error) {
      throw new Error(`Service verification failed: ${error.message}`);
    }
  }

  /**
   * Print success information
   */
  printSuccessInfo() {
    console.log('\n📊 Event Sourcing Environment Ready!');
    console.log('\n🔗 Access Points:');
    console.log('  - Community Service: http://localhost:3003');
    console.log('  - Event Sourcing Health: http://localhost:3003/health/event-sourcing');
    console.log('  - CQRS Statistics: http://localhost:3003/stats/cqrs');
    console.log('  - Redis: localhost:6379');
    console.log('  - KurrentDB: http://localhost:2113');
    
    console.log('\n🚀 Next Steps:');
    console.log('  1. Run "npm run test:event-sourcing" to test the setup');
    console.log('  2. Run "npm run health:event-sourcing" to check status');
    console.log('  3. Run "npm start" to start all services');
    console.log('  4. Visit http://localhost:3003/health/event-sourcing for detailed status');
    
    console.log('\n💡 Useful Commands:');
    console.log('  - npm run infrastructure:start    # Start Redis + KurrentDB');
    console.log('  - npm run infrastructure:stop     # Stop infrastructure');
    console.log('  - npm run event-sourcing:health   # Check Event Sourcing health');
    console.log('  - npm run start:community         # Start Community Service only');
    
    console.log('\n✨ Event Sourcing is now ready for development!');
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run if called directly
if (require.main === module) {
  const setup = new QuickEventSourcingSetup();
  setup.setup().catch(error => {
    console.error('💥 Quick setup failed:', error.message);
    process.exit(1);
  });
}

module.exports = QuickEventSourcingSetup;
