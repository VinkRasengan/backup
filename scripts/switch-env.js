#!/usr/bin/env node

/**
 * Environment Configuration Switcher
 * Helps developers switch between different deployment environments
 */

const fs = require('fs');
const path = require('path');

const environments = {
  local: {
    file: '.env.example',
    description: '🏠 Local Development (localhost URLs)',
    servicePattern: 'http://localhost:PORT'
  },
  docker: {
    file: '.env.docker', 
    description: '🐳 Docker Development (service names)',
    servicePattern: 'http://service-name:PORT'
  },
  k8s: {
    file: '.env.k8s',
    description: '☸️  Kubernetes (service names)',
    servicePattern: 'http://service-name:PORT'
  }
};

function showUsage() {
  console.log('🔧 Environment Configuration Switcher\n');
  console.log('Usage: node scripts/switch-env.js <environment>\n');
  console.log('Available environments:');
  
  Object.entries(environments).forEach(([key, env]) => {
    console.log(`  ${key.padEnd(8)} - ${env.description}`);
    console.log(`  ${' '.repeat(10)} Pattern: ${env.servicePattern}`);
  });
  
  console.log('\nExamples:');
  console.log('  node scripts/switch-env.js local   # Switch to local development');
  console.log('  node scripts/switch-env.js docker  # Switch to Docker development');
  console.log('  node scripts/switch-env.js k8s     # Switch to Kubernetes');
  
  console.log('\n⚠️  This will backup your current .env to .env.backup');
}

function switchEnvironment(envType) {
  const projectRoot = process.cwd();
  const currentEnvPath = path.join(projectRoot, '.env');
  const backupEnvPath = path.join(projectRoot, '.env.backup');
  const templatePath = path.join(projectRoot, environments[envType].file);
  
  // Check if template exists
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Template file not found: ${environments[envType].file}`);
    console.error('💡 Make sure you have the environment template files');
    process.exit(1);
  }
  
  // Backup current .env if it exists
  if (fs.existsSync(currentEnvPath)) {
    fs.copyFileSync(currentEnvPath, backupEnvPath);
    console.log('📦 Backed up current .env to .env.backup');
  }
  
  // Copy template to .env
  fs.copyFileSync(templatePath, currentEnvPath);
  
  console.log(`✅ Switched to ${environments[envType].description}`);
  console.log(`📁 Configuration loaded from: ${environments[envType].file}`);
  
  // Show next steps
  console.log('\n📋 Next Steps:');
  console.log('1. Edit .env file with your actual credentials');
  console.log('2. Run: node scripts/validate-env-config.js');
  console.log('3. Start services with: npm start');
  
  if (envType !== 'local') {
    console.log('\n⚠️  Important Notes:');
    console.log('- Replace placeholder values with actual credentials');
    console.log('- Ensure service names match your deployment configuration');
    console.log('- Test connectivity between services');
  }
}

function validateCurrentEnvironment() {
  const projectRoot = process.cwd();
  const currentEnvPath = path.join(projectRoot, '.env');
  
  if (!fs.existsSync(currentEnvPath)) {
    console.log('❌ No .env file found');
    return;
  }
  
  // Load and analyze current environment
  require('dotenv').config({ path: currentEnvPath });
  
  const serviceUrls = [
    'AUTH_SERVICE_URL',
    'LINK_SERVICE_URL',
    'COMMUNITY_SERVICE_URL',
    'CHAT_SERVICE_URL',
    'NEWS_SERVICE_URL',
    'ADMIN_SERVICE_URL'
  ];
  
  let localhostCount = 0;
  let serviceNameCount = 0;
  let productionUrlCount = 0;
  
  serviceUrls.forEach(urlVar => {
    const url = process.env[urlVar];
    if (url) {
      if (url.includes('localhost') || url.includes('127.0.0.1')) {
        localhostCount++;
      } else if (url.startsWith('http://') && !url.includes('.')) {
        serviceNameCount++;
      } else if (url.startsWith('https://')) {
        productionUrlCount++;
      }
    }
  });
  
  console.log('🔍 Current Environment Analysis:');
  console.log(`   Localhost URLs: ${localhostCount}`);
  console.log(`   Service Names: ${serviceNameCount}`);
  console.log(`   Production URLs: ${productionUrlCount}`);
  
  if (localhostCount > 0) {
    console.log('   🏠 Detected: Local Development Environment');
  } else if (serviceNameCount > 0) {
    console.log('   🐳 Detected: Docker/Kubernetes Environment');
  } else if (productionUrlCount > 0) {
    console.log('   🚀 Detected: Production Environment');
  }
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
  showUsage();
  console.log('\n' + '='.repeat(50));
  validateCurrentEnvironment();
  process.exit(0);
}

const envType = args[0].toLowerCase();

if (!environments[envType]) {
  console.error(`❌ Unknown environment: ${envType}`);
  console.error('💡 Available environments: ' + Object.keys(environments).join(', '));
  process.exit(1);
}

switchEnvironment(envType);
