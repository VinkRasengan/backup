#!/usr/bin/env node

/**
 * Simple Docker Start Script
 * Starts the full FactCheck Platform using docker-compose.yml
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

class SimpleDockerStart {
  constructor() {
    this.rootDir = process.cwd();
    this.composeFile = 'docker-compose.yml';
  }

  /**
   * Main start function
   */
  async start() {
    console.log('🐳 Starting FactCheck Platform - Full Docker Stack');
    console.log('=' .repeat(60));

    try {
      await this.checkPrerequisites();
      await this.startServices();
      await this.showStatus();
      this.showSummary();
    } catch (error) {
      console.error('❌ Start failed:', error.message);
      console.log('\n🔍 Troubleshooting tips:');
      console.log('  - Check Docker Desktop is running');
      console.log('  - Run: docker compose logs -f');
      console.log('  - Check port conflicts: netstat -an | findstr :3000');
      process.exit(1);
    }
  }

  /**
   * Check prerequisites
   */
  async checkPrerequisites() {
    console.log('🔍 Checking prerequisites...');

    // Check if Docker is available
    try {
      await this.execAsync('docker --version');
      console.log('  ✅ Docker is available');
    } catch (error) {
      throw new Error('Docker is not installed or not running');
    }

    // Check if docker-compose.yml exists
    const composePath = path.join(this.rootDir, this.composeFile);
    if (!fs.existsSync(composePath)) {
      throw new Error(`${this.composeFile} not found`);
    }
    console.log('  ✅ docker-compose.yml found');

    // Check if .env file exists
    const envPath = path.join(this.rootDir, '.env');
    if (!fs.existsSync(envPath)) {
      console.log('  ⚠️  .env file not found - using defaults');
    } else {
      console.log('  ✅ .env file found');
    }
  }

  /**
   * Start services
   */
  async startServices() {
    console.log('\n🚀 Starting services...');
    
    try {
      // Stop any existing containers first
      await this.execAsync(`docker compose -f ${this.composeFile} down --remove-orphans`);
      console.log('  ✅ Cleaned up existing containers');
    } catch (error) {
      console.log('  ℹ️  No existing containers to clean up');
    }

    // Start services
    console.log('  🔄 Building and starting containers...');
    await this.execAsync(`docker compose -f ${this.composeFile} up -d --build`);
    console.log('  ✅ All services started');

    // Wait a moment for services to initialize
    console.log('  ⏳ Waiting for services to initialize...');
    await this.sleep(10000);
  }

  /**
   * Show service status
   */
  async showStatus() {
    console.log('\n📊 Service Status:');
    
    try {
      const result = await this.execAsync(`docker compose -f ${this.composeFile} ps`);
      console.log(result.stdout);
    } catch (error) {
      console.log('  ⚠️  Could not get service status');
    }
  }

  /**
   * Show summary
   */
  showSummary() {
    console.log('\n✅ FactCheck Platform Started Successfully!');
    console.log('=' .repeat(60));
    console.log('\n🌐 Access URLs:');
    console.log('  Frontend:        http://localhost:3000');
    console.log('  API Gateway:     http://localhost:8080');
    console.log('  RabbitMQ UI:     http://localhost:15672 (factcheck/antifraud123)');
    console.log('  KurrentDB:       http://localhost:2113');
    console.log('  Prometheus:      http://localhost:9090');
    console.log('  Grafana:         http://localhost:3010 (admin/admin)');
    
    console.log('\n🔧 Useful Commands:');
    console.log('  View logs:       npm run docker:logs');
    console.log('  Stop services:   npm run docker:stop');
    console.log('  Health check:    npm run docker:health');
    console.log('  Restart:         npm run docker:restart');
    
    console.log('\n📋 Service Ports:');
    console.log('  Auth Service:    http://localhost:3001');
    console.log('  Link Service:    http://localhost:3002');
    console.log('  Community:       http://localhost:3003');
    console.log('  Chat Service:    http://localhost:3004');
    console.log('  News Service:    http://localhost:3005');
    console.log('  Admin Service:   http://localhost:3006');
    console.log('  Event Bus:       http://localhost:3007');
    console.log('  ETL Service:     http://localhost:3008');
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

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run if called directly
if (require.main === module) {
  const deployment = new SimpleDockerStart();
  deployment.start();
}

module.exports = SimpleDockerStart;
