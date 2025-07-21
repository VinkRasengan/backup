#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class BigDataStackManager {
  constructor() {
    this.processes = new Map();
    this.isShuttingDown = false;
  }

  /**
   * Main start method
   */
  async start() {
    console.log('🚀 Starting FactCheck Platform Big Data Stack...\n');
    
    try {
      // Step 1: Check Docker
      await this.checkDocker();
      
      // Step 2: Start Big Data Infrastructure
      await this.startBigDataInfrastructure();
      
      // Step 3: Wait for infrastructure to be ready
      await this.waitForInfrastructure();
      
      // Step 4: Start Big Data Services
      await this.startBigDataServices();
      
      // Step 5: Verify everything is running
      await this.verifyStartup();
      
      // Step 6: Show access points
      this.showAccessPoints();
      
      // Step 7: Setup graceful shutdown
      this.setupGracefulShutdown();
      
      console.log('\n🎉 Big Data Stack started successfully!');
      console.log('Press Ctrl+C to stop all services\n');
      
    } catch (error) {
      console.error('❌ Failed to start Big Data stack:', error.message);
      await this.cleanup();
      process.exit(1);
    }
  }

  /**
   * Check if Docker is available
   */
  async checkDocker() {
    console.log('🐳 Checking Docker availability...');
    
    try {
      await execAsync('docker --version');
      await execAsync('docker-compose --version');
      console.log('✅ Docker is available');
    } catch (error) {
      throw new Error('Docker is not available. Please install Docker and Docker Compose.');
    }
  }

  /**
   * Start Big Data infrastructure (Hadoop, Spark, etc.)
   */
  async startBigDataInfrastructure() {
    console.log('🏗️  Starting Big Data Infrastructure...');
    
    try {
      console.log('  📦 Starting Hadoop, Spark, and supporting services...');
      
      const { stdout, stderr } = await execAsync('docker-compose -f docker-compose.bigdata.yml up -d', {
        timeout: 120000 // 2 minutes timeout
      });
      
      if (stderr && !stderr.includes('warning')) {
        console.warn('⚠️  Docker compose warnings:', stderr);
      }
      
      console.log('  ✅ Big Data infrastructure containers started');
      
    } catch (error) {
      throw new Error(`Failed to start Big Data infrastructure: ${error.message}`);
    }
  }

  /**
   * Wait for infrastructure services to be ready
   */
  async waitForInfrastructure() {
    console.log('⏳ Waiting for infrastructure services to be ready...');
    
    const services = [
      { name: 'Hadoop NameNode', url: 'http://localhost:9870', timeout: 60000 },
      { name: 'Spark Master', url: 'http://localhost:8080', timeout: 45000 },
      { name: 'Jupyter Spark', url: 'http://localhost:8888', timeout: 30000 }
    ];
    
    for (const service of services) {
      await this.waitForService(service.name, service.url, service.timeout);
    }
    
    console.log('✅ All infrastructure services are ready');
  }

  /**
   * Wait for a specific service to be ready
   */
  async waitForService(serviceName, url, timeout = 30000) {
    const startTime = Date.now();
    const maxWaitTime = timeout;
    
    console.log(`  ⏳ Waiting for ${serviceName}...`);
    
    while (Date.now() - startTime < maxWaitTime) {
      try {
        const response = await fetch(url, { 
          method: 'GET',
          timeout: 5000 
        });
        
        if (response.ok) {
          console.log(`  ✅ ${serviceName} is ready`);
          return;
        }
      } catch (error) {
        // Service not ready yet, continue waiting
      }
      
      await this.sleep(2000); // Wait 2 seconds before retry
    }
    
    console.warn(`  ⚠️  ${serviceName} may not be fully ready (timeout reached)`);
  }

  /**
   * Start Big Data services (Spark Service, ETL Service)
   */
  async startBigDataServices() {
    console.log('🚀 Starting Big Data Services...');
    
    const services = [
      {
        name: 'Spark Service',
        port: 3010,
        script: 'start:spark',
        healthPath: '/health'
      },
      {
        name: 'ETL Service',
        port: 3011,
        script: 'start:etl',
        healthPath: '/health'
      }
    ];
    
    for (const service of services) {
      await this.startService(service);
      await this.sleep(3000); // Wait between service starts
    }
    
    console.log('✅ All Big Data services started');
  }

  /**
   * Start a single service
   */
  async startService(service) {
    console.log(`  🚀 Starting ${service.name}...`);
    
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
          console.error(`    ❌ ${service.name} error:`, error);
        }
      });
      
      process.on('exit', (code) => {
        if (!this.isShuttingDown && code !== 0) {
          console.error(`    ❌ ${service.name} exited with code ${code}`);
        }
      });
      
    } catch (error) {
      throw new Error(`Failed to start ${service.name}: ${error.message}`);
    }
  }

  /**
   * Verify that all services are running
   */
  async verifyStartup() {
    console.log('🔍 Verifying service startup...');
    
    const healthChecks = [
      { name: 'Spark Service', url: 'http://localhost:3010/health' },
      { name: 'ETL Service', url: 'http://localhost:3011/health' }
    ];
    
    for (const check of healthChecks) {
      try {
        await this.waitForService(check.name, check.url, 15000);
      } catch (error) {
        console.warn(`  ⚠️  ${check.name} health check failed: ${error.message}`);
      }
    }
    
    console.log('✅ Service verification completed');
  }

  /**
   * Show access points for all services
   */
  showAccessPoints() {
    console.log('\n📊 Big Data Stack Access Points:');
    console.log('');
    console.log('🏗️  Infrastructure:');
    console.log('  • Hadoop NameNode UI: http://localhost:9870');
    console.log('  • Spark Master UI: http://localhost:8080');
    console.log('  • Spark Worker 1 UI: http://localhost:8081');
    console.log('  • Spark Worker 2 UI: http://localhost:8082');
    console.log('  • Jupyter Spark: http://localhost:8888');
    console.log('  • Zeppelin: http://localhost:8890');
    console.log('');
    console.log('🚀 Services:');
    console.log('  • Spark Service: http://localhost:3010');
    console.log('  • ETL Service: http://localhost:3011');
    console.log('');
    console.log('🔍 Health Checks:');
    console.log('  • Spark Service Health: http://localhost:3010/health');
    console.log('  • ETL Service Health: http://localhost:3011/health');
    console.log('');
    console.log('📈 APIs:');
    console.log('  • Spark Jobs API: http://localhost:3010/api/v1/jobs');
    console.log('  • ML Models API: http://localhost:3010/api/v1/ml');
    console.log('  • Analytics API: http://localhost:3010/api/v1/analytics');
    console.log('  • ETL Pipelines API: http://localhost:3011/api/v1/pipelines');
    console.log('');
  }

  /**
   * Setup graceful shutdown
   */
  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      if (this.isShuttingDown) return;
      
      console.log(`\n🛑 Received ${signal}, shutting down Big Data stack gracefully...`);
      this.isShuttingDown = true;
      
      await this.cleanup();
      process.exit(0);
    };
    
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }

  /**
   * Cleanup all processes and containers
   */
  async cleanup() {
    console.log('🧹 Cleaning up...');
    
    // Stop Node.js services
    for (const [serviceName, process] of this.processes) {
      try {
        console.log(`  🛑 Stopping ${serviceName}...`);
        process.kill('SIGTERM');
      } catch (error) {
        console.warn(`    ⚠️  Failed to stop ${serviceName}:`, error.message);
      }
    }
    
    // Stop Docker containers
    try {
      console.log('  🐳 Stopping Docker containers...');
      await execAsync('docker-compose -f docker-compose.bigdata.yml down', { timeout: 30000 });
      console.log('  ✅ Docker containers stopped');
    } catch (error) {
      console.warn('  ⚠️  Failed to stop Docker containers:', error.message);
    }
    
    console.log('✅ Cleanup completed');
  }

  // Utility methods
  async isPortInUse(port) {
    try {
      const { stdout } = await execAsync(`netstat -an | findstr :${port}`, { timeout: 5000 });
      return stdout.includes(`:${port}`);
    } catch (error) {
      return false;
    }
  }

  async killProcessOnPort(port) {
    try {
      await execAsync(`for /f "tokens=5" %a in ('netstat -aon ^| findstr :${port}') do taskkill /f /pid %a`, { timeout: 10000 });
    } catch (error) {
      // Ignore errors - process might not exist
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run if called directly
if (require.main === module) {
  const manager = new BigDataStackManager();
  manager.start().catch(console.error);
}

module.exports = BigDataStackManager;
