#!/usr/bin/env node

/**
 * Deploy Node - Direct Node.js Deployment Script
 * Deploys all services and client using direct node execution
 */

import { spawn, exec, fork  } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';

class NodeDeployment {
  constructor() {
    this.rootDir = process.cwd();
    this.processes = new Map();
    this.services = [
      { 
        name: 'auth-service', 
        path: 'services/auth-service', 
        entry: 'src/server.js',
        port: 3001, 
        priority: 1,
        env: { NODE_ENV: 'development', PORT: '3001' }
      },
      { 
        name: 'link-service', 
        path: 'services/link-service', 
        entry: 'src/server.js',
        port: 3002, 
        priority: 2,
        env: { NODE_ENV: 'development', PORT: '3002' }
      },
      { 
        name: 'community-service', 
        path: 'services/community-service', 
        entry: 'src/server.js',
        port: 3003, 
        priority: 3,
        env: { NODE_ENV: 'development', PORT: '3003' }
      },
      { 
        name: 'chat-service', 
        path: 'services/chat-service', 
        entry: 'src/server.js',
        port: 3004, 
        priority: 3,
        env: { NODE_ENV: 'development', PORT: '3004' }
      },
      { 
        name: 'news-service', 
        path: 'services/news-service', 
        entry: 'src/server.js',
        port: 3005, 
        priority: 3,
        env: { NODE_ENV: 'development', PORT: '3005' }
      },
      { 
        name: 'admin-service', 
        path: 'services/admin-service', 
        entry: 'src/server.js',
        port: 3006, 
        priority: 4,
        env: { NODE_ENV: 'development', PORT: '3006' }
      },
      { 
        name: 'api-gateway', 
        path: 'services/api-gateway', 
        entry: 'src/server.js',
        port: 8080, 
        priority: 5,
        env: { NODE_ENV: 'development', PORT: '8080' }
      },
      { 
        name: 'client', 
        path: 'client', 
        entry: 'scripts/start.js',
        port: 3000, 
        priority: 6,
        env: { NODE_ENV: 'development', PORT: '3000' }
      }
    ];
    this.pidFile = path.join(this.rootDir, '.node-deploy-pids');
  }

  /**
   * Main deployment function
   */
  async deploy() {
    console.log('🚀 Starting Node.js Direct Deployment');
    console.log('=' .repeat(60));

    try {
      await this.cleanup();
      await this.checkPrerequisites();
      await this.setupEnvironment();
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
            exec(`taskkill /PID ${pid} /F /T`, () => {});
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
    
    // Check Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    if (majorVersion < 18) {
      throw new Error(`Node.js 18+ required, found ${nodeVersion}`);
    }
    console.log(`  ✅ Node.js: ${nodeVersion}`);

    // Check if all service directories and entry points exist
    for (const service of this.services) {
      const servicePath = path.join(this.rootDir, service.path);
      if (!fs.existsSync(servicePath)) {
        throw new Error(`Service directory not found: ${service.path}`);
      }
      
      // Check for entry point
      const entryPath = path.join(servicePath, service.entry);
      const altEntryPath = path.join(servicePath, 'index.js');
      const packageJsonPath = path.join(servicePath, 'package.json');
      
      if (!fs.existsSync(entryPath) && !fs.existsSync(altEntryPath) && !fs.existsSync(packageJsonPath)) {
        console.warn(`  ⚠️  Entry point not found for ${service.name}, will try package.json main`);
      }
    }

    console.log('✅ Prerequisites check passed');
  }

  /**
   * Setup environment variables
   */
  async setupEnvironment() {
    console.log('🔧 Setting up environment...');
    
    // Load shared environment
    const sharedEnvPath = path.join(this.rootDir, 'config', 'shared.env');
    if (fs.existsSync(sharedEnvPath)) {
      const envContent = fs.readFileSync(sharedEnvPath, 'utf8');
      const envVars = this.parseEnvFile(envContent);
      Object.assign(process.env, envVars);
      console.log('  ✅ Loaded shared environment variables');
    }

    // Set common environment variables
    process.env.NODE_ENV = process.env.NODE_ENV || 'development';
    process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'info';
    
    console.log('✅ Environment setup completed');
  }

  /**
   * Parse .env file content
   */
  parseEnvFile(content) {
    const envVars = {};
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          envVars[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
        }
      }
    }
    
    return envVars;
  }

  /**
   * Start all services in priority order
   */
  async startServices() {
    console.log('🚀 Starting services with Node.js...');
    
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
        await this.sleep(2000);
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
      
      // Determine entry point
      let entryPoint = service.entry;
      const entryPath = path.join(servicePath, entryPoint);
      
      if (!fs.existsSync(entryPath)) {
        // Try alternative entry points
        const alternatives = ['index.js', 'app.js', 'server.js'];
        let found = false;
        
        for (const alt of alternatives) {
          const altPath = path.join(servicePath, alt);
          if (fs.existsSync(altPath)) {
            entryPoint = alt;
            found = true;
            break;
          }
        }
        
        if (!found) {
          // Try to read from package.json
          const packageJsonPath = path.join(servicePath, 'package.json');
          if (fs.existsSync(packageJsonPath)) {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            entryPoint = packageJson.main || 'index.js';
          }
        }
      }

      // Prepare environment
      const env = {
        ...process.env,
        ...service.env
      };

      // Start the service
      const child = fork(entryPoint, [], {
        cwd: servicePath,
        env: env,
        silent: false
      });

      // Store process info
      this.processes.set(service.name, {
        process: child,
        port: service.port,
        startTime: Date.now()
      });

      // Save PID
      fs.appendFileSync(this.pidFile, `${child.pid}\n`);

      // Handle messages
      child.on('message', (message) => {
        if (message && message.type === 'ready') {
          console.log(`  ✅ ${service.name} started successfully`);
          resolve();
        }
      });

      child.on('error', (error) => {
        console.error(`  ❌ Failed to start ${service.name}:`, error.message);
        reject(error);
      });

      child.on('exit', (code, signal) => {
        if (code !== 0 && signal !== 'SIGTERM') {
          console.error(`  ❌ ${service.name} exited with code ${code}`);
        }
        this.processes.delete(service.name);
      });

      // Timeout fallback
      setTimeout(() => {
        console.log(`  ⏱️  ${service.name} startup timeout - assuming started`);
        resolve();
      }, 10000);
    });
  }

  /**
   * Perform health check on all services
   */
  async healthCheck() {
    console.log('🏥 Performing health checks...');
    
    // Wait a bit for services to fully start
    await this.sleep(3000);
    
    for (const service of this.services) {
      if (service.name === 'client') {
        console.log(`  ✅ ${service.name} - Frontend application`);
        continue;
      }
      
      try {
        const healthUrl = `http://localhost:${service.port}/health`;
        await this.httpGet(healthUrl);
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
    console.log('\n🎉 Node.js Direct Deployment Completed!');
    console.log('=' .repeat(60));
    console.log('📋 Service Status:');
    
    this.services.forEach(service => {
      const status = this.processes.has(service.name) ? '🟢 Running' : '🔴 Stopped';
      const pid = this.processes.has(service.name) ? 
        `PID: ${this.processes.get(service.name).process.pid}` : '';
      console.log(`  ${service.name.padEnd(20)} ${status.padEnd(12)} http://localhost:${service.port} ${pid}`);
    });
    
    console.log('\n🌐 Quick Access:');
    console.log('  Frontend:     http://localhost:3000');
    console.log('  API Gateway:  http://localhost:8080');
    console.log('  Auth Service: http://localhost:3001');
    
    console.log('\n📝 Management Commands:');
    console.log('  Stop all:     npm run stop');
    console.log('  Check status: npm run status');
    console.log('  View logs:    npm run logs');
    
    console.log('\n💡 Tips:');
    console.log('  - Services run as direct Node.js processes');
    console.log('  - Better performance than npm start');
    console.log('  - Use process monitoring tools for production');
  }

  /**
   * Utility functions
   */
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
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const deployment = new NodeDeployment();
  deployment.deploy().catch(console.error);
}

export default NodeDeployment;
