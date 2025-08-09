#!/usr/bin/env node
/**
 * Fullstack Start Script
 * Starts the complete FactCheck Platform with all services
 * This is the main entry point for fullstack development
 */

import { spawn, exec  } from 'child_process';
import path from 'path';
import fs from 'fs';

class FullstackStarter {
  constructor() {
    this.rootDir = process.cwd();
    this.isWindows = process.platform === 'win32';
  }

  /**
   * Main start function
   */
  async start() {
    console.log('🚀 FactCheck Platform - Fullstack Start');
    console.log('=' .repeat(60));
    
    try {
      // Check if Docker is available
      const hasDocker = await this.checkDocker();
      
      if (hasDocker) {
        console.log('🐳 Docker detected - Starting full Docker stack...');
        await this.startDockerFullstack();
      } else {
        console.log('💻 Docker not available - Starting local development stack...');
        await this.startLocalFullstack();
      }
      
    } catch (error) {
      console.error('❌ Fullstack start failed:', error.message);
      console.log('\n🔍 Troubleshooting:');
      console.log('  - For Docker: npm run docker:start');
      console.log('  - For local: npm run start:separate');
      console.log('  - For together: npm run start:together');
      process.exit(1);
    }
  }

  /**
   * Check if Docker is available
   */
  async checkDocker() {
    try {
      await this.execAsync('docker --version', { timeout: 3000 });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Start Docker fullstack
   */
  async startDockerFullstack() {
    console.log('\n🐳 Starting Docker Fullstack...');
    
    try {
      // Use the existing Docker start script
      const child = spawn('node', ['scripts/docker-start-simple.js'], {
        cwd: this.rootDir,
        stdio: 'inherit'
      });
      
      return new Promise((resolve, reject) => {
        child.on('close', (code) => {
          if (code === 0) {
            console.log('\n✅ Docker Fullstack started successfully!');
            this.showDockerSummary();
            resolve();
          } else {
            reject(new Error(`Docker start failed with code ${code}`));
          }
        });
        
        child.on('error', (error) => {
          reject(error);
        });
      });
      
    } catch (error) {
      throw new Error(`Docker fullstack failed: ${error.message}`);
    }
  }

  /**
   * Start local fullstack
   */
  async startLocalFullstack() {
    console.log('\n💻 Starting Local Fullstack...');
    
    try {
      // Start infrastructure first
      await this.startInfrastructure();
      
      // Start all services together
      const child = spawn('node', ['scripts/start-fast-together.js'], {
        cwd: this.rootDir,
        stdio: 'inherit'
      });
      
      return new Promise((resolve, reject) => {
        child.on('close', (code) => {
          if (code === 0) {
            console.log('\n✅ Local Fullstack started successfully!');
            this.showLocalSummary();
            resolve();
          } else {
            reject(new Error(`Local start failed with code ${code}`));
          }
        });
        
        child.on('error', (error) => {
          reject(error);
        });
      });
      
    } catch (error) {
      throw new Error(`Local fullstack failed: ${error.message}`);
    }
  }

  /**
   * Start infrastructure services
   */
  async startInfrastructure() {
    console.log('🏗️  Starting infrastructure...');
    
    try {
      // Try to start Redis and RabbitMQ
      const child = spawn('node', ['scripts/start-infrastructure-fallback.js', 'start'], {
        cwd: this.rootDir,
        stdio: 'pipe'
      });
      
      // Don't wait for completion - just start it in background
      child.unref();
      
      console.log('  ✅ Infrastructure starting in background');
      
    } catch (error) {
      console.log('  ⚠️  Infrastructure start failed - continuing without');
    }
  }

  /**
   * Show Docker summary
   */
  showDockerSummary() {
    console.log('\n🎉 Docker Fullstack Complete!');
    console.log('=' .repeat(60));
    console.log('\n🌐 Access URLs:');
    console.log('  🎯 Frontend:        http://localhost:3000');
    console.log('  🚪 API Gateway:     http://localhost:8080');
    console.log('  🔐 Auth Service:    http://localhost:3001');
    console.log('  🔗 Link Service:    http://localhost:3002');
    console.log('  👥 Community:       http://localhost:3003');
    console.log('  💬 Chat Service:    http://localhost:3004');
    console.log('  📰 News Service:    http://localhost:3005');
    console.log('  👨‍💼 Admin Service:   http://localhost:3006');
    console.log('  📊 RabbitMQ UI:     http://localhost:15672');
    console.log('  🗄️  KurrentDB:       http://localhost:2113');
    
    console.log('\n🛠️  Management:');
    console.log('  📋 View logs:       npm run docker:logs');
    console.log('  🛑 Stop all:        npm run docker:stop');
    console.log('  🔄 Restart:         npm run docker:restart');
    console.log('  📊 Health check:    npm run docker:health');
  }

  /**
   * Show local summary
   */
  showLocalSummary() {
    console.log('\n🎉 Local Fullstack Complete!');
    console.log('=' .repeat(60));
    console.log('\n🌐 Access URLs:');
    console.log('  🎯 Frontend:        http://localhost:3000');
    console.log('  🚪 API Gateway:     http://localhost:8080');
    console.log('  🔐 Auth Service:    http://localhost:3001');
    console.log('  🔗 Link Service:    http://localhost:3002');
    console.log('  👥 Community:       http://localhost:3003');
    console.log('  💬 Chat Service:    http://localhost:3004');
    console.log('  📰 News Service:    http://localhost:3005');
    console.log('  👨‍💼 Admin Service:   http://localhost:3006');
    
    console.log('\n🛠️  Management:');
    console.log('  🛑 Stop all:        npm run stop');
    console.log('  📊 Check status:    npm run status');
    console.log('  🔄 Restart:         npm run restart');
    console.log('  🪟 Separate mode:   npm run start:separate');
    console.log('  🐳 Docker mode:     npm run docker:start');
  }

  /**
   * Execute async command
   */
  execAsync(command, options = {}) {
    return new Promise((resolve, reject) => {
      exec(command, { cwd: this.rootDir, ...options }, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve({ stdout, stderr });
        }
      });
    });
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Fullstack start interrupted');
  console.log('💡 Services are running - use appropriate stop command');
  process.exit(0);
});

// Run fullstack start
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const fullstackStarter = new FullstackStarter();
  fullstackStarter.start().catch(console.error);
}

export default FullstackStarter; 