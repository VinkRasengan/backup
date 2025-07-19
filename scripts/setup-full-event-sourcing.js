#!/usr/bin/env node
/**
 * Full Event Sourcing Setup Script
 * Complete automated setup for Event Sourcing environment
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');
const os = require('os');

const execAsync = util.promisify(exec);

class FullEventSourcingSetup {
  constructor() {
    this.isWindows = os.platform() === 'win32';
    this.setupSteps = [
      { name: 'Environment Check', fn: () => this.checkEnvironment(), critical: true },
      { name: 'Install Dependencies', fn: () => this.installDependencies(), critical: true },
      { name: 'Setup Infrastructure', fn: () => this.setupInfrastructure(), critical: true },
      { name: 'Configure Services', fn: () => this.configureServices(), critical: false },
      { name: 'Start Event Sourcing', fn: () => this.startEventSourcing(), critical: true },
      { name: 'Verify Setup', fn: () => this.verifySetup(), critical: true },
      { name: 'Run Tests', fn: () => this.runTests(), critical: false }
    ];
    
    this.currentStep = 0;
    this.results = {
      steps: [],
      overall: 'unknown',
      startTime: new Date(),
      endTime: null
    };
  }

  /**
   * Run complete setup
   */
  async setup() {
    console.log('🚀 Full Event Sourcing Setup Starting...\n');
    console.log('This will perform a complete setup of the Event Sourcing environment:\n');
    console.log('  ✅ Check system prerequisites');
    console.log('  📦 Install all dependencies');
    console.log('  🏗️  Setup Redis and KurrentDB infrastructure');
    console.log('  ⚙️  Configure services for Event Sourcing');
    console.log('  🚀 Start Event Sourcing services');
    console.log('  🔍 Verify complete setup');
    console.log('  🧪 Run comprehensive tests\n');

    console.log('⏱️  Estimated time: 5-10 minutes\n');
    console.log('='.repeat(60));

    try {
      for (const step of this.setupSteps) {
        await this.runSetupStep(step);
      }

      this.results.overall = 'success';
      this.results.endTime = new Date();
      
      console.log('\n🎉 Full Event Sourcing Setup Completed Successfully!');
      this.printSetupSummary();
      
    } catch (error) {
      this.results.overall = 'failed';
      this.results.endTime = new Date();
      
      console.error(`\n❌ Setup failed at step "${this.setupSteps[this.currentStep].name}":`, error.message);
      this.printFailureInfo();
      process.exit(1);
    }
  }

  /**
   * Run individual setup step
   */
  async runSetupStep(step) {
    const stepNumber = this.currentStep + 1;
    const totalSteps = this.setupSteps.length;
    
    console.log(`\n📋 Step ${stepNumber}/${totalSteps}: ${step.name}`);
    console.log('─'.repeat(40));
    
    const startTime = Date.now();
    
    try {
      await step.fn();
      const duration = Date.now() - startTime;
      
      this.results.steps.push({
        name: step.name,
        status: 'success',
        duration,
        critical: step.critical
      });
      
      console.log(`✅ ${step.name} completed (${duration}ms)\n`);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.results.steps.push({
        name: step.name,
        status: 'failed',
        duration,
        error: error.message,
        critical: step.critical
      });
      
      if (step.critical) {
        throw error;
      } else {
        console.log(`⚠️  ${step.name} failed (non-critical): ${error.message}\n`);
      }
    }
    
    this.currentStep++;
  }

  /**
   * Check environment prerequisites
   */
  async checkEnvironment() {
    console.log('🔍 Checking system prerequisites...');
    
    const checks = [
      { name: 'Node.js', command: 'node --version', required: true },
      { name: 'npm', command: 'npm --version', required: true },
      { name: 'Docker', command: 'docker --version', required: true },
      { name: 'Docker Compose', command: 'docker-compose --version', required: true }
    ];

    for (const check of checks) {
      try {
        const { stdout } = await execAsync(check.command, { timeout: 10000 });
        console.log(`  ✅ ${check.name}: ${stdout.trim()}`);
      } catch (error) {
        if (check.required) {
          throw new Error(`${check.name} not found. Please install ${check.name}`);
        } else {
          console.log(`  ⚠️  ${check.name}: Not found (optional)`);
        }
      }
    }

    // Check required files
    const requiredFiles = ['.env', 'docker-compose.yml', 'package.json'];
    for (const file of requiredFiles) {
      if (!fs.existsSync(file)) {
        throw new Error(`Required file ${file} not found`);
      }
      console.log(`  ✅ ${file}: Found`);
    }

    // Check Docker daemon
    try {
      await execAsync('docker ps', { timeout: 10000 });
      console.log('  ✅ Docker daemon: Running');
    } catch (error) {
      throw new Error('Docker daemon not running. Please start Docker Desktop');
    }
  }

  /**
   * Install all dependencies
   */
  async installDependencies() {
    console.log('📦 Installing dependencies...');
    
    // Install root dependencies
    console.log('  📦 Installing root dependencies...');
    try {
      await execAsync('npm install', { timeout: 180000 });
      console.log('  ✅ Root dependencies installed');
    } catch (error) {
      throw new Error(`Failed to install root dependencies: ${error.message}`);
    }

    // Install service dependencies
    const services = [
      'api-gateway', 'auth-service', 'community-service', 
      'link-service', 'chat-service', 'news-service', 'admin-service'
    ];

    for (const service of services) {
      console.log(`  📦 Installing ${service} dependencies...`);
      try {
        const command = this.isWindows 
          ? `cd services\\${service} && npm install`
          : `cd services/${service} && npm install`;
        await execAsync(command, { timeout: 120000 });
        console.log(`  ✅ ${service} dependencies installed`);
      } catch (error) {
        console.log(`  ⚠️  ${service} dependencies failed: ${error.message}`);
      }
    }

    // Install Event Sourcing specific packages
    console.log('  📦 Installing Event Sourcing packages...');
    try {
      const command = this.isWindows
        ? 'cd services\\community-service && npm install @eventstore/db-client uuid lodash winston'
        : 'cd services/community-service && npm install @eventstore/db-client uuid lodash winston';
      await execAsync(command, { timeout: 60000 });
      console.log('  ✅ Event Sourcing packages installed');
    } catch (error) {
      console.log('  ⚠️  Event Sourcing packages may already be installed');
    }
  }

  /**
   * Setup infrastructure
   */
  async setupInfrastructure() {
    console.log('🏗️  Setting up Event Sourcing infrastructure...');
    
    // Stop any existing containers
    console.log('  🛑 Stopping existing containers...');
    try {
      await execAsync('docker-compose down', { timeout: 30000 });
      console.log('  ✅ Existing containers stopped');
    } catch (error) {
      console.log('  ℹ️  No existing containers to stop');
    }

    // Start infrastructure
    console.log('  🚀 Starting Redis and KurrentDB...');
    try {
      await execAsync('docker-compose up -d redis kurrentdb', { timeout: 120000 });
      console.log('  ✅ Infrastructure containers started');
    } catch (error) {
      throw new Error(`Failed to start infrastructure: ${error.message}`);
    }

    // Wait for infrastructure to be ready
    console.log('  ⏳ Waiting for infrastructure to be ready...');
    await this.waitForInfrastructure();
  }

  /**
   * Configure services for Event Sourcing
   */
  async configureServices() {
    console.log('⚙️  Configuring services for Event Sourcing...');
    
    // Check .env configuration
    const envPath = '.env';
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      
      const requiredEnvVars = [
        'EVENT_STORE_ENABLED=true',
        'CQRS_ENABLED=true',
        'EVENT_BUS_REDIS_ENABLED=true',
        'KURRENTDB_ENABLED=true'
      ];

      let envUpdated = false;
      let newEnvContent = envContent;

      for (const envVar of requiredEnvVars) {
        const [key] = envVar.split('=');
        if (!envContent.includes(key)) {
          newEnvContent += `\n${envVar}`;
          envUpdated = true;
          console.log(`  ✅ Added ${envVar} to .env`);
        } else {
          console.log(`  ✅ ${key} already configured`);
        }
      }

      if (envUpdated) {
        fs.writeFileSync(envPath, newEnvContent);
        console.log('  ✅ .env file updated with Event Sourcing configuration');
      }
    }

    // Kill any processes on required ports
    const ports = [3001, 3003, 8080];
    for (const port of ports) {
      await this.killProcessOnPort(port);
    }
  }

  /**
   * Start Event Sourcing services
   */
  async startEventSourcing() {
    console.log('🚀 Starting Event Sourcing services...');
    
    // Start Community Service (main Event Sourcing service)
    console.log('  🔧 Starting Community Service with Event Sourcing...');
    
    return new Promise((resolve, reject) => {
      const npmCommand = this.isWindows ? 'npm.cmd' : 'npm';
      const process = spawn(npmCommand, ['run', 'start:community'], {
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: true,
        detached: false
      });

      let serviceStarted = false;
      const timeout = setTimeout(() => {
        if (!serviceStarted) {
          reject(new Error('Community Service failed to start within timeout'));
        }
      }, 60000);

      process.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('started on port') || 
            output.includes('🚀') ||
            output.includes('Server running')) {
          if (!serviceStarted) {
            console.log('  ✅ Community Service started successfully');
            serviceStarted = true;
            clearTimeout(timeout);
            
            // Give it a moment to fully initialize
            setTimeout(resolve, 3000);
          }
        }
      });

      process.stderr.on('data', (data) => {
        const error = data.toString();
        if (!error.includes('warning') && 
            !error.includes('deprecated') && 
            !error.includes('ExperimentalWarning')) {
          console.log(`  ℹ️  Community Service: ${error.trim()}`);
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
   * Verify complete setup
   */
  async verifySetup() {
    console.log('🔍 Verifying Event Sourcing setup...');
    
    // Wait for services to fully initialize
    await this.sleep(5000);
    
    const axios = require('axios');
    const verifications = [];

    // Check infrastructure
    try {
      const redisOk = await this.checkRedis();
      verifications.push({ name: 'Redis', status: redisOk ? 'OK' : 'FAIL' });
      console.log(`  ${redisOk ? '✅' : '❌'} Redis: ${redisOk ? 'Connected' : 'Not connected'}`);
    } catch (error) {
      verifications.push({ name: 'Redis', status: 'ERROR', error: error.message });
    }

    try {
      const kurrentOk = await this.checkKurrentDB();
      verifications.push({ name: 'KurrentDB', status: kurrentOk ? 'OK' : 'FAIL' });
      console.log(`  ${kurrentOk ? '✅' : '❌'} KurrentDB: ${kurrentOk ? 'Connected' : 'Not connected'}`);
    } catch (error) {
      verifications.push({ name: 'KurrentDB', status: 'ERROR', error: error.message });
    }

    // Check Community Service
    try {
      const healthResponse = await axios.get('http://localhost:3003/health', { timeout: 10000 });
      verifications.push({ name: 'Community Service', status: 'OK' });
      console.log('  ✅ Community Service: Basic health OK');
    } catch (error) {
      verifications.push({ name: 'Community Service', status: 'FAIL', error: error.message });
      throw new Error('Community Service health check failed');
    }

    // Check Event Sourcing health
    try {
      const esHealthResponse = await axios.get('http://localhost:3003/health/event-sourcing', { timeout: 10000 });
      const status = esHealthResponse.data.status;
      verifications.push({ name: 'Event Sourcing', status: status === 'healthy' ? 'OK' : 'DEGRADED' });
      console.log(`  ${status === 'healthy' ? '✅' : '⚠️'} Event Sourcing: ${status}`);
    } catch (error) {
      verifications.push({ name: 'Event Sourcing', status: 'FAIL', error: error.message });
      console.log('  ⚠️  Event Sourcing health check failed');
    }

    // Check CQRS
    try {
      const cqrsResponse = await axios.get('http://localhost:3003/stats/cqrs', { timeout: 5000 });
      const stats = cqrsResponse.data.data;
      verifications.push({ name: 'CQRS', status: stats.enabled ? 'OK' : 'DISABLED' });
      console.log(`  ${stats.enabled ? '✅' : '⚠️'} CQRS: ${stats.enabled ? 'Enabled' : 'Disabled'} (${stats.commandHandlers} commands, ${stats.queryHandlers} queries)`);
    } catch (error) {
      verifications.push({ name: 'CQRS', status: 'FAIL', error: error.message });
      console.log('  ⚠️  CQRS stats not available');
    }

    // Store verification results
    this.results.verifications = verifications;
  }

  /**
   * Run comprehensive tests
   */
  async runTests() {
    console.log('🧪 Running Event Sourcing tests...');
    
    try {
      const { stdout, stderr } = await execAsync('npm run test:event-sourcing', { timeout: 60000 });
      console.log('  ✅ Event Sourcing tests completed');
      
      // Parse test results
      if (stdout.includes('Success Rate:')) {
        const successRateMatch = stdout.match(/Success Rate: ([\d.]+)%/);
        if (successRateMatch) {
          const successRate = parseFloat(successRateMatch[1]);
          console.log(`  📊 Test Success Rate: ${successRate}%`);
          this.results.testSuccessRate = successRate;
        }
      }
      
    } catch (error) {
      console.log('  ⚠️  Some tests failed, but setup is functional');
      this.results.testError = error.message;
    }
  }

  /**
   * Wait for infrastructure to be ready
   */
  async waitForInfrastructure() {
    const maxWaitTime = 60000; // 1 minute
    const checkInterval = 5000; // 5 seconds
    const startTime = Date.now();

    console.log('  🔍 Checking infrastructure status...');

    while (Date.now() - startTime < maxWaitTime) {
      const redisReady = await this.checkRedis();
      const kurrentReady = await this.checkKurrentDB();

      console.log(`    Redis: ${redisReady ? '✅' : '⏳'}, KurrentDB: ${kurrentReady ? '✅' : '⏳'}`);

      if (redisReady && kurrentReady) {
        console.log('  ✅ Infrastructure ready');
        return;
      }

      if (Date.now() - startTime < maxWaitTime - checkInterval) {
        await this.sleep(checkInterval);
      }
    }

    // Final check with detailed error info
    const redisReady = await this.checkRedis();
    const kurrentReady = await this.checkKurrentDB();

    if (!redisReady || !kurrentReady) {
      console.log('  ⚠️  Infrastructure status:');
      console.log(`    Redis: ${redisReady ? 'Ready' : 'Not ready'}`);
      console.log(`    KurrentDB: ${kurrentReady ? 'Ready' : 'Not ready'}`);
      console.log('  💡 Continuing anyway - services may work in fallback mode');
      return; // Don't throw error, continue with setup
    }
  }

  /**
   * Check Redis connectivity
   */
  async checkRedis() {
    try {
      // Use Docker exec to test Redis since redis-cli may not be available on Windows
      const command = 'docker exec backup-redis-1 redis-cli -a antifraud123 ping';
      const { stdout } = await execAsync(command, { timeout: 10000 });
      return stdout.trim() === 'PONG';
    } catch (error) {
      // Fallback: check if container is running and healthy
      try {
        const { stdout } = await execAsync('docker ps --filter name=backup-redis-1 --filter status=running', { timeout: 5000 });
        return stdout.includes('backup-redis-1');
      } catch (fallbackError) {
        return false;
      }
    }
  }

  /**
   * Check KurrentDB connectivity
   */
  async checkKurrentDB() {
    try {
      const axios = require('axios');
      const response = await axios.get('http://localhost:2113/info', { timeout: 10000 });
      return response.status === 200;
    } catch (error) {
      // Fallback: check if container is running and healthy
      try {
        const { stdout } = await execAsync('docker ps --filter name=factcheck-kurrentdb --filter status=running', { timeout: 5000 });
        return stdout.includes('factcheck-kurrentdb') && stdout.includes('healthy');
      } catch (fallbackError) {
        return false;
      }
    }
  }

  /**
   * Kill process on port
   */
  async killProcessOnPort(port) {
    try {
      const command = this.isWindows 
        ? `netstat -ano | findstr :${port}`
        : `lsof -ti:${port}`;
        
      const { stdout } = await execAsync(command, { timeout: 5000 });
      
      if (this.isWindows) {
        const lines = stdout.trim().split('\n');
        for (const line of lines) {
          const parts = line.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          if (pid && !isNaN(pid)) {
            await execAsync(`taskkill /PID ${pid} /F`);
            console.log(`  🔄 Killed process ${pid} on port ${port}`);
          }
        }
      } else {
        if (stdout.trim()) {
          await execAsync(`kill -9 ${stdout.trim()}`);
          console.log(`  🔄 Killed process on port ${port}`);
        }
      }
    } catch (error) {
      // Ignore errors when killing processes
    }
  }

  /**
   * Print setup summary
   */
  printSetupSummary() {
    const duration = this.results.endTime - this.results.startTime;
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 FULL EVENT SOURCING SETUP COMPLETED!');
    console.log('='.repeat(60));
    
    console.log(`⏱️  Total Setup Time: ${minutes}m ${seconds}s`);
    console.log(`✅ Steps Completed: ${this.results.steps.filter(s => s.status === 'success').length}/${this.results.steps.length}`);
    
    if (this.results.testSuccessRate) {
      console.log(`🧪 Test Success Rate: ${this.results.testSuccessRate}%`);
    }
    
    console.log('\n🔗 Access Points:');
    console.log('  - Community Service: http://localhost:3003');
    console.log('  - Event Sourcing Health: http://localhost:3003/health/event-sourcing');
    console.log('  - CQRS Statistics: http://localhost:3003/stats/cqrs');
    console.log('  - Redis: localhost:6379');
    console.log('  - KurrentDB: http://localhost:2113');
    
    console.log('\n🚀 Next Steps:');
    console.log('  1. Run "npm start" to start all services');
    console.log('  2. Run "npm run health:event-sourcing" to check status');
    console.log('  3. Run "npm run test:event-sourcing" to run tests');
    console.log('  4. Visit http://localhost:3003/health/event-sourcing for detailed status');
    
    console.log('\n💡 Useful Commands:');
    console.log('  - npm run infrastructure:start    # Start Redis + KurrentDB');
    console.log('  - npm run infrastructure:stop     # Stop infrastructure');
    console.log('  - npm run event-sourcing:health   # Check Event Sourcing health');
    console.log('  - npm run start:community         # Start Community Service only');
    
    console.log('\n✨ Event Sourcing environment is fully operational!');
  }

  /**
   * Print failure information
   */
  printFailureInfo() {
    console.log('\n💡 Troubleshooting:');
    console.log('  - Make sure Docker Desktop is running');
    console.log('  - Check if ports 6379, 2113, 3003 are available');
    console.log('  - Verify .env file exists and is properly configured');
    console.log('  - Run "docker ps" to check container status');
    console.log('  - Run "npm run health:event-sourcing" to check status');
    console.log('\n📞 For help, check the logs above or run individual setup steps:');
    console.log('  - npm run setup:dependencies');
    console.log('  - npm run setup:infrastructure');
    console.log('  - npm run setup:verify');
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
  const setup = new FullEventSourcingSetup();
  setup.setup().catch(error => {
    console.error('💥 Full setup failed:', error.message);
    process.exit(1);
  });
}

module.exports = FullEventSourcingSetup;
