#!/usr/bin/env node

/**
 * Fix env-loader module exports
 */

const fs = require('fs');
const path = require('path');

const services = [
  'auth-service',
  'chat-service', 
  'admin-service',
  'phishtank-service',
  'api-gateway'
];

function fixEnvLoader(serviceName) {
  const envLoaderPath = path.join(__dirname, '..', 'services', serviceName, 'src', 'utils', 'env-loader.js');
  
  if (!fs.existsSync(envLoaderPath)) {
    console.log(`⚠️  Skipping ${serviceName} - env-loader.js not found`);
    return;
  }

  try {
    let content = fs.readFileSync(envLoaderPath, 'utf8');
    
    // Fix the module.exports
    const correctExport = `module.exports = {
  setupEnvironment
};`;

    // Replace any existing module.exports
    content = content.replace(/module\.exports\s*=\s*{[^}]*};?/g, correctExport);
    
    fs.writeFileSync(envLoaderPath, content);
    console.log(`✅ Fixed module.exports for ${serviceName}`);
    
  } catch (error) {
    console.error(`❌ Error fixing ${serviceName}:`, error.message);
  }
}

console.log('🔧 Fixing env-loader module exports...\n');

services.forEach(fixEnvLoader);

console.log('\n✅ Module exports fix complete!');
