const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Installing monitoring dependencies for all services...');

// Services to update
const services = [
  'services/auth-service',
  'services/link-service', 
  'services/news-service',
  'services/chat-service',
  'services/community-service',
  'services/admin-service',
  'services/criminalip-service',
  'services/phishtank-service'
];

// Store original directory
const originalDir = process.cwd();

// Install prom-client for each service
services.forEach(service => {
  const servicePath = path.join(originalDir, service);

  if (fs.existsSync(servicePath)) {
    console.log(`📦 Installing prom-client in ${service}...`);
    try {
      process.chdir(servicePath);
      execSync('npm install prom-client@^15.1.0', { stdio: 'inherit' });
      process.chdir(originalDir);
    } catch (error) {
      console.error(`❌ Error installing in ${service}:`, error.message);
      process.chdir(originalDir);
    }
  } else {
    console.log(`⚠️  Directory ${service} not found, skipping...`);
  }
});

// Install webhook service dependencies
const webhookPath = path.join(originalDir, 'monitoring/webhook-service');
if (fs.existsSync(webhookPath)) {
  console.log('📦 Installing webhook service dependencies...');
  try {
    process.chdir(webhookPath);
    execSync('npm install', { stdio: 'inherit' });
    process.chdir(originalDir);
  } catch (error) {
    console.error('❌ Error installing webhook service dependencies:', error.message);
    process.chdir(originalDir);
  }
}

// Install shared monitoring dependencies
console.log('📦 Installing shared monitoring dependencies...');
try {
  execSync('npm install prom-client@^15.1.0', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Error installing shared dependencies:', error.message);
}

console.log('✅ Monitoring dependencies installed successfully!');
console.log('');
console.log('Next steps:');
console.log('1. Update each service to include metrics endpoints');
console.log('2. Start monitoring stack with: npm run monitoring:start');
console.log('3. Access Grafana at http://localhost:3001 (admin/admin123)');
console.log('4. Access Prometheus at http://localhost:9090');
console.log('5. Access Alertmanager at http://localhost:9093');
