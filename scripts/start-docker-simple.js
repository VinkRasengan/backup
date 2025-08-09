#!/usr/bin/env node
/**
 * Simple Docker Start Script
 * Starts all services with Docker Compose without complex health checks
 */

import { exec  } from 'child_process';
const util = require('util');

const execAsync = util.promisify(exec);

class SimpleDockerStarter {
  constructor() {
    this.composeFile = 'docker-compose.dev.yml';
  }

  /**
   * Main start method
   */
  async start() {
    console.log('🐳 Starting FactCheck Platform with Docker...\n');
    
    try {
      // Step 1: Check Docker
      await this.checkDocker();
      
      // Step 2: Stop existing containers
      await this.stopExisting();
      
      // Step 3: Start services
      await this.startServices();
      
      // Step 4: Show info
      this.showInfo();
      
    } catch (error) {
      console.error('❌ Failed to start:', error.message);
      process.exit(1);
    }
  }

  /**
   * Check Docker
   */
  async checkDocker() {
    console.log('🔍 Checking Docker...');
    
    try {
      await execAsync('docker --version', { timeout: 5000 });
      await execAsync('docker-compose --version', { timeout: 5000 });
      console.log('  ✅ Docker is available');
    } catch (error) {
      throw new Error('Docker is not available. Please install Docker and try again.');
    }
  }

  /**
   * Stop existing containers
   */
  async stopExisting() {
    console.log('🛑 Stopping existing containers...');
    
    try {
      await execAsync(`docker-compose -f ${this.composeFile} down`, { timeout: 30000 });
      console.log('  ✅ Stopped existing containers');
    } catch (error) {
      console.log('  ℹ️  No existing containers to stop');
    }
  }

  /**
   * Start services
   */
  async startServices() {
    console.log('🚀 Starting all services...');
    console.log('  📦 Building and starting containers (this may take a few minutes)...\n');
    
    try {
      const command = `docker-compose -f ${this.composeFile} up --build -d`;
      console.log(`  🔧 Running: ${command}\n`);
      
      // Show real-time output
      const child = exec(command, { timeout: 300000 });
      
      child.stdout.on('data', (data) => {
        process.stdout.write(data);
      });
      
      child.stderr.on('data', (data) => {
        process.stderr.write(data);
      });
      
      await new Promise((resolve, reject) => {
        child.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Docker compose failed with code ${code}`));
          }
        });
        
        child.on('error', reject);
      });
      
      console.log('\n  ✅ All services started successfully!');
      
    } catch (error) {
      throw new Error(`Failed to start services: ${error.message}`);
    }
  }

  /**
   * Show access information
   */
  showInfo() {
    console.log('\n🎉 FactCheck Platform started successfully!\n');
    
    console.log('📊 Access Points:');
    console.log('  🌐 Frontend:          http://localhost:3000');
    console.log('  🚪 API Gateway:       http://localhost:8080');
    console.log('  👤 Auth Service:      http://localhost:3001');
    console.log('  🔗 Link Service:      http://localhost:3002');
    console.log('  💬 Community Service: http://localhost:3003');
    console.log('  💭 Chat Service:      http://localhost:3004');
    console.log('  📰 News Service:      http://localhost:3005');
    console.log('  ⚙️  Admin Service:     http://localhost:3006');
    console.log('');
    console.log('📈 Monitoring:');
    console.log('  📊 Prometheus:        http://localhost:9090');
    console.log('  📈 Grafana:           http://localhost:3010 (admin/admin123)');
    console.log('');
    console.log('🛠️  Management:');
    console.log('  📋 Check status:      npm run docker:status');
    console.log('  📋 View logs:         npm run docker:logs');
    console.log('  📋 Health check:      npm run docker:health');
    console.log('  🛑 Stop services:     npm stop');
    console.log('');
    console.log('⏳ Services may take 1-2 minutes to fully start up.');
    console.log('💡 Check individual service health at their /health endpoints.');
    console.log('');
    console.log('✨ Platform is now running in Docker containers!');
  }
}

// Start the platform
const starter = new SimpleDockerStarter();
starter.start().catch(console.error);
