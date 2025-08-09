#!/usr/bin/env node
/**
 * Start Essential Services
 * Khởi động các services cần thiết nhất: frontend + backend core
 */

import { spawn, exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class EssentialStarter {
  constructor() {
    this.rootDir = process.cwd();
    
    // Tất cả services quan trọng của FactCheck Platform
    this.services = [
      // Core Infrastructure
      { name: 'event-bus', dir: 'services/event-bus-service', port: 3009 },
      
      // Essential Services
      { name: 'auth', dir: 'services/auth-service', port: 3001 },
      { name: 'gateway', dir: 'services/api-gateway', port: 8080 },
      
      // Business Services
      { name: 'community', dir: 'services/community-service', port: 3003 },
      { name: 'link', dir: 'services/link-service', port: 3002 },
      { name: 'chat', dir: 'services/chat-service', port: 3004 },
      { name: 'news', dir: 'services/news-service', port: 3005 },
      { name: 'admin', dir: 'services/admin-service', port: 3006 },
      
      // Analytics & Big Data
      { name: 'spark', dir: 'services/spark-service', port: 3010 },
      { name: 'etl', dir: 'services/etl-service', port: 3011 },
      { name: 'analytics', dir: 'services/analytics-service', port: 3012 },
      
      // Security Services
      { name: 'phishtank', dir: 'services/phishtank-service', port: 3013 },
      { name: 'criminalip', dir: 'services/criminalip-service', port: 3014 },
      
      // Frontend
      { name: 'frontend', dir: 'client', port: 3000 }
    ];
  }

  async start() {
    console.log('🚀 Starting FactCheck Platform - All Services (Frontend + Complete Backend)');
    console.log('=' .repeat(60));
    
    try {
      await this.cleanup();
      await this.startServicesIndividually();
      this.showSummary();
    } catch (error) {
      console.error('❌ Failed to start services:', error.message);
      process.exit(1);
    }
  }

  async cleanup() {
    console.log('🧹 Quick cleanup...');
    // Kill processes on our ports
    for (const service of this.services) {
      await this.killProcessOnPort(service.port);
    }
    console.log('✅ Cleanup completed');
  }

  async startServicesIndividually() {
    console.log('🚀 Starting services individually...');
    
    for (const service of this.services) {
      console.log(`\n  🔧 Starting ${service.name}...`);
      
      const servicePath = path.join(this.rootDir, service.dir);
      const title = `${service.name} - Port ${service.port}`;
      
      // Start in new terminal window
      if (process.platform === 'win32') {
        const command = `start "${title}" cmd /k "cd /d "${servicePath}" && npm start"`;
        spawn('cmd', ['/c', command], { 
          stdio: 'ignore',
          shell: true,
          detached: true
        });
      } else {
        // For Unix systems
        spawn('gnome-terminal', ['--title', title, '--', 'bash', '-c', 
          `cd '${servicePath}' && npm start; exec bash`], { 
          stdio: 'ignore',
          detached: true 
        });
      }
      
      console.log(`    ✅ ${service.name} starting in new terminal (port ${service.port})`);
      
      // Small delay between starts
      await this.sleep(1000);
    }
  }

  async killProcessOnPort(port) {
    return new Promise((resolve) => {
      if (process.platform === 'win32') {
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

  showSummary() {
    console.log('\n🎉 FactCheck Platform - All Services Started!');
    console.log('=' .repeat(70));
    
    console.log('\n📱 All Service URLs:');
    this.services.forEach(service => {
      console.log(`  🔗 ${service.name.padEnd(12)} - http://localhost:${service.port}`);
    });

    console.log('\n🌐 Quick Access URLs:');
    console.log('  🎯 Frontend:        http://localhost:3000');
    console.log('  🚪 API Gateway:     http://localhost:8080');
    console.log('  🔐 Auth Service:    http://localhost:3001');
    console.log('  🏘️  Community:       http://localhost:3003');
    console.log('  🔗 Link Service:    http://localhost:3002');
    console.log('  💬 Chat Service:    http://localhost:3004');
    console.log('  📰 News Service:    http://localhost:3005');
    console.log('  👨‍💼 Admin Service:   http://localhost:3006');
    
    console.log('\n📊 Analytics & Big Data:');
    console.log('  ⚡ Spark Service:   http://localhost:3010');
    console.log('  🔄 ETL Service:     http://localhost:3011');
    console.log('  📈 Analytics:       http://localhost:3012');
    
    console.log('\n🛡️  Security Services:');
    console.log('  🎣 PhishTank:       http://localhost:3013');
    console.log('  🚨 CriminalIP:      http://localhost:3014');
    
    console.log('\n💡 Each service runs in its own terminal window for easy debugging!');
    console.log('🛑 To stop all services: npm run stop');
    console.log('📊 To check status: npm run status');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run essential start
const scriptPath = fileURLToPath(import.meta.url);
if (process.argv[1] === scriptPath) {
  const starter = new EssentialStarter();
  starter.start();
}

export default EssentialStarter;
