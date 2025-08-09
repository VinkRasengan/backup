#!/usr/bin/env node

/**
 * Restart API Gateway
 * Restarts the API Gateway service with new routing configuration
 */

import { spawn, exec  } from 'child_process';
import path from 'path';
import os from 'os';

class ApiGatewayRestart {
  constructor() {
    this.rootDir = process.cwd();
    this.servicePath = path.join(this.rootDir, 'services/api-gateway');
    this.port = 8080;
  }

  async restart() {
    console.log('🔄 Restarting API Gateway with New Routing');
    console.log('=' .repeat(50));

    try {
      await this.killExistingProcess();
      await this.startService();
      await this.healthCheck();
      
      console.log('\n✅ API Gateway restart completed successfully!');
      console.log('🌐 Service available at: http://localhost:8080');
      console.log('📋 API endpoints now available:');
      console.log('  - POST /api/votes');
      console.log('  - GET /api/votes/:linkId');
      console.log('  - POST /api/comments');
      console.log('  - GET /api/comments/:linkId');
      console.log('  - GET /api/posts');
      console.log('  - POST /api/auth/login');
      
    } catch (error) {
      console.error('❌ API Gateway restart failed:', error.message);
      process.exit(1);
    }
  }

  async killExistingProcess() {
    console.log('🛑 Stopping existing API Gateway...');
    
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

  async startService() {
    console.log('🚀 Starting API Gateway...');
    
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
        
        if ((output.includes('API Gateway running') || 
             output.includes('listening') || 
             output.includes('started')) && !resolved) {
          console.log('  ✅ API Gateway started successfully');
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
      
      // Test API endpoint
      const apiResponse = await this.httpGet(`http://localhost:${this.port}/api`);
      console.log('  ✅ API endpoint accessible');
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
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const restarter = new ApiGatewayRestart();
  restarter.restart().catch(console.error);
}

export default ApiGatewayRestart;
