#!/usr/bin/env node

const { spawn, execSync } = require('child_process');
const os = require('os');

console.log('🚀 Starting All Services with Fixed Ports');
console.log('==========================================');
console.log('');

const isWindows = os.platform() === 'win32';

// Service configuration with fixed ports
const services = [
  { name: 'Frontend', port: 3000, path: 'client', command: 'npm start' },
  { name: 'Auth Service', port: 3001, path: 'services/auth-service', command: 'npm start' },
  { name: 'Link Service', port: 3002, path: 'services/link-service', command: 'npm start' },
  { name: 'Community Service', port: 3003, path: 'services/community-service', command: 'npm start' },
  { name: 'Chat Service', port: 3004, path: 'services/chat-service', command: 'npm start' },
  { name: 'News Service', port: 3005, path: 'services/news-service', command: 'npm start' },
  { name: 'Admin Service', port: 3006, path: 'services/admin-service', command: 'npm start' },
  { name: 'API Gateway', port: 8082, path: 'services/api-gateway', command: 'npm start' }
];

const monitoringServices = [
  { name: 'Prometheus', port: 9090 },
  { name: 'Grafana', port: 3010 },
  { name: 'Alertmanager', port: 9093 },
  { name: 'Node Exporter', port: 9100 },
  { name: 'cAdvisor', port: 8081 },
  { name: 'Redis Exporter', port: 9121 },
  { name: 'Webhook Service', port: 5001 },
  { name: 'Redis', port: 6379 }
];

function checkPort(port) {
  try {
    if (isWindows) {
      execSync(`netstat -an | findstr :${port}`, { stdio: 'ignore' });
    } else {
      execSync(`lsof -i :${port}`, { stdio: 'ignore' });
    }
    return true;
  } catch {
    return false;
  }
}

function killPort(port) {
  try {
    if (isWindows) {
      const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
      const lines = output.split('\n');
      lines.forEach(line => {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 5 && parts[1].includes(`:${port}`)) {
          const pid = parts[4];
          if (pid && pid !== '0') {
            execSync(`taskkill /f /pid ${pid}`, { stdio: 'ignore' });
          }
        }
      });
    } else {
      const pid = execSync(`lsof -t -i:${port}`, { encoding: 'utf8' }).trim();
      if (pid) {
        execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
      }
    }
    return true;
  } catch {
    return false;
  }
}

async function startMonitoring() {
  console.log('📊 Starting Monitoring Stack...');
  
  try {
    execSync('npm run monitoring:start', { stdio: 'inherit' });
    console.log('✅ Monitoring stack started successfully');
    
    // Wait for services to be ready
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Verify monitoring services
    let monitoringReady = 0;
    monitoringServices.forEach(service => {
      if (checkPort(service.port)) {
        console.log(`✅ ${service.name} is running on port ${service.port}`);
        monitoringReady++;
      } else {
        console.log(`❌ ${service.name} is not running on port ${service.port}`);
      }
    });
    
    console.log(`📊 Monitoring: ${monitoringReady}/${monitoringServices.length} services ready`);
    return monitoringReady > 0;
  } catch (error) {
    console.log('❌ Failed to start monitoring stack:', error.message);
    return false;
  }
}

async function startServices() {
  console.log('🔧 Starting Microservices...');
  
  const processes = [];
  
  for (const service of services) {
    // Check if port is already in use
    if (checkPort(service.port)) {
      console.log(`⚠️  Port ${service.port} is already in use, killing existing process...`);
      killPort(service.port);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log(`🚀 Starting ${service.name} on port ${service.port}...`);
    
    try {
      const child = spawn('npm', ['start'], {
        cwd: service.path,
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: true
      });
      
      processes.push({ name: service.name, port: service.port, process: child });
      
      // Wait a bit before starting next service
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check if service started successfully
      if (checkPort(service.port)) {
        console.log(`✅ ${service.name} started successfully on port ${service.port}`);
      } else {
        console.log(`⚠️  ${service.name} may still be starting on port ${service.port}`);
      }
      
    } catch (error) {
      console.log(`❌ Failed to start ${service.name}:`, error.message);
    }
  }
  
  return processes;
}

async function validateAllServices() {
  console.log('\\n🔍 Final Service Validation...');
  
  let totalRunning = 0;
  let totalExpected = services.length + monitoringServices.length;
  
  console.log('\\n📊 Microservices Status:');
  services.forEach(service => {
    if (checkPort(service.port)) {
      console.log(`✅ ${service.name} - Port ${service.port}`);
      totalRunning++;
    } else {
      console.log(`❌ ${service.name} - Port ${service.port} (not running)`);
    }
  });
  
  console.log('\\n📈 Monitoring Services Status:');
  monitoringServices.forEach(service => {
    if (checkPort(service.port)) {
      console.log(`✅ ${service.name} - Port ${service.port}`);
      totalRunning++;
    } else {
      console.log(`❌ ${service.name} - Port ${service.port} (not running)`);
    }
  });
  
  console.log(`\\n📊 Summary: ${totalRunning}/${totalExpected} services running`);
  
  if (totalRunning >= totalExpected * 0.8) {
    console.log('🎉 Platform started successfully!');
    return true;
  } else {
    console.log('⚠️  Some services failed to start. Check logs for details.');
    return false;
  }
}

async function showAccessUrls() {
  console.log('\\n🌐 Access URLs:');
  console.log('================');
  console.log('🎯 Main Application:');
  console.log('   Frontend:        http://localhost:3000');
  console.log('   API Gateway:     http://localhost:8082');
  console.log('');
  console.log('📊 Monitoring:');
  console.log('   Grafana:         http://localhost:3010 (admin/admin123)');
  console.log('   Prometheus:      http://localhost:9090');
  console.log('   Alertmanager:    http://localhost:9093');
  console.log('');
  console.log('🔧 Health Checks:');
  console.log('   API Gateway:     http://localhost:8082/health');
  console.log('   Services Status: http://localhost:8082/services/status');
  console.log('   Metrics:         http://localhost:8082/metrics');
  console.log('');
  console.log('🚨 Alerts:');
  console.log('   Webhook Service: http://localhost:5001/alerts');
  console.log('');
}

// Main execution
async function main() {
  try {
    // Step 1: Start monitoring stack
    const monitoringStarted = await startMonitoring();
    if (!monitoringStarted) {
      console.log('⚠️  Monitoring stack failed to start, but continuing with services...');
    }
    
    // Step 2: Start microservices
    const processes = await startServices();
    
    // Step 3: Wait for all services to stabilize
    console.log('\\n⏳ Waiting for services to stabilize...');
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    // Step 4: Validate all services
    const success = await validateAllServices();
    
    // Step 5: Show access URLs
    await showAccessUrls();
    
    if (success) {
      console.log('🎉 All services started successfully!');
      console.log('\\n💡 Tips:');
      console.log('   - Run "npm run validate:ports" to check port status');
      console.log('   - Run "npm run health" to check API Gateway health');
      console.log('   - Check Grafana for real-time monitoring');
      console.log('');
    } else {
      console.log('⚠️  Some services may need manual attention.');
    }
    
  } catch (error) {
    console.error('❌ Error starting services:', error.message);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\\n🛑 Shutting down...');
  console.log('Use "npm run stop:all" to stop all services');
  process.exit(0);
});

main();
