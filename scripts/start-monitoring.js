const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Starting Monitoring Stack...');

// Function to check if a command exists
function commandExists(command) {
  try {
    execSync(`where ${command}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// Check if Docker is running
function checkDocker() {
  try {
    execSync('docker info', { stdio: 'ignore' });
    return true;
  } catch {
    console.log('❌ Docker is not running. Please start Docker Desktop first.');
    return false;
  }
}

// Check if required commands exist
if (!commandExists('docker')) {
  console.log('❌ Docker is not installed. Please install Docker Desktop.');
  process.exit(1);
}

if (!commandExists('docker-compose')) {
  console.log('❌ Docker Compose is not installed. Please install Docker Desktop with Compose.');
  process.exit(1);
}

if (!checkDocker()) {
  process.exit(1);
}

// Create networks
console.log('📡 Creating Docker networks...');
try {
  execSync('docker network create monitoring', { stdio: 'ignore' });
  console.log('✅ Created monitoring network');
} catch {
  console.log('ℹ️  Network "monitoring" already exists');
}

try {
  execSync('docker network create app-network', { stdio: 'ignore' });
  console.log('✅ Created app-network');
} catch {
  console.log('ℹ️  Network "app-network" already exists');
}

// Start webhook service
console.log('🚀 Starting webhook service...');
const webhookPath = path.join(process.cwd(), 'monitoring/webhook-service');

if (fs.existsSync(webhookPath)) {
  const webhookProcess = spawn('node', ['app.js'], {
    cwd: webhookPath,
    detached: true,
    stdio: 'ignore'
  });
  
  webhookProcess.unref();
  
  // Save PID for later cleanup
  fs.writeFileSync(path.join(process.cwd(), 'webhook-service.pid'), webhookProcess.pid.toString());
  console.log(`✅ Webhook service started (PID: ${webhookProcess.pid})`);
} else {
  console.log('⚠️  Webhook service directory not found');
}

// Wait for webhook service to start
console.log('⏳ Waiting for webhook service to initialize...');
setTimeout(() => {
  // Start monitoring stack with Docker Compose
  console.log('🚀 Starting Prometheus, Grafana, and Alertmanager...');
  try {
    execSync('docker-compose -f docker-compose.monitoring.yml up -d', { stdio: 'inherit' });
    console.log('✅ Docker containers started');
  } catch (error) {
    console.error('❌ Error starting Docker containers:', error.message);
    process.exit(1);
  }

  // Wait for services to be ready
  console.log('⏳ Waiting for services to be ready...');
  setTimeout(() => {
    checkServices();
  }, 15000);
}, 3000);

function checkServices() {
  console.log('🔍 Checking service status...');

  const services = [
    { name: 'Prometheus', port: '9090' },
    { name: 'Grafana', port: '3010' },
    { name: 'Alertmanager', port: '9093' },
    { name: 'Node Exporter', port: '9100' },
    { name: 'Webhook Service', port: '5001' }
  ];

  services.forEach(service => {
    try {
      execSync(`netstat -an | findstr :${service.port}`, { stdio: 'ignore' });
      console.log(`✅ ${service.name} is running on port ${service.port}`);
    } catch (error) {
      console.log(`❌ ${service.name} is not running on port ${service.port}`);
    }
  });

  console.log('');
  console.log('🎉 Monitoring Stack Started Successfully!');
  console.log('');
  console.log('📊 Access URLs:');
  console.log('   Grafana:      http://localhost:3010 (admin/admin123)');
  console.log('   Prometheus:   http://localhost:9090');
  console.log('   Alertmanager: http://localhost:9093');
  console.log('   Node Exporter: http://localhost:9100');
  console.log('   Webhook Service: http://localhost:5001');
  console.log('');
  console.log('📈 Grafana Dashboards:');
  console.log('   - Import from monitoring/grafana/dashboards/');
  console.log('');
  console.log('🚨 Alert Endpoints:');
  console.log('   - View Alerts: http://localhost:5001/alerts');
  console.log('   - Critical Alerts: http://localhost:5001/alerts/critical');
  console.log('   - Warning Alerts: http://localhost:5001/alerts/warning');
  console.log('');
  console.log('🔧 Next Steps:');
  console.log('   1. Start your microservices with metrics enabled');
  console.log('   2. Import Grafana dashboards');
  console.log('   3. Configure alert notification channels');
}
