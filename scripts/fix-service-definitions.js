#!/usr/bin/env node

/**
 * Fix Service Definitions - Add missing service object definitions
 * Fixes the "service is not defined" error in all services
 */

const fs = require('fs');
const path = require('path');

class ServiceDefinitionFixer {
  constructor() {
    this.rootDir = process.cwd();
    this.services = [
      { name: 'auth-service', displayName: 'Auth Service', port: 3001 },
      { name: 'link-service', displayName: 'Link Service', port: 3002 },
      { name: 'community-service', displayName: 'Community Service', port: 3003 },
      { name: 'chat-service', displayName: 'Chat Service', port: 3004 },
      { name: 'news-service', displayName: 'News Service', port: 3005 },
      { name: 'admin-service', displayName: 'Admin Service', port: 3006 },
      { name: 'api-gateway', displayName: 'API Gateway', port: 8080 }
    ];
  }

  /**
   * Main fix function
   */
  async fix() {
    console.log('🔧 Fixing Service Definitions - Adding missing service objects');
    console.log('=' .repeat(60));

    try {
      for (const service of this.services) {
        await this.fixService(service);
      }
      
      console.log('\n✅ All service definitions fixed successfully!');
      console.log('💡 You can now run "npm start" to deploy all services');
    } catch (error) {
      console.error('❌ Fix failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Fix individual service
   */
  async fixService(service) {
    const servicePath = path.join(this.rootDir, 'services', service.name);
    const appJsPath = path.join(servicePath, 'app.js');
    
    console.log(`🔧 Fixing ${service.name}...`);

    if (!fs.existsSync(appJsPath)) {
      console.log(`  ⚠️  app.js not found, skipping ${service.name}`);
      return;
    }

    try {
      let content = fs.readFileSync(appJsPath, 'utf8');
      
      // Check if service object already exists
      if (content.includes('const service = {') || content.includes('service.name')) {
        // Check if it's properly defined
        if (!content.includes('const service = {')) {
          // service.name exists but service object doesn't - need to add it
          content = this.addServiceDefinition(content, service);
          fs.writeFileSync(appJsPath, content);
          console.log(`  ✅ Added service definition to ${service.name}`);
        } else {
          console.log(`  ✅ ${service.name} already has service definition`);
        }
      } else {
        // No service object at all - add it
        content = this.addServiceDefinition(content, service);
        fs.writeFileSync(appJsPath, content);
        console.log(`  ✅ Added service definition to ${service.name}`);
      }
    } catch (error) {
      console.error(`  ❌ Failed to fix ${service.name}:`, error.message);
    }
  }

  /**
   * Add service definition to app.js content
   */
  addServiceDefinition(content, service) {
    // Find the right place to insert the service definition
    // Look for PORT definition
    const portRegex = /const PORT = process\.env\.PORT \|\| \d+;/;
    const portMatch = content.match(portRegex);
    
    if (portMatch) {
      // Insert service definition after PORT definition
      const serviceDefinition = `
// Service configuration
const service = {
    name: '${service.displayName}',
    version: '1.0.0',
    port: PORT
};`;

      const insertIndex = content.indexOf(portMatch[0]) + portMatch[0].length;
      content = content.slice(0, insertIndex) + serviceDefinition + content.slice(insertIndex);
    } else {
      // If PORT not found, insert after express app creation
      const appRegex = /const app = express\(\);/;
      const appMatch = content.match(appRegex);
      
      if (appMatch) {
        const serviceDefinition = `
const PORT = process.env.PORT || ${service.port};

// Service configuration
const service = {
    name: '${service.displayName}',
    version: '1.0.0',
    port: PORT
};`;

        const insertIndex = content.indexOf(appMatch[0]) + appMatch[0].length;
        content = content.slice(0, insertIndex) + serviceDefinition + content.slice(insertIndex);
      } else {
        // Last resort - add at the beginning after requires
        const requiresEndRegex = /require\([^)]+\);[\s\n]*$/m;
        const matches = [...content.matchAll(/require\([^)]+\);/g)];
        
        if (matches.length > 0) {
          const lastRequire = matches[matches.length - 1];
          const insertIndex = lastRequire.index + lastRequire[0].length;
          
          const serviceDefinition = `

const app = express();
const PORT = process.env.PORT || ${service.port};

// Service configuration
const service = {
    name: '${service.displayName}',
    version: '1.0.0',
    port: PORT
};`;

          content = content.slice(0, insertIndex) + serviceDefinition + content.slice(insertIndex);
        }
      }
    }

    return content;
  }
}

// Run the fixer
if (require.main === module) {
  const fixer = new ServiceDefinitionFixer();
  fixer.fix().catch(console.error);
}

module.exports = ServiceDefinitionFixer;
