#!/usr/bin/env node
/**
 * Fast Start Together - Optimized concurrently startup
 * Starts all services and frontend together with better logging
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class FastTogetherStart {
  constructor() {
    this.rootDir = process.cwd();
    
    // Services with optimized concurrently setup
    this.services = [
      { name: 'auth', dir: 'services/auth-service', port: 3001, color: 'bgBlue.bold' },
      { name: 'gateway', dir: 'services/api-gateway', port: 8080, color: 'bgWhite.bold' },
      { name: 'community', dir: 'services/community-service', port: 3003, color: 'bgGreen.bold' },
      { name: 'link', dir: 'services/link-service', port: 3002, color: 'bgMagenta.bold' },
      { name: 'chat', dir: 'services/chat-service', port: 3004, color: 'bgYellow.bold' },
      { name: 'news', dir: 'services/news-service', port: 3005, color: 'bgRed.bold' },
      { name: 'admin', dir: 'services/admin-service', port: 3006, color: 'bgCyan.bold' },
      { name: 'frontend', dir: 'client', port: 3000, color: 'bgMagenta.bold' }
    ];
  }

  /**
   * Main start function
   */
  async start() {
    console.log('🚀 Fast Start - Together Mode (Concurrently)');
    console.log('=' .repeat(50));
    
    try {
      await this.cleanup();
      await this.checkQuickPrerequisites();
      await this.startInfrastructureQuick();
      await this.startServicesTogether();
    } catch (error) {
      console.error('❌ Fast start failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Quick cleanup
   */
  async cleanup() {
    console.log('🧹 Quick cleanup...');
    
    // Kill processes on service ports
    const ports = this.services.map(s => s.port);
    const cleanupPromises = ports.map(port => this.killProcessOnPort(port));
    await Promise.all(cleanupPromises);
    
    console.log('✅ Cleanup completed');
  }

  /**
   * Quick prerequisites check
   */
  async checkQuickPrerequisites() {
    console.log('🔍 Quick prerequisites check...');
    
    // Check if service directories exist
    const missingServices = this.services.filter(service => {
      const servicePath = path.join(this.rootDir, service.dir);
      return !fs.existsSync(servicePath);
    });

    if (missingServices.length > 0) {
      throw new Error(`Missing service directories: ${missingServices.map(s => s.dir).join(', ')}`);
    }
    
    console.log('✅ Prerequisites OK');
  }

  /**
   * Quick infrastructure start
   */
  async startInfrastructureQuick() {
    console.log('🏗️  Starting infrastructure (optional)...');
    
    try {
      // Quick Docker check
      await this.execAsync('docker --version', { timeout: 3000 });
      
      // Start infrastructure in background
      console.log('  🚀 Starting Redis & RabbitMQ in background...');
      this.execAsync('node scripts/start-infrastructure-fallback.js start')
        .catch(() => console.log('  ⚠️  Infrastructure start failed - continuing without'));
      
    } catch (error) {
      console.log('  ⚠️  Docker not available - running in standalone mode');
    }
  }

  /**
   * Start all services together using concurrently
   */
  async startServicesTogether() {
    console.log('🚀 Starting all services together...');
    
    // Build concurrently command
    const colors = this.services.map(s => s.color).join(',');
    const commands = this.services.map(s => {
      if (s.name === 'frontend') {
        return `"cd ${s.dir} && npm start"`;
      } else {
        return `"cd ${s.dir} && npm start"`;
      }
    });

    const concurrentlyArgs = [
      '--kill-others-on-fail',
      '--prefix-colors', colors,
      '--prefix', '[{name}]',
      '--names', this.services.map(s => s.name).join(','),
      '--restart-tries', '3',
      '--restart-after', '2000',
      ...commands
    ];

    console.log('  📦 Starting services with concurrently...');
    console.log('  ⏱️  This will show all service logs in one terminal...');
    console.log('  🎨 Each service has a different color prefix\n');

    // Start concurrently
    const child = spawn('npx', ['concurrently', ...concurrentlyArgs], {
      cwd: this.rootDir,
      stdio: 'inherit',
      env: {
        ...process.env,
        FORCE_COLOR: '1' // Enable colors
      }
    });

    // Handle process events
    child.on('error', (error) => {
      console.error('❌ Failed to start services:', error.message);
      process.exit(1);
    });

    child.on('exit', (code) => {
      if (code !== 0) {
        console.error(`❌ Services exited with code ${code}`);
        process.exit(code);
      }
    });

    // Show quick summary after a delay
    setTimeout(() => {
      this.showQuickSummary();
    }, 5000);

    // Keep the process running
    return new Promise((resolve) => {
      child.on('exit', resolve);
    });
  }

  /**
   * Kill process on specific port
   */
  async killProcessOnPort(port) {
    return new Promise((resolve) => {
      const isWindows = process.platform === 'win32';
      
      if (isWindows) {
        const { exec } = require('child_process');
        exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
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
          resolve();
        });
      } else {
        const { exec } = require('child_process');
        exec(`lsof -ti:${port} | xargs kill -9 2>/dev/null`, () => resolve());
      }
    });
  }

  /**
   * Show quick summary
   */
  showQuickSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('🎉 Fast Start Together - Services Running!');
    console.log('='.repeat(60));
    
    console.log('\n📱 Services Status:');
    this.services.forEach(service => {
      const url = `http://localhost:${service.port}`;
      console.log(`  🟢 ${service.name.padEnd(12)} - ${url}`);
    });

    console.log('\n🌐 Quick Access:');
    console.log('  🎯 Frontend:      http://localhost:3000');
    console.log('  🚪 API Gateway:   http://localhost:8080');
    console.log('  🔐 Auth Service:  http://localhost:3001');
    
    console.log('\n📋 Log Reading Tips:');
    console.log('  🎨 Each service has a colored prefix: [service-name]');
    console.log('  🔍 Look for the service name in brackets to identify logs');
    console.log('  ⚡ All logs appear in this single terminal');
    console.log('  🛑 Press Ctrl+C to stop all services');

    console.log('\n🛠️  Management:');
    console.log('  🛑 Stop all:      Ctrl+C or npm run stop');
    console.log('  📊 Check status:  npm run status');
    console.log('  🔄 Restart:       npm run restart');
    console.log('  🪟 Separate mode: npm run start:separate');
    
    console.log('\n💡 All services running together with colored logs!');
    console.log('='.repeat(60));
  }

  /**
   * Utility functions
   */
  execAsync(command, options = {}) {
    return new Promise((resolve, reject) => {
      const { exec } = require('child_process');
      const timeout = options.timeout || 30000;
      const child = exec(command, options, (error, stdout, stderr) => {
        if (error) reject(error);
        else resolve(stdout);
      });
      
      setTimeout(() => {
        child.kill();
        reject(new Error('Command timeout'));
      }, timeout);
    });
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping all services...');
  process.exit(0);
});

// Run fast start
if (require.main === module) {
  const fastStart = new FastTogetherStart();
  fastStart.start().catch(console.error);
}

module.exports = FastTogetherStart;
