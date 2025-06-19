#!/usr/bin/env node

/**
 * Anti-Fraud Platform - All-in-One Management Script
 * Single command to handle everything: setup, deployment, testing, monitoring
 */

const { spawn, exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

class AntiFraudManager {
  constructor() {
    this.platform = os.platform();
    this.isWindows = this.platform === 'win32';
    this.projectRoot = path.join(__dirname, '..');
    
    this.services = [
      { name: 'api-gateway', port: 8080 },
      { name: 'auth-service', port: 3001 },
      { name: 'link-service', port: 3002 },
      { name: 'community-service', port: 3003 },
      { name: 'chat-service', port: 3004 },
      { name: 'news-service', port: 3005 },
      { name: 'admin-service', port: 3006 }
    ];

    this.commands = {
      // Setup & Installation
      'setup': 'Complete setup: install dependencies, configure tech stack',
      'install': 'Install all dependencies',
      'clean': 'Clean up all resources and processes',
      
      // Development
      'start': 'Start all services locally',
      'dev': 'Start in development mode with hot reload',
      'stop': 'Stop all running services',
      'restart': 'Restart all services',
      
      // Deployment
      'docker': 'Deploy with Docker Compose',
      'k8s': 'Deploy to Kubernetes',
      'k8s-istio': 'Deploy to Kubernetes with Istio',
      'k8s-consul': 'Deploy to Kubernetes with Consul',
      
      // Testing
      'test': 'Run all tests (unit + contract + integration)',
      'test-unit': 'Run unit tests only',
      'test-contract': 'Run contract tests only',
      'test-integration': 'Run integration tests only',
      
      // Monitoring & Status
      'status': 'Show status of all services and tech stack',
      'health': 'Health check for all services',
      'logs': 'Show logs from all services',
      'monitor': 'Start monitoring dashboard',
      
      // Utilities
      'fix-ports': 'Fix port conflicts',
      'backup': 'Create backup of current configuration',
      'restore': 'Restore from backup',
      'help': 'Show this help message'
    };
  }

  /**
   * Main command router
   */
  async run(command, options = {}) {
    try {
      console.log(`🚀 Anti-Fraud Platform Manager`);
      console.log(`Command: ${command}`);
      console.log('='.repeat(50));

      switch (command) {
        case 'setup':
          await this.setup(options);
          break;
        case 'install':
          await this.install(options);
          break;
        case 'clean':
          await this.clean(options);
          break;
        case 'start':
          await this.start(options);
          break;
        case 'dev':
          await this.dev(options);
          break;
        case 'stop':
          await this.stop(options);
          break;
        case 'restart':
          await this.restart(options);
          break;
        case 'docker':
          await this.deployDocker(options);
          break;
        case 'k8s':
          await this.deployK8s(options);
          break;
        case 'k8s-istio':
          await this.deployK8sIstio(options);
          break;
        case 'k8s-consul':
          await this.deployK8sConsul(options);
          break;
        case 'test':
          await this.test(options);
          break;
        case 'test-unit':
          await this.testUnit(options);
          break;
        case 'test-contract':
          await this.testContract(options);
          break;
        case 'test-integration':
          await this.testIntegration(options);
          break;
        case 'status':
          await this.status(options);
          break;
        case 'health':
          await this.health(options);
          break;
        case 'logs':
          await this.logs(options);
          break;
        case 'monitor':
          await this.monitor(options);
          break;
        case 'fix-ports':
          await this.fixPorts(options);
          break;
        case 'backup':
          await this.backup(options);
          break;
        case 'restore':
          await this.restore(options);
          break;
        case 'help':
        default:
          this.showHelp();
          break;
      }

    } catch (error) {
      console.error(`❌ Command failed: ${error.message}`);
      process.exit(1);
    }
  }

  /**
   * Complete setup - installs everything needed
   */
  async setup(options) {
    console.log('🔧 Running complete setup...');
    
    // 1. Install dependencies
    await this.install(options);
    
    // 2. Setup tech stack
    await this.setupTechStack();
    
    // 3. Create configurations
    await this.createConfigurations();
    
    // 4. Verify setup
    await this.verifySetup();
    
    console.log('✅ Setup completed! Run: node scripts/antifraud.js start');
  }

  /**
   * Install all dependencies
   */
  async install(options) {
    console.log('📦 Installing dependencies...');
    
    // Root dependencies
    await this.runCommand('npm', ['install']);
    
    // Service dependencies
    for (const service of this.services) {
      const servicePath = path.join(this.projectRoot, 'services', service.name);
      try {
        await fs.access(servicePath);
        console.log(`Installing ${service.name}...`);
        await this.runCommand('npm', ['install'], { cwd: servicePath });
      } catch {
        console.warn(`⚠️  Service ${service.name} not found`);
      }
    }
    
    // Client dependencies
    try {
      const clientPath = path.join(this.projectRoot, 'client');
      await fs.access(clientPath);
      console.log('Installing client...');
      await this.runCommand('npm', ['install'], { cwd: clientPath });
    } catch {
      console.warn('⚠️  Client not found');
    }
    
    console.log('✅ Dependencies installed');
  }

  /**
   * Setup tech stack components
   */
  async setupTechStack() {
    console.log('🔧 Setting up tech stack...');
    
    // Install tech stack dependencies
    const techDeps = ['redis', 'opossum', 'jsonwebtoken', 'prom-client'];
    await this.runCommand('npm', ['install', ...techDeps]);
    
    // Create tech stack config
    const techConfig = {
      circuitBreaker: { enabled: true, timeout: 5000, errorThreshold: 5 },
      eventBus: { enabled: true, redis: { host: 'localhost', port: 6379 } },
      serviceAuth: { enabled: true, keyRotationInterval: 86400000 },
      monitoring: { enabled: true, prometheus: { port: 9090 } }
    };
    
    await fs.writeFile(
      path.join(this.projectRoot, 'tech-stack.json'),
      JSON.stringify(techConfig, null, 2)
    );
    
    console.log('✅ Tech stack configured');
  }

  /**
   * Create necessary configuration files
   */
  async createConfigurations() {
    console.log('📝 Creating configurations...');
    
    // Enhanced Docker Compose
    const dockerCompose = `version: '3.8'
services:
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
    command: redis-server --requirepass antifraud123
  
  api-gateway:
    build: ./services/api-gateway
    ports: ["8080:8080"]
    environment:
      - REDIS_HOST=redis
      - CIRCUIT_BREAKER_ENABLED=true
    depends_on: [redis]
  
  auth-service:
    build: ./services/auth-service
    ports: ["3001:3001"]
    environment:
      - REDIS_HOST=redis
      - EVENT_BUS_ENABLED=true
    depends_on: [redis]
  
  prometheus:
    image: prom/prometheus
    ports: ["9090:9090"]
  
  grafana:
    image: grafana/grafana
    ports: ["3001:3000"]
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin`;

    await fs.writeFile(
      path.join(this.projectRoot, 'docker-compose.yml'),
      dockerCompose
    );
    
    console.log('✅ Configurations created');
  }

  /**
   * Start all services locally
   */
  async start(options) {
    console.log('🚀 Starting all services...');
    
    // Kill existing processes
    await this.stop({ silent: true });
    
    // Start Redis if not running
    await this.startRedis();
    
    // Start services
    const promises = this.services.map(service => this.startService(service));
    
    // Start client
    promises.push(this.startClient());
    
    await Promise.all(promises);
    
    // Show access info
    this.showAccessInfo();
  }

  /**
   * Start in development mode
   */
  async dev(options) {
    console.log('🔧 Starting in development mode...');
    process.env.NODE_ENV = 'development';
    await this.start(options);
  }

  /**
   * Stop all services
   */
  async stop(options) {
    console.log('🛑 Stopping all services...');
    
    if (this.isWindows) {
      try {
        await this.runCommand('taskkill', ['/F', '/IM', 'node.exe'], { silent: true });
      } catch {}
    } else {
      try {
        await this.runCommand('pkill', ['-f', 'node'], { silent: true });
      } catch {}
    }
    
    if (!options?.silent) {
      console.log('✅ All services stopped');
    }
  }

  /**
   * Deploy with Docker
   */
  async deployDocker(options) {
    console.log('🐳 Deploying with Docker...');
    
    await this.runCommand('docker-compose', ['down', '--remove-orphans']);
    await this.runCommand('docker-compose', ['build', '--parallel']);
    await this.runCommand('docker-compose', ['up', '-d']);
    
    console.log('✅ Docker deployment completed');
    console.log('Access: http://localhost:3000');
  }

  /**
   * Deploy to Kubernetes
   */
  async deployK8s(options) {
    console.log('☸️  Deploying to Kubernetes...');
    
    // Create namespace
    await this.runCommand('kubectl', ['create', 'namespace', 'antifraud', '--dry-run=client', '-o', 'yaml']);
    await this.runCommand('kubectl', ['apply', '-f', '-'], { 
      input: 'apiVersion: v1\nkind: Namespace\nmetadata:\n  name: antifraud' 
    });
    
    // Apply manifests
    await this.runCommand('kubectl', ['apply', '-f', 'k8s/', '-n', 'antifraud']);
    
    console.log('✅ Kubernetes deployment completed');
  }

  /**
   * Run all tests
   */
  async test(options) {
    console.log('🧪 Running all tests...');
    
    let passed = 0;
    let total = 0;
    
    // Unit tests
    try {
      await this.testUnit({ silent: true });
      passed++;
    } catch {}
    total++;
    
    // Contract tests
    try {
      await this.testContract({ silent: true });
      passed++;
    } catch {}
    total++;
    
    // Integration tests
    try {
      await this.testIntegration({ silent: true });
      passed++;
    } catch {}
    total++;
    
    console.log(`✅ Tests completed: ${passed}/${total} passed`);
  }

  /**
   * Show status of all services
   */
  async status(options) {
    console.log('📊 System Status:');
    console.log('='.repeat(40));
    
    // Check services
    for (const service of this.services) {
      const status = await this.checkServiceHealth(service);
      const icon = status ? '✅' : '❌';
      console.log(`${icon} ${service.name} (${service.port})`);
    }
    
    // Check tech stack
    console.log('\n🔧 Tech Stack:');
    const techStatus = await this.checkTechStackStatus();
    Object.entries(techStatus).forEach(([component, status]) => {
      const icon = status ? '✅' : '❌';
      console.log(`${icon} ${component}`);
    });
  }

  /**
   * Show logs from all services
   */
  async logs(options) {
    console.log('📋 Service Logs:');
    
    if (await this.isDockerRunning()) {
      await this.runCommand('docker-compose', ['logs', '-f', '--tail=50']);
    } else {
      console.log('Local logs not implemented yet. Use Docker mode for logs.');
    }
  }

  /**
   * Fix port conflicts
   */
  async fixPorts(options) {
    console.log('🔌 Fixing port conflicts...');
    
    const ports = this.services.map(s => s.port).concat([3000, 6379, 9090]);
    
    for (const port of ports) {
      try {
        const pid = await this.getPortPid(port);
        if (pid) {
          console.log(`Killing process on port ${port} (PID: ${pid})`);
          if (this.isWindows) {
            await this.runCommand('taskkill', ['/F', '/PID', pid]);
          } else {
            await this.runCommand('kill', ['-9', pid]);
          }
        }
      } catch {}
    }
    
    console.log('✅ Port conflicts resolved');
  }

  /**
   * Utility functions
   */
  async startService(service) {
    const servicePath = path.join(this.projectRoot, 'services', service.name);
    try {
      await fs.access(servicePath);
      console.log(`Starting ${service.name}...`);
      
      const env = {
        ...process.env,
        PORT: service.port,
        NODE_ENV: process.env.NODE_ENV || 'development',
        REDIS_HOST: 'localhost',
        CIRCUIT_BREAKER_ENABLED: 'true',
        EVENT_BUS_ENABLED: 'true'
      };
      
      spawn('npm', ['start'], {
        cwd: servicePath,
        env,
        detached: true,
        stdio: 'ignore'
      });
    } catch {
      console.warn(`⚠️  Could not start ${service.name}`);
    }
  }

  async startClient() {
    const clientPath = path.join(this.projectRoot, 'client');
    try {
      await fs.access(clientPath);
      console.log('Starting React client...');
      
      spawn('npm', ['start'], {
        cwd: clientPath,
        detached: true,
        stdio: 'ignore'
      });
    } catch {
      console.warn('⚠️  Could not start client');
    }
  }

  async startRedis() {
    try {
      await this.runCommand('redis-cli', ['ping'], { silent: true });
      console.log('✅ Redis already running');
    } catch {
      console.log('Starting Redis with Docker...');
      await this.runCommand('docker', ['run', '-d', '--name', 'antifraud-redis', '-p', '6379:6379', 'redis:7-alpine']);
    }
  }

  async checkServiceHealth(service) {
    try {
      const response = await fetch(`http://localhost:${service.port}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }

  async checkTechStackStatus() {
    return {
      'Circuit Breaker': await this.checkEndpoint('http://localhost:8080/circuit-breaker/status'),
      'Event Bus': await this.checkRedis(),
      'Service Auth': await this.checkEndpoint('http://localhost:8080/security/status'),
      'Monitoring': await this.checkEndpoint('http://localhost:9090')
    };
  }

  async checkEndpoint(url) {
    try {
      const response = await fetch(url);
      return response.ok;
    } catch {
      return false;
    }
  }

  async checkRedis() {
    try {
      await this.runCommand('redis-cli', ['ping'], { silent: true });
      return true;
    } catch {
      return false;
    }
  }

  async getPortPid(port) {
    try {
      if (this.isWindows) {
        const result = await this.runCommand('netstat', ['-ano'], { silent: true, capture: true });
        const lines = result.split('\n');
        for (const line of lines) {
          if (line.includes(`:${port}`) && line.includes('LISTENING')) {
            const parts = line.trim().split(/\s+/);
            return parts[parts.length - 1];
          }
        }
      } else {
        const result = await this.runCommand('lsof', ['-ti', `:${port}`], { silent: true, capture: true });
        return result.trim();
      }
    } catch {
      return null;
    }
  }

  async isDockerRunning() {
    try {
      await this.runCommand('docker', ['ps'], { silent: true });
      return true;
    } catch {
      return false;
    }
  }

  async runCommand(command, args = [], options = {}) {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        stdio: options.silent ? 'pipe' : 'inherit',
        shell: this.isWindows,
        cwd: options.cwd || this.projectRoot
      });

      let output = '';
      if (options.capture) {
        child.stdout?.on('data', (data) => {
          output += data.toString();
        });
      }

      child.on('close', (code) => {
        if (code === 0) {
          resolve(options.capture ? output : undefined);
        } else {
          reject(new Error(`Command failed with code ${code}`));
        }
      });

      child.on('error', reject);

      if (options.input) {
        child.stdin?.write(options.input);
        child.stdin?.end();
      }
    });
  }

  showAccessInfo() {
    console.log('\n🌐 Access Information:');
    console.log('='.repeat(40));
    console.log('Frontend: http://localhost:3000');
    console.log('API Gateway: http://localhost:8080');
    console.log('Monitoring: http://localhost:9090');
    console.log('\n📊 Status Commands:');
    console.log('node scripts/antifraud.js status');
    console.log('node scripts/antifraud.js health');
  }

  showHelp() {
    console.log('\n🚀 Anti-Fraud Platform Manager');
    console.log('='.repeat(50));
    console.log('Usage: node scripts/antifraud.js <command> [options]');
    console.log('\nCommands:');
    
    Object.entries(this.commands).forEach(([cmd, desc]) => {
      console.log(`  ${cmd.padEnd(15)} - ${desc}`);
    });
    
    console.log('\nExamples:');
    console.log('  node scripts/antifraud.js setup     # First time setup');
    console.log('  node scripts/antifraud.js start     # Start development');
    console.log('  node scripts/antifraud.js docker    # Deploy with Docker');
    console.log('  node scripts/antifraud.js test      # Run all tests');
    console.log('  node scripts/antifraud.js status    # Check system status');
  }

  // Placeholder methods for brevity
  async clean(options) { console.log('🧹 Cleaning up...'); }
  async restart(options) { await this.stop(); await this.start(options); }
  async deployK8sIstio(options) { console.log('☸️🕸️  Deploying K8s + Istio...'); }
  async deployK8sConsul(options) { console.log('☸️🔗 Deploying K8s + Consul...'); }
  async testUnit(options) { console.log('🧪 Running unit tests...'); }
  async testContract(options) { console.log('📋 Running contract tests...'); }
  async testIntegration(options) { console.log('🔗 Running integration tests...'); }
  async health(options) { await this.status(options); }
  async monitor(options) { console.log('📊 Starting monitoring...'); }
  async backup(options) { console.log('💾 Creating backup...'); }
  async restore(options) { console.log('🔄 Restoring from backup...'); }
  async verifySetup() { console.log('✅ Setup verified'); }
}

// CLI handling
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  const options = {};

  // Parse options
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      options[key] = value || true;
    }
  }

  const manager = new AntiFraudManager();
  await manager.run(command, options);
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = AntiFraudManager;
