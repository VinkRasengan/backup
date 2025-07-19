#!/usr/bin/env node
/**
 * Auto Start Event Sourcing Infrastructure and Services
 * Handles the complete startup sequence for Event Sourcing
 */

const { spawn, exec } = require('child_process');
const axios = require('axios');
const util = require('util');

const execAsync = util.promisify(exec);

class EventSourcingStarter {
  constructor() {
    this.infrastructure = [
      {
        name: 'Redis',
        container: 'backup-redis-1',
        port: 6379,
        healthCheck: () => this.checkRedis()
      },
      {
        name: 'KurrentDB',
        container: 'factcheck-kurrentdb',
        port: 2113,
        healthCheck: () => this.checkKurrentDB()
      }
    ];

    this.services = [
      {
        name: 'Community Service',
        port: 3003,
        script: 'start:community',
        healthEndpoint: '/health/event-sourcing',
        priority: 1
      },
      {
        name: 'Auth Service',
        port: 3001,
        script: 'start:auth',
        healthEndpoint: '/health',
        priority: 2
      },
      {
        name: 'API Gateway',
        port: 8080,
        script: 'start:gateway',
        healthEndpoint: '/health',
        priority: 3
      }
    ];

    this.processes = new Map();
    this.startupTimeout = 120000; // 2 minutes
  }

  /**
   * Start complete Event Sourcing stack
   */
  async start(options = {}) {
    const { 
      skipInfrastructure = false, 
      servicesOnly = false,
      coreOnly = true 
    } = options;

    console.log('🚀 Starting Event Sourcing Stack...\n');

    try {
      if (!skipInfrastructure && !servicesOnly) {
        await this.startInfrastructure();
      }

      if (!servicesOnly) {
        await this.waitForInfrastructure();
      }

      await this.startServices(coreOnly);
      
      await this.verifyStartup();
      
      console.log('\n🎉 Event Sourcing Stack started successfully!');
      console.log('\n📊 Access Points:');
      console.log('  - Community Service: http://localhost:3003');
      console.log('  - Auth Service: http://localhost:3001');
      console.log('  - API Gateway: http://localhost:8080');
      console.log('  - Event Sourcing Health: http://localhost:3003/health/event-sourcing');
      console.log('  - CQRS Stats: http://localhost:3003/stats/cqrs');
      
      // Keep process alive
      this.setupGracefulShutdown();
      
    } catch (error) {
      console.error('❌ Failed to start Event Sourcing stack:', error.message);
      await this.cleanup();
      process.exit(1);
    }
  }

  /**
   * Start infrastructure components
   */
  async startInfrastructure() {
    console.log('🏗️  Starting Infrastructure...');
    
    try {
      console.log('  📦 Starting Redis and KurrentDB...');
      
      const { stdout, stderr } = await execAsync('docker-compose up -d redis kurrentdb', {
        timeout: 60000
      });
      
      if (stderr && !stderr.includes('warning')) {
        throw new Error(`Docker compose error: ${stderr}`);
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
    const checkInterval = 2000; // 2 seconds
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      let allReady = true;
      
      for (const infra of this.infrastructure) {
        try {
          const isReady = await infra.healthCheck();
          if (!isReady) {
            allReady = false;
            break;
          }
        } catch (error) {
          allReady = false;
          break;
        }
      }
      
      if (allReady) {
        console.log('  ✅ All infrastructure components ready');
        return;
      }
      
      process.stdout.write('.');
      await this.sleep(checkInterval);
    }
    
    throw new Error('Infrastructure failed to become ready within timeout');
  }

  /**
   * Start services
   */
  async startServices(coreOnly = true) {
    console.log('\n🚀 Starting Services...');
    
    const servicesToStart = coreOnly 
      ? this.services.filter(s => s.priority <= 2)
      : this.services;
    
    // Sort by priority
    servicesToStart.sort((a, b) => a.priority - b.priority);
    
    for (const service of servicesToStart) {
      await this.startService(service);
      await this.sleep(3000); // Wait 3 seconds between services
    }
  }

  /**
   * Start individual service
   */
  async startService(service) {
    console.log(`  🔧 Starting ${service.name}...`);
    
    try {
      // Check if port is already in use
      const portInUse = await this.isPortInUse(service.port);
      if (portInUse) {
        console.log(`    ⚠️  Port ${service.port} already in use, attempting to kill existing process...`);
        await this.killProcessOnPort(service.port);
        await this.sleep(2000);
      }
      
      // Start the service
      const process = spawn('npm', ['run', service.script], {
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: true,
        detached: false
      });
      
      this.processes.set(service.name, process);
      
      // Handle process output
      process.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('started on port') || output.includes('Server running')) {
          console.log(`    ✅ ${service.name} started on port ${service.port}`);
        }
      });
      
      process.stderr.on('data', (data) => {
        const error = data.toString();
        if (!error.includes('warning') && !error.includes('deprecated')) {
          console.error(`    ❌ ${service.name} error:`, error.trim());
        }
      });
      
      process.on('exit', (code) => {
        if (code !== 0) {
          console.error(`    ❌ ${service.name} exited with code ${code}`);
        }
        this.processes.delete(service.name);
      });
      
      // Wait for service to be ready
      await this.waitForService(service);
      
    } catch (error) {
      throw new Error(`Failed to start ${service.name}: ${error.message}`);
    }
  }

  /**
   * Wait for service to be ready
   */
  async waitForService(service) {
    const maxWaitTime = 30000; // 30 seconds
    const checkInterval = 1000; // 1 second
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      try {
        const response = await axios.get(`http://localhost:${service.port}${service.healthEndpoint}`, {
          timeout: 2000
        });
        
        if (response.status === 200 || response.status === 503) {
          return true;
        }
      } catch (error) {
        // Service not ready yet
      }
      
      await this.sleep(checkInterval);
    }
    
    throw new Error(`${service.name} failed to become ready within timeout`);
  }

  /**
   * Verify complete startup
   */
  async verifyStartup() {
    console.log('\n🔍 Verifying startup...');
    
    // Check infrastructure
    for (const infra of this.infrastructure) {
      const isReady = await infra.healthCheck();
      const icon = isReady ? '✅' : '❌';
      console.log(`  ${icon} ${infra.name}: ${isReady ? 'Ready' : 'Not ready'}`);
    }
    
    // Check services
    for (const service of this.services) {
      if (this.processes.has(service.name)) {
        try {
          const response = await axios.get(`http://localhost:${service.port}${service.healthEndpoint}`, {
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
   * Check Redis health
   */
  async checkRedis() {
    try {
      const { stdout } = await execAsync('docker exec backup-redis-1 redis-cli -a antifraud123 ping', {
        timeout: 5000
      });
      return stdout.includes('PONG');
    } catch (error) {
      return false;
    }
  }

  /**
   * Check KurrentDB health
   */
  async checkKurrentDB() {
    try {
      const response = await axios.get('http://localhost:2113/info', {
        timeout: 5000
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if port is in use
   */
  async isPortInUse(port) {
    try {
      const { stdout } = await execAsync(`netstat -ano | findstr :${port}`, {
        timeout: 5000
      });
      return stdout.trim().length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Kill process on port
   */
  async killProcessOnPort(port) {
    try {
      const { stdout } = await execAsync(`netstat -ano | findstr :${port}`, {
        timeout: 5000
      });
      
      const lines = stdout.trim().split('\n');
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        
        if (pid && !isNaN(pid)) {
          await execAsync(`taskkill /PID ${pid} /F`);
          console.log(`    🔄 Killed process ${pid} on port ${port}`);
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
    
    // Keep process alive
    console.log('\n✨ Event Sourcing stack is running. Press Ctrl+C to stop.');
  }

  /**
   * Cleanup processes
   */
  async cleanup() {
    console.log('🧹 Cleaning up processes...');
    
    for (const [name, process] of this.processes) {
      try {
        process.kill('SIGTERM');
        console.log(`  ✅ Stopped ${name}`);
      } catch (error) {
        console.log(`  ⚠️  Failed to stop ${name}:`, error.message);
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

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    skipInfrastructure: args.includes('--skip-infrastructure'),
    servicesOnly: args.includes('--services-only'),
    coreOnly: !args.includes('--all-services')
  };

  const starter = new EventSourcingStarter();
  starter.start(options).catch(error => {
    console.error('💥 Startup failed:', error.message);
    process.exit(1);
  });
}

module.exports = EventSourcingStarter;
