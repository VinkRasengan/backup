#!/usr/bin/env node

/**
 * Enhanced Simple Start Script - With Monitoring Integration
 */

const { spawn } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

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
    
    this.monitoringEnabled = process.env.ENABLE_MONITORING !== 'false';
  }

  async start() {
    console.log('🚀 Starting Anti-Fraud Platform with Monitoring...');
    console.log('='.repeat(60));

    try {
      // Step 1: Quick cleanup
      console.log('1. 🧹 Quick cleanup...');
      await this.quickCleanup();

      // Step 2: Start monitoring stack (if enabled)
      if (this.monitoringEnabled) {
        console.log('2. 📊 Starting monitoring stack...');
        await this.startMonitoringStack();
      }

      // Step 3: Start services
      console.log('3. 📦 Starting services...');
      await this.startServices();

      // Step 4: Start client
      console.log('4. 🌐 Starting client...');
      await this.startClient();

      // Step 5: Show info
      console.log('5. ✅ Startup complete!');
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

  async startMonitoringStack() {
    try {
      // Firebase emulator removed - all services now use production Firebase
      // await this.startFirebaseEmulator();
      
      // 2. Start Docker monitoring stack if available
      await this.startDockerMonitoring();
      
      // 3. Start webhook service if available
      await this.startWebhookService();
      
      console.log('  ✅ Monitoring stack starting...');
    } catch (error) {
      console.log('  ⚠️ Monitoring stack failed to start:', error.message);
      console.log('  ℹ️ Continuing without monitoring...');
    }
  }

  async startDockerMonitoring() {
    try {
      // Start simple HTML dashboard instead of Docker
      const dashboardPath = path.join(this.projectRoot, 'monitoring/simple-dashboard');
      
      if (!fs.existsSync(dashboardPath)) {
        console.log('  ℹ️ Simple dashboard not found, skipping monitoring');
        return;
      }

      console.log('  📊 Starting simple monitoring dashboard...');
      const command = this.isWindows ? 'npm.cmd' : 'npm';
      
      const child = spawn(command, ['start'], {
        cwd: dashboardPath,
        detached: true,
        stdio: 'ignore',
        shell: true
      });

      child.unref();
      console.log('  🌐 Simple monitoring dashboard starting on port 3010...');
      
    } catch (error) {
      console.log('  ⚠️ Could not start simple dashboard:', error.message);
    }
  }

  async startWebhookService() {
    try {
      const webhookPath = path.join(this.projectRoot, 'monitoring/webhook-service');
      
      if (!fs.existsSync(webhookPath)) {
        console.log('  ℹ️ Webhook service not found, skipping');
        return;
      }

      console.log('  🪝 Starting webhook service...');
      const command = this.isWindows ? 'npm.cmd' : 'npm';
      
      const child = spawn(command, ['start'], {
        cwd: webhookPath,
        detached: true,
        stdio: 'ignore',
        shell: true
      });

      child.unref();
      console.log('  🚨 Alert webhook service starting on port 5001...');
      
    } catch (error) {
      console.log('  ⚠️ Could not start webhook service:', error.message);
    }
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
    
    if (this.monitoringEnabled) {
      console.log('\n🔍 Monitoring URLs:');
      console.log('='.repeat(30));
      console.log('Dashboard:   http://localhost:3010 (Simple HTML Dashboard)');
      console.log('Webhook:     http://localhost:5001');
      console.log('Health API:  http://localhost:3010/api/health');
      console.log('Alerts API:  http://localhost:3010/api/alerts');
    }
    
    console.log('\n📋 Commands:');
    console.log('Check status: npm run status');
    console.log('Stop all:     npm stop');
    console.log('Restart:      npm restart');
    console.log('Health check: npm run health');
    
    console.log('\n💡 Note: Services are starting in background.');
    console.log('   Wait 1-2 minutes for everything to be ready.');
    console.log('   Frontend will auto-open at http://localhost:3000');
    
    if (this.monitoringEnabled) {
      console.log('\n📈 Monitoring Tips:');
      console.log('   • Simple dashboard: http://localhost:3010');
      console.log('   • Check service health: http://localhost:3010/api/health');
      console.log('   • View alerts: http://localhost:3010/api/alerts');
      console.log('   • Webhook service: http://localhost:5001/health');
      
      // Try to open monitoring dashboard
      this.openMonitoringDashboard();
    }

    // Auto-open frontend client
    // console.log('\n🌐 Opening frontend application...');
    // this.openFrontendClient();
  }

  async openMonitoringDashboard() {
    try {
      // Wait a bit for services to start
      setTimeout(async () => {
        try {
          const url = 'http://localhost:3010';
          
          if (this.isWindows) {
            await this.runCommand('start', [url], { silent: true });
          } else if (process.platform === 'darwin') {
            await this.runCommand('open', [url], { silent: true });
          } else {
            await this.runCommand('xdg-open', [url], { silent: true });
          }
        } catch {
          // Silent fail - browser may not be available
        }
      }, 5000); // Wait 5 seconds
    } catch {
      // Silent fail
    }
  }

  async openFrontendClient() {
    try {
      // Wait a bit longer for frontend to be ready
      setTimeout(async () => {
        try {
          const url = 'http://localhost:3000';
          
          console.log(`   📱 Opening ${url} in browser...`);
          
          if (this.isWindows) {
            await this.runCommand('start', [url], { silent: true });
          } else if (process.platform === 'darwin') {
            await this.runCommand('open', [url], { silent: true });
          } else {
            await this.runCommand('xdg-open', [url], { silent: true });
          }
          
          console.log('   ✅ Frontend opened in browser!');
        } catch (error) {
          console.log('   ℹ️ Could not auto-open browser. Please visit http://localhost:3000');
        }
      }, 8000); // Wait 8 seconds for frontend to be ready
    } catch {
      // Silent fail
    }
  }
}

// Run if called directly
if (require.main === module) {
  const starter = new SimpleStart();
  starter.start().catch(console.error);
}

module.exports = SimpleStart;
