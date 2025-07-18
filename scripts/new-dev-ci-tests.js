#!/usr/bin/env node

/**
 * New Developer CI Tests
 * Comprehensive testing for common issues new developers face
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

class NewDeveloperCITests {
  constructor() {
    this.projectRoot = process.cwd();
    this.results = {
      passed: [],
      failed: [],
      warnings: [],
      critical: []
    };
    this.testSuites = [
      'environment',
      'dependencies',
      'services',
      'configuration',
      'connectivity',
      'security',
      'performance'
    ];
  }

  async runAllTests() {
    console.log('🧪 New Developer CI Tests - Comprehensive Validation');
    console.log('='.repeat(65));
    console.log(`📅 Started at: ${new Date().toISOString()}`);
    console.log(`📁 Project root: ${this.projectRoot}`);
    console.log('');

    try {
      // Run all test suites
      for (const suite of this.testSuites) {
        await this.runTestSuite(suite);
      }

      // Generate comprehensive report
      this.generateReport();
      
      // Return success/failure status
      return this.results.failed.length === 0 && this.results.critical.length === 0;

    } catch (error) {
      console.error('❌ CI Tests failed with error:', error.message);
      return false;
    }
  }

  async runTestSuite(suiteName) {
    console.log(`\n🔍 Running ${suiteName.toUpperCase()} tests...`);
    
    switch (suiteName) {
      case 'environment':
        await this.testEnvironmentSetup();
        break;
      case 'dependencies':
        await this.testDependencies();
        break;
      case 'services':
        await this.testServices();
        break;
      case 'configuration':
        await this.testConfiguration();
        break;
      case 'connectivity':
        await this.testConnectivity();
        break;
      case 'security':
        await this.testSecurity();
        break;
      case 'performance':
        await this.testPerformance();
        break;
    }
  }

  async testEnvironmentSetup() {
    // Test 1: Environment file exists and is properly configured
    const envPath = path.join(this.projectRoot, '.env');
    if (!fs.existsSync(envPath)) {
      this.results.critical.push('❌ .env file not found - new developers cannot start');
      return;
    }

    // Load and validate environment
    require('dotenv').config({ path: envPath });

    // Test 2: Critical environment variables
    const criticalVars = [
      'NODE_ENV',
      'FIREBASE_PROJECT_ID',
      'JWT_SECRET',
      'REACT_APP_API_URL'
    ];

    for (const varName of criticalVars) {
      if (!process.env[varName]) {
        this.results.critical.push(`❌ Missing critical env var: ${varName}`);
      } else if (process.env[varName].includes('your-') || process.env[varName].includes('placeholder')) {
        this.results.failed.push(`❌ ${varName} has placeholder value`);
      } else {
        this.results.passed.push(`✅ ${varName} configured`);
      }
    }

    // Test 3: Service URLs configuration
    const serviceVars = [
      'AUTH_SERVICE_URL',
      'LINK_SERVICE_URL',
      'COMMUNITY_SERVICE_URL',
      'CHAT_SERVICE_URL',
      'NEWS_SERVICE_URL',
      'ADMIN_SERVICE_URL'
    ];

    let localhostCount = 0;
    for (const varName of serviceVars) {
      const value = process.env[varName];
      if (value && (value.includes('localhost') || value.includes('127.0.0.1'))) {
        localhostCount++;
      }
    }

    if (localhostCount > 0) {
      this.results.warnings.push(`⚠️  ${localhostCount} services using localhost (OK for local dev)`);
    }

    // Test 4: Environment validation script
    try {
      execSync('node scripts/validate-env-config.js', { stdio: 'pipe' });
      this.results.passed.push('✅ Environment validation script passes');
    } catch (error) {
      this.results.failed.push('❌ Environment validation script fails');
    }
  }

  async testDependencies() {
    // Test 1: Root dependencies
    const rootNodeModules = path.join(this.projectRoot, 'node_modules');
    if (!fs.existsSync(rootNodeModules)) {
      this.results.critical.push('❌ Root dependencies not installed');
    } else {
      this.results.passed.push('✅ Root dependencies installed');
    }

    // Test 2: Client dependencies
    const clientNodeModules = path.join(this.projectRoot, 'client', 'node_modules');
    if (!fs.existsSync(clientNodeModules)) {
      this.results.critical.push('❌ Client dependencies not installed');
    } else {
      this.results.passed.push('✅ Client dependencies installed');
    }

    // Test 3: Service dependencies
    const services = ['api-gateway', 'auth-service', 'link-service', 'community-service', 'chat-service', 'news-service', 'admin-service'];
    let missingServiceDeps = 0;

    for (const service of services) {
      const serviceNodeModules = path.join(this.projectRoot, 'services', service, 'node_modules');
      if (!fs.existsSync(serviceNodeModules)) {
        missingServiceDeps++;
      }
    }

    if (missingServiceDeps > 0) {
      this.results.failed.push(`❌ ${missingServiceDeps} services missing dependencies`);
    } else {
      this.results.passed.push('✅ All service dependencies installed');
    }

    // Test 4: Package.json consistency
    try {
      const rootPkg = JSON.parse(fs.readFileSync(path.join(this.projectRoot, 'package.json'), 'utf8'));
      const clientPkg = JSON.parse(fs.readFileSync(path.join(this.projectRoot, 'client', 'package.json'), 'utf8'));
      
      // Check Node version consistency
      if (rootPkg.engines && clientPkg.engines) {
        if (rootPkg.engines.node !== clientPkg.engines.node) {
          this.results.warnings.push('⚠️  Node version mismatch between root and client');
        }
      }
      
      this.results.passed.push('✅ Package.json files are valid');
    } catch (error) {
      this.results.failed.push('❌ Package.json validation failed');
    }
  }

  async testServices() {
    // Test 1: Service structure
    const services = ['api-gateway', 'auth-service', 'link-service', 'community-service', 'chat-service', 'news-service', 'admin-service'];
    
    for (const service of services) {
      const servicePath = path.join(this.projectRoot, 'services', service);
      const packagePath = path.join(servicePath, 'package.json');
      const appPath = path.join(servicePath, 'src', 'app.js');
      const rootAppPath = path.join(servicePath, 'app.js'); // Some services have app.js in root
      const envLoaderPath = path.join(servicePath, 'src', 'utils', 'env-loader.js');

      if (!fs.existsSync(servicePath)) {
        this.results.failed.push(`❌ Service directory missing: ${service}`);
        continue;
      }

      if (!fs.existsSync(packagePath)) {
        this.results.failed.push(`❌ Package.json missing: ${service}`);
      }

      if (!fs.existsSync(appPath) && !fs.existsSync(rootAppPath)) {
        this.results.failed.push(`❌ App.js missing: ${service}`);
      }

      if (!fs.existsSync(envLoaderPath)) {
        this.results.warnings.push(`⚠️  env-loader.js missing: ${service}`);
      } else {
        this.results.passed.push(`✅ ${service} has proper structure`);
      }
    }

    // Test 2: Service environment loading
    try {
      execSync('node scripts/test-env-loading.js', { stdio: 'pipe' });
      this.results.passed.push('✅ All services can load environment variables');
    } catch (error) {
      this.results.failed.push('❌ Some services cannot load environment variables');
    }
  }

  async testConfiguration() {
    // Test 1: Docker configuration
    const dockerFiles = ['docker-compose.yml', 'docker-compose.dev.yml'];
    for (const file of dockerFiles) {
      if (fs.existsSync(path.join(this.projectRoot, file))) {
        this.results.passed.push(`✅ ${file} exists`);
      } else {
        this.results.warnings.push(`⚠️  ${file} missing`);
      }
    }

    // Test 2: Kubernetes configuration
    const k8sDir = path.join(this.projectRoot, 'k8s');
    if (fs.existsSync(k8sDir)) {
      const k8sFiles = fs.readdirSync(k8sDir).filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));
      if (k8sFiles.length > 0) {
        this.results.passed.push(`✅ Kubernetes configuration (${k8sFiles.length} files)`);
      }
    }

    // Test 3: CI/CD configuration
    const ciFiles = ['.github/workflows/microservices-ci.yml', '.github/workflows/test-pipeline.yml'];
    for (const file of ciFiles) {
      if (fs.existsSync(path.join(this.projectRoot, file))) {
        this.results.passed.push(`✅ ${file} exists`);
      } else {
        this.results.warnings.push(`⚠️  ${file} missing`);
      }
    }
  }

  async testConnectivity() {
    // Test 1: Port availability check
    const ports = [3000, 3001, 3002, 3003, 3004, 3005, 3006, 8080];
    const busyPorts = [];

    for (const port of ports) {
      try {
        const { execSync } = require('child_process');
        if (process.platform === 'win32') {
          execSync(`netstat -an | findstr :${port}`, { stdio: 'pipe' });
          busyPorts.push(port);
        } else {
          execSync(`lsof -i :${port}`, { stdio: 'pipe' });
          busyPorts.push(port);
        }
      } catch (error) {
        // Port is free
      }
    }

    if (busyPorts.length > 0) {
      this.results.warnings.push(`⚠️  Ports in use: ${busyPorts.join(', ')} (may cause conflicts)`);
    } else {
      this.results.passed.push('✅ All required ports are available');
    }

    // Test 2: Network connectivity
    try {
      execSync('ping -c 1 8.8.8.8', { stdio: 'pipe', timeout: 5000 });
      this.results.passed.push('✅ Internet connectivity available');
    } catch (error) {
      this.results.warnings.push('⚠️  Internet connectivity issues detected');
    }
  }

  async testSecurity() {
    // Test 1: JWT Secret strength
    const jwtSecret = process.env.JWT_SECRET;
    if (jwtSecret) {
      if (jwtSecret.length < 32) {
        this.results.failed.push('❌ JWT_SECRET too short (minimum 32 characters)');
      } else if (jwtSecret === 'your-jwt-secret' || jwtSecret.includes('example')) {
        this.results.failed.push('❌ JWT_SECRET is using default/example value');
      } else {
        this.results.passed.push('✅ JWT_SECRET is properly configured');
      }
    }

    // Test 2: Firebase credentials
    const firebaseVars = ['FIREBASE_PROJECT_ID', 'FIREBASE_PRIVATE_KEY', 'FIREBASE_CLIENT_EMAIL'];
    let firebaseConfigured = 0;
    
    for (const varName of firebaseVars) {
      const value = process.env[varName];
      if (value && !value.includes('your-') && !value.includes('placeholder')) {
        firebaseConfigured++;
      }
    }

    if (firebaseConfigured === firebaseVars.length) {
      this.results.passed.push('✅ Firebase credentials configured');
    } else {
      this.results.warnings.push('⚠️  Firebase credentials incomplete (services may not work)');
    }

    // Test 3: API keys security
    const apiKeys = ['GEMINI_API_KEY', 'VIRUSTOTAL_API_KEY', 'SCAMADVISER_API_KEY'];
    let exposedKeys = 0;

    for (const keyName of apiKeys) {
      const value = process.env[keyName];
      if (value && value.length > 10 && !value.includes('your-')) {
        // Check if key might be exposed in git
        try {
          execSync(`git log --all -p | grep -i "${value.substring(0, 10)}"`, { stdio: 'pipe' });
          exposedKeys++;
        } catch (error) {
          // Key not found in git history (good)
        }
      }
    }

    if (exposedKeys > 0) {
      this.results.failed.push(`❌ ${exposedKeys} API keys may be exposed in git history`);
    }
  }

  async testPerformance() {
    // Test 1: File system performance
    const testFile = path.join(this.projectRoot, '.test-performance');
    const startTime = Date.now();
    
    try {
      fs.writeFileSync(testFile, 'performance test');
      fs.readFileSync(testFile);
      fs.unlinkSync(testFile);
      
      const duration = Date.now() - startTime;
      if (duration > 1000) {
        this.results.warnings.push('⚠️  Slow file system performance detected');
      } else {
        this.results.passed.push('✅ File system performance OK');
      }
    } catch (error) {
      this.results.warnings.push('⚠️  File system performance test failed');
    }

    // Test 2: Memory usage
    const memUsage = process.memoryUsage();
    const memMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    
    if (memMB > 500) {
      this.results.warnings.push(`⚠️  High memory usage: ${memMB}MB`);
    } else {
      this.results.passed.push(`✅ Memory usage OK: ${memMB}MB`);
    }
  }

  generateReport() {
    console.log('\n' + '='.repeat(65));
    console.log('📊 NEW DEVELOPER CI TEST RESULTS');
    console.log('='.repeat(65));

    const total = this.results.passed.length + this.results.failed.length + 
                  this.results.warnings.length + this.results.critical.length;

    console.log(`\n📈 Summary: ${total} tests completed`);
    console.log(`   ✅ Passed: ${this.results.passed.length}`);
    console.log(`   ❌ Failed: ${this.results.failed.length}`);
    console.log(`   ⚠️  Warnings: ${this.results.warnings.length}`);
    console.log(`   🚨 Critical: ${this.results.critical.length}`);

    if (this.results.critical.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES (Must fix before development):');
      this.results.critical.forEach(issue => console.log(`   ${issue}`));
    }

    if (this.results.failed.length > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.results.failed.forEach(issue => console.log(`   ${issue}`));
    }

    if (this.results.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      this.results.warnings.forEach(issue => console.log(`   ${issue}`));
    }

    if (this.results.passed.length > 0) {
      console.log('\n✅ PASSED TESTS:');
      this.results.passed.forEach(issue => console.log(`   ${issue}`));
    }

    console.log('\n' + '='.repeat(65));
    
    if (this.results.critical.length > 0) {
      console.log('🚨 CRITICAL ISSUES FOUND - Development cannot proceed');
      console.log('💡 Run: npm run setup:full');
      console.log('💡 Check: DEVELOPER_SETUP.md');
    } else if (this.results.failed.length > 0) {
      console.log('❌ Some tests failed - Development may have issues');
      console.log('💡 Run: npm run env:validate');
      console.log('💡 Run: npm run env:test');
    } else {
      console.log('🎉 All critical tests passed - Ready for development!');
      console.log('💡 Next: npm start');
    }

    console.log(`\n⏱️  Completed at: ${new Date().toISOString()}`);
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new NewDeveloperCITests();
  tester.runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = NewDeveloperCITests;
