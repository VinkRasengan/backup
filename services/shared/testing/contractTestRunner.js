/**
 * Contract Test Runner
 * Orchestrates contract testing across all microservices
 */

const ContractTestManager = require('./contractTestManager');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

class ContractTestRunner {
  constructor(options = {}) {
    this.servicesDir = options.servicesDir || path.join(__dirname, '../../..');
    this.contractManager = new ContractTestManager(options);
    this.testResults = new Map();
    this.services = [
      'api-gateway',
      'auth-service',
      'link-service',
      'community-service',
      'chat-service',
      'news-service',
      'admin-service'
    ];
    
    this.serviceContracts = {
      'api-gateway': ['auth-service', 'link-service', 'community-service', 'chat-service', 'news-service', 'admin-service'],
      'link-service': ['auth-service'],
      'community-service': ['auth-service'],
      'chat-service': ['auth-service'],
      'news-service': ['auth-service'],
      'admin-service': ['auth-service', 'link-service', 'community-service', 'news-service']
    };
  }

  /**
   * Run all contract tests
   */
  async runAllContractTests() {
    console.log('🚀 Starting contract test suite...');
    
    try {
      // Initialize contract definitions
      this.contractManager.defineStandardContracts();
      
      // Run consumer tests
      await this.runConsumerTests();
      
      // Run provider verification tests
      await this.runProviderTests();
      
      // Generate test report
      const report = this.generateTestReport();
      
      console.log('✅ Contract test suite completed');
      return report;
      
    } catch (error) {
      console.error('❌ Contract test suite failed:', error);
      throw error;
    }
  }

  /**
   * Run consumer contract tests
   */
  async runConsumerTests() {
    console.log('📝 Running consumer contract tests...');
    
    for (const [consumer, providers] of Object.entries(this.serviceContracts)) {
      for (const provider of providers) {
        try {
          console.log(`Testing contract: ${consumer} -> ${provider}`);
          
          // Run Jest tests for this contract
          const testResult = await this.runJestContractTest(consumer, provider);
          
          this.testResults.set(`${consumer}->${provider}`, {
            type: 'consumer',
            consumer,
            provider,
            status: testResult.success ? 'passed' : 'failed',
            details: testResult,
            timestamp: new Date().toISOString()
          });
          
          if (testResult.success) {
            console.log(`✅ Consumer test passed: ${consumer} -> ${provider}`);
          } else {
            console.log(`❌ Consumer test failed: ${consumer} -> ${provider}`);
          }
          
        } catch (error) {
          console.error(`Error testing ${consumer} -> ${provider}:`, error);
          this.testResults.set(`${consumer}->${provider}`, {
            type: 'consumer',
            consumer,
            provider,
            status: 'error',
            error: error.message,
            timestamp: new Date().toISOString()
          });
        }
      }
    }
  }

  /**
   * Run provider verification tests
   */
  async runProviderTests() {
    console.log('🔍 Running provider verification tests...');
    
    for (const service of this.services) {
      try {
        // Check if service has any contracts to verify
        const hasContracts = Object.values(this.serviceContracts).some(providers => 
          providers.includes(service)
        );
        
        if (!hasContracts) {
          console.log(`⏭️  Skipping ${service} - no contracts to verify`);
          continue;
        }
        
        console.log(`Verifying provider: ${service}`);
        
        // Start the service for verification
        const serviceProcess = await this.startServiceForTesting(service);
        
        try {
          // Wait for service to be ready
          await this.waitForService(service);
          
          // Run provider verification
          const verificationResult = await this.contractManager.verifyProviderContracts(
            service,
            this.getServiceUrl(service),
            {
              publishResults: false,
              tags: ['test']
            }
          );
          
          this.testResults.set(`provider-${service}`, {
            type: 'provider',
            service,
            status: 'passed',
            details: verificationResult,
            timestamp: new Date().toISOString()
          });
          
          console.log(`✅ Provider verification passed: ${service}`);
          
        } finally {
          // Stop the service
          if (serviceProcess) {
            serviceProcess.kill();
          }
        }
        
      } catch (error) {
        console.error(`Error verifying provider ${service}:`, error);
        this.testResults.set(`provider-${service}`, {
          type: 'provider',
          service,
          status: 'failed',
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  /**
   * Run Jest contract test for specific consumer-provider pair
   */
  async runJestContractTest(consumer, provider) {
    return new Promise((resolve) => {
      const testFile = path.join(
        this.servicesDir,
        consumer,
        'tests',
        'contracts',
        `${provider}.contract.test.js`
      );
      
      // Check if test file exists
      fs.access(testFile)
        .then(() => {
          const jest = spawn('npx', ['jest', testFile, '--json'], {
            cwd: path.join(this.servicesDir, consumer),
            stdio: 'pipe'
          });
          
          let output = '';
          let errorOutput = '';
          
          jest.stdout.on('data', (data) => {
            output += data.toString();
          });
          
          jest.stderr.on('data', (data) => {
            errorOutput += data.toString();
          });
          
          jest.on('close', (code) => {
            try {
              const result = JSON.parse(output);
              resolve({
                success: code === 0,
                exitCode: code,
                results: result,
                error: errorOutput
              });
            } catch (parseError) {
              resolve({
                success: false,
                exitCode: code,
                error: `Failed to parse Jest output: ${parseError.message}`,
                rawOutput: output,
                rawError: errorOutput
              });
            }
          });
        })
        .catch(() => {
          resolve({
            success: false,
            error: `Contract test file not found: ${testFile}`
          });
        });
    });
  }

  /**
   * Start service for testing
   */
  async startServiceForTesting(serviceName) {
    const servicePath = path.join(this.servicesDir, serviceName);
    
    return new Promise((resolve, reject) => {
      const serviceProcess = spawn('npm', ['start'], {
        cwd: servicePath,
        stdio: 'pipe',
        env: {
          ...process.env,
          NODE_ENV: 'test',
          PORT: this.getServicePort(serviceName)
        }
      });
      
      serviceProcess.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('started') || output.includes('listening')) {
          resolve(serviceProcess);
        }
      });
      
      serviceProcess.stderr.on('data', (data) => {
        console.error(`Service ${serviceName} error:`, data.toString());
      });
      
      serviceProcess.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Service ${serviceName} exited with code ${code}`));
        }
      });
      
      // Timeout after 30 seconds
      setTimeout(() => {
        reject(new Error(`Service ${serviceName} failed to start within 30 seconds`));
      }, 30000);
    });
  }

  /**
   * Wait for service to be ready
   */
  async waitForService(serviceName, maxAttempts = 30) {
    const serviceUrl = this.getServiceUrl(serviceName);
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await fetch(`${serviceUrl}/health`);
        if (response.ok) {
          console.log(`Service ${serviceName} is ready`);
          return;
        }
      } catch (error) {
        // Service not ready yet
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error(`Service ${serviceName} did not become ready within ${maxAttempts} seconds`);
  }

  /**
   * Get service URL for testing
   */
  getServiceUrl(serviceName) {
    const port = this.getServicePort(serviceName);
    return `http://localhost:${port}`;
  }

  /**
   * Get service port for testing
   */
  getServicePort(serviceName) {
    const portMap = {
      'api-gateway': 8080,
      'auth-service': 3001,
      'link-service': 3002,
      'community-service': 3003,
      'chat-service': 3004,
      'news-service': 3005,
      'admin-service': 3006
    };
    
    return portMap[serviceName] || 3000;
  }

  /**
   * Generate test report
   */
  generateTestReport() {
    const results = Array.from(this.testResults.values());
    const consumerTests = results.filter(r => r.type === 'consumer');
    const providerTests = results.filter(r => r.type === 'provider');
    
    const report = {
      summary: {
        total: results.length,
        passed: results.filter(r => r.status === 'passed').length,
        failed: results.filter(r => r.status === 'failed').length,
        errors: results.filter(r => r.status === 'error').length
      },
      consumerTests: {
        total: consumerTests.length,
        passed: consumerTests.filter(r => r.status === 'passed').length,
        failed: consumerTests.filter(r => r.status === 'failed').length
      },
      providerTests: {
        total: providerTests.length,
        passed: providerTests.filter(r => r.status === 'passed').length,
        failed: providerTests.filter(r => r.status === 'failed').length
      },
      details: results,
      timestamp: new Date().toISOString()
    };
    
    return report;
  }

  /**
   * Run contract tests for CI/CD
   */
  async runForCI() {
    try {
      const report = await this.runAllContractTests();
      
      // Save report to file
      const reportPath = path.join(this.contractManager.pactDir, 'contract-test-report.json');
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
      
      // Exit with appropriate code
      const hasFailures = report.summary.failed > 0 || report.summary.errors > 0;
      
      if (hasFailures) {
        console.error('❌ Contract tests failed');
        process.exit(1);
      } else {
        console.log('✅ All contract tests passed');
        process.exit(0);
      }
      
    } catch (error) {
      console.error('❌ Contract test runner failed:', error);
      process.exit(1);
    }
  }

  /**
   * Run specific contract test
   */
  async runSpecificContract(consumer, provider) {
    console.log(`Running specific contract test: ${consumer} -> ${provider}`);
    
    try {
      this.contractManager.defineStandardContracts();
      const testResult = await this.runJestContractTest(consumer, provider);
      
      if (testResult.success) {
        console.log(`✅ Contract test passed: ${consumer} -> ${provider}`);
      } else {
        console.log(`❌ Contract test failed: ${consumer} -> ${provider}`);
        console.error(testResult.error);
      }
      
      return testResult;
      
    } catch (error) {
      console.error(`Error running contract test: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get test status
   */
  getStatus() {
    return {
      services: this.services,
      serviceContracts: this.serviceContracts,
      testResults: Array.from(this.testResults.entries()),
      contractManager: this.contractManager.getStatus()
    };
  }
}

module.exports = ContractTestRunner;
