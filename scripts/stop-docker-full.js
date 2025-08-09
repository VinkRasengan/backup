#!/usr/bin/env node
/**
 * Full Docker Stop Script
 * Stops all Docker services including frontend and monitoring
 */

import { exec  } from 'child_process';
const util = require('util');

const execAsync = util.promisify(exec);

class FullDockerStopper {
  constructor() {
    this.composeFile = 'docker-compose.dev.yml';
  }

  /**
   * Main stop method
   */
  async stop() {
    console.log('🛑 Stopping FactCheck Platform Docker Stack...\n');
    
    try {
      // Step 1: Stop Docker Compose services
      await this.stopDockerServices();
      
      // Step 2: Clean up containers and networks
      await this.cleanup();
      
      // Step 3: Show status
      await this.showStatus();
      
      console.log('\n✅ All services stopped successfully!');
      
    } catch (error) {
      console.error('❌ Error stopping services:', error.message);
      process.exit(1);
    }
  }

  /**
   * Stop Docker services
   */
  async stopDockerServices() {
    console.log('🐳 Stopping Docker Compose services...');
    
    try {
      const command = `docker-compose -f ${this.composeFile} down --remove-orphans`;
      console.log(`  🔧 Running: ${command}`);
      
      const { stdout, stderr } = await execAsync(command, { timeout: 60000 });
      
      if (stdout) {
        console.log('  ✅ Docker services stopped');
      }
      
      if (stderr && !stderr.includes('warning') && !stderr.includes('WARNING')) {
        console.warn('  ⚠️  Docker warnings:', stderr);
      }
      
    } catch (error) {
      console.log('  ⚠️  Error stopping Docker services:', error.message);
    }
  }

  /**
   * Clean up containers and networks
   */
  async cleanup() {
    console.log('🧹 Cleaning up...');
    
    try {
      // Remove any dangling containers
      await execAsync('docker container prune -f', { timeout: 30000 });
      console.log('  ✅ Cleaned up stopped containers');
      
      // Remove unused networks
      await execAsync('docker network prune -f', { timeout: 30000 });
      console.log('  ✅ Cleaned up unused networks');
      
    } catch (error) {
      console.log('  ⚠️  Cleanup warnings (this is usually normal)');
    }
  }

  /**
   * Show current status
   */
  async showStatus() {
    console.log('📊 Current Docker Status:');
    
    try {
      const { stdout } = await execAsync('docker ps --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"', { timeout: 10000 });
      
      if (stdout.trim()) {
        console.log('\n  🔍 Running containers:');
        console.log(stdout);
      } else {
        console.log('  ✅ No containers running');
      }
      
    } catch (error) {
      console.log('  ⚠️  Could not check Docker status');
    }
  }
}

// Stop the platform
const stopper = new FullDockerStopper();
stopper.stop().catch(console.error);
