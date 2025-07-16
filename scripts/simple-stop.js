#!/usr/bin/env node

/**
 * Enhanced Stop Script - Stops all services and processes from npm start
 * Handles both "together" and "separate" modes
 */

const { spawn, exec } = require('child_process');
const os = require('os');
const path = require('path');

class EnhancedStop {
  constructor() {
    this.isWindows = os.platform() === 'win32';
    this.ports = [3000, 3001, 3002, 3003, 3004, 3005, 3006, 8080, 9090, 3010, 9093, 9100, 8081, 4000, 5001];
    this.killedPids = new Set(); // Track killed PIDs to avoid duplicates
    this.serviceNames = [
      'auth-service',
      'link-service', 
      'community-service',
      'chat-service',
      'news-service',
      'admin-service',
      'api-gateway',
      'factcheck-platform', // Main process
      'concurrently'
    ];
  }

  async stop() {
    console.log('🛑 Stopping FactCheck Platform (All modes)...');
    console.log('='.repeat(50));

    try {
      // Method 1: Kill by port (enhanced)
      console.log('1. 🔌 Stopping processes by port...');
      await this.stopByPorts();

      // Method 2: Kill Node processes (more aggressive)
      console.log('2. 🛑 Stopping Node.js processes...');
      await this.stopNodeProcesses();

      // Method 3: Kill npm start related processes
      console.log('3. 📦 Stopping npm start processes...');
      await this.stopNpmStartProcesses();

      // Method 4: Kill concurrently processes
      console.log('4. 🔄 Stopping concurrently processes...');
      await this.stopConcurrentlyProcesses();

      // Method 5: Kill specific service processes
      console.log('5. 🔧 Stopping service processes...');
      await this.stopServiceProcesses();

      // Method 6: Clean up Docker containers
      console.log('6. 🐳 Cleaning up Docker containers...');
      await this.cleanupDocker();

      // Method 7: Final cleanup
      console.log('7. 🧹 Final cleanup...');
      await this.finalCleanup();

      console.log('✅ All services stopped successfully!');
      console.log('💡 You can now run "npm start" to restart everything.');
      console.log('');
      console.log('🔍 If you still see running processes:');
      console.log('   • Check: npm run check:processes');
      console.log('   • Force cleanup: npm run force:cleanup');

    } catch (error) {
      console.error('❌ Stop failed:', error.message);
      console.log('💡 Some processes might still be running');
      console.log('   Try running the command again or restart your computer.');
    }
  }

  async stopByPorts() {
    for (const port of this.ports) {
      try {
        await this.killProcessOnPort(port);
      } catch {
        // Port not in use or couldn't kill - that's fine
      }
    }
    console.log('  ✅ Port cleanup done');
  }

  async killProcessOnPort(port) {
    if (this.isWindows) {
      // Find process using the port
      const findCmd = `netstat -ano | findstr :${port} | findstr LISTENING`;
      const result = await this.runCommand(findCmd, { capture: true, silent: true });
      
      if (result?.trim()) {
        // Extract PID from netstat output
        const lines = result.split('\n');
        for (const line of lines) {
          const parts = line.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          if (pid && pid !== '0' && !this.killedPids.has(pid)) {
            console.log(`  🛑 Killing process on port ${port} (PID: ${pid})`);
            await this.runCommand(`taskkill /F /PID ${pid}`, { silent: true });
            this.killedPids.add(pid);
          }
        }
      }
    } else {
      // Linux/Mac
      await this.runCommand(`lsof -ti:${port} | xargs kill -9`, { silent: true });
    }
  }

  async stopNodeProcesses() {
    try {
      if (this.isWindows) {
        // Kill all node.exe processes more aggressively
        const nodeCommands = [
          'taskkill /F /IM node.exe /T',  // Kill all node processes with child processes
          'taskkill /F /IM npm.cmd /T',   // Kill npm.cmd processes
          'taskkill /F /IM npm /T',       // Kill npm processes
          'taskkill /F /FI "IMAGENAME eq node.exe" /FI "COMMANDLINE eq *factcheck*" /T',
          'taskkill /F /FI "IMAGENAME eq node.exe" /FI "COMMANDLINE eq *start*" /T',
          'taskkill /F /FI "IMAGENAME eq node.exe" /FI "COMMANDLINE eq *concurrently*" /T'
        ];

        let nodeKilled = 0;
        for (const cmd of nodeCommands) {
          try {
            await this.runCommand(cmd, { silent: true });
            nodeKilled++;
          } catch (error) {
            // Ignore errors for processes that don't exist
          }
        }

        if (nodeKilled > 0) {
          console.log(`  ✅ Node.js processes stopped (${nodeKilled} commands executed)`);
        }
      } else {
        // Linux/Mac: Kill node processes more comprehensively
        const nodeCommands = [
          'pkill -f "node.*factcheck"',
          'pkill -f "node.*start"',
          'pkill -f "node.*concurrently"',
          'pkill -f "npm.*start"',
          'pkill -9 -f node',  // Force kill all node processes
          'pkill -9 -f npm'    // Force kill all npm processes
        ];

        let nodeKilled = 0;
        for (const cmd of nodeCommands) {
          try {
            await this.runCommand(cmd, { silent: true });
            nodeKilled++;
          } catch (error) {
            // Ignore errors for processes that don't exist
          }
        }

        if (nodeKilled > 0) {
          console.log(`  ✅ Node.js and NPM processes stopped (${nodeKilled} commands executed)`);
        }
      }
    } catch (error) {
      console.log('  ℹ️  No Node.js processes to stop');
    }
  }

  /**
   * Stop npm start related processes
   */
  async stopNpmStartProcesses() {
    return new Promise((resolve) => {
      if (this.isWindows) {
        // Windows: Find and kill npm start processes
        const commands = [
          'taskkill /F /FI "IMAGENAME eq npm.cmd" /T',
          'taskkill /F /FI "IMAGENAME eq node.exe" /FI "WINDOWTITLE eq npm*" /T',
          'taskkill /F /FI "IMAGENAME eq cmd.exe" /FI "WINDOWTITLE eq *npm start*" /T',
          'taskkill /F /FI "IMAGENAME eq cmd.exe" /FI "WINDOWTITLE eq *factcheck*" /T',
          'taskkill /F /FI "IMAGENAME eq cmd.exe" /FI "WINDOWTITLE eq *Service*" /T'
        ];

        let completed = 0;
        commands.forEach(cmd => {
          exec(cmd, (error, stdout, stderr) => {
            if (stdout && !stdout.includes('No tasks running')) {
              console.log(`   ✅ Killed npm processes: ${stdout.trim()}`);
            }
            completed++;
            if (completed === commands.length) resolve();
          });
        });
      } else {
        // Linux/Mac: Kill npm start processes
        const commands = [
          'pkill -f "npm.*start"',
          'pkill -f "node.*start"',
          'pkill -f "factcheck-platform"',
          'pkill -f "concurrently"'
        ];

        let completed = 0;
        commands.forEach(cmd => {
          exec(cmd, (error, stdout, stderr) => {
            if (!error) {
              console.log(`   ✅ Killed npm processes`);
            }
            completed++;
            if (completed === commands.length) resolve();
          });
        });
      }
    });
  }

  /**
   * Stop concurrently processes
   */
  async stopConcurrentlyProcesses() {
    return new Promise((resolve) => {
      if (this.isWindows) {
        // Windows: Kill concurrently processes
        const command = 'taskkill /F /FI "IMAGENAME eq node.exe" /FI "COMMANDLINE eq *concurrently*" /T';
        exec(command, (error, stdout, stderr) => {
          if (stdout && !stdout.includes('No tasks running')) {
            console.log(`   ✅ Killed concurrently processes`);
          }
          resolve();
        });
      } else {
        // Linux/Mac: Kill concurrently processes
        const command = 'pkill -f concurrently';
        exec(command, (error, stdout, stderr) => {
          if (!error) {
            console.log(`   ✅ Killed concurrently processes`);
          }
          resolve();
        });
      }
    });
  }

  async stopServiceProcesses() {
    try {
      if (this.isWindows) {
        // Kill processes by name patterns
        const serviceNames = [
          'api-gateway', 'auth-service', 'link-service', 
          'community-service', 'chat-service', 'news-service', 'admin-service'
        ];
        
        for (const serviceName of serviceNames) {
          await this.runCommand(`taskkill /F /FI "WINDOWTITLE eq ${serviceName}*" /T`, { silent: true });
        }
        console.log('  ✅ Service-specific processes stopped');
      } else {
        await this.runCommand('pkill -f "services/"', { silent: true });
        console.log('  ✅ Service-specific processes stopped');
      }
    } catch {
      console.log('  ℹ️  No service processes to stop');
    }
  }

  async cleanupDocker() {
    try {
      // Stop monitoring containers
      await this.runCommand('docker-compose -f docker-compose.monitoring.yml down', { silent: true });
      
      // Stop main containers
      await this.runCommand('docker stop antifraud-redis antifraud-api-gateway antifraud-auth antifraud-link antifraud-community antifraud-chat antifraud-news antifraud-admin', { silent: true });
      await this.runCommand('docker rm antifraud-redis antifraud-api-gateway antifraud-auth antifraud-link antifraud-community antifraud-chat antifraud-news antifraud-admin', { silent: true });
      
      // Stop monitoring containers specifically
      await this.runCommand('docker stop prometheus grafana alertmanager node-exporter cadvisor redis-exporter', { silent: true });
      await this.runCommand('docker rm prometheus grafana alertmanager node-exporter cadvisor redis-exporter', { silent: true });
      
      console.log('  ✅ Docker cleanup done');
    } catch {
      console.log('  ℹ️  No Docker containers to clean');
    }
  }

  async finalCleanup() {
    try {
      // Kill any remaining processes that might be hanging
      if (this.isWindows) {
        // Force kill any remaining processes on our ports
        for (const port of [3000, 8080, 9090, 3010]) {
          await this.runCommand(`for /f "tokens=5" %a in ('netstat -aon ^| findstr :${port}') do taskkill /f /pid %a`, { silent: true });
        }
        
        // Clean up any webpack-dev-server processes
        await this.runCommand('taskkill /F /FI "COMMANDLINE eq *webpack*" /T', { silent: true });
        await this.runCommand('taskkill /F /FI "COMMANDLINE eq *react-scripts*" /T', { silent: true });
      }
      console.log('  ✅ Final cleanup completed');
    } catch {
      console.log('  ℹ️  Final cleanup completed');
    }
  }

  async runCommand(command, options = {}) {
    return new Promise((resolve, reject) => {
      let stdio;
      if (options.capture) {
        stdio = 'pipe';
      } else if (options.silent) {
        stdio = 'pipe';
      } else {
        stdio = 'inherit';
      }

      const child = spawn('cmd', ['/c', command], {
        stdio,
        shell: true
      });

      let output = '';
      if (options.capture && child.stdout) {
        child.stdout.on('data', (data) => {
          output += data.toString();
        });
      }

      child.on('close', (code) => {
        if (options.silent || code === 0) {
          resolve(options.capture ? output : undefined);
        } else {
          reject(new Error(`Command failed with code ${code}`));
        }
      });

      child.on('error', (error) => {
        if (options.silent) {
          resolve('');
        } else {
          reject(error);
        }
      });
    });
  }
}

// Run if called directly
if (require.main === module) {
  const stopper = new EnhancedStop();
  stopper.stop().catch(console.error);
}

module.exports = EnhancedStop;
