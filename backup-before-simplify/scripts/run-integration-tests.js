#!/usr/bin/env node

/**
 * Integration Test Runner Script
 * Orchestrates the complete integration testing pipeline
 */

const IntegrationTestManager = require('../services/shared/testing/integrationTestManager');
const ContractTestRunner = require('../services/shared/testing/contractTestRunner');
const path = require('path');
const fs = require('fs').promises;

class TestPipeline {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.reportsDir = path.join(this.projectRoot, 'test-reports');
    this.integrationTestManager = new IntegrationTestManager({
      projectRoot: this.projectRoot
    });
    this.contractTestRunner = new ContractTestRunner({
      servicesDir: path.join(this.projectRoot, 'services')
    });
  }

  /**
   * Run complete test pipeline
   */
  async runTestPipeline() {
    console.log('🚀 Starting complete test pipeline...');
    
    try {
      // Ensure reports directory exists
      await fs.mkdir(this.reportsDir, { recursive: true });
      
      const results = {
        pipeline: {
          startTime: new Date().toISOString(),
          endTime: null,
          duration: null,
          status: 'running'
        },
        contractTests: null,
        integrationTests: null,
        summary: null
      };
      
      // Run contract tests first
      console.log('\n📋 Phase 1: Contract Testing');
      try {
        results.contractTests = await this.contractTestRunner.runAllContractTests();
        console.log('✅ Contract tests completed');
      } catch (error) {
        console.error('❌ Contract tests failed:', error.message);
        results.contractTests = { error: error.message, status: 'failed' };
      }
      
      // Run integration tests
      console.log('\n🔗 Phase 2: Integration Testing');
      try {
        results.integrationTests = await this.integrationTestManager.runIntegrationTests();
        console.log('✅ Integration tests completed');
      } catch (error) {
        console.error('❌ Integration tests failed:', error.message);
        results.integrationTests = { error: error.message, status: 'failed' };
      }
      
      // Generate summary
      results.pipeline.endTime = new Date().toISOString();
      results.pipeline.duration = new Date(results.pipeline.endTime) - new Date(results.pipeline.startTime);
      results.summary = this.generateSummary(results);
      
      // Determine overall status
      const hasFailures = this.hasFailures(results);
      results.pipeline.status = hasFailures ? 'failed' : 'passed';
      
      // Save reports
      await this.saveReports(results);
      
      // Print summary
      this.printSummary(results);
      
      // Exit with appropriate code
      if (hasFailures) {
        console.log('\n❌ Test pipeline failed');
        process.exit(1);
      } else {
        console.log('\n✅ Test pipeline passed');
        process.exit(0);
      }
      
    } catch (error) {
      console.error('\n💥 Test pipeline crashed:', error);
      process.exit(1);
    }
  }

  /**
   * Run only contract tests
   */
  async runContractTestsOnly() {
    console.log('📋 Running contract tests only...');
    
    try {
      const results = await this.contractTestRunner.runAllContractTests();
      await this.saveContractReport(results);
      
      const hasFailures = results.summary.failed > 0 || results.summary.errors > 0;
      
      if (hasFailures) {
        console.log('❌ Contract tests failed');
        process.exit(1);
      } else {
        console.log('✅ Contract tests passed');
        process.exit(0);
      }
      
    } catch (error) {
      console.error('❌ Contract tests crashed:', error);
      process.exit(1);
    }
  }

  /**
   * Run only integration tests
   */
  async runIntegrationTestsOnly() {
    console.log('🔗 Running integration tests only...');
    
    try {
      const results = await this.integrationTestManager.runIntegrationTests();
      await this.saveIntegrationReport(results);
      
      const hasFailures = results.summary.failed > 0;
      
      if (hasFailures) {
        console.log('❌ Integration tests failed');
        process.exit(1);
      } else {
        console.log('✅ Integration tests passed');
        process.exit(0);
      }
      
    } catch (error) {
      console.error('❌ Integration tests crashed:', error);
      process.exit(1);
    }
  }

  /**
   * Generate test summary
   */
  generateSummary(results) {
    const summary = {
      overall: {
        status: 'unknown',
        totalTests: 0,
        passedTests: 0,
        failedTests: 0
      },
      contractTests: {
        status: 'not_run',
        total: 0,
        passed: 0,
        failed: 0
      },
      integrationTests: {
        status: 'not_run',
        total: 0,
        passed: 0,
        failed: 0
      }
    };

    // Contract tests summary
    if (results.contractTests && !results.contractTests.error) {
      summary.contractTests = {
        status: results.contractTests.summary.failed > 0 ? 'failed' : 'passed',
        total: results.contractTests.summary.total,
        passed: results.contractTests.summary.passed,
        failed: results.contractTests.summary.failed
      };
    } else if (results.contractTests && results.contractTests.error) {
      summary.contractTests.status = 'error';
    }

    // Integration tests summary
    if (results.integrationTests && !results.integrationTests.error) {
      summary.integrationTests = {
        status: results.integrationTests.summary.failed > 0 ? 'failed' : 'passed',
        total: results.integrationTests.summary.total,
        passed: results.integrationTests.summary.passed,
        failed: results.integrationTests.summary.failed
      };
    } else if (results.integrationTests && results.integrationTests.error) {
      summary.integrationTests.status = 'error';
    }

    // Overall summary
    summary.overall.totalTests = summary.contractTests.total + summary.integrationTests.total;
    summary.overall.passedTests = summary.contractTests.passed + summary.integrationTests.passed;
    summary.overall.failedTests = summary.contractTests.failed + summary.integrationTests.failed;
    
    const hasFailures = summary.overall.failedTests > 0 || 
                       summary.contractTests.status === 'error' || 
                       summary.integrationTests.status === 'error';
    
    summary.overall.status = hasFailures ? 'failed' : 'passed';

    return summary;
  }

  /**
   * Check if there are any failures
   */
  hasFailures(results) {
    const contractFailures = results.contractTests && 
      (results.contractTests.error || 
       (results.contractTests.summary && results.contractTests.summary.failed > 0));
    
    const integrationFailures = results.integrationTests && 
      (results.integrationTests.error || 
       (results.integrationTests.summary && results.integrationTests.summary.failed > 0));
    
    return contractFailures || integrationFailures;
  }

  /**
   * Save all test reports
   */
  async saveReports(results) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Save complete report
    const completeReportPath = path.join(this.reportsDir, `complete-test-report-${timestamp}.json`);
    await fs.writeFile(completeReportPath, JSON.stringify(results, null, 2));
    
    // Save individual reports
    if (results.contractTests) {
      await this.saveContractReport(results.contractTests, timestamp);
    }
    
    if (results.integrationTests) {
      await this.saveIntegrationReport(results.integrationTests, timestamp);
    }
    
    // Save summary report
    const summaryReportPath = path.join(this.reportsDir, `test-summary-${timestamp}.json`);
    await fs.writeFile(summaryReportPath, JSON.stringify(results.summary, null, 2));
    
    console.log(`📊 Reports saved to: ${this.reportsDir}`);
  }

  /**
   * Save contract test report
   */
  async saveContractReport(results, timestamp = null) {
    const ts = timestamp || new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(this.reportsDir, `contract-test-report-${ts}.json`);
    await fs.writeFile(reportPath, JSON.stringify(results, null, 2));
  }

  /**
   * Save integration test report
   */
  async saveIntegrationReport(results, timestamp = null) {
    const ts = timestamp || new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(this.reportsDir, `integration-test-report-${ts}.json`);
    await fs.writeFile(reportPath, JSON.stringify(results, null, 2));
  }

  /**
   * Print test summary to console
   */
  printSummary(results) {
    console.log('\n📊 TEST PIPELINE SUMMARY');
    console.log('========================');
    
    if (results.summary) {
      console.log(`Overall Status: ${results.summary.overall.status.toUpperCase()}`);
      console.log(`Total Tests: ${results.summary.overall.totalTests}`);
      console.log(`Passed: ${results.summary.overall.passedTests}`);
      console.log(`Failed: ${results.summary.overall.failedTests}`);
      
      console.log('\nContract Tests:');
      console.log(`  Status: ${results.summary.contractTests.status}`);
      console.log(`  Total: ${results.summary.contractTests.total}`);
      console.log(`  Passed: ${results.summary.contractTests.passed}`);
      console.log(`  Failed: ${results.summary.contractTests.failed}`);
      
      console.log('\nIntegration Tests:');
      console.log(`  Status: ${results.summary.integrationTests.status}`);
      console.log(`  Total: ${results.summary.integrationTests.total}`);
      console.log(`  Passed: ${results.summary.integrationTests.passed}`);
      console.log(`  Failed: ${results.summary.integrationTests.failed}`);
    }
    
    if (results.pipeline.duration) {
      console.log(`\nDuration: ${Math.round(results.pipeline.duration / 1000)}s`);
    }
  }

  /**
   * Clean up test environment
   */
  async cleanup() {
    console.log('🧹 Cleaning up test environment...');
    await this.integrationTestManager.cleanup();
  }
}

// CLI handling
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'all';
  
  const pipeline = new TestPipeline();
  
  try {
    switch (command) {
      case 'all':
      case 'pipeline':
        await pipeline.runTestPipeline();
        break;
      
      case 'contracts':
        await pipeline.runContractTestsOnly();
        break;
      
      case 'integration':
        await pipeline.runIntegrationTestsOnly();
        break;
      
      case 'cleanup':
        await pipeline.cleanup();
        console.log('✅ Cleanup completed');
        break;
      
      default:
        console.log('Usage: node run-integration-tests.js [all|contracts|integration|cleanup]');
        process.exit(1);
    }
  } catch (error) {
    console.error('Test pipeline failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = TestPipeline;
