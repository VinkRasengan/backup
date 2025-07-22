#!/usr/bin/env node

/**
 * Stop All - Enhanced Universal Stop Script
 * Stops all running services, processes, and terminal windows
 * Enhanced for Windows with better process and terminal management
 */

const { exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

class UniversalStop {
  constructor() {
    this.rootDir = process.cwd();
    this.pidFiles = [
      '.local-deploy-pids',
      '.node-deploy-pids',
      '.service-pids',
      '.fast-start-pids'
    ];
    this.ports = [3000, 3001, 3002, 3003, 3004, 3005, 3006, 3007, 3008, 3009, 8080, 6379, 5672, 15672];
    this.isWindows = os.platform() === 'win32';

    // Service-related process patterns to kill
    this.processPatterns = [
      'node.*auth-service',
      'node.*link-service',
      'node.*community-service',
      'node.*chat-service',
      'node.*news-service',
      'node.*admin-service',
      'node.*api-gateway',
      'node.*event-bus-service',
      'node.*client',
      'npm.*start',
      'npm.*dev',
      'nodemon',
      'react-scripts'
    ];

    // Terminal window titles to close
    this.terminalTitles = [
      'Auth Service',
      'Link Service',
      'Community Service',
      'Chat Service',
      'News Service',
      'Admin Service',
      'API Gateway',
      'Event Bus',
      'Frontend'
    ];
  }

  /**
   * Main stop function - Enhanced with better process and terminal management
   */
  async stop() {
    console.log('🛑 Enhanced Stop All Services - Universal Stop');
    console.log('=' .repeat(60));

    try {
      // Enhanced stopping sequence
      await this.stopProcessesByPid();
      await this.stopProcessesByPattern();
      await this.stopProcessesByPort();
      await this.closeTerminalWindows();
      await this.stopDockerContainers();
      await this.stopKubernetesServices();
      await this.forceKillRemainingProcesses();
      await this.cleanup();

      console.log('\n✅ All services, processes, and terminals stopped successfully!');
      console.log('💡 You can restart with: npm start');
    } catch (error) {
      console.error('❌ Stop failed:', error.message);
      console.log('🔄 Attempting force cleanup...');
      await this.forceKillRemainingProcesses();
      process.exit(1);
    }
  }

  /**
   * Stop processes by saved PIDs - Enhanced with tree killing
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
            if (this.isWindows) {
              // Enhanced Windows process killing with tree termination
              await this.execAsync(`taskkill /PID ${pid} /F /T`, { timeout: 5000 });
              console.log(`    ✅ Force killed process tree PID: ${pid}`);
            } else {
              // Unix process killing
              process.kill(parseInt(pid), 'SIGTERM');
              await this.sleep(1000);
              try {
                process.kill(parseInt(pid), 'SIGKILL');
              } catch (e) {
                // Process already dead
              }
              console.log(`    ✅ Stopped process PID: ${pid}`);
            }
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
   * Stop processes by pattern matching - New enhanced method
   */
  async stopProcessesByPattern() {
    console.log('🎯 Stopping processes by pattern...');

    if (this.isWindows) {
      // Windows: Use wmic and taskkill for pattern matching
      for (const pattern of this.processPatterns) {
        try {
          // Find processes matching pattern
          const command = `wmic process where "CommandLine like '%${pattern.replace(/\.\*/g, '%')}%'" get ProcessId /format:value`;
          const result = await this.execAsync(command, { timeout: 5000 });

          const pids = result.split('\n')
            .filter(line => line.includes('ProcessId='))
            .map(line => line.split('=')[1])
            .filter(pid => pid && pid.trim() && !isNaN(pid.trim()));

          for (const pid of pids) {
            try {
              await this.execAsync(`taskkill /PID ${pid.trim()} /F /T`, { timeout: 3000 });
              console.log(`    ✅ Killed process matching '${pattern}' PID: ${pid.trim()}`);
            } catch (e) {
              // Process might already be dead
            }
          }
        } catch (error) {
          // Pattern not found or error - continue
        }
      }
    } else {
      // Unix: Use pkill for pattern matching
      for (const pattern of this.processPatterns) {
        try {
          await this.execAsync(`pkill -f "${pattern}"`, { timeout: 3000 });
          console.log(`    ✅ Killed processes matching '${pattern}'`);
        } catch (error) {
          // Pattern not found - continue
        }
      }
    }
  }

  /**
   * Close terminal windows - New method for Windows
   */
  async closeTerminalWindows() {
    if (!this.isWindows) {
      console.log('🪟 Terminal closing only supported on Windows');
      return;
    }

    console.log('🪟 Closing terminal windows...');

    for (const title of this.terminalTitles) {
      try {
        // Close windows by title
        await this.execAsync(`taskkill /FI "WINDOWTITLE eq ${title}*" /F`, { timeout: 3000 });
        console.log(`    ✅ Closed terminal: ${title}`);
      } catch (error) {
        // Window not found - continue
      }
    }

    // Also close any cmd windows with our service names
    try {
      await this.execAsync('taskkill /FI "IMAGENAME eq cmd.exe" /FI "WINDOWTITLE eq *Service*" /F', { timeout: 3000 });
      console.log('    ✅ Closed service-related cmd windows');
    } catch (error) {
      // No windows found
    }
  }

  /**
   * Stop processes by port - Enhanced
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
   * Kill process running on specific port - Enhanced
   */
  async killProcessOnPort(port) {
    return new Promise((resolve, reject) => {
      if (this.isWindows) {
        // Enhanced Windows port killing
        exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
          if (stdout) {
            const lines = stdout.split('\n');
            const killPromises = [];

            lines.forEach(line => {
              const parts = line.trim().split(/\s+/);
              if (parts.length > 4) {
                const pid = parts[parts.length - 1];
                if (pid && !isNaN(pid)) {
                  // Use /T flag to kill process tree
                  const killPromise = this.execAsync(`taskkill /PID ${pid} /F /T`)
                    .catch(() => {}); // Ignore errors
                  killPromises.push(killPromise);
                }
              }
            });

            if (killPromises.length > 0) {
              Promise.all(killPromises).then(() => resolve()).catch(() => resolve());
            } else {
              reject(new Error('No process found'));
            }
          } else {
            reject(new Error('No process found'));
          }
        });
      } else {
        // Unix port killing
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
   * Force kill any remaining processes - New method
   */
  async forceKillRemainingProcesses() {
    console.log('💀 Force killing any remaining processes...');

    if (this.isWindows) {
      // Kill any remaining Node.js processes related to our services
      const killCommands = [
        'taskkill /F /IM node.exe /FI "WINDOWTITLE eq *Service*"',
        'taskkill /F /IM node.exe /FI "WINDOWTITLE eq *Gateway*"',
        'taskkill /F /IM node.exe /FI "WINDOWTITLE eq *Frontend*"',
        'taskkill /F /IM cmd.exe /FI "WINDOWTITLE eq *Service*"',
        'taskkill /F /IM cmd.exe /FI "WINDOWTITLE eq *Gateway*"',
        'taskkill /F /IM cmd.exe /FI "WINDOWTITLE eq *Frontend*"'
      ];

      for (const command of killCommands) {
        try {
          await this.execAsync(command, { timeout: 3000 });
        } catch (error) {
          // Ignore errors - processes might not exist
        }
      }
    } else {
      // Unix force kill
      try {
        await this.execAsync('pkill -f "npm.*start"', { timeout: 3000 });
        await this.execAsync('pkill -f "node.*service"', { timeout: 3000 });
        await this.execAsync('pkill -f "react-scripts"', { timeout: 3000 });
      } catch (error) {
        // Ignore errors
      }
    }

    console.log('    ✅ Force kill completed');
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
   * Cleanup temporary files - Enhanced
   */
  async cleanup() {
    console.log('🧹 Enhanced cleanup...');

    // Remove temporary files
    const tempFiles = [
      '.local-deploy-pids',
      '.node-deploy-pids',
      '.service-pids',
      '.fast-start-pids',
      'docker-compose.local.yml'
    ];

    for (const file of tempFiles) {
      const filePath = path.join(this.rootDir, file);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log(`  🗑️  Removed ${file}`);
        } catch (error) {
          console.log(`  ⚠️  Could not remove ${file}: ${error.message}`);
        }
      }
    }

    // Clean up k8s local manifests
    const k8sDir = path.join(this.rootDir, 'k8s');
    if (fs.existsSync(k8sDir)) {
      try {
        const localManifests = fs.readdirSync(k8sDir)
          .filter(file => file.includes('-local.yml'));

        for (const manifest of localManifests) {
          const manifestPath = path.join(k8sDir, manifest);
          fs.unlinkSync(manifestPath);
          console.log(`  🗑️  Removed k8s/${manifest}`);
        }
      } catch (error) {
        console.log(`  ⚠️  Could not clean k8s directory: ${error.message}`);
      }
    }

    // Clear any remaining lock files
    const lockFiles = [
      'package-lock.json.lock',
      '.npm-lock'
    ];

    for (const lockFile of lockFiles) {
      const lockPath = path.join(this.rootDir, lockFile);
      if (fs.existsSync(lockPath)) {
        try {
          fs.unlinkSync(lockPath);
          console.log(`  🗑️  Removed lock file: ${lockFile}`);
        } catch (error) {
          // Ignore lock file errors
        }
      }
    }

    console.log('  ✅ Enhanced cleanup completed');
  }

  /**
   * Utility functions - Enhanced
   */
  execAsync(command, options = {}) {
    return new Promise((resolve, reject) => {
      const timeout = options.timeout || 30000;
      const child = exec(command, {
        timeout,
        windowsHide: true, // Hide windows on Windows
        ...options
      }, (error, stdout, stderr) => {
        if (error) {
          // Don't reject on expected errors (like process not found)
          if (error.message.includes('not found') ||
              error.message.includes('No such process') ||
              error.message.includes('not running')) {
            resolve('');
          } else {
            reject(error);
          }
        } else {
          resolve(stdout);
        }
      });

      // Ensure timeout
      setTimeout(() => {
        if (!child.killed) {
          child.kill('SIGKILL');
          resolve('');
        }
      }, timeout);
    });
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Enhanced stop operation interrupted');
  console.log('💀 Performing emergency cleanup...');

  // Emergency cleanup
  const stop = new UniversalStop();
  stop.forceKillRemainingProcesses()
    .then(() => {
      console.log('✅ Emergency cleanup completed');
      process.exit(0);
    })
    .catch(() => {
      console.log('⚠️  Emergency cleanup had issues');
      process.exit(1);
    });
});

// Run enhanced stop
if (require.main === module) {
  console.log('🚀 Starting Enhanced Universal Stop...');
  const stop = new UniversalStop();
  stop.stop()
    .then(() => {
      console.log('\n🎉 Enhanced stop completed successfully!');
      console.log('💡 All processes, terminals, and services have been stopped');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Enhanced stop failed:', error.message);
      console.log('🔄 Running emergency cleanup...');
      stop.forceKillRemainingProcesses()
        .then(() => process.exit(1))
        .catch(() => process.exit(1));
    });
}

module.exports = UniversalStop;
