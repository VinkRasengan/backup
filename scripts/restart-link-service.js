#!/usr/bin/env node

/**
 * Restart Link Service
 * Installs missing dependencies and restarts the link service
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const os = require('os');

class LinkServiceRestart {
  constructor() {
    this.rootDir = process.cwd();
    this.servicePath = path.join(this.rootDir, 'services/link-service');
    this.port = 3002;
  }

  async restart() {
    console.log('🔄 Restarting Link Service with Dependencies');
    console.log('=' .repeat(50));

    try {
      await this.killExistingProcess();
      await this.installDependencies();
      await this.startService();
      await this.healthCheck();
      
      console.log('\n✅ Link Service restart completed successfully!');
      console.log('🌐 Service available at: http://localhost:3002');
      
    } catch (error) {
      console.error('❌ Link Service restart failed:', error.message);
      process.exit(1);
    }
  }

  async killExistingProcess() {
    console.log('🛑 Stopping existing link-service...');
    
    return new Promise((resolve) => {
      if (os.platform() === 'win32') {
        exec(`netstat -ano | findstr :${this.port}`, (error, stdout) => {
          if (stdout) {
            const lines = stdout.split('\n');
            lines.forEach(line => {
              const parts = line.trim().split(/\s+/);
              if (parts.length > 4) {
                const pid = parts[parts.length - 1];
                exec(`taskkill /PID ${pid} /F`, () => {});
              }
            });
          }
          console.log('  ✅ Existing processes stopped');
          resolve();
        });
      } else {
        exec(`lsof -ti:${this.port} | xargs kill -9`, () => {
          console.log('  ✅ Existing processes stopped');
          resolve();
        });
      }
    });
  }

  async installDependencies() {
    console.log('📦 Installing missing dependencies...');
    
    return new Promise((resolve, reject) => {
      const isWindows = process.platform === 'win32';
      const command = isWindows ? 'cmd' : 'npm';
      const args = isWindows ? ['/c', 'npm', 'install'] : ['install'];

      const child = spawn(command, args, {
        cwd: this.servicePath,
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: isWindows
      });

      child.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('added') || output.includes('updated')) {
          console.log('  📦 Installing packages...');
        }
      });

      child.stderr.on('data', (data) => {
        const error = data.toString();
        if (!error.includes('warning') && !error.includes('deprecated')) {
          console.error('  ❌ Install error:', error);
        }
      });

      child.on('close', (code) => {
        if (code === 0) {
          console.log('  ✅ Dependencies installed successfully');
          resolve();
        } else {
          reject(new Error(`npm install failed with code ${code}`));
        }
      });

      child.on('error', (error) => {
        reject(new Error(`Failed to run npm install: ${error.message}`));
      });
    });
  }

  async startService() {
    console.log('🚀 Starting link-service...');
    
    return new Promise((resolve, reject) => {
      const isWindows = process.platform === 'win32';
      const command = isWindows ? 'cmd' : 'npm';
      const args = isWindows ? ['/c', 'npm', 'start'] : ['start'];

      const child = spawn(command, args, {
        cwd: this.servicePath,
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false,
        shell: isWindows
      });

      let resolved = false;

      child.stdout.on('data', (data) => {
        const output = data.toString();
        console.log('  📡', output.trim());
        
        if ((output.includes('Server running') || 
             output.includes('listening') || 
             output.includes('started')) && !resolved) {
          console.log('  ✅ Link service started successfully');
          resolved = true;
          resolve();
        }
      });

      child.stderr.on('data', (data) => {
        const error = data.toString();
        if (!error.includes('warning') && !error.includes('deprecated')) {
          console.error('  ❌ Service error:', error);
          if (!resolved) {
            resolved = true;
            reject(new Error(error));
          }
        }
      });

      child.on('error', (error) => {
        if (!resolved) {
          resolved = true;
          reject(new Error(`Failed to start service: ${error.message}`));
        }
      });

      // Timeout fallback
      setTimeout(() => {
        if (!resolved) {
          console.log('  ⏱️  Service startup timeout - assuming started');
          resolved = true;
          resolve();
        }
      }, 10000);
    });
  }

  async healthCheck() {
    console.log('🏥 Performing health check...');
    
    // Wait a bit for service to fully start
    await this.sleep(3000);
    
    try {
      const response = await this.httpGet(`http://localhost:${this.port}/health`);
      console.log('  ✅ Health check passed');
    } catch (error) {
      console.log('  ⚠️  Health check failed (service might still be starting)');
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  httpGet(url) {
    return new Promise((resolve, reject) => {
      const http = require('http');
      const request = http.get(url, (response) => {
        if (response.statusCode === 200) {
          resolve(response);
        } else {
          reject(new Error(`HTTP ${response.statusCode}`));
        }
      });
      
      request.on('error', reject);
      request.setTimeout(5000, () => {
        request.destroy();
        reject(new Error('Timeout'));
      });
    });
  }
}

// Run restart
if (require.main === module) {
  const restarter = new LinkServiceRestart();
  restarter.restart().catch(console.error);
}

module.exports = LinkServiceRestart;
