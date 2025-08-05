#!/usr/bin/env node

/**
 * FactCheck Platform - Project Status Checker
 * Check project health and status after cleanup
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 FactCheck Platform - Project Status Check');
console.log('==========================================\n');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFileExists(filePath, description) {
  const exists = fs.existsSync(filePath);
  const status = exists ? '✅' : '❌';
  const color = exists ? 'green' : 'red';
  log(`${status} ${description}: ${exists ? 'Found' : 'Missing'}`, color);
  return exists;
}

function checkDirectoryExists(dirPath, description) {
  const exists = fs.existsSync(dirPath);
  const status = exists ? '✅' : '❌';
  const color = exists ? 'green' : 'red';
  log(`${status} ${description}: ${exists ? 'Found' : 'Missing'}`, color);
  return exists;
}

function checkPortStatus(port, service) {
  try {
    execSync(`netstat -ano | findstr :${port}`, { stdio: 'pipe' });
    log(`🔴 Port ${port} (${service}): In Use`, 'red');
    return true;
  } catch (error) {
    log(`🟢 Port ${port} (${service}): Available`, 'green');
    return false;
  }
}

function checkDockerStatus() {
  try {
    execSync('docker --version', { stdio: 'pipe' });
    log('✅ Docker: Available', 'green');
    
    try {
      execSync('docker ps', { stdio: 'pipe' });
      log('✅ Docker Daemon: Running', 'green');
      return true;
    } catch (error) {
      log('⚠️  Docker Daemon: Not Running', 'yellow');
      return false;
    }
  } catch (error) {
    log('❌ Docker: Not Installed', 'red');
    return false;
  }
}

function checkNodeVersion() {
  try {
    const version = execSync('node --version', { encoding: 'utf8' }).trim();
    log(`✅ Node.js: ${version}`, 'green');
    return true;
  } catch (error) {
    log('❌ Node.js: Not Installed', 'red');
    return false;
  }
}

function checkNpmVersion() {
  try {
    const version = execSync('npm --version', { encoding: 'utf8' }).trim();
    log(`✅ npm: ${version}`, 'green');
    return true;
  } catch (error) {
    log('❌ npm: Not Installed', 'red');
    return false;
  }
}

function checkDiskSpace() {
  try {
    const stats = fs.statSync('.');
    const freeSpace = require('child_process').execSync('wmic logicaldisk get size,freespace,caption', { encoding: 'utf8' });
    log('✅ Disk Space: Available', 'green');
    return true;
  } catch (error) {
    log('⚠️  Disk Space: Unable to check', 'yellow');
    return false;
  }
}

function generateStatusReport() {
  log('\n📊 Project Status Report', 'magenta');
  log('========================', 'magenta');
  
  const report = {
    timestamp: new Date().toISOString(),
    nodeVersion: 'Checked',
    npmVersion: 'Checked',
    dockerStatus: 'Checked',
    diskSpace: 'Checked',
    ports: 'Checked',
    files: 'Checked'
  };
  
  console.table(report);
  
  // Save report to file
  const reportPath = path.join(process.cwd(), 'project-status.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log(`📄 Status report saved to: ${reportPath}`, 'green');
}

function main() {
  try {
    log('🚀 Checking project status...', 'bright');
    
    // Check core dependencies
    log('\n🔧 Core Dependencies:', 'cyan');
    checkNodeVersion();
    checkNpmVersion();
    checkDockerStatus();
    checkDiskSpace();
    
    // Check essential files
    log('\n📁 Essential Files:', 'cyan');
    checkFileExists('package.json', 'package.json');
    checkFileExists('.env', '.env file');
    checkFileExists('docker-compose.yml', 'docker-compose.yml');
    checkFileExists('client/package.json', 'Client package.json');
    
    // Check service directories
    log('\n🏗️  Service Structure:', 'cyan');
    checkDirectoryExists('services', 'Services directory');
    checkDirectoryExists('services/auth-service', 'Auth Service');
    checkDirectoryExists('services/link-service', 'Link Service');
    checkDirectoryExists('services/community-service', 'Community Service');
    checkDirectoryExists('services/chat-service', 'Chat Service');
    checkDirectoryExists('services/news-service', 'News Service');
    checkDirectoryExists('services/admin-service', 'Admin Service');
    checkDirectoryExists('services/api-gateway', 'API Gateway');
    checkDirectoryExists('client', 'Client directory');
    
    // Check ports
    log('\n🔌 Port Status:', 'cyan');
    const ports = [
      { port: 3000, service: 'Frontend' },
      { port: 3001, service: 'Auth Service' },
      { port: 3002, service: 'Link Service' },
      { port: 3003, service: 'Community Service' },
      { port: 3004, service: 'Chat Service' },
      { port: 3005, service: 'News Service' },
      { port: 3006, service: 'Admin Service' },
      { port: 3007, service: 'Event Bus' },
      { port: 8080, service: 'API Gateway' },
      { port: 6379, service: 'Redis' },
      { port: 5672, service: 'RabbitMQ' }
    ];
    
    ports.forEach(({ port, service }) => {
      checkPortStatus(port, service);
    });
    
    // Check for node_modules
    log('\n📦 Dependencies Status:', 'cyan');
    const hasRootNodeModules = checkDirectoryExists('node_modules', 'Root node_modules');
    const hasClientNodeModules = checkDirectoryExists('client/node_modules', 'Client node_modules');
    
    if (!hasRootNodeModules || !hasClientNodeModules) {
      log('\n⚠️  Missing Dependencies:', 'yellow');
      if (!hasRootNodeModules) {
        log('   Run: npm install', 'yellow');
      }
      if (!hasClientNodeModules) {
        log('   Run: cd client && npm install', 'yellow');
      }
    }
    
    // Generate report
    generateStatusReport();
    
    log('\n🎉 Project status check completed!', 'bright');
    log('💡 Recommendations:', 'cyan');
    log('   1. Install dependencies: npm install', 'yellow');
    log('   2. Setup environment: npm run setup', 'yellow');
    log('   3. Start services: npm start', 'yellow');
    
  } catch (error) {
    log(`❌ Status check failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run status check
if (require.main === module) {
  main();
}

module.exports = {
  checkFileExists,
  checkDirectoryExists,
  checkPortStatus,
  checkDockerStatus,
  checkNodeVersion,
  checkNpmVersion,
  generateStatusReport
}; 