#!/usr/bin/env node

/**
 * Cross-Platform Deployment Script
 * Ensures stable deployment on any machine with just "git pull"
 */

const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');
const os = require('os');

class CrossPlatformDeployer {
  constructor() {
    this.platform = os.platform();
    this.isWindows = this.platform === 'win32';
    this.projectRoot = path.resolve(__dirname, '..');
    this.services = [
      'api-gateway',
      'auth-service', 
      'link-service',
      'community-service',
      'chat-service',
      'news-service',
      'admin-service',
      'phishtank-service',
      'criminalip-service'
    ];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const colors = {
      info: '\x1b[36m',    // Cyan
      success: '\x1b[32m', // Green
      warning: '\x1b[33m', // Yellow
      error: '\x1b[31m',   // Red
      reset: '\x1b[0m'     // Reset
    };
    
    console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
  }

  async checkPrerequisites() {
    this.log('🔍 Checking prerequisites...');
    
    const checks = [
      { name: 'Node.js', command: 'node --version' },
      { name: 'npm', command: 'npm --version' },
      { name: 'Docker', command: 'docker --version' },
      { name: 'Docker Compose', command: 'docker-compose --version' }
    ];

    for (const check of checks) {
      try {
        await this.execCommand(check.command);
        this.log(`✅ ${check.name} is available`, 'success');
      } catch (error) {
        this.log(`❌ ${check.name} is not available`, 'error');
        throw new Error(`Missing prerequisite: ${check.name}`);
      }
    }
  }

  async setupEnvironment() {
    this.log('🔧 Setting up environment...');
    
    const envPath = path.join(this.projectRoot, '.env');
    const envExamplePath = path.join(this.projectRoot, '.env.example');
    
    if (!fs.existsSync(envPath)) {
      if (fs.existsSync(envExamplePath)) {
        fs.copyFileSync(envExamplePath, envPath);
        this.log('📄 Created .env from .env.example', 'success');
        this.log('⚠️  Please update .env with your actual values', 'warning');
      } else {
        throw new Error('.env.example not found');
      }
    } else {
      this.log('✅ .env file exists', 'success');
    }
  }

  async installDependencies() {
    this.log('📦 Installing dependencies...');
    
    // Root dependencies
    await this.execCommand('npm install', this.projectRoot);
    this.log('✅ Root dependencies installed', 'success');
    
    // Client dependencies
    const clientPath = path.join(this.projectRoot, 'client');
    if (fs.existsSync(clientPath)) {
      await this.execCommand('npm install', clientPath);
      this.log('✅ Client dependencies installed', 'success');
    }
    
    // Service dependencies
    for (const service of this.services) {
      const servicePath = path.join(this.projectRoot, 'services', service);
      if (fs.existsSync(servicePath) && fs.existsSync(path.join(servicePath, 'package.json'))) {
        await this.execCommand('npm install', servicePath);
        this.log(`✅ ${service} dependencies installed`, 'success');
      }
    }
  }

  async validatePorts() {
    this.log('🔌 Validating port configuration...');
    
    const expectedPorts = {
      'api-gateway': 8080,
      'auth-service': 3001,
      'link-service': 3002,
      'community-service': 3003,
      'chat-service': 3004,
      'news-service': 3005,
      'admin-service': 3006,
      'phishtank-service': 3007,
      'criminalip-service': 3008,
      'frontend': 3000,
      'redis': 6379
    };

    for (const [service, port] of Object.entries(expectedPorts)) {
      const isPortFree = await this.checkPortAvailable(port);
      if (!isPortFree) {
        this.log(`⚠️  Port ${port} (${service}) is in use`, 'warning');
      } else {
        this.log(`✅ Port ${port} (${service}) is available`, 'success');
      }
    }
  }

  async checkPortAvailable(port) {
    return new Promise((resolve) => {
      const net = require('net');
      const server = net.createServer();
      
      server.listen(port, () => {
        server.once('close', () => resolve(true));
        server.close();
      });
      
      server.on('error', () => resolve(false));
    });
  }

  async buildDockerImages() {
    this.log('🐳 Building Docker images...');
    
    try {
      await this.execCommand('docker-compose -f docker-compose.dev.yml build', this.projectRoot);
      this.log('✅ Docker images built successfully', 'success');
    } catch (error) {
      this.log('❌ Failed to build Docker images', 'error');
      throw error;
    }
  }

  async startServices() {
    this.log('🚀 Starting services...');
    
    try {
      await this.execCommand('docker-compose -f docker-compose.dev.yml up -d', this.projectRoot);
      this.log('✅ Services started successfully', 'success');
      
      // Wait for services to be ready
      await this.waitForServices();
    } catch (error) {
      this.log('❌ Failed to start services', 'error');
      throw error;
    }
  }

  async waitForServices() {
    this.log('⏳ Waiting for services to be ready...');
    
    const healthChecks = [
      { name: 'API Gateway', url: 'http://localhost:8080/health' },
      { name: 'Auth Service', url: 'http://localhost:3001/health' },
      { name: 'Frontend', url: 'http://localhost:3000' }
    ];

    for (const check of healthChecks) {
      let retries = 30;
      while (retries > 0) {
        try {
          await this.execCommand(`curl -f ${check.url} || exit 1`);
          this.log(`✅ ${check.name} is ready`, 'success');
          break;
        } catch (error) {
          retries--;
          if (retries === 0) {
            this.log(`❌ ${check.name} failed to start`, 'error');
          } else {
            await this.sleep(2000);
          }
        }
      }
    }
  }

  async execCommand(command, cwd = process.cwd()) {
    return new Promise((resolve, reject) => {
      const shell = this.isWindows ? 'cmd' : 'bash';
      const shellFlag = this.isWindows ? '/c' : '-c';
      
      const child = spawn(shell, [shellFlag, command], {
        cwd,
        stdio: 'inherit',
        shell: true
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Command failed with code ${code}: ${command}`));
        }
      });

      child.on('error', reject);
    });
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async deploy() {
    try {
      this.log('🚀 Starting cross-platform deployment...', 'info');
      
      await this.checkPrerequisites();
      await this.setupEnvironment();
      await this.installDependencies();
      await this.validatePorts();
      await this.buildDockerImages();
      await this.startServices();
      
      this.log('🎉 Deployment completed successfully!', 'success');
      this.log('📱 Frontend: http://localhost:3000', 'info');
      this.log('🔗 API Gateway: http://localhost:8080', 'info');
      this.log('📊 Health Check: http://localhost:8080/health', 'info');
      
    } catch (error) {
      this.log(`💥 Deployment failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// Run deployment if called directly
if (require.main === module) {
  const deployer = new CrossPlatformDeployer();
  deployer.deploy();
}

module.exports = CrossPlatformDeployer;
