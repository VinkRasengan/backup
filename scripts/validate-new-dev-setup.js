#!/usr/bin/env node

/**
 * New Developer Setup Validation Script
 * Comprehensive validation to ensure everything is ready for development
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class NewDevSetupValidator {
  constructor() {
    this.projectRoot = process.cwd();
    this.errors = [];
    this.warnings = [];
    this.passed = [];
  }

  async validate() {
    console.log('🔍 FactCheck Platform - New Developer Setup Validation');
    console.log('====================================================');

    try {
      await this.checkProjectStructure();
      await this.checkEnvironmentVariables();
      await this.checkDependencies();
      await this.checkServiceConfiguration();
      await this.checkDockerSetup();
      await this.generateReport();
    } catch (error) {
      console.error('❌ Validation failed:', error.message);
      process.exit(1);
    }
  }

  async checkProjectStructure() {
    console.log('\n1. 📁 Checking project structure...');
    
    const requiredDirs = [
      'services',
      'client', 
      'shared',
      'scripts',
      'k8s',
      'monitoring'
    ];
    
    const requiredFiles = [
      'package.json',
      'docker-compose.yml',
      'docker-compose.dev.yml',
      '.env.example'
    ];

    for (const dir of requiredDirs) {
      if (fs.existsSync(path.join(this.projectRoot, dir))) {
        this.passed.push(`✅ Directory ${dir} exists`);
      } else {
        this.errors.push(`❌ Missing directory: ${dir}`);
      }
    }

    for (const file of requiredFiles) {
      if (fs.existsSync(path.join(this.projectRoot, file))) {
        this.passed.push(`✅ File ${file} exists`);
      } else {
        this.errors.push(`❌ Missing file: ${file}`);
      }
    }

    // Check .env file
    if (fs.existsSync(path.join(this.projectRoot, '.env'))) {
      this.passed.push('✅ .env file exists');
    } else {
      this.warnings.push('⚠️ .env file missing - run npm run setup to create it');
    }
  }

  async checkEnvironmentVariables() {
    console.log('\n2. 🔐 Checking environment variables...');
    
    // Load environment variables
    const envPath = path.join(this.projectRoot, '.env');
    if (fs.existsSync(envPath)) {
      require('dotenv').config({ path: envPath });
    }

    const requiredVars = [
      'FIREBASE_PROJECT_ID',
      'FIREBASE_CLIENT_EMAIL',
      'FIREBASE_PRIVATE_KEY',
      'JWT_SECRET',
      'GEMINI_API_KEY'
    ];

    const reactVars = [
      'REACT_APP_API_URL',
      'REACT_APP_FIREBASE_API_KEY',
      'REACT_APP_FIREBASE_AUTH_DOMAIN',
      'REACT_APP_FIREBASE_PROJECT_ID'
    ];

    // Check backend variables
    for (const varName of requiredVars) {
      const value = process.env[varName];
      if (!value) {
        this.errors.push(`❌ Missing required variable: ${varName}`);
      } else if (value.includes('your_') || value.includes('xxxxx')) {
        this.warnings.push(`⚠️ ${varName} has placeholder value`);
      } else {
        this.passed.push(`✅ ${varName} is configured`);
      }
    }

    // Check React variables
    for (const varName of reactVars) {
      const value = process.env[varName];
      if (!value) {
        this.warnings.push(`⚠️ Missing React variable: ${varName} (frontend may not work)`);
      } else if (value.includes('your_') || value.includes('xxxxx')) {
        this.warnings.push(`⚠️ ${varName} has placeholder value`);
      } else {
        this.passed.push(`✅ ${varName} is configured`);
      }
    }
  }

  async checkDependencies() {
    console.log('\n3. 📦 Checking dependencies...');

    // Check if node_modules exists in root
    if (fs.existsSync(path.join(this.projectRoot, 'node_modules'))) {
      this.passed.push('✅ Root dependencies installed');
    } else {
      this.errors.push('❌ Root dependencies not installed - run npm install');
    }

    // Check client dependencies
    if (fs.existsSync(path.join(this.projectRoot, 'client', 'node_modules'))) {
      this.passed.push('✅ Client dependencies installed');
    } else {
      this.warnings.push('⚠️ Client dependencies not installed - run npm run install:all');
    }

    // Check service dependencies
    const services = ['api-gateway', 'auth-service', 'link-service', 'community-service', 'chat-service', 'news-service', 'admin-service'];
    
    let missingServices = 0;
    for (const service of services) {
      const serviceNodeModules = path.join(this.projectRoot, 'services', service, 'node_modules');
      if (fs.existsSync(serviceNodeModules)) {
        this.passed.push(`✅ ${service} dependencies installed`);
      } else {
        missingServices++;
      }
    }
    
    if (missingServices > 0) {
      this.warnings.push(`⚠️ ${missingServices} services missing dependencies - run npm run install:all`);
    }
  }

  async checkServiceConfiguration() {
    console.log('\n4. ⚙️ Checking service configuration...');

    const services = [
      { name: 'api-gateway', path: 'services/api-gateway/app.js' },
      { name: 'auth-service', path: 'services/auth-service/src/app.js' },
      { name: 'link-service', path: 'services/link-service/src/app.js' },
      { name: 'community-service', path: 'services/community-service/src/app.js' },
      { name: 'chat-service', path: 'services/chat-service/src/app.js' },
      { name: 'news-service', path: 'services/news-service/src/app.js' },
      { name: 'admin-service', path: 'services/admin-service/src/app.js' },
      { name: 'phishtank-service', path: 'services/phishtank-service/src/app.js' }
    ];

    for (const service of services) {
      const servicePath = path.join(this.projectRoot, service.path);
      if (fs.existsSync(servicePath)) {
        this.passed.push(`✅ ${service.name} configuration exists`);
        
        // Check if service uses env-loader
        const content = fs.readFileSync(servicePath, 'utf8');
        if (content.includes('env-loader') || content.includes('setupEnvironment')) {
          this.passed.push(`✅ ${service.name} uses standardized env-loader`);
        } else if (service.name === 'phishtank-service') {
          // This is expected to be fixed now
          this.warnings.push(`⚠️ ${service.name} should use standardized env-loader`);
        }
      } else {
        this.errors.push(`❌ ${service.name} configuration missing`);
      }
    }
  }

  async checkDockerSetup() {
    console.log('\n5. 🐳 Checking Docker setup...');

    try {
      execSync('docker --version', { stdio: 'pipe' });
      this.passed.push('✅ Docker is installed');
      
      try {
        execSync('docker-compose --version', { stdio: 'pipe' });
        this.passed.push('✅ Docker Compose is installed');
      } catch (error) {
        this.warnings.push('⚠️ Docker Compose not installed (optional for development)');
      }
    } catch (error) {
      this.warnings.push('⚠️ Docker not installed (optional for development)');
    }

    // Check Docker configurations
    const dockerFiles = [
      'docker-compose.yml',
      'docker-compose.dev.yml',
      'docker-compose.microservices.yml'
    ];

    for (const file of dockerFiles) {
      if (fs.existsSync(path.join(this.projectRoot, file))) {
        this.passed.push(`✅ ${file} exists`);
      } else {
        this.errors.push(`❌ Missing Docker file: ${file}`);
      }
    }
  }

  async generateReport() {
    console.log('\n📊 VALIDATION REPORT');
    console.log('==================');

    console.log(`\n✅ PASSED: ${this.passed.length}`);
    this.passed.forEach(item => console.log(`  ${item}`));

    if (this.warnings.length > 0) {
      console.log(`\n⚠️  WARNINGS: ${this.warnings.length}`);
      this.warnings.forEach(item => console.log(`  ${item}`));
    }

    if (this.errors.length > 0) {
      console.log(`\n❌ ERRORS: ${this.errors.length}`);
      this.errors.forEach(item => console.log(`  ${item}`));
      console.log('\n🔧 TO FIX ERRORS:');
      console.log('  1. Run: npm run setup');
      console.log('  2. Run: npm run install:all');
      console.log('  3. Edit .env file with your actual credentials');
      console.log('  4. Run this validation again');
      
      process.exit(1);
    }

    console.log('\n🎉 SETUP VALIDATION COMPLETE!');
    
    if (this.warnings.length === 0) {
      console.log('✅ Your development environment is perfectly configured!');
      console.log('\n📋 Ready to start developing:');
      console.log('  npm start  # Start all services');
      console.log('  npm run docker  # Alternative: Start with Docker');
    } else {
      console.log('⚠️  Your environment is functional but has some warnings.');
      console.log('   Consider addressing the warnings for optimal experience.');
      console.log('\n📋 You can still start developing:');
      console.log('  npm start  # Start all services');
    }
  }
}

// Run if called directly
if (require.main === module) {
  const validator = new NewDevSetupValidator();
  validator.validate().catch(console.error);
}

module.exports = NewDevSetupValidator; 