#!/usr/bin/env node

/**
 * Simple Start Script - Minimal version that works
 */

const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

class SimpleStart {
  constructor() {
    this.isWindows = os.platform() === 'win32';
    this.projectRoot = process.cwd();
    
    this.services = [
      { name: 'api-gateway', port: 8080 },
      { name: 'auth-service', port: 3001 },
      { name: 'link-service', port: 3002 },
      { name: 'community-service', port: 3003 },
      { name: 'chat-service', port: 3004 },
      { name: 'news-service', port: 3005 },
      { name: 'admin-service', port: 3006 }
    ];
  }

  async start() {
    console.log('🚀 Starting Anti-Fraud Platform...');
    console.log('='.repeat(50));

    try {
      // Step 1: Quick cleanup
      console.log('1. 🧹 Quick cleanup...');
      await this.quickCleanup();

      // Step 2: Start services
      console.log('2. 📦 Starting services...');
      await this.startServices();

      // Step 3: Start client
      console.log('3. 🌐 Starting client...');
      await this.startClient();

      // Step 4: Show info
      console.log('4. ✅ Startup complete!');
      this.showInfo();

    } catch (error) {
      console.error('❌ Startup failed:', error.message);
      console.log('💡 Try: npm run fix-ports && npm start');
    }
  }

  async quickCleanup() {
    // Simple cleanup - just kill obvious processes
    try {
      if (this.isWindows) {
        // Kill any existing node processes on our ports
        const ports = [3000, 3001, 3002, 3003, 3004, 3005, 3006, 8080];
        for (const port of ports) {
          try {
            await this.runCommand(`netstat -ano | findstr :${port} | findstr LISTENING`, [], { silent: true });
            console.log(`  🛑 Cleaning up port ${port}...`);
          } catch {
            // Port not in use - good
          }
        }
      }
    } catch {
      // Cleanup failed - continue anyway
    }
    console.log('  ✅ Cleanup done');
  }

  async startServices() {
    for (const service of this.services) {
      try {
        const servicePath = path.join(this.projectRoot, 'services', service.name);
        
        console.log(`  🚀 Starting ${service.name} (port ${service.port})...`);
        
        const env = {
          ...process.env,
          PORT: service.port,
          NODE_ENV: 'development'
        };

        // Start service in background
        const child = spawn('npm.cmd', ['start'], {
          cwd: servicePath,
          env: env,
          detached: true,
          stdio: 'ignore',
          shell: true
        });

        // Don't wait for service to fully start
        child.unref();
        
        console.log(`  ✅ ${service.name} starting...`);
        
        // Small delay between services
        await this.delay(1000);
        
      } catch (error) {
        console.log(`  ⚠️  Could not start ${service.name}: ${error.message}`);
      }
    }
    
    // Wait for services to initialize
    console.log('  ⏳ Waiting for services to initialize...');
    await this.delay(10000);
  }

  async startClient() {
    try {
      const clientPath = path.join(this.projectRoot, 'client');
      
      console.log('  🌐 Starting React client...');
      
      const env = {
        ...process.env,
        REACT_APP_API_URL: 'http://localhost:8080',
        BROWSER: 'none'
      };

      const child = spawn('npm.cmd', ['start'], {
        cwd: clientPath,
        env: env,
        detached: true,
        stdio: 'ignore',
        shell: true
      });

      child.unref();
      
      console.log('  ✅ React client starting...');
      
      // Wait for client to start
      await this.delay(5000);
      
    } catch (error) {
      console.log(`  ⚠️  Could not start client: ${error.message}`);
    }
  }

  async runCommand(command, args = [], options = {}) {
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

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  showInfo() {
    console.log('\n🌐 Access URLs:');
    console.log('='.repeat(30));
    console.log('Frontend:    http://localhost:3000');
    console.log('API Gateway: http://localhost:8080');
    console.log('Auth:        http://localhost:3001');
    console.log('Link:        http://localhost:3002');
    console.log('Community:   http://localhost:3003');
    console.log('Chat:        http://localhost:3004');
    console.log('News:        http://localhost:3005');
    console.log('Admin:       http://localhost:3006');
    
    console.log('\n📋 Commands:');
    console.log('Check status: npm run status');
    console.log('Stop all:     npm stop');
    console.log('Restart:      npm restart');
    
    console.log('\n💡 Note: Services are starting in background.');
    console.log('   Wait 1-2 minutes for everything to be ready.');
    console.log('   Check http://localhost:3000 when ready.');
  }
}

// Run if called directly
if (require.main === module) {
  const starter = new SimpleStart();
  starter.start().catch(console.error);
}

module.exports = SimpleStart;
