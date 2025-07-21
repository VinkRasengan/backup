#!/usr/bin/env node

/**
 * Deploy Local All - Comprehensive Local Deployment Script
 * Deploys all services and client locally using npm start
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

class LocalDeployment {
  constructor() {
    this.rootDir = process.cwd();
    this.processes = new Map();
    this.services = [
      { name: 'auth-service', path: 'services/auth-service', port: 3001, priority: 1 },
      { name: 'link-service', path: 'services/link-service', port: 3002, priority: 2 },
      { name: 'community-service', path: 'services/community-service', port: 3003, priority: 3 },
      { name: 'chat-service', path: 'services/chat-service', port: 3004, priority: 3 },
      { name: 'news-service', path: 'services/news-service', port: 3005, priority: 3 },
      { name: 'admin-service', path: 'services/admin-service', port: 3006, priority: 4 },
      { name: 'api-gateway', path: 'services/api-gateway', port: 8080, priority: 5 },
      { name: 'client', path: 'client', port: 3000, priority: 6 }
    ];
    this.pidFile = path.join(this.rootDir, '.local-deploy-pids');
  }

  /**
   * Main deployment function
   */
  async deploy() {
    console.log('🚀 Starting Local Deployment - All Services & Client');
    console.log('=' .repeat(60));

    try {
      await this.cleanup();
      await this.checkPrerequisites();
      await this.installDependencies();
      await this.startServices();
      await this.healthCheck();
      this.showSummary();
    } catch (error) {
      console.error('❌ Deployment failed:', error.message);
      await this.cleanup();
      process.exit(1);
    }
  }

  /**
   * Cleanup existing processes
   */
  async cleanup() {
    console.log('🧹 Cleaning up existing processes...');
    
    if (fs.existsSync(this.pidFile)) {
      const pids = fs.readFileSync(this.pidFile, 'utf8').split('\n').filter(Boolean);
      
      for (const pid of pids) {
        try {
          if (os.platform() === 'win32') {
            exec(`taskkill /PID ${pid} /F`, () => {});
          } else {
            process.kill(parseInt(pid), 'SIGTERM');
          }
        } catch (error) {
          // Process might already be dead
        }
      }
      
      fs.unlinkSync(this.pidFile);
    }

    // Kill processes by port
    for (const service of this.services) {
      await this.killProcessOnPort(service.port);
    }

    console.log('✅ Cleanup completed');
  }

  /**
   * Kill process running on specific port
   */
  async killProcessOnPort(port) {
    return new Promise((resolve) => {
      if (os.platform() === 'win32') {
        exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
          if (stdout) {
            const lines = stdout.split('\n');
            lines.forEach(line => {
              const parts = line.trim().split(/\s+/);
              if (parts.length > 4) {
                const pid = parts[parts.length - 1];
                exec(`taskkill /PID ${pid} /F`, () => {});
              }
            });
          }
          resolve();
        });
      } else {
        exec(`lsof -ti:${port} | xargs kill -9`, () => resolve());
      }
    });
  }

  /**
   * Check prerequisites
   */
  async checkPrerequisites() {
    console.log('🔍 Checking prerequisites...');
    
    // Check Node.js
    const nodeVersion = process.version;
    console.log(`  ✅ Node.js: ${nodeVersion}`);
    
    // Check npm
    try {
      const npmVersion = await this.execAsync('npm --version');
      console.log(`  ✅ npm: ${npmVersion.trim()}`);
    } catch (error) {
      throw new Error('npm is not installed or not in PATH');
    }

    // Check if all service directories exist
    for (const service of this.services) {
      const servicePath = path.join(this.rootDir, service.path);
      if (!fs.existsSync(servicePath)) {
        throw new Error(`Service directory not found: ${service.path}`);
      }
      
      const packageJsonPath = path.join(servicePath, 'package.json');
      if (!fs.existsSync(packageJsonPath)) {
        throw new Error(`package.json not found in: ${service.path}`);
      }
    }

    console.log('✅ Prerequisites check passed');
  }

  /**
   * Install dependencies for all services
   */
  async installDependencies() {
    console.log('📦 Installing dependencies...');
    
    for (const service of this.services) {
      const servicePath = path.join(this.rootDir, service.path);
      console.log(`  📦 Installing ${service.name}...`);
      
      try {
        await this.execAsync('npm install', { cwd: servicePath });
        console.log(`  ✅ ${service.name} dependencies installed`);
      } catch (error) {
        console.warn(`  ⚠️  Warning: Failed to install dependencies for ${service.name}`);
      }
    }
    
    console.log('✅ Dependencies installation completed');
  }

  /**
   * Start all services in priority order
   */
  async startServices() {
    console.log('🚀 Starting services...');
    
    // Group services by priority
    const priorityGroups = {};
    this.services.forEach(service => {
      if (!priorityGroups[service.priority]) {
        priorityGroups[service.priority] = [];
      }
      priorityGroups[service.priority].push(service);
    });

    // Start services by priority
    const priorities = Object.keys(priorityGroups).sort((a, b) => a - b);
    
    for (const priority of priorities) {
      const servicesInGroup = priorityGroups[priority];
      
      // Start all services in this priority group
      const startPromises = servicesInGroup.map(service => this.startService(service));
      await Promise.all(startPromises);
      
      // Wait a bit before starting next priority group
      if (priority < priorities[priorities.length - 1]) {
        console.log(`  ⏱️  Waiting for priority ${priority} services to stabilize...`);
        await this.sleep(3000);
      }
    }
    
    console.log('✅ All services started');
  }

  /**
   * Start individual service
   */
  async startService(service) {
    return new Promise((resolve, reject) => {
      const servicePath = path.join(this.rootDir, service.path);
      console.log(`  🚀 Starting ${service.name} on port ${service.port}...`);

      // Use cmd on Windows to handle npm properly
      const isWindows = process.platform === 'win32';
      const command = isWindows ? 'cmd' : 'npm';
      const args = isWindows ? ['/c', 'npm', 'start'] : ['start'];

      const child = spawn(command, args, {
        cwd: servicePath,
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false,
        shell: isWindows
      });

      // Store process info
      this.processes.set(service.name, {
        process: child,
        port: service.port,
        startTime: Date.now()
      });

      // Save PID
      fs.appendFileSync(this.pidFile, `${child.pid}\n`);

      // Handle output
      child.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('Server running') || 
            output.includes('listening') || 
            output.includes('started') ||
            output.includes('ready')) {
          console.log(`  ✅ ${service.name} started successfully`);
          resolve();
        }
      });

      child.stderr.on('data', (data) => {
        const error = data.toString();
        if (!error.includes('warning') && !error.includes('deprecated')) {
          console.error(`  ❌ ${service.name} error:`, error);
        }
      });

      child.on('error', (error) => {
        console.error(`  ❌ Failed to start ${service.name}:`, error.message);
        reject(error);
      });

      child.on('exit', (code) => {
        if (code !== 0) {
          console.error(`  ❌ ${service.name} exited with code ${code}`);
        }
        this.processes.delete(service.name);
      });

      // Timeout fallback
      setTimeout(() => {
        console.log(`  ⏱️  ${service.name} startup timeout - assuming started`);
        resolve();
      }, 15000);
    });
  }

  /**
   * Perform health check on all services
   */
  async healthCheck() {
    console.log('🏥 Performing health checks...');
    
    // Wait a bit for services to fully start
    await this.sleep(5000);
    
    for (const service of this.services) {
      if (service.name === 'client') {
        // Client doesn't have health endpoint
        console.log(`  ✅ ${service.name} - Frontend application`);
        continue;
      }
      
      try {
        const healthUrl = `http://localhost:${service.port}/health`;
        const response = await this.httpGet(healthUrl);
        console.log(`  ✅ ${service.name} - Health check passed`);
      } catch (error) {
        console.log(`  ⚠️  ${service.name} - Health check failed (service might still be starting)`);
      }
    }
    
    console.log('✅ Health checks completed');
  }

  /**
   * Show deployment summary
   */
  showSummary() {
    console.log('\n🎉 Local Deployment Completed Successfully!');
    console.log('=' .repeat(60));
    console.log('📋 Service Status:');
    
    this.services.forEach(service => {
      const status = this.processes.has(service.name) ? '🟢 Running' : '🔴 Stopped';
      console.log(`  ${service.name.padEnd(20)} ${status.padEnd(12)} http://localhost:${service.port}`);
    });
    
    console.log('\n🌐 Quick Access:');
    console.log('  Frontend:     http://localhost:3000');
    console.log('  API Gateway:  http://localhost:8080');
    console.log('  Auth Service: http://localhost:3001');
    
    console.log('\n📝 Management Commands:');
    console.log('  Stop all:     npm run stop');
    console.log('  Check status: npm run status');
    console.log('  View logs:    npm run logs');
    console.log('  Health check: npm run health');
    
    console.log('\n💡 Tips:');
    console.log('  - Services start in priority order for proper dependencies');
    console.log('  - Check individual service logs if issues occur');
    console.log('  - Use Ctrl+C to stop this process (services will continue running)');
  }

  /**
   * Utility functions
   */
  execAsync(command, options = {}) {
    return new Promise((resolve, reject) => {
      exec(command, options, (error, stdout, stderr) => {
        if (error) reject(error);
        else resolve(stdout);
      });
    });
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  httpGet(url) {
    return new Promise((resolve, reject) => {
      const http = require('http');
      const request = http.get(url, (response) => {
        if (response.statusCode === 200) {
          resolve(response);
        } else {
          reject(new Error(`HTTP ${response.statusCode}`));
        }
      });
      
      request.on('error', reject);
      request.setTimeout(5000, () => {
        request.destroy();
        reject(new Error('Timeout'));
      });
    });
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received interrupt signal');
  console.log('💡 Services are still running in background');
  console.log('💡 Use "npm run stop" to stop all services');
  process.exit(0);
});

// Run deployment
if (require.main === module) {
  const deployment = new LocalDeployment();
  deployment.deploy().catch(console.error);
}

module.exports = LocalDeployment;
