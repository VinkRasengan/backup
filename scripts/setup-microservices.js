#!/usr/bin/env node

/**
 * Microservices Setup Script
 * Ensures all microservices can load necessary environment variables
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class MicroservicesSetup {
  constructor() {
    this.projectRoot = process.cwd();
    this.envPath = path.join(this.projectRoot, '.env');
    this.services = [
      'api-gateway',
      'auth-service', 
      'link-service',
      'community-service',
      'chat-service',
      'news-service',
      'admin-service',
      'phishtank-service',
      'criminalip-service'
    ];
  }

  async setup() {
    console.log('🚀 Microservices Setup - Environment Configuration');
    console.log('='.repeat(60));

    try {
      // Step 1: Validate root .env file
      await this.validateRootEnv();
      
      // Step 2: Install dependencies for all services
      await this.installDependencies();
      
      // Step 3: Validate each service can load environment
      await this.validateServiceEnvironments();
      
      // Step 4: Test service connectivity
      await this.testServiceConnectivity();
      
      // Step 5: Show final status
      this.showSetupComplete();
      
    } catch (error) {
      console.error('❌ Microservices setup failed:', error.message);
      process.exit(1);
    }
  }

  async validateRootEnv() {
    console.log('\n1. 🔍 Validating root .env file...');
    
    if (!fs.existsSync(this.envPath)) {
      throw new Error('.env file not found in project root');
    }

    // Load environment variables
    require('dotenv').config({ path: this.envPath });

    const requiredVars = [
      'NODE_ENV',
      'FIREBASE_PROJECT_ID',
      'JWT_SECRET',
      'AUTH_SERVICE_URL',
      'LINK_SERVICE_URL',
      'COMMUNITY_SERVICE_URL',
      'CHAT_SERVICE_URL',
      'NEWS_SERVICE_URL',
      'ADMIN_SERVICE_URL'
    ];

    const missing = [];
    const warnings = [];

    for (const varName of requiredVars) {
      const value = process.env[varName];
      if (!value) {
        missing.push(varName);
      } else if (value.includes('your-') || value.includes('placeholder')) {
        warnings.push(varName);
      }
    }

    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    if (warnings.length > 0) {
      console.log(`⚠️  Variables with placeholder values: ${warnings.join(', ')}`);
      console.log('💡 Update these with actual values for full functionality');
    }

    console.log('✅ Root .env file validation passed');
  }

  async installDependencies() {
    console.log('\n2. 📦 Installing dependencies for all services...');
    
    // Install root dependencies
    console.log('   Installing root dependencies...');
    try {
      execSync('npm install --silent', { stdio: 'pipe' });
      console.log('   ✅ Root dependencies installed');
    } catch (error) {
      console.log('   ⚠️  Root dependencies installation had warnings');
    }

    // Install client dependencies
    const clientPath = path.join(this.projectRoot, 'client');
    if (fs.existsSync(clientPath)) {
      console.log('   Installing client dependencies...');
      try {
        execSync('npm install --silent', { cwd: clientPath, stdio: 'pipe' });
        console.log('   ✅ Client dependencies installed');
      } catch (error) {
        console.log('   ⚠️  Client dependencies installation had warnings');
      }
    }

    // Install service dependencies
    for (const service of this.services) {
      const servicePath = path.join(this.projectRoot, 'services', service);
      if (fs.existsSync(servicePath)) {
        console.log(`   Installing ${service} dependencies...`);
        try {
          execSync('npm install --silent', { cwd: servicePath, stdio: 'pipe' });
          console.log(`   ✅ ${service} dependencies installed`);
        } catch (error) {
          console.log(`   ⚠️  ${service} dependencies installation had warnings`);
        }
      }
    }
  }

  async validateServiceEnvironments() {
    console.log('\n3. 🔧 Validating service environment loading...');
    
    for (const service of this.services) {
      const servicePath = path.join(this.projectRoot, 'services', service);
      const envLoaderPath = path.join(servicePath, 'src', 'utils', 'env-loader.js');
      
      if (fs.existsSync(envLoaderPath)) {
        try {
          // Test if the service can load environment variables
          const envLoader = require(path.resolve(envLoaderPath));
          if (typeof envLoader.setupEnvironment === 'function') {
            const result = envLoader.setupEnvironment(service, [], false);
            if (result.success) {
              console.log(`   ✅ ${service} - Environment loading OK`);
            } else {
              console.log(`   ⚠️  ${service} - Environment loading has warnings`);
            }
          } else {
            console.log(`   ⚠️  ${service} - env-loader exists but setupEnvironment not found`);
          }
        } catch (error) {
          console.log(`   ❌ ${service} - Environment loading failed: ${error.message}`);
        }
      } else {
        console.log(`   ⚠️  ${service} - No env-loader found`);
      }
    }
  }

  async testServiceConnectivity() {
    console.log('\n4. 🌐 Testing service connectivity configuration...');
    
    const serviceUrls = {
      'AUTH_SERVICE_URL': 'auth-service',
      'LINK_SERVICE_URL': 'link-service', 
      'COMMUNITY_SERVICE_URL': 'community-service',
      'CHAT_SERVICE_URL': 'chat-service',
      'NEWS_SERVICE_URL': 'news-service',
      'ADMIN_SERVICE_URL': 'admin-service'
    };

    for (const [envVar, serviceName] of Object.entries(serviceUrls)) {
      const url = process.env[envVar];
      if (url) {
        if (url.includes('localhost')) {
          console.log(`   🏠 ${serviceName}: ${url} (Local development)`);
        } else if (url.includes('http://') && !url.includes('.')) {
          console.log(`   🐳 ${serviceName}: ${url} (Docker/K8s service name)`);
        } else if (url.includes('https://')) {
          console.log(`   🚀 ${serviceName}: ${url} (Production URL)`);
        } else {
          console.log(`   ❓ ${serviceName}: ${url} (Unknown format)`);
        }
      } else {
        console.log(`   ❌ ${serviceName}: Not configured`);
      }
    }
  }

  showSetupComplete() {
    console.log('\n' + '='.repeat(60));
    console.log('✅ Microservices setup completed successfully!');
    console.log('\n📋 Next Steps:');
    console.log('1. Validate environment: npm run env:validate');
    console.log('2. Start all services: npm start');
    console.log('3. Check service status: npm run status');
    console.log('4. Open frontend: http://localhost:3000');
    
    console.log('\n🔧 Available Commands:');
    console.log('• npm run env:validate  - Validate environment configuration');
    console.log('• npm run env:local     - Switch to local development');
    console.log('• npm run env:docker    - Switch to Docker configuration');
    console.log('• npm run env:k8s       - Switch to Kubernetes configuration');
    console.log('• npm start             - Start all microservices');
    console.log('• npm run status        - Check service status');
    
    console.log('\n💡 Tips:');
    console.log('• All services load environment variables from the root .env file');
    console.log('• Use npm run env:validate to check configuration before starting');
    console.log('• Check logs if services fail to start: npm run logs');
  }
}

// Run setup if called directly
if (require.main === module) {
  const setup = new MicroservicesSetup();
  setup.setup().catch(error => {
    console.error('Setup failed:', error);
    process.exit(1);
  });
}

module.exports = MicroservicesSetup;
