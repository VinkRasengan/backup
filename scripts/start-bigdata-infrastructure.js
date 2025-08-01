#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class BigDataInfrastructureManager {
  constructor() {
    this.processes = new Map();
    this.isShuttingDown = false;
  }

  /**
   * Main start method
   */
  async start() {
    console.log('🚀 Starting FactCheck Platform Big Data Infrastructure...\n');
    
    try {
      // Step 1: Check Docker
      await this.checkDocker();
      
      // Step 2: Start Big Data Infrastructure
      await this.startBigDataInfrastructure();
      
      // Step 3: Wait for infrastructure to be ready
      await this.waitForInfrastructure();
      
      // Step 4: Show access points
      this.showAccessPoints();
      
      // Step 5: Setup graceful shutdown
      this.setupGracefulShutdown();
      
      console.log('\n🎉 Big Data Infrastructure started successfully!');
      console.log('Press Ctrl+C to stop all services\n');
      
    } catch (error) {
      console.error('❌ Failed to start Big Data infrastructure:', error.message);
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
   * Show access points for all services
   */
  showAccessPoints() {
    console.log('\n📊 Big Data Infrastructure Access Points:');
    console.log('');
    console.log('🏗️  Infrastructure:');
    console.log('  • Hadoop NameNode UI: http://localhost:9870');
    console.log('  • Spark Master UI: http://localhost:8080');
    console.log('  • Spark Worker 1 UI: http://localhost:8081');
    console.log('  • Spark Worker 2 UI: http://localhost:8082');
    console.log('  • Jupyter Spark: http://localhost:8888');
    console.log('  • Zeppelin: http://localhost:8890');
    console.log('');
    console.log('🔍 Health Checks:');
    console.log('  • Hadoop NameNode: http://localhost:9870/jmx?qry=Hadoop:service=NameNode,name=NameNodeStatus');
    console.log('  • Spark Master: http://localhost:8080/api/v1/applications');
    console.log('');
  }

  /**
   * Setup graceful shutdown
   */
  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      if (this.isShuttingDown) return;
      
      console.log(`\n🛑 Received ${signal}, shutting down Big Data infrastructure gracefully...`);
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
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run if called directly
if (require.main === module) {
  const manager = new BigDataInfrastructureManager();
  manager.start().catch(console.error);
}

module.exports = BigDataInfrastructureManager; 