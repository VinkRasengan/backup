#!/usr/bin/env node
/**
 * Fast Start Separate - Optimized separate terminal startup
 * Starts all services and frontend in separate terminals quickly
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

class FastSeparateStart {
  constructor() {
    this.rootDir = process.cwd();
    this.pidFile = path.join(this.rootDir, '.fast-start-pids');
    
    // Infrastructure services (optional Docker containers)
    this.infrastructure = [
      { name: 'Redis', container: 'factcheck-redis', port: 6379, optional: true },
      { name: 'RabbitMQ', container: 'factcheck-rabbitmq', port: 5672, optional: true }
    ];

    // Application services with optimized startup order
    this.services = [
      // Core infrastructure services first
      { name: 'Event Bus', dir: 'services/event-bus-service', port: 3009, color: '\x1b[90m', priority: 1, critical: false },
      
      // Essential services
      { name: 'Auth Service', dir: 'services/auth-service', port: 3001, color: '\x1b[34m', priority: 2, critical: true },
      { name: 'API Gateway', dir: 'services/api-gateway', port: 8080, color: '\x1b[37m', priority: 3, critical: true },
      
      // Business services (can start in parallel)
      { name: 'Community Service', dir: 'services/community-service', port: 3003, color: '\x1b[32m', priority: 4, critical: false },
      { name: 'Link Service', dir: 'services/link-service', port: 3002, color: '\x1b[35m', priority: 4, critical: false },
      { name: 'Chat Service', dir: 'services/chat-service', port: 3004, color: '\x1b[33m', priority: 4, critical: false },
      { name: 'News Service', dir: 'services/news-service', port: 3005, color: '\x1b[31m', priority: 4, critical: false },
      { name: 'Admin Service', dir: 'services/admin-service', port: 3006, color: '\x1b[36m', priority: 4, critical: false },
      
      // Frontend last
      { name: 'Frontend', dir: 'client', port: 3000, color: '\x1b[95m', priority: 5, critical: true }
    ];

    this.isWindows = os.platform() === 'win32';
  }

  /**
   * Main start function
   */
  async start() {
    console.log('🚀 Fast Start - Separate Terminals Mode');
    console.log('=' .repeat(50));
    
    try {
      await this.cleanup();
      await this.checkQuickPrerequisites();
      await this.startInfrastructureQuick();
      await this.startServicesInGroups();
      this.showQuickSummary();
    } catch (error) {
      console.error('❌ Fast start failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Quick cleanup - only kill processes on ports
   */
  async cleanup() {
    console.log('🧹 Quick cleanup...');
    
    // Clean up PID file
    if (fs.existsSync(this.pidFile)) {
      fs.unlinkSync(this.pidFile);
    }

    // Quick port cleanup for critical services only
    const criticalPorts = this.services.filter(s => s.critical).map(s => s.port);
    const cleanupPromises = criticalPorts.map(port => this.killProcessOnPort(port));
    await Promise.all(cleanupPromises);
    
    console.log('✅ Cleanup completed');
  }

  /**
   * Quick prerequisites check - skip heavy checks
   */
  async checkQuickPrerequisites() {
    console.log('🔍 Quick prerequisites check...');
    
    // Only check if service directories exist
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
   * Quick infrastructure start - optional
   */
  async startInfrastructureQuick() {
    console.log('🏗️  Starting infrastructure (optional)...');
    
    try {
      // Quick Docker check
      await this.execAsync('docker --version', { timeout: 3000 });
      
      // Try to start infrastructure quickly
      console.log('  🚀 Starting Redis & RabbitMQ...');
      this.execAsync('node scripts/start-infrastructure-fallback.js start')
        .catch(() => console.log('  ⚠️  Infrastructure start failed - continuing without'));
      
      // Don't wait - continue with services
      console.log('  ⏭️  Continuing with services (infrastructure starting in background)');
      
    } catch (error) {
      console.log('  ⚠️  Docker not available - running in standalone mode');
    }
  }

  /**
   * Start services in priority groups with minimal delay
   */
  async startServicesInGroups() {
    console.log('🚀 Starting services in separate terminals...');
    
    // Group by priority
    const groups = {};
    this.services.forEach(service => {
      if (!groups[service.priority]) groups[service.priority] = [];
      groups[service.priority].push(service);
    });

    // Start each priority group
    const priorities = Object.keys(groups).sort((a, b) => a - b);
    
    for (const priority of priorities) {
      const servicesInGroup = groups[priority];
      console.log(`\n  📦 Starting priority ${priority} services...`);
      
      // Start all services in this group simultaneously
      servicesInGroup.forEach((service, index) => {
        setTimeout(() => {
          this.startServiceInTerminal(service);
        }, index * 500); // Very short delay between services in same group
      });
      
      // Short wait before next group (only for critical services)
      if (priority < priorities[priorities.length - 1] && servicesInGroup.some(s => s.critical)) {
        await this.sleep(2000);
      }
    }
    
    console.log('\n✅ All services starting in separate terminals!');
  }

  /**
   * Start individual service in new terminal
   */
  startServiceInTerminal(service) {
    const servicePath = path.join(this.rootDir, service.dir);
    const title = `${service.name} - Port ${service.port}`;
    
    console.log(`  ${service.color}🚀 ${service.name} (${service.port})\x1b[0m`);

    if (this.isWindows) {
      // Windows - optimized command
      const command = `start "${title}" cmd /k "cd /d "${servicePath}" && echo Starting ${service.name}... && npm start"`;
      spawn('cmd', ['/c', command], { 
        stdio: 'ignore',
        shell: true,
        detached: true
      });
    } else {
      // Linux/Mac - try different terminals
      this.startUnixTerminal(service, servicePath, title);
    }
  }

  /**
   * Start terminal on Unix systems
   */
  startUnixTerminal(service, servicePath, title) {
    let terminal, args;
    
    if (os.platform() === 'darwin') {
      // macOS - Terminal.app
      terminal = 'osascript';
      args = ['-e', `tell application "Terminal" to do script "cd '${servicePath}' && echo 'Starting ${service.name}...' && npm start"`];
    } else {
      // Linux - try gnome-terminal, then xterm, then konsole
      try {
        terminal = 'gnome-terminal';
        args = ['--title', title, '--', 'bash', '-c', `cd '${servicePath}' && echo 'Starting ${service.name}...' && npm start; exec bash`];
      } catch (error) {
        try {
          terminal = 'konsole';
          args = ['--title', title, '-e', `bash -c "cd '${servicePath}' && echo 'Starting ${service.name}...' && npm start; exec bash"`];
        } catch (error) {
          terminal = 'xterm';
          args = ['-title', title, '-e', `bash -c "cd '${servicePath}' && echo 'Starting ${service.name}...' && npm start; exec bash"`];
        }
      }
    }
    
    const child = spawn(terminal, args, { 
      stdio: 'ignore',
      detached: true 
    });
    
    child.unref(); // Don't wait for terminal to close
  }

  /**
   * Kill process on specific port
   */
  async killProcessOnPort(port) {
    return new Promise((resolve) => {
      if (this.isWindows) {
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
        exec(`lsof -ti:${port} | xargs kill -9 2>/dev/null`, () => resolve());
      }
    });
  }

  /**
   * Show quick summary
   */
  showQuickSummary() {
    console.log('\n🎉 Fast Start Complete!');
    console.log('=' .repeat(50));
    
    console.log('\n📱 Service Terminals:');
    this.services.forEach(service => {
      const status = service.critical ? '🔥 Critical' : '📦 Service';
      console.log(`  ${service.color}${service.name.padEnd(18)} ${status} - http://localhost:${service.port}\x1b[0m`);
    });

    console.log('\n🌐 Quick Access:');
    console.log('  🎯 Frontend:      http://localhost:3000');
    console.log('  🚪 API Gateway:   http://localhost:8080');
    console.log('  🔐 Auth Service:  http://localhost:3001');
    
    console.log('\n⚡ Performance Tips:');
    console.log('  ✅ Services started in separate terminals for easy log viewing');
    console.log('  ✅ Optimized startup order (critical services first)');
    console.log('  ✅ Minimal delays between service starts');
    console.log('  ✅ Infrastructure started in background');

    console.log('\n🛠️  Management:');
    console.log('  🛑 Stop all:      npm run stop');
    console.log('  📊 Check status:  npm run status');
    console.log('  📋 View logs:     Check individual terminal windows');
    console.log('  🔄 Restart:       npm run restart');
    
    console.log('\n💡 Each service runs in its own terminal window for easy debugging!');
  }

  /**
   * Utility functions
   */
  execAsync(command, options = {}) {
    return new Promise((resolve, reject) => {
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

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Fast start interrupted');
  console.log('💡 Services are starting in separate terminals');
  console.log('💡 Use "npm run stop" to stop all services');
  process.exit(0);
});

// Run fast start
if (require.main === module) {
  const fastStart = new FastSeparateStart();
  fastStart.start().catch(console.error);
}

module.exports = FastSeparateStart;
