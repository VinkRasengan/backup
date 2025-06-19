#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const os = require('os');

console.log('🛑 Killing All Services - Anti-Fraud Platform');
console.log('=============================================');
console.log('');

const isWindows = os.platform() === 'win32';

// All ports used by the platform
const allPorts = [
  // Core Services
  { port: 3000, name: 'Frontend (React)' },
  { port: 3001, name: 'Auth Service' },
  { port: 3002, name: 'Link Service' },
  { port: 3003, name: 'Community Service' },
  { port: 3004, name: 'Chat Service' },
  { port: 3005, name: 'News Service' },
  { port: 3006, name: 'Admin Service' },
  { port: 3007, name: 'CriminalIP Service' },
  { port: 3008, name: 'PhishTank Service' },
  { port: 8080, name: 'API Gateway' },
  
  // Monitoring Stack
  { port: 3010, name: 'Grafana' },
  { port: 5001, name: 'Webhook Service' },
  { port: 6379, name: 'Redis' },
  { port: 8081, name: 'cAdvisor' },
  { port: 9090, name: 'Prometheus' },
  { port: 9093, name: 'Alertmanager' },
  { port: 9100, name: 'Node Exporter' },
  { port: 9121, name: 'Redis Exporter' },
  
  // Development ports
  { port: 3009, name: 'Dev Server' },
  { port: 3011, name: 'Dev Server' },
  { port: 3012, name: 'Dev Server' },
  { port: 8082, name: 'Legacy API Gateway' },
  { port: 8000, name: 'Dev Server' },
  { port: 8001, name: 'Dev Server' }
];

function killProcessOnPort(port) {
  try {
    if (isWindows) {
      // Windows approach
      const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8', stdio: 'pipe' });
      const lines = output.split('\n');
      let killed = false;
      
      lines.forEach(line => {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 5 && parts[1].includes(`:${port}`)) {
          const pid = parts[4];
          if (pid && pid !== '0' && !isNaN(pid)) {
            try {
              execSync(`taskkill /f /pid ${pid}`, { stdio: 'ignore' });
              killed = true;
            } catch (e) {
              // Process might already be dead
            }
          }
        }
      });
      
      return killed;
    } else {
      // Unix/Linux/Mac approach
      const pid = execSync(`lsof -t -i:${port}`, { encoding: 'utf8', stdio: 'pipe' }).trim();
      if (pid) {
        execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
        return true;
      }
      return false;
    }
  } catch (error) {
    return false;
  }
}

function killNodeProcesses() {
  console.log('🔥 Killing all Node.js processes...');
  try {
    if (isWindows) {
      execSync('taskkill /f /im node.exe', { stdio: 'ignore' });
      execSync('taskkill /f /im nodejs.exe', { stdio: 'ignore' });
      console.log('✅ Killed Node.js processes');
    } else {
      execSync('pkill -f node', { stdio: 'ignore' });
      console.log('✅ Killed Node.js processes');
    }
  } catch (error) {
    console.log('ℹ️  No Node.js processes found or already killed');
  }
}

function killNpmProcesses() {
  console.log('📦 Killing all npm processes...');
  try {
    if (isWindows) {
      execSync('taskkill /f /im npm.cmd', { stdio: 'ignore' });
      execSync('taskkill /f /im npm.exe', { stdio: 'ignore' });
      console.log('✅ Killed npm processes');
    } else {
      execSync('pkill -f npm', { stdio: 'ignore' });
      console.log('✅ Killed npm processes');
    }
  } catch (error) {
    console.log('ℹ️  No npm processes found or already killed');
  }
}

function stopDockerContainers() {
  console.log('🐳 Stopping Docker containers...');
  try {
    // Stop monitoring stack
    execSync('docker-compose -f docker-compose.monitoring.yml down', { stdio: 'ignore' });
    console.log('✅ Stopped monitoring containers');
  } catch (error) {
    console.log('ℹ️  No monitoring containers running');
  }
  
  try {
    // Stop microservices stack
    execSync('docker-compose -f docker-compose.microservices.yml down', { stdio: 'ignore' });
    console.log('✅ Stopped microservices containers');
  } catch (error) {
    console.log('ℹ️  No microservices containers running');
  }
  
  try {
    // Stop dev stack
    execSync('docker-compose -f docker-compose.dev.yml down', { stdio: 'ignore' });
    console.log('✅ Stopped dev containers');
  } catch (error) {
    console.log('ℹ️  No dev containers running');
  }
  
  try {
    // Stop any remaining containers with our project name
    execSync('docker stop $(docker ps -q --filter "name=backup_") 2>/dev/null || true', { stdio: 'ignore' });
    console.log('✅ Stopped remaining project containers');
  } catch (error) {
    console.log('ℹ️  No remaining containers found');
  }
}

function killWebhookService() {
  console.log('🔔 Stopping webhook service...');
  try {
    if (isWindows) {
      execSync('taskkill /f /fi "WINDOWTITLE eq webhook-service*"', { stdio: 'ignore' });
    } else {
      execSync('pkill -f "webhook-service"', { stdio: 'ignore' });
    }
    console.log('✅ Stopped webhook service');
  } catch (error) {
    console.log('ℹ️  No webhook service found');
  }
}

function killConcurrentlyProcesses() {
  console.log('🔄 Killing concurrently processes...');
  try {
    if (isWindows) {
      execSync('taskkill /f /fi "IMAGENAME eq node.exe" /fi "COMMANDLINE eq *concurrently*"', { stdio: 'ignore' });
    } else {
      execSync('pkill -f concurrently', { stdio: 'ignore' });
    }
    console.log('✅ Killed concurrently processes');
  } catch (error) {
    console.log('ℹ️  No concurrently processes found');
  }
}

async function main() {
  console.log('🎯 Step 1: Killing processes by port...');
  let killedCount = 0;
  
  for (const service of allPorts) {
    const killed = killProcessOnPort(service.port);
    if (killed) {
      console.log(`✅ Killed ${service.name} (port ${service.port})`);
      killedCount++;
    } else {
      console.log(`⚪ ${service.name} (port ${service.port}) - not running`);
    }
  }
  
  console.log(`\n📊 Killed ${killedCount} services by port`);
  
  console.log('\n🎯 Step 2: Killing process types...');
  killConcurrentlyProcesses();
  killNpmProcesses();
  killNodeProcesses();
  killWebhookService();
  
  console.log('\n🎯 Step 3: Stopping Docker containers...');
  stopDockerContainers();
  
  console.log('\n🎯 Step 4: Final cleanup...');
  
  // Wait a moment for processes to die
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Final aggressive cleanup
  try {
    if (isWindows) {
      execSync('taskkill /f /fi "IMAGENAME eq node.exe"', { stdio: 'ignore' });
      execSync('taskkill /f /fi "IMAGENAME eq npm.cmd"', { stdio: 'ignore' });
    } else {
      execSync('pkill -9 -f "node.*factcheck"', { stdio: 'ignore' });
      execSync('pkill -9 -f "npm.*start"', { stdio: 'ignore' });
    }
    console.log('✅ Final cleanup completed');
  } catch (error) {
    console.log('ℹ️  Final cleanup - no processes found');
  }
  
  console.log('\n🎉 All Services Killed Successfully!');
  console.log('====================================');
  console.log('');
  console.log('📊 Summary:');
  console.log(`   - Killed ${killedCount} services by port`);
  console.log('   - Stopped all Node.js processes');
  console.log('   - Stopped all npm processes');
  console.log('   - Stopped all Docker containers');
  console.log('   - Cleaned up webhook services');
  console.log('');
  console.log('🚀 To start services again:');
  console.log('   npm run start:full');
  console.log('   npm run start:safe');
  console.log('   npm run monitoring:start');
  console.log('');
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n🛑 Kill script interrupted');
  process.exit(0);
});

main().catch(error => {
  console.error('❌ Error during kill process:', error.message);
  process.exit(1);
});
