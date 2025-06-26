#!/usr/bin/env node

/**
 * Enhanced Simple Stop Script - Stops all services completely
 */

const { spawn, exec } = require('child_process');
const os = require('os');

class SimpleStop {
  constructor() {
    this.isWindows = os.platform() === 'win32';
    this.ports = [3000, 3001, 3002, 3003, 3004, 3005, 3006, 8080, 9090, 3010, 9093, 9100, 8081, 5001];
    this.killedPids = new Set(); // Track killed PIDs to avoid duplicates
  }

  async stop() {
    console.log('🛑 Stopping Anti-Fraud Platform...');
    console.log('='.repeat(40));

    try {
      // Method 1: Kill by port (enhanced)
      console.log('1. 🔌 Stopping processes by port...');
      await this.stopByPorts();

      // Method 2: Kill Node processes (more aggressive)
      console.log('2. 🛑 Stopping Node.js processes...');
      await this.stopNodeProcesses();

      // Method 3: Kill specific service processes
      console.log('3. 📦 Stopping service processes...');
      await this.stopServiceProcesses();

      // Method 4: Clean up Docker containers
      console.log('4. 🐳 Cleaning up Docker containers...');
      await this.cleanupDocker();

      // Method 5: Final cleanup
      console.log('5. 🧹 Final cleanup...');
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
        await this.runCommand('taskkill /F /IM node.exe /T', { silent: true }); // /T kills child processes too
        console.log('  ✅ Node.js processes stopped');
        
        // Also kill npm processes
        await this.runCommand('taskkill /F /IM npm.cmd /T', { silent: true });
        await this.runCommand('taskkill /F /IM npm /T', { silent: true });
        console.log('  ✅ NPM processes stopped');
      } else {
        await this.runCommand('pkill -f node', { silent: true });
        await this.runCommand('pkill -f npm', { silent: true });
        console.log('  ✅ Node.js and NPM processes stopped');
      }
    } catch {
      console.log('  ℹ️  No Node.js processes to stop');
    }
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
  const stopper = new SimpleStop();
  stopper.stop().catch(console.error);
}

module.exports = SimpleStop;
