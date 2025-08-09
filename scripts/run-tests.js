import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
#!/usr/bin/env node

/**
 * Test Runner Script
 * Runs tests for Event Sourcing implementation
 */

import { execSync, spawn  } from 'child_process';
import path from 'path';
import fs from 'fs';

class TestRunner {
  constructor() {
    this.services = [
      'event-bus-service',
      'community-service'
    ];
    
    this.testTypes = {
      unit: 'Unit Tests',
      integration: 'Integration Tests',
      coverage: 'Coverage Tests',
      all: 'All Tests'
    };
    
    this.results = {
      passed: 0,
      failed: 0,
      services: {}
    };
  }

  /**
   * Main test runner
   */
  async run() {
    console.log('🧪 Event Sourcing Test Runner');
    console.log('================================\n');

    const testType = process.argv[2] || 'all';
    const serviceFilter = process.argv[3];

    if (!this.testTypes[testType]) {
      console.error(`❌ Invalid test type: ${testType}`);
      console.log(`Available types: ${Object.keys(this.testTypes).join(', ')}`);
      process.exit(1);
    }

    console.log(`📋 Running: ${this.testTypes[testType]}`);
    if (serviceFilter) {
      console.log(`🎯 Service: ${serviceFilter}`);
    }
    console.log('');

    try {
      // Check prerequisites
      await this.checkPrerequisites();
      
      // Get services to test
      const servicesToTest = serviceFilter 
        ? [serviceFilter] 
        : this.services;

      // Run tests for each service
      for (const service of servicesToTest) {
        await this.runServiceTests(service, testType);
      }

      // Print summary
      this.printSummary();

      // Exit with appropriate code
      process.exit(this.results.failed > 0 ? 1 : 0);

    } catch (error) {
      console.error('❌ Test runner failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Check prerequisites
   */
  async checkPrerequisites() {
    console.log('🔍 Checking prerequisites...');

    // Check Node.js version
    const nodeVersion = process.version;
    console.log(`   Node.js: ${nodeVersion}`);

    // Check if services exist
    for (const service of this.services) {
      const servicePath = path.join(__dirname, '..', 'services', service);
      if (!fs.existsSync(servicePath)) {
        throw new Error(`Service not found: ${service}`);
      }
      
      const packageJsonPath = path.join(servicePath, 'package.json');
      if (!fs.existsSync(packageJsonPath)) {
        throw new Error(`package.json not found for service: ${service}`);
      }
    }

    console.log('   ✅ All prerequisites met\n');
  }

  /**
   * Run tests for a specific service
   */
  async runServiceTests(service, testType) {
    console.log(`🚀 Testing ${service}...`);
    console.log('─'.repeat(50));

    const servicePath = path.join(__dirname, '..', 'services', service);
    
    try {
      // Install dependencies if needed
      await this.ensureDependencies(servicePath, service);
      
      // Run the appropriate test command
      const testCommand = this.getTestCommand(testType);
      const result = await this.executeTest(servicePath, testCommand, service);
      
      this.results.services[service] = result;
      
      if (result.success) {
        this.results.passed++;
        console.log(`   ✅ ${service} tests passed`);
      } else {
        this.results.failed++;
        console.log(`   ❌ ${service} tests failed`);
      }

    } catch (error) {
      this.results.failed++;
      this.results.services[service] = {
        success: false,
        error: error.message
      };
      console.log(`   ❌ ${service} tests failed: ${error.message}`);
    }

    console.log('');
  }

  /**
   * Ensure dependencies are installed
   */
  async ensureDependencies(servicePath, service) {
    const nodeModulesPath = path.join(servicePath, 'node_modules');
    
    if (!fs.existsSync(nodeModulesPath)) {
      console.log(`   📦 Installing dependencies for ${service}...`);
      
      try {
        execSync('npm install', {
          cwd: servicePath,
          stdio: 'pipe'
        });
        console.log(`   ✅ Dependencies installed for ${service}`);
      } catch (error) {
        throw new Error(`Failed to install dependencies for ${service}: ${error.message}`);
      }
    }
  }

  /**
   * Get test command based on type
   */
  getTestCommand(testType) {
    switch (testType) {
      case 'unit':
        return 'npm run test:unit';
      case 'integration':
        return 'npm run test:integration';
      case 'coverage':
        return 'npm run test:coverage';
      case 'all':
      default:
        return 'npm test';
    }
  }

  /**
   * Execute test command
   */
  async executeTest(servicePath, command, service) {
    return new Promise((resolve) => {
      const [cmd, ...args] = command.split(' ');
      
      const child = spawn(cmd, args, {
        cwd: servicePath,
        stdio: 'pipe'
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        const success = code === 0;
        
        // Log output for debugging
        if (process.env.VERBOSE === 'true') {
          console.log(`   📄 ${service} output:`);
          console.log(stdout);
          if (stderr) {
            console.log(`   ⚠️ ${service} errors:`);
            console.log(stderr);
          }
        }

        resolve({
          success,
          code,
          stdout,
          stderr
        });
      });

      child.on('error', (error) => {
        resolve({
          success: false,
          error: error.message
        });
      });
    });
  }

  /**
   * Print test summary
   */
  printSummary() {
    console.log('📊 Test Summary');
    console.log('===============');
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`📈 Total: ${this.results.passed + this.results.failed}`);
    console.log('');

    // Detailed results
    console.log('📋 Detailed Results:');
    for (const [service, result] of Object.entries(this.results.services)) {
      const status = result.success ? '✅' : '❌';
      console.log(`   ${status} ${service}`);
      
      if (!result.success && result.error) {
        console.log(`      Error: ${result.error}`);
      }
    }
    console.log('');

    // Recommendations
    if (this.results.failed > 0) {
      console.log('💡 Recommendations:');
      console.log('   - Check test output above for specific failures');
      console.log('   - Run with VERBOSE=true for detailed output');
      console.log('   - Ensure all dependencies are installed');
      console.log('   - Check that Event Store is properly configured');
      console.log('');
    } else {
      console.log('🎉 All tests passed! Event Sourcing implementation is ready.');
      console.log('');
    }
  }
}

// Usage information
function printUsage() {
  console.log('Usage: node scripts/run-tests.js [test-type] [service]');
  console.log('');
  console.log('Test types:');
  console.log('  unit        - Run unit tests only');
  console.log('  integration - Run integration tests only');
  console.log('  coverage    - Run tests with coverage');
  console.log('  all         - Run all tests (default)');
  console.log('');
  console.log('Services:');
  console.log('  event-bus-service    - Test Event Store Service');
  console.log('  community-service    - Test Community Service');
  console.log('  (omit to test all services)');
  console.log('');
  console.log('Examples:');
  console.log('  node scripts/run-tests.js');
  console.log('  node scripts/run-tests.js unit');
  console.log('  node scripts/run-tests.js integration event-bus-service');
  console.log('  VERBOSE=true node scripts/run-tests.js coverage');
}

// Handle help flag
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  printUsage();
  process.exit(0);
}

// Run tests
const runner = new TestRunner();
runner.run().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
