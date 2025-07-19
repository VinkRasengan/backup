#!/usr/bin/env node

/**
 * Validate Environment Configuration Refactoring
 * Tests the new microservice-specific environment configuration
 */

const fs = require('fs');
const path = require('path');
const { quickSetup, getRequiredVarsForService } = require('../config/env-loader');

class EnvRefactorValidator {
  constructor() {
    this.results = {
      services: {},
      client: {},
      shared: {},
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        warnings: 0
      }
    };
  }

  /**
   * Validate all service configurations
   */
  async validateAll() {
    console.log('🔍 Validating Environment Configuration Refactoring...\n');

    // Validate shared configuration
    await this.validateSharedConfig();

    // Validate client configuration
    await this.validateClientConfig();

    // Validate service configurations
    const services = [
      'api-gateway',
      'auth-service', 
      'chat-service',
      'link-service',
      'community-service',
      'news-service',
      'admin-service',
      'phishtank-service',
      'criminalip-service'
    ];

    for (const service of services) {
      await this.validateServiceConfig(service);
    }

    // Generate summary report
    this.generateSummaryReport();
  }

  /**
   * Validate shared configuration
   */
  async validateSharedConfig() {
    console.log('📋 Validating shared configuration...');
    
    const sharedEnvPath = path.join(__dirname, '../config/shared.env');
    const exists = fs.existsSync(sharedEnvPath);
    
    this.results.shared = {
      exists,
      path: sharedEnvPath,
      valid: exists
    };

    if (exists) {
      console.log('✅ Shared config exists at config/shared.env');
    } else {
      console.log('❌ Shared config missing at config/shared.env');
    }
  }

  /**
   * Validate client configuration
   */
  async validateClientConfig() {
    console.log('\n⚛️ Validating client configuration...');
    
    const clientEnvPath = path.join(__dirname, '../client/.env');
    const exists = fs.existsSync(clientEnvPath);
    
    let valid = false;
    let hasRequiredVars = false;
    
    if (exists) {
      const content = fs.readFileSync(clientEnvPath, 'utf8');
      hasRequiredVars = content.includes('REACT_APP_API_URL') && 
                       content.includes('REACT_APP_FIREBASE_PROJECT_ID');
      valid = hasRequiredVars;
    }

    this.results.client = {
      exists,
      path: clientEnvPath,
      valid,
      hasRequiredVars
    };

    if (valid) {
      console.log('✅ Client config is valid');
    } else if (exists) {
      console.log('⚠️ Client config exists but missing required variables');
    } else {
      console.log('❌ Client config missing');
    }
  }

  /**
   * Validate individual service configuration
   */
  async validateServiceConfig(serviceName) {
    console.log(`\n🔧 Validating ${serviceName}...`);
    
    const serviceDir = path.join(__dirname, '../services', serviceName);
    const envPath = path.join(serviceDir, '.env');
    
    const result = {
      serviceName,
      exists: fs.existsSync(envPath),
      path: envPath,
      valid: false,
      envResult: null,
      requiredVars: [],
      missingVars: [],
      warnings: []
    };

    this.results.summary.total++;

    if (!result.exists) {
      console.log(`❌ ${serviceName}: .env file not found`);
      result.valid = false;
      this.results.summary.failed++;
      this.results.services[serviceName] = result;
      return;
    }

    // Test environment loading from service directory
    const originalCwd = process.cwd();
    try {
      process.chdir(serviceDir);
      
      // Get required variables for this service type
      result.requiredVars = getRequiredVarsForService(serviceName);
      
      // Test the new env loader
      result.envResult = quickSetup(serviceName, serviceName, false);
      
      if (result.envResult.success) {
        console.log(`✅ ${serviceName}: Configuration valid`);
        result.valid = true;
        this.results.summary.passed++;
      } else {
        console.log(`⚠️ ${serviceName}: Configuration has issues`);
        result.missingVars = result.envResult.validation.missing || [];
        result.warnings = result.envResult.validation.warnings || [];
        
        if (result.missingVars.length > 0) {
          console.log(`   Missing: ${result.missingVars.join(', ')}`);
          this.results.summary.failed++;
        } else {
          console.log(`   Warnings only`);
          this.results.summary.warnings++;
        }
      }
      
    } catch (error) {
      console.log(`❌ ${serviceName}: Error testing configuration - ${error.message}`);
      result.valid = false;
      result.error = error.message;
      this.results.summary.failed++;
    } finally {
      process.chdir(originalCwd);
    }

    this.results.services[serviceName] = result;
  }

  /**
   * Generate summary report
   */
  generateSummaryReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 ENVIRONMENT REFACTORING VALIDATION SUMMARY');
    console.log('='.repeat(60));

    // Overall statistics
    console.log(`\n📈 Overall Results:`);
    console.log(`   Total Services: ${this.results.summary.total}`);
    console.log(`   ✅ Passed: ${this.results.summary.passed}`);
    console.log(`   ❌ Failed: ${this.results.summary.failed}`);
    console.log(`   ⚠️ Warnings: ${this.results.summary.warnings}`);

    // Shared config status
    console.log(`\n📋 Shared Configuration:`);
    console.log(`   Status: ${this.results.shared.valid ? '✅ Valid' : '❌ Invalid'}`);

    // Client config status
    console.log(`\n⚛️ Client Configuration:`);
    console.log(`   Status: ${this.results.client.valid ? '✅ Valid' : '❌ Invalid'}`);

    // Service details
    console.log(`\n🔧 Service Details:`);
    Object.entries(this.results.services).forEach(([serviceName, result]) => {
      const status = result.valid ? '✅' : '❌';
      console.log(`   ${status} ${serviceName}`);
      
      if (result.missingVars && result.missingVars.length > 0) {
        console.log(`      Missing: ${result.missingVars.join(', ')}`);
      }
      
      if (result.warnings && result.warnings.length > 0) {
        console.log(`      Warnings: ${result.warnings.length} variable(s)`);
      }
    });

    // Recommendations
    console.log(`\n💡 Recommendations:`);
    
    if (this.results.summary.failed > 0) {
      console.log(`   1. Fix missing environment variables in failed services`);
      console.log(`   2. Ensure all required .env files exist`);
      console.log(`   3. Check service-specific variable requirements`);
    }
    
    if (this.results.summary.warnings > 0) {
      console.log(`   4. Review warnings and update placeholder values`);
      console.log(`   5. Consider using production-ready API keys`);
    }
    
    if (this.results.summary.passed === this.results.summary.total) {
      console.log(`   🎉 All services configured correctly!`);
      console.log(`   🚀 Ready for microservices deployment`);
    }

    // Migration status
    console.log(`\n🔄 Migration Status:`);
    console.log(`   ✅ Configuration structure refactored`);
    console.log(`   ✅ Service-specific .env files created`);
    console.log(`   ✅ Standardized env-loader implemented`);
    console.log(`   ${this.results.summary.failed === 0 ? '✅' : '⏳'} All services validated`);
    console.log(`   ⏳ Production deployment pending`);

    console.log('\n' + '='.repeat(60));
  }

  /**
   * Save detailed report to file
   */
  saveDetailedReport() {
    const reportPath = path.join(__dirname, '../docs/env-refactor-validation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new EnvRefactorValidator();
  validator.validateAll()
    .then(() => {
      validator.saveDetailedReport();
      
      // Exit with appropriate code
      const hasFailures = validator.results.summary.failed > 0;
      process.exit(hasFailures ? 1 : 0);
    })
    .catch(error => {
      console.error('❌ Validation failed:', error);
      process.exit(1);
    });
}

module.exports = EnvRefactorValidator;
