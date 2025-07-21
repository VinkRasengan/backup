#!/usr/bin/env node

/**
 * Stop All - Universal Stop Script
 * Stops all running services across different deployment methods
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

class UniversalStop {
  constructor() {
    this.rootDir = process.cwd();
    this.pidFiles = [
      '.local-deploy-pids',
      '.node-deploy-pids',
      '.service-pids'
    ];
    this.ports = [3000, 3001, 3002, 3003, 3004, 3005, 3006, 3007, 3008, 3009, 8080, 6379, 5672, 15672];
  }

  /**
   * Main stop function
   */
  async stop() {
    console.log('🛑 Stopping All Services - Universal Stop');
    console.log('=' .repeat(50));

    try {
      await this.stopProcessesByPid();
      await this.stopProcessesByPort();
      await this.stopDockerContainers();
      await this.stopKubernetesServices();
      await this.cleanup();
      
      console.log('\n✅ All services stopped successfully!');
      console.log('💡 You can restart with: npm start');
    } catch (error) {
      console.error('❌ Stop failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Stop processes by saved PIDs
   */
  async stopProcessesByPid() {
    console.log('🔍 Stopping processes by PID...');
    
    for (const pidFile of this.pidFiles) {
      const pidFilePath = path.join(this.rootDir, pidFile);
      
      if (fs.existsSync(pidFilePath)) {
        console.log(`  📄 Found PID file: ${pidFile}`);
        
        const pids = fs.readFileSync(pidFilePath, 'utf8')
          .split('\n')
          .filter(Boolean)
          .map(pid => pid.trim())
          .filter(pid => pid && !isNaN(pid));
        
        for (const pid of pids) {
          try {
            if (os.platform() === 'win32') {
              await this.execAsync(`taskkill /PID ${pid} /F /T`);
            } else {
              process.kill(parseInt(pid), 'SIGTERM');
              // Give process time to gracefully shutdown
              await this.sleep(1000);
              try {
                process.kill(parseInt(pid), 'SIGKILL');
              } catch (e) {
                // Process already dead
              }
            }
            console.log(`    ✅ Stopped process PID: ${pid}`);
          } catch (error) {
            console.log(`    ⚠️  Process PID ${pid} might already be stopped`);
          }
        }
        
        // Remove PID file
        fs.unlinkSync(pidFilePath);
        console.log(`    🗑️  Removed PID file: ${pidFile}`);
      }
    }
  }

  /**
   * Stop processes by port
   */
  async stopProcessesByPort() {
    console.log('🔌 Stopping processes by port...');
    
    for (const port of this.ports) {
      try {
        await this.killProcessOnPort(port);
        console.log(`  ✅ Stopped process on port ${port}`);
      } catch (error) {
        console.log(`  ⚠️  No process found on port ${port}`);
      }
    }
  }

  /**
   * Kill process running on specific port
   */
  async killProcessOnPort(port) {
    return new Promise((resolve, reject) => {
      if (os.platform() === 'win32') {
        exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
          if (stdout) {
            const lines = stdout.split('\n');
            let killed = false;
            
            lines.forEach(line => {
              const parts = line.trim().split(/\s+/);
              if (parts.length > 4) {
                const pid = parts[parts.length - 1];
                if (pid && !isNaN(pid)) {
                  exec(`taskkill /PID ${pid} /F`, () => {});
                  killed = true;
                }
              }
            });
            
            if (killed) {
              resolve();
            } else {
              reject(new Error('No process found'));
            }
          } else {
            reject(new Error('No process found'));
          }
        });
      } else {
        exec(`lsof -ti:${port}`, (error, stdout) => {
          if (stdout) {
            const pids = stdout.trim().split('\n');
            pids.forEach(pid => {
              if (pid && !isNaN(pid)) {
                try {
                  process.kill(parseInt(pid), 'SIGTERM');
                  setTimeout(() => {
                    try {
                      process.kill(parseInt(pid), 'SIGKILL');
                    } catch (e) {
                      // Process already dead
                    }
                  }, 2000);
                } catch (e) {
                  // Process might already be dead
                }
              }
            });
            resolve();
          } else {
            reject(new Error('No process found'));
          }
        });
      }
    });
  }

  /**
   * Stop Docker containers
   */
  async stopDockerContainers() {
    console.log('🐳 Stopping Docker containers...');
    
    try {
      // Check if Docker is available
      await this.execAsync('docker --version');
      
      const composeFiles = [
        'docker-compose.yml',
        'docker-compose.dev.yml',
        'docker-compose.local.yml'
      ];
      
      for (const composeFile of composeFiles) {
        const composePath = path.join(this.rootDir, composeFile);
        if (fs.existsSync(composePath)) {
          try {
            await this.execAsync(`docker-compose -f ${composeFile} down --remove-orphans`, {
              cwd: this.rootDir
            });
            console.log(`  ✅ Stopped containers from ${composeFile}`);
          } catch (error) {
            console.log(`  ⚠️  No running containers from ${composeFile}`);
          }
        }
      }
      
      // Stop individual containers by name pattern
      const containerPatterns = [
        'factcheck-*',
        'antifraud-*',
        '*-local'
      ];

      for (const pattern of containerPatterns) {
        try {
          const containers = await this.execAsync(`docker ps -q --filter "name=${pattern}"`);
          if (containers.trim()) {
            await this.execAsync(`docker stop ${containers.trim().replace(/\n/g, ' ')}`);
            console.log(`  ✅ Stopped containers matching ${pattern}`);
          }
        } catch (error) {
          // No containers found
        }
      }

      // Stop infrastructure containers specifically
      const infrastructureContainers = [
        'factcheck-redis',
        'factcheck-rabbitmq',
        'factcheck-event-bus'
      ];

      for (const containerName of infrastructureContainers) {
        try {
          await this.execAsync(`docker stop ${containerName}`);
          await this.execAsync(`docker rm ${containerName}`);
          console.log(`  ✅ Stopped and removed ${containerName}`);
        } catch (error) {
          // Container not found or already stopped
        }
      }
      
    } catch (error) {
      console.log('  ⚠️  Docker not available or no containers running');
    }
  }

  /**
   * Stop Kubernetes services
   */
  async stopKubernetesServices() {
    console.log('☸️  Stopping Kubernetes services...');
    
    try {
      // Check if kubectl is available
      await this.execAsync('kubectl version --client --short');
      
      const namespaces = [
        'factcheck-local',
        'anti-fraud-platform',
        'antifraud'
      ];
      
      for (const namespace of namespaces) {
        try {
          // Check if namespace exists
          await this.execAsync(`kubectl get namespace ${namespace}`);
          
          // Scale down all deployments
          const deployments = await this.execAsync(`kubectl get deployments -n ${namespace} -o name`);
          if (deployments.trim()) {
            const deploymentNames = deployments.trim().split('\n');
            for (const deployment of deploymentNames) {
              await this.execAsync(`kubectl scale ${deployment} --replicas=0 -n ${namespace}`);
            }
            console.log(`  ✅ Scaled down deployments in namespace ${namespace}`);
          }
          
        } catch (error) {
          console.log(`  ⚠️  Namespace ${namespace} not found or no deployments`);
        }
      }
      
    } catch (error) {
      console.log('  ⚠️  kubectl not available or no Kubernetes services running');
    }
  }

  /**
   * Cleanup temporary files
   */
  async cleanup() {
    console.log('🧹 Cleaning up...');
    
    // Remove temporary files
    const tempFiles = [
      '.local-deploy-pids',
      '.node-deploy-pids',
      '.service-pids',
      'docker-compose.local.yml'
    ];
    
    for (const file of tempFiles) {
      const filePath = path.join(this.rootDir, file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`  🗑️  Removed ${file}`);
      }
    }
    
    // Clean up k8s local manifests
    const k8sDir = path.join(this.rootDir, 'k8s');
    if (fs.existsSync(k8sDir)) {
      const localManifests = fs.readdirSync(k8sDir)
        .filter(file => file.includes('-local.yml'));
      
      for (const manifest of localManifests) {
        const manifestPath = path.join(k8sDir, manifest);
        fs.unlinkSync(manifestPath);
        console.log(`  🗑️  Removed k8s/${manifest}`);
      }
    }
    
    console.log('  ✅ Cleanup completed');
  }

  /**
   * Utility functions
   */
  execAsync(command, options = {}) {
    return new Promise((resolve, reject) => {
      exec(command, { timeout: 30000, ...options }, (error, stdout, stderr) => {
        if (error) reject(error);
        else resolve(stdout);
      });
    });
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Stop operation interrupted');
  process.exit(0);
});

// Run stop
if (require.main === module) {
  const stop = new UniversalStop();
  stop.stop().catch(console.error);
}

module.exports = UniversalStop;
