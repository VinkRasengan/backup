import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
#!/usr/bin/env node
/**
 * Simple Docker Stop Script
 * Stops all Docker services and cleans up containers
 */

import { exec  } from 'child_process';
const util = require('util');
import path from 'path';

const execAsync = util.promisify(exec);

class DockerStopper {
  constructor() {
    this.rootDir = path.resolve(__dirname, '..');
    this.composeFile = 'docker-compose.dev.yml';
  }

  /**
   * Main stop method
   */
  async stop() {
    console.log('🛑 Stopping FactCheck Platform Docker Services...\n');
    
    try {
      // Step 1: Check Docker
      await this.checkDocker();
      
      // Step 2: Stop Docker Compose services
      await this.stopDockerServices();
      
      // Step 3: Clean up containers and networks
      await this.cleanup();
      
      // Step 4: Show final status
      await this.showStatus();
      
      console.log('\n✅ All services stopped successfully!');
      console.log('💡 Use "npm start" to start services again');
      
    } catch (error) {
      console.error('❌ Error stopping services:', error.message);
      console.log('\n🔧 Manual cleanup commands:');
      console.log('• docker-compose -f docker-compose.dev.yml down --remove-orphans');
      console.log('• docker container prune -f');
      console.log('• docker network prune -f');
      process.exit(1);
    }
  }

  /**
   * Check Docker availability
   */
  async checkDocker() {
    console.log('1. 🔍 Checking Docker...');
    
    try {
      await execAsync('docker info', { timeout: 10000 });
      console.log('  ✅ Docker is running');
    } catch (error) {
      throw new Error('Docker is not running. Please start Docker Desktop.');
    }
  }

  /**
   * Stop Docker services
   */
  async stopDockerServices() {
    console.log('2. 🐳 Stopping Docker Compose services...');
    
    try {
      const command = `docker-compose -f ${this.composeFile} down --remove-orphans`;
      console.log(`  🔧 Running: ${command}`);
      
      const { stdout, stderr } = await execAsync(command, { 
        cwd: this.rootDir,
        timeout: 120000 // 2 minutes timeout
      });
      
      if (stdout) {
        console.log('  ✅ Docker services stopped');
      }
      
      if (stderr && !stderr.includes('warning') && !stderr.includes('WARNING')) {
        console.warn('  ⚠️  Docker warnings:', stderr);
      }
      
    } catch (error) {
      // Try to stop individual containers if compose fails
      console.log('  ⚠️  Docker Compose failed, trying individual containers...');
      await this.stopIndividualContainers();
    }
  }

  /**
   * Stop individual containers if compose fails
   */
  async stopIndividualContainers() {
    const containerNames = [
      'factcheck-frontend',
      'factcheck-api-gateway',
      'factcheck-auth-service',
      'factcheck-link-service',
      'factcheck-community-service',
      'factcheck-chat-service',
      'factcheck-news-service',
      'factcheck-admin-service',
      'factcheck-redis',
      'factcheck-prometheus',
      'factcheck-grafana'
    ];
    
    console.log('  🔄 Stopping individual containers...');
    
    for (const containerName of containerNames) {
      try {
        await execAsync(`docker stop ${containerName}`, { timeout: 30000 });
        await execAsync(`docker rm ${containerName}`, { timeout: 10000 });
        console.log(`    ✅ Stopped ${containerName}`);
      } catch (error) {
        // Container might not exist, which is fine
        console.log(`    ℹ️  ${containerName} not found (already stopped)`);
      }
    }
  }

  /**
   * Clean up containers and networks
   */
  async cleanup() {
    console.log('3. 🧹 Cleaning up...');
    
    try {
      // Remove any stopped containers
      console.log('  🗑️  Removing stopped containers...');
      await execAsync('docker container prune -f', { timeout: 30000 });
      console.log('  ✅ Cleaned up stopped containers');
      
      // Remove unused networks
      console.log('  🌐 Removing unused networks...');
      await execAsync('docker network prune -f', { timeout: 30000 });
      console.log('  ✅ Cleaned up unused networks');
      
      // Remove dangling images (optional)
      try {
        console.log('  🖼️  Removing dangling images...');
        await execAsync('docker image prune -f', { timeout: 30000 });
        console.log('  ✅ Cleaned up dangling images');
      } catch (error) {
        console.log('  ℹ️  No dangling images to clean');
      }
      
    } catch (error) {
      console.log('  ⚠️  Some cleanup operations failed (this is usually normal)');
    }
  }

  /**
   * Show current status
   */
  async showStatus() {
    console.log('4. 📊 Current Docker Status:');
    
    try {
      // Check running containers
      const { stdout: containers } = await execAsync(
        'docker ps --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"', 
        { timeout: 10000 }
      );
      
      if (containers.trim() && !containers.includes('NAMES')) {
        console.log('\n  🔍 Still running containers:');
        console.log(containers);
      } else {
        console.log('  ✅ No project containers running');
      }
      
      // Check project-specific containers
      const { stdout: projectContainers } = await execAsync(
        'docker ps -a --filter "name=factcheck" --format "table {{.Names}}\\t{{.Status}}"',
        { timeout: 10000 }
      );
      
      if (projectContainers.trim() && !projectContainers.includes('NAMES')) {
        console.log('\n  📋 Project containers status:');
        console.log(projectContainers);
      }
      
    } catch (error) {
      console.log('  ⚠️  Could not check Docker status');
    }
    
    // Show disk usage
    try {
      const { stdout: diskUsage } = await execAsync('docker system df', { timeout: 10000 });
      console.log('\n  💾 Docker disk usage:');
      console.log(diskUsage);
    } catch (error) {
      console.log('  ℹ️  Could not check disk usage');
    }
  }

  /**
   * Force stop all project containers
   */
  async forceStop() {
    console.log('🚨 Force stopping all project containers...');
    
    try {
      // Get all containers with factcheck in name
      const { stdout } = await execAsync(
        'docker ps -aq --filter "name=factcheck"',
        { timeout: 10000 }
      );
      
      if (stdout.trim()) {
        const containerIds = stdout.trim().split('\n');
        
        // Force stop containers
        for (const containerId of containerIds) {
          try {
            await execAsync(`docker kill ${containerId}`, { timeout: 10000 });
            await execAsync(`docker rm ${containerId}`, { timeout: 10000 });
          } catch (error) {
            // Ignore errors for individual containers
          }
        }
        
        console.log(`  ✅ Force stopped ${containerIds.length} containers`);
      } else {
        console.log('  ℹ️  No project containers found');
      }
      
    } catch (error) {
      console.log('  ⚠️  Force stop failed:', error.message);
    }
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
const forceMode = args.includes('--force') || args.includes('-f');

// Stop if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const stopper = new DockerStopper();
  
  if (forceMode) {
    stopper.forceStop().then(() => {
      console.log('✅ Force stop completed');
    }).catch(console.error);
  } else {
    stopper.stop().catch(console.error);
  }
}

export default DockerStopper;
