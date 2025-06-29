#!/usr/bin/env node

/**
 * Enhanced Simple Start Script - Cross-platform with Environment Validation
 */

const { spawn } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

class SimpleStart {
  constructor() {
    this.isWindows = os.platform() === 'win32';
    this.projectRoot = process.cwd();
    
    // Service start order matters - dependencies first
    this.services = [
      { name: 'auth-service', port: 3001, priority: 1 },
      { name: 'link-service', port: 3002, priority: 2 },
      { name: 'community-service', port: 3003, priority: 2 },
      { name: 'chat-service', port: 3004, priority: 2 },
      { name: 'news-service', port: 3005, priority: 2 },
      { name: 'admin-service', port: 3006, priority: 3 },
      { name: 'api-gateway', port: 8080, priority: 4 } // Start last - depends on others
    ];
    
    this.monitoringEnabled = process.env.ENABLE_MONITORING !== 'false';
  }

  async start() {
    console.log('🚀 Starting FactCheck Platform...');
    console.log('='.repeat(50));

    try {
      // Step 1: Validate environment
      console.log('1. 🔍 Validating environment...');
      await this.validateEnvironment();

      // Step 2: Quick cleanup
      console.log('2. 🧹 Quick cleanup...');
      await this.quickCleanup();

      // Step 3: Start monitoring stack (if enabled)
      if (this.monitoringEnabled) {
        console.log('3. 📊 Starting monitoring stack...');
        await this.startMonitoringStack();
      }

      // Step 4: Start services in order
      console.log('4. 📦 Starting services...');
      await this.startServices();

      // Step 5: Start client
      console.log('5. 🌐 Starting client...');
      await this.startClient();

      // Step 6: Show info
      console.log('6. ✅ Startup complete!');
      this.showInfo();

    } catch (error) {
      console.error('❌ Startup failed:', error.message);
      console.log('💡 Try: npm run env:setup && npm start');
      process.exit(1);
    }
  }

  async validateEnvironment() {
    // Check if .env exists
    const envPath = path.join(this.projectRoot, '.env');
    if (!fs.existsSync(envPath)) {
      console.log('  ⚠️ .env file not found');
      console.log('  🔧 Run: npm run env:setup to create .env file');
      throw new Error('.env file is required. Run "npm run env:setup" first.');
    }

    // Load environment variables
    require('dotenv').config({ path: envPath });

    // Check required variables
    const requiredVars = [
      'FIREBASE_PROJECT_ID',
      'FIREBASE_CLIENT_EMAIL',
      'FIREBASE_PRIVATE_KEY',
      'JWT_SECRET',
      'GEMINI_API_KEY'
    ];

    const missing = [];
    const placeholders = [];

    for (const varName of requiredVars) {
      const value = process.env[varName];
      if (!value) {
        missing.push(varName);
      } else if (value.includes('your_') || value.includes('YOUR_') || value.includes('xxxxx')) {
        placeholders.push(varName);
      }
    }

    if (missing.length > 0) {
      console.log('  ❌ Missing required environment variables:');
      missing.forEach(v => console.log(`     - ${v}`));
      throw new Error('Missing required environment variables. Edit your .env file.');
    }

    if (placeholders.length > 0) {
      console.log('  ⚠️ Environment variables with placeholder values:');
      placeholders.forEach(v => console.log(`     - ${v}`));
      throw new Error('Please update placeholder values in your .env file.');
    }

    console.log('  ✅ Environment validation passed');
  }

  async quickCleanup() {
    // Simple cleanup - just kill obvious processes
    try {
      const ports = [3000, 3001, 3002, 3003, 3004, 3005, 3006, 8080];
      for (const port of ports) {
        try {
          await this.killProcessOnPort(port);
        } catch {
          // Port not in use - good
        }
      }
    } catch {
      // Cleanup failed - continue anyway
    }
    console.log('  ✅ Cleanup done');
  }

  async killProcessOnPort(port) {
    if (this.isWindows) {
      const findCmd = `netstat -ano | findstr :${port} | findstr LISTENING`;
      try {
        const result = await this.runCommand(findCmd, { capture: true, silent: true });
        if (result?.trim()) {
          const lines = result.split('\n');
          for (const line of lines) {
            const parts = line.trim().split(/\s+/);
            const pid = parts[parts.length - 1];
            if (pid && pid !== '0') {
              await this.runCommand(`taskkill /F /PID ${pid}`, { silent: true });
            }
          }
        }
      } catch {
        // Silent fail
      }
    } else {
      // Unix/Linux/Mac
      try {
        await this.runCommand(`lsof -ti:${port} | xargs kill -9`, { silent: true });
      } catch {
        // Silent fail
      }
    }
  }

  async startMonitoringStack() {
    try {
      // Start simple HTML dashboard if available
      const dashboardPath = path.join(this.projectRoot, 'monitoring/simple-dashboard');
      
      if (fs.existsSync(dashboardPath)) {
        console.log('  📊 Starting simple monitoring dashboard...');
        const npmCmd = this.isWindows ? 'npm.cmd' : 'npm';
        
        const child = spawn(npmCmd, ['start'], {
          cwd: dashboardPath,
          detached: true,
          stdio: 'ignore',
          shell: true
        });

        child.unref();
        console.log('  🌐 Monitoring dashboard starting on port 3010...');
      }
      
      console.log('  ✅ Monitoring stack starting...');
    } catch (error) {
      console.log('  ⚠️ Monitoring stack failed to start:', error.message);
      console.log('  ℹ️ Continuing without monitoring...');
    }
  }

  async startServices() {
    // Group services by priority and start them in waves
    const servicesByPriority = {};
    this.services.forEach(service => {
      if (!servicesByPriority[service.priority]) {
        servicesByPriority[service.priority] = [];
      }
      servicesByPriority[service.priority].push(service);
    });

    const priorities = Object.keys(servicesByPriority).sort((a, b) => parseInt(a) - parseInt(b));

    for (const priority of priorities) {
      const servicesInPriority = servicesByPriority[priority];
      console.log(`  📋 Starting priority ${priority} services...`);
      
      // Start all services in this priority level
      const startPromises = servicesInPriority.map(service => this.startSingleService(service));
      await Promise.all(startPromises);
      
      // Wait between priority levels
      if (priority < priorities[priorities.length - 1]) {
        console.log(`  ⏳ Waiting for priority ${priority} services to initialize...`);
        await this.delay(3000);
      }
    }
    
    // Final wait for all services
    console.log('  ⏳ Waiting for all services to be ready...');
    await this.delay(8000);
  }

  async startSingleService(service) {
    try {
      const servicePath = path.join(this.projectRoot, 'services', service.name);
      
      if (!fs.existsSync(servicePath)) {
        console.log(`  ⚠️ Service directory not found: ${service.name}`);
        return;
      }

      console.log(`  🚀 Starting ${service.name} (port ${service.port})...`);
      
      const env = {
        ...process.env,
        PORT: service.port,
        NODE_ENV: 'development'
      };

      // Use correct npm command for platform
      const npmCmd = this.isWindows ? 'npm.cmd' : 'npm';

      // Start service in background
      const child = spawn(npmCmd, ['start'], {
        cwd: servicePath,
        env: env,
        detached: true,
        stdio: 'ignore',
        shell: true
      });

      child.unref();
      console.log(`  ✅ ${service.name} starting...`);
      
    } catch (error) {
      console.log(`  ⚠️ Could not start ${service.name}: ${error.message}`);
    }
  }

  async startClient() {
    try {
      const clientPath = path.join(this.projectRoot, 'client');
      
      if (!fs.existsSync(clientPath)) {
        console.log('  ⚠️ Client directory not found');
        return;
      }

      console.log('  🌐 Starting React client...');
      
      const env = {
        ...process.env,
        REACT_APP_API_URL: 'http://localhost:8080',
        BROWSER: 'none'
      };

      const npmCmd = this.isWindows ? 'npm.cmd' : 'npm';

      const child = spawn(npmCmd, ['start'], {
        cwd: clientPath,
        env: env,
        detached: true,
        stdio: 'ignore',
        shell: true
      });

      child.unref();
      console.log('  ✅ React client starting...');
      
      // Wait for client to start
      await this.delay(5000);
      
    } catch (error) {
      console.log(`  ⚠️ Could not start client: ${error.message}`);
    }
  }

  async runCommand(command, options = {}) {
    return new Promise((resolve, reject) => {
      let stdio;
      if (options.capture) {
        stdio = 'pipe';
      } else if (options.silent) {
        stdio = 'pipe';
      } else {
        stdio = 'inherit';
      }

      const shell = this.isWindows ? 'cmd' : '/bin/sh';
      const shellFlag = this.isWindows ? '/c' : '-c';

      const child = spawn(shell, [shellFlag, command], {
        stdio,
        shell: true
      });

      let output = '';
      if (options.capture && child.stdout) {
        child.stdout.on('data', (data) => {
          output += data.toString();
        });
      }

      child.on('close', (code) => {
        if (options.silent || code === 0) {
          resolve(options.capture ? output : undefined);
        } else {
          reject(new Error(`Command failed with code ${code}`));
        }
      });

      child.on('error', (error) => {
        if (options.silent) {
          resolve('');
        } else {
          reject(error);
        }
      });
    });
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  showInfo() {
    console.log('\n🌐 Access URLs:');
    console.log('='.repeat(30));
    console.log('Frontend:    http://localhost:3000');
    console.log('API Gateway: http://localhost:8080');
    console.log('Auth:        http://localhost:3001/health');
    console.log('Link:        http://localhost:3002/health');
    console.log('Community:   http://localhost:3003/health');
    console.log('Chat:        http://localhost:3004/health');
    console.log('News:        http://localhost:3005/health');
    console.log('Admin:       http://localhost:3006/health');
    
    if (this.monitoringEnabled) {
      console.log('\n🔍 Monitoring URLs:');
      console.log('='.repeat(30));
      console.log('Dashboard:   http://localhost:3010');
      console.log('Health API:  http://localhost:3010/api/health');
    }
    
    console.log('\n📋 Commands:');
    console.log('Check status: npm run status');
    console.log('Stop all:     npm stop');
    console.log('Restart:      npm restart');
    console.log('Health check: npm run health');
    console.log('Setup env:    npm run env:setup');
    
    console.log('\n💡 Note: Services are starting in background.');
    console.log('   Wait 1-2 minutes for everything to be ready.');
    console.log('   Check individual service health endpoints if needed.');
    
    console.log('\n🎯 What to do next:');
    console.log('   1. Wait 1-2 minutes for services to fully start');
    console.log('   2. Open http://localhost:3000 in your browser');
    console.log('   3. Check service status with: npm run status');
  }
}

// Run if called directly
if (require.main === module) {
  const starter = new SimpleStart();
  starter.start().catch(console.error);
}

module.exports = SimpleStart;
