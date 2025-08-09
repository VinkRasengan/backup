#!/usr/bin/env node

/**
 * Simple Status Script - Check what's running
 */

import { spawn  } from 'child_process';
const http = require('http');
import os from 'os';

class SimpleStatus {
  constructor() {
    this.isWindows = os.platform() === 'win32';
    this.services = [
      { name: 'Frontend', port: 3000, url: 'http://localhost:3000' },
      { name: 'API Gateway', port: 8080, url: 'http://localhost:8080' },
      { name: 'Auth Service', port: 3001, url: 'http://localhost:3001' },
      { name: 'Link Service', port: 3002, url: 'http://localhost:3002' },
      { name: 'Community Service', port: 3003, url: 'http://localhost:3003' },
      { name: 'Chat Service', port: 3004, url: 'http://localhost:3004' },
      { name: 'News Service', port: 3005, url: 'http://localhost:3005' },
      { name: 'Admin Service', port: 3006, url: 'http://localhost:3006' }
    ];
  }

  async checkStatus() {
    console.log('📊 Anti-Fraud Platform Status');
    console.log('='.repeat(50));

    let runningCount = 0;
    let totalCount = this.services.length;

    console.log('🔍 Checking services...\n');

    for (const service of this.services) {
      const isRunning = await this.checkService(service);
      const status = isRunning ? '✅ RUNNING' : '❌ STOPPED';
      const padding = ' '.repeat(20 - service.name.length);
      
      console.log(`${service.name}${padding} ${status} (port ${service.port})`);
      
      if (isRunning) runningCount++;
    }

    console.log('\n' + '='.repeat(50));
    console.log(`📈 Summary: ${runningCount}/${totalCount} services running`);

    if (runningCount === 0) {
      console.log('\n💡 To start all services: npm start');
    } else if (runningCount < totalCount) {
      console.log('\n⚠️  Some services are not running');
      console.log('💡 To restart all: npm restart');
    } else {
      console.log('\n🎉 All services are running!');
      console.log('🌐 Frontend: http://localhost:3000');
    }

    // Check additional components
    console.log('\n🔧 Additional Components:');
    await this.checkRedis();
    await this.checkDocker();
  }

  async checkService(service) {
    return new Promise((resolve) => {
      const req = http.get(service.url, { timeout: 2000 }, (res) => {
        resolve(true);
      });

      req.on('error', () => {
        resolve(false);
      });

      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });
    });
  }

  async checkRedis() {
    try {
      await this.runCommand('redis-cli ping', { silent: true });
      console.log('Redis                ✅ RUNNING');
    } catch {
      console.log('Redis                ❌ STOPPED');
    }
  }

  async checkDocker() {
    try {
      await this.runCommand('docker ps', { silent: true });
      console.log('Docker               ✅ AVAILABLE');
    } catch {
      console.log('Docker               ❌ NOT AVAILABLE');
    }
  }

  async runCommand(command, options = {}) {
    return new Promise((resolve, reject) => {
      const child = spawn('cmd', ['/c', command], {
        stdio: options.silent ? 'pipe' : 'inherit',
        shell: true
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Command failed with code ${code}`));
        }
      });

      child.on('error', reject);
    });
  }
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const status = new SimpleStatus();
  status.checkStatus().catch(console.error);
}

export default SimpleStatus;
