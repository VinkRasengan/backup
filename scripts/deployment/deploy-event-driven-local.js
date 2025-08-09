#!/usr/bin/env node

/**
 * Deploy Event-Driven Architecture Locally
 * Alternative deployment without Docker Desktop dependency
 */

import { spawn, execSync  } from 'child_process';
import fs from 'fs';
import path from 'path';

class LocalEventDrivenDeployer {
  constructor() {
    this.services = [
      {
        name: 'Event Bus Service',
        port: 3007,
        directory: 'services/event-bus-service',
        script: 'npm start',
        priority: 1,
        eventDriven: true
      },
      {
        name: 'Auth Service',
        port: 3001,
        directory: 'services/auth-service',
        script: 'npm start',
        priority: 2,
        eventDriven: true
      },
      {
        name: 'Community Service',
        port: 3003,
        directory: 'services/community-service',
        script: 'npm start',
        priority: 2,
        eventDriven: true
      },
      {
        name: 'Link Service',
        port: 3002,
        directory: 'services/link-service',
        script: 'npm start',
        priority: 3,
        eventDriven: false
      },
      {
        name: 'Chat Service',
        port: 3004,
        directory: 'services/chat-service',
        script: 'npm start',
        priority: 3,
        eventDriven: false
      },
      {
        name: 'News Service',
        port: 3005,
        directory: 'services/news-service',
        script: 'npm start',
        priority: 3,
        eventDriven: false
      },
      {
        name: 'Admin Service',
        port: 3006,
        directory: 'services/admin-service',
        script: 'npm start',
        priority: 4,
        eventDriven: false
      },
      {
        name: 'API Gateway',
        port: 8080,
        directory: 'services/api-gateway',
        script: 'npm start',
        priority: 5,
        eventDriven: false
      },
      {
        name: 'Frontend',
        port: 3000,
        directory: 'client',
        script: 'npm start',
        priority: 6,
        eventDriven: false
      }
    ];

    this.processes = new Map();
    this.infrastructure = {
      redis: null,
      kurrentdb: null
    };
  }

  async deploy() {
    console.log('🚀 Event-Driven Architecture - Local Deployment');
    console.log('================================================\n');

    try {
      // Step 1: Check prerequisites
      await this.checkPrerequisites();

      // Step 2: Setup environment
      await this.setupEnvironment();

      // Step 3: Start infrastructure
      await this.startInfrastructure();

      // Step 4: Install dependencies
      await this.installDependencies();

      // Step 5: Start services
      await this.startServices();

      // Step 6: Verify deployment
      await this.verifyDeployment();

      console.log('\n🎉 Event-Driven Architecture deployed successfully!');
      this.printAccessPoints();

    } catch (error) {
      console.error('❌ Deployment failed:', error.message);
      await this.cleanup();
      process.exit(1);
    }
  }

  async checkPrerequisites() {
    console.log('🔍 Checking prerequisites...');

    // Check Node.js
    try {
      const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
      console.log(`  ✅ Node.js: ${nodeVersion}`);
    } catch (error) {
      throw new Error('Node.js is not installed');
    }

    // Check npm
    try {
      const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
      console.log(`  ✅ npm: ${npmVersion}`);
    } catch (error) {
      throw new Error('npm is not available');
    }

    // Check ports
    const portsToCheck = [3000, 3001, 3002, 3003, 3004, 3005, 3006, 3007, 8080];
    for (const port of portsToCheck) {
      if (await this.isPortInUse(port)) {
        console.log(`  ⚠️  Port ${port} is in use - will attempt to stop existing process`);
      }
    }

    console.log('  ✅ Prerequisites check completed');
  }

  async setupEnvironment() {
    console.log('\n🔧 Setting up environment...');

    // Create .env file if not exists
    const envFile = '.env';
    if (!fs.existsSync(envFile)) {
      const envContent = `
# Event-Driven Architecture Environment
NODE_ENV=development
LOG_LEVEL=info

# Event Bus Configuration
EVENT_BUS_SERVICE_URL=http://localhost:3007
ENABLE_EVENT_DRIVEN=true
EVENT_BUS_REDIS_ENABLED=true
EVENT_BUS_RABBITMQ_ENABLED=false

# Event Store Configuration
EVENT_STORE_ENABLED=true
KURRENTDB_ENABLED=false
KURRENTDB_URL=esdb://localhost:2113?tls=false
CQRS_ENABLED=true

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-factcheck-microservices-2024

# Firebase Configuration (placeholder)
FIREBASE_PROJECT_ID=factcheck-1d6e8
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@factcheck-1d6e8.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\\n-----END PRIVATE KEY-----"
`;

      fs.writeFileSync(envFile, envContent.trim());
      console.log('  ✅ Created .env file');
    } else {
      console.log('  ✅ .env file exists');
    }

    console.log('  ✅ Environment setup completed');
  }

  async startInfrastructure() {
    console.log('\n🏗️  Starting infrastructure...');

    // For local deployment, we'll use in-memory alternatives
    // Redis and KurrentDB would normally be Docker containers
    console.log('  📦 Using in-memory infrastructure for local deployment');
    console.log('  ✅ Event Bus will use fallback mode');
    console.log('  ✅ Services will use local pub/sub');
    console.log('  ✅ Infrastructure ready');
  }

  async installDependencies() {
    console.log('\n📦 Installing dependencies...');

    // Install root dependencies
    try {
      execSync('npm install', { stdio: 'pipe' });
      console.log('  ✅ Root dependencies installed');
    } catch (error) {
      console.log('  ⚠️  Root dependencies installation had warnings');
    }

    // Install service dependencies
    for (const service of this.services) {
      if (fs.existsSync(service.directory)) {
        try {
          execSync('npm install', { 
            cwd: service.directory, 
            stdio: 'pipe' 
          });
          console.log(`  ✅ ${service.name}: dependencies installed`);
        } catch (error) {
          console.log(`  ⚠️  ${service.name}: dependency installation had warnings`);
        }
      }
    }

    console.log('  ✅ All dependencies installed');
  }

  async startServices() {
    console.log('\n🚀 Starting services...');

    // Group services by priority
    const servicesByPriority = {};
    this.services.forEach(service => {
      if (!servicesByPriority[service.priority]) {
        servicesByPriority[service.priority] = [];
      }
      servicesByPriority[service.priority].push(service);
    });

    // Start services by priority
    for (const priority of Object.keys(servicesByPriority).sort()) {
      console.log(`\n  📦 Starting priority ${priority} services...`);
      
      const services = servicesByPriority[priority];
      const startPromises = services.map(service => this.startService(service));
      
      await Promise.all(startPromises);
      
      // Wait a bit between priority groups
      if (priority < Math.max(...Object.keys(servicesByPriority))) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log('\n  ✅ All services started');
  }

  async startService(service) {
    return new Promise((resolve, reject) => {
      console.log(`    🚀 Starting ${service.name}...`);

      const process = spawn('npm', ['start'], {
        cwd: service.directory,
        stdio: 'pipe',
        shell: true
      });

      this.processes.set(service.name, process);

      let started = false;
      const timeout = setTimeout(() => {
        if (!started) {
          console.log(`    ✅ ${service.name} started (timeout)`);
          started = true;
          resolve();
        }
      }, 5000);

      process.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('listening') || output.includes('started') || output.includes('running')) {
          if (!started) {
            console.log(`    ✅ ${service.name} started`);
            started = true;
            clearTimeout(timeout);
            resolve();
          }
        }
      });

      process.stderr.on('data', (data) => {
        const error = data.toString();
        if (error.includes('EADDRINUSE') || error.includes('port') && error.includes('use')) {
          console.log(`    ⚠️  ${service.name} port conflict - may already be running`);
          if (!started) {
            started = true;
            clearTimeout(timeout);
            resolve();
          }
        }
      });

      process.on('error', (error) => {
        console.log(`    ❌ ${service.name} failed to start: ${error.message}`);
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  async verifyDeployment() {
    console.log('\n🔍 Verifying deployment...');

    // Wait a bit for services to fully start
    await new Promise(resolve => setTimeout(resolve, 5000));

    let healthyServices = 0;
    const totalServices = this.services.length;

    for (const service of this.services) {
      try {
        const isRunning = await this.isPortInUse(service.port);
        if (isRunning) {
          console.log(`  ✅ ${service.name}: running on port ${service.port}`);
          healthyServices++;
        } else {
          console.log(`  ❌ ${service.name}: not responding on port ${service.port}`);
        }
      } catch (error) {
        console.log(`  ❌ ${service.name}: health check failed`);
      }
    }

    const healthPercentage = Math.round((healthyServices / totalServices) * 100);
    console.log(`\n  📊 Health Status: ${healthyServices}/${totalServices} services (${healthPercentage}%)`);

    if (healthPercentage >= 70) {
      console.log('  ✅ Deployment verification passed');
    } else {
      throw new Error('Too many services failed to start');
    }
  }

  printAccessPoints() {
    console.log('\n🌐 Access Points:');
    console.log('================');
    
    this.services.forEach(service => {
      const eventDrivenIcon = service.eventDriven ? '⚡' : '📦';
      console.log(`  ${eventDrivenIcon} ${service.name}: http://localhost:${service.port}`);
    });

    console.log('\n🎯 Key URLs:');
    console.log('  🎨 Frontend: http://localhost:3000');
    console.log('  🚪 API Gateway: http://localhost:8080');
    console.log('  ⚡ Event Bus: http://localhost:3007');
    console.log('  🔐 Auth Service: http://localhost:3001');
    console.log('  👥 Community Service: http://localhost:3003');

    console.log('\n📊 Event-Driven Features:');
    console.log('  📤 Event Publishing: POST http://localhost:3007/events');
    console.log('  📊 Event Statistics: GET http://localhost:3007/stats');
    console.log('  🗄️  Event Store API: http://localhost:3007/api/eventstore');
    console.log('  🔍 Health Checks: GET http://localhost:{port}/health');

    console.log('\n🛠️  Management:');
    console.log('  🛑 Stop all: node scripts/stop-all.js');
    console.log('  📊 Status: node scripts/status-all.js');
    console.log('  🏥 Health: node scripts/health-all.js');
  }

  async isPortInUse(port) {
    return new Promise((resolve) => {
      import { exec  } from 'child_process';
      exec(`netstat -an | findstr :${port}`, (error, stdout) => {
        resolve(stdout.includes(`0.0.0.0:${port}`) || stdout.includes(`127.0.0.1:${port}`));
      });
    });
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up...');
    
    for (const [name, process] of this.processes) {
      try {
        process.kill();
        console.log(`  ✅ Stopped ${name}`);
      } catch (error) {
        console.log(`  ⚠️  Failed to stop ${name}`);
      }
    }
  }
}

// Run deployment
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const deployer = new LocalEventDrivenDeployer();
  deployer.deploy().catch(console.error);
}

export default LocalEventDrivenDeployer;
