#!/usr/bin/env node

/**
 * Fix workspace dependencies to be CI/CD friendly
 */

const fs = require('fs');
const path = require('path');

const servicesDir = path.join(__dirname, 'services');
const services = fs.readdirSync(servicesDir).filter(dir => 
  fs.statSync(path.join(servicesDir, dir)).isDirectory()
);

console.log('🔧 Fixing workspace dependencies...');

services.forEach(service => {
  const packageJsonPath = path.join(servicesDir, service, 'package.json');
  
  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      if (packageJson.dependencies && packageJson.dependencies['@factcheck/shared']) {
        if (packageJson.dependencies['@factcheck/shared'] === 'workspace:*') {
          // Option 1: Use relative path
          packageJson.dependencies['@factcheck/shared'] = 'file:../../shared';
          
          // Option 2: Remove dependency entirely and link manually (better for CI/CD)
          // delete packageJson.dependencies['@factcheck/shared'];
          
          fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
          console.log(`✅ Fixed ${service}/package.json`);
        } else {
          console.log(`ℹ️  ${service}/package.json already fixed`);
        }
      }
    } catch (error) {
      console.error(`❌ Error fixing ${service}: ${error.message}`);
    }
  }
});

console.log('✅ All workspace dependencies fixed!');
console.log('💡 Now you can run: npm run install:all');
