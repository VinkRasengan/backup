#!/usr/bin/env node

/**
 * Enhanced Stop Script - Comprehensive cleanup for all services
 */

const { spawn } = require('child_process');
const os = require('os');

class SimpleStop {
  constructor() {
    this.isWindows = os.platform() === 'win32';
    // Extended port list including monitoring services
    this.ports = [3000, 3001, 3002, 3003, 3004, 3005, 3006, 8080, 9090, 3010, 9093, 9100, 8081, 5001];
  }

  async stop() {
    console.log('🛑 Stopping Anti-Fraud Platform...');
    console.log('='.repeat(40));

    try {
      // Method 1: Kill by port
      console.log('1. 🔌 Stopping processes by port...');
      await this.stopByPorts();

      // Method 2: Kill Node processes more aggressively  
      console.log('2. 🛑 Stopping Node.js processes...');
      await this.stopNodeProcesses();

      // Method 3: Clean up Docker containers
      console.log('3. 🐳 Cleaning up Docker containers...');
      await this.cleanupDocker();

      // Method 4: Final cleanup - kill any remaining node processes
      console.log('4. 🧹 Final cleanup...');
      await this.finalCleanup();

      console.log('✅ All services stopped!');
      console.log('\n💡 Tips:');
      console.log('  • Check status: npm run status');
      console.log('  • Start again: npm start');
      console.log('  • Health check: npm run monitoring:health');

    } catch (error) {
      console.error('❌ Stop failed:', error.message);
      console.log('💡 Some processes might still be running');
      console.log('💡 Try running: npm run fix-ports');
    }
  }

  async stopByPorts() {
    for (const port of this.ports) {
      try {
        if (this.isWindows) {
          // Find process using the port
          const findCmd = `netstat -ano | findstr :${port} | findstr LISTENING`;
          const result = await this.runCommand(findCmd, { capture: true, silent: true });
          
          if (result && result.trim()) {
            // Extract PID from netstat output
            const lines = result.split('\n');
            for (const line of lines) {
              const parts = line.trim().split(/\s+/);
              const pid = parts[parts.length - 1];
              if (pid && pid !== '0') {
                console.log(`  🛑 Killing process on port ${port} (PID: ${pid})`);
                await this.runCommand(`taskkill /F /PID ${pid}`, { silent: true });
              }
            }
          }
        } else {
          // Linux/Mac
          await this.runCommand(`lsof -ti:${port} | xargs kill -9`, { silent: true });
        }
      } catch {
        // Port not in use or couldn't kill - that's fine
      }
    }
    console.log('  ✅ Port cleanup done');
  }

  async stopNodeProcesses() {
    try {
      if (this.isWindows) {
        // Kill all node.exe processes
        await this.runCommand('taskkill /F /IM node.exe', { silent: true });
        console.log('  ✅ Node.js processes stopped');
      } else {
        await this.runCommand('pkill -f node', { silent: true });
        console.log('  ✅ Node.js processes stopped');
      }
    } catch {
      console.log('  ℹ️  No Node.js processes to stop');
    }
  }

  async cleanupDocker() {
    try {
      // Stop and remove any antifraud containers
      await this.runCommand('docker stop antifraud-redis', { silent: true });
      await this.runCommand('docker rm antifraud-redis', { silent: true });
      console.log('  ✅ Docker cleanup done');
    } catch {
      console.log('  ℹ️  No Docker containers to clean');
    }
  }

  async runCommand(command, options = {}) {
    return new Promise((resolve, reject) => {
      const child = spawn('cmd', ['/c', command], {
        stdio: options.capture ? 'pipe' : (options.silent ? 'pipe' : 'inherit'),
        shell: true
      });

      let output = '';
      if (options.capture) {
        child.stdout?.on('data', (data) => {
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
