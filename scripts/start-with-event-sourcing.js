#!/usr/bin/env node
/**
 * Enhanced Start Script with Event Sourcing
 * Starts infrastructure and services with proper Event Sourcing setup
 */

const { spawn, exec } = require('child_process');
const axios = require('axios');
const util = require('util');
const os = require('os');

const execAsync = util.promisify(exec);

class EventSourcingPlatformStarter {
  constructor() {
    this.isWindows = os.platform() === 'win32';
    this.processes = new Map();
    
    this.infrastructure = [
      { name: 'Redis', container: 'factcheck-redis', port: 6379 },
      { name: 'KurrentDB', container: 'factcheck-kurrentdb', port: 2113 }
    ];
    
    this.services = [
      { name: 'Community Service', port: 3003, script: 'start:community', priority: 1 },
      { name: 'Auth Service', port: 3001, script: 'start:auth', priority: 2 },
      { name: 'API Gateway', port: 8080, script: 'start:gateway', priority: 3 },
      { name: 'Link Service', port: 3002, script: 'start:link', priority: 4 },
      { name: 'Chat Service', port: 3004, script: 'start:chat', priority: 5 },
      { name: 'News Service', port: 3005, script: 'start:news', priority: 6 },
      { name: 'Admin Service', port: 3006, script: 'start:admin', priority: 7 }
    ];
  }

  /**
   * Main start method
   */
  async start() {
    console.log('🚀 Starting FactCheck Platform with Event Sourcing...\n');
    
    try {
      // Step 1: Start infrastructure
      await this.startInfrastructure();
      
      // Step 2: Wait for infrastructure
      await this.waitForInfrastructure();
      
      // Step 3: Start core services first
      await this.startCoreServices();
      
      // Step 4: Start remaining services
      await this.startRemainingServices();
      
      // Step 5: Verify everything is running
      await this.verifyStartup();
      
      console.log('\n🎉 FactCheck Platform with Event Sourcing started successfully!');
      this.printAccessPoints();
      
      // Keep process alive and handle shutdown
      this.setupGracefulShutdown();
      
    } catch (error) {
      console.error('❌ Failed to start platform:', error.message);
      await this.cleanup();
      process.exit(1);
    }
  }

  /**
   * Start infrastructure (Redis + KurrentDB)
   */
  async startInfrastructure() {
    console.log('🏗️  Starting Event Sourcing Infrastructure...');
    
    try {
      const command = 'docker-compose up -d redis kurrentdb';
      console.log(`  📦 Running: ${command}`);
      
      const { stdout, stderr } = await execAsync(command, { timeout: 60000 });
      
      if (stderr && !stderr.includes('warning')) {
        console.warn('  ⚠️  Docker warnings:', stderr);
      }
      
      console.log('  ✅ Infrastructure containers started');
      
    } catch (error) {
      throw new Error(`Failed to start infrastructure: ${error.message}`);
    }
  }

  /**
   * Wait for infrastructure to be ready
   */
  async waitForInfrastructure() {
    console.log('⏳ Waiting for infrastructure to be ready...');
    
    const maxWaitTime = 60000; // 1 minute
    const checkInterval = 3000; // 3 seconds
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      let allReady = true;
      
      // Check Redis
      try {
        const redisReady = await this.checkRedis();
        if (!redisReady) allReady = false;
      } catch (error) {
        allReady = false;
      }
      
      // Check KurrentDB
      try {
        const kurrentReady = await this.checkKurrentDB();
        if (!kurrentReady) allReady = false;
      } catch (error) {
        allReady = false;
      }
      
      if (allReady) {
        console.log('  ✅ Infrastructure ready');
        return;
      }
      
      process.stdout.write('.');
      await this.sleep(checkInterval);
    }
    
    throw new Error('Infrastructure failed to become ready within timeout');
  }

  /**
   * Start core services (Community, Auth, Gateway)
   */
  async startCoreServices() {
    console.log('\n🚀 Starting Core Services...');
    
    const coreServices = this.services.filter(s => s.priority <= 3);
    
    for (const service of coreServices) {
      await this.startService(service);
      await this.sleep(5000); // Wait 5 seconds between core services
    }
  }

  /**
   * Start remaining services
   */
  async startRemainingServices() {
    console.log('\n🔧 Starting Extended Services...');
    
    const extendedServices = this.services.filter(s => s.priority > 3);
    
    // Start extended services in parallel
    const startPromises = extendedServices.map(service => 
      this.startService(service, false) // Don't wait for health check
    );
    
    await Promise.all(startPromises);
  }

  /**
   * Start individual service
   */
  async startService(service, waitForHealth = true) {
    console.log(`  🔧 Starting ${service.name}...`);
    
    try {
      // Kill existing process on port if any
      await this.killProcessOnPort(service.port);
      
      // Start the service
      const npmCommand = this.isWindows ? 'npm.cmd' : 'npm';
      const process = spawn(npmCommand, ['run', service.script], {
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: true,
        detached: false
      });
      
      this.processes.set(service.name, process);
      
      // Handle process output
      let serviceStarted = false;
      process.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('started on port') || 
            output.includes('Server running') ||
            output.includes('🚀')) {
          if (!serviceStarted) {
            console.log(`    ✅ ${service.name} started on port ${service.port}`);
            serviceStarted = true;
          }
        }
      });
      
      process.stderr.on('data', (data) => {
        const error = data.toString();
        if (!error.includes('warning') && 
            !error.includes('deprecated') && 
            !error.includes('ExperimentalWarning')) {
          console.error(`    ⚠️  ${service.name}:`, error.trim());
        }
      });
      
      process.on('exit', (code) => {
        if (code !== 0) {
          console.error(`    ❌ ${service.name} exited with code ${code}`);
        }
        this.processes.delete(service.name);
      });
      
      // Wait for service to be ready if requested
      if (waitForHealth) {
        await this.waitForService(service);
      }
      
    } catch (error) {
      console.error(`    ❌ Failed to start ${service.name}:`, error.message);
    }
  }

  /**
   * Wait for service to be ready
   */
  async waitForService(service) {
    const maxWaitTime = 45000; // 45 seconds
    const checkInterval = 2000; // 2 seconds
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      try {
        const healthEndpoint = service.name === 'Community Service' 
          ? '/health/event-sourcing' 
          : '/health';
          
        const response = await axios.get(`http://localhost:${service.port}${healthEndpoint}`, {
          timeout: 3000
        });
        
        if (response.status === 200 || response.status === 503) {
          return true;
        }
      } catch (error) {
        // Service not ready yet
      }
      
      await this.sleep(checkInterval);
    }
    
    console.log(`    ⚠️  ${service.name} health check timeout (service may still be starting)`);
  }

  /**
   * Verify startup
   */
  async verifyStartup() {
    console.log('\n🔍 Verifying Platform Status...');
    
    // Check infrastructure
    const redisOk = await this.checkRedis();
    const kurrentOk = await this.checkKurrentDB();
    
    console.log(`  ${redisOk ? '✅' : '❌'} Redis: ${redisOk ? 'Connected' : 'Not connected'}`);
    console.log(`  ${kurrentOk ? '✅' : '❌'} KurrentDB: ${kurrentOk ? 'Connected' : 'Not connected'}`);
    
    // Check services
    for (const service of this.services.slice(0, 3)) { // Check core services
      if (this.processes.has(service.name)) {
        try {
          const healthEndpoint = service.name === 'Community Service' 
            ? '/health/event-sourcing' 
            : '/health';
            
          const response = await axios.get(`http://localhost:${service.port}${healthEndpoint}`, {
            timeout: 5000
          });
          console.log(`  ✅ ${service.name}: Ready (${response.status})`);
        } catch (error) {
          console.log(`  ⚠️  ${service.name}: Started but health check failed`);
        }
      }
    }
  }

  /**
   * Print access points
   */
  printAccessPoints() {
    console.log('\n📊 Access Points:');
    console.log('  🌐 Frontend: http://localhost:3000 (if client is running)');
    console.log('  🚪 API Gateway: http://localhost:8080');
    console.log('  👤 Auth Service: http://localhost:3001');
    console.log('  💬 Community Service: http://localhost:3003');
    console.log('  🔗 Link Service: http://localhost:3002');
    console.log('  💭 Chat Service: http://localhost:3004');
    console.log('  📰 News Service: http://localhost:3005');
    console.log('  ⚙️  Admin Service: http://localhost:3006');
    console.log('\n⚡ Event Sourcing:');
    console.log('  📊 Event Sourcing Health: http://localhost:3003/health/event-sourcing');
    console.log('  📈 CQRS Statistics: http://localhost:3003/stats/cqrs');
    console.log('  🔴 Redis: localhost:6379');
    console.log('  📦 KurrentDB: http://localhost:2113');
  }

  /**
   * Check Redis connectivity
   */
  async checkRedis() {
    try {
      // Use Docker exec to test Redis connection since redis-cli may not be available on Windows
      const command = 'docker exec factcheck-redis redis-cli -a antifraud123 ping';
      const { stdout } = await execAsync(command, { timeout: 5000 });
      return stdout.includes('PONG');
    } catch (error) {
      return false;
    }
  }

  /**
   * Check KurrentDB connectivity
   */
  async checkKurrentDB() {
    try {
      const response = await axios.get('http://localhost:2113/info', { timeout: 5000 });
      return response.status === 200;
    } catch (error) {
      return false;
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
          }
        }
      } else {
        if (stdout.trim()) {
          await execAsync(`kill -9 ${stdout.trim()}`);
        }
      }
    } catch (error) {
      // Ignore errors when killing processes
    }
  }

  /**
   * Setup graceful shutdown
   */
  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
      await this.cleanup();
      process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    
    console.log('\n✨ Platform is running with Event Sourcing. Press Ctrl+C to stop.');
    
    // Keep process alive
    setInterval(() => {}, 1000);
  }

  /**
   * Cleanup all processes
   */
  async cleanup() {
    console.log('🧹 Cleaning up processes...');
    
    for (const [name, process] of this.processes) {
      try {
        if (this.isWindows) {
          process.kill('SIGTERM');
        } else {
          process.kill('SIGTERM');
        }
        console.log(`  ✅ Stopped ${name}`);
      } catch (error) {
        console.log(`  ⚠️  Failed to stop ${name}`);
      }
    }
    
    this.processes.clear();
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
  const starter = new EventSourcingPlatformStarter();
  starter.start().catch(error => {
    console.error('💥 Platform startup failed:', error.message);
    process.exit(1);
  });
}

module.exports = EventSourcingPlatformStarter;
