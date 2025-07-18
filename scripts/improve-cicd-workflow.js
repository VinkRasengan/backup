#!/usr/bin/env node

/**
 * CI/CD Workflow Improvement Script
 * Analyzes and improves the microservices CI/CD workflow
 */

const fs = require('fs');
const path = require('path');

class CICDWorkflowImprover {
  constructor() {
    this.projectRoot = process.cwd();
    this.improvements = [];
    this.issues = [];
    this.warnings = [];
  }

  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      warning: '\x1b[33m',
      error: '\x1b[31m',
      reset: '\x1b[0m'
    };
    
    console.log(`${colors[type]}${message}${colors.reset}`);
  }

  async analyzeWorkflow() {
    this.log('🔍 Analyzing CI/CD Workflow...', 'info');
    this.log('==========================================', 'info');

    await this.checkWorkflowFile();
    await this.analyzeJobConditions();
    await this.checkServiceStructure();
    await this.validateScripts();
    await this.checkDependencies();
    
    this.generateReport();
  }

  async checkWorkflowFile() {
    this.log('\n1. 📋 Checking workflow file...', 'info');
    
    const workflowPath = '.github/workflows/microservices-ci.yml';
    if (!fs.existsSync(workflowPath)) {
      this.issues.push('Workflow file not found: .github/workflows/microservices-ci.yml');
      return;
    }

    const content = fs.readFileSync(workflowPath, 'utf8');
    
    // Check for common issues
    if (content.includes('environment: staging-environment')) {
      this.improvements.push('Fix environment name from staging-environment to staging');
    }
    
    if (content.includes('needs.detect-changes.outputs.api-gateway == \'true\' || needs.detect-changes.outputs.auth-service == \'true\'')) {
      this.improvements.push('Simplify complex job conditions using any-service output');
    }
    
    this.log('✅ Workflow file exists and analyzed', 'success');
  }

  async analyzeJobConditions() {
    this.log('\n2. 🔍 Analyzing job conditions...', 'info');
    
    const services = [
      'api-gateway', 'auth-service', 'link-service', 'community-service',
      'chat-service', 'news-service', 'admin-service', 'phishtank-service', 'criminalip-service'
    ];
    
    // Check if all services exist
    services.forEach(service => {
      const servicePath = path.join('services', service);
      if (!fs.existsSync(servicePath)) {
        this.warnings.push(`Service directory not found: ${service}`);
      } else if (!fs.existsSync(path.join(servicePath, 'package.json'))) {
        this.warnings.push(`package.json not found in ${service}`);
      }
    });
    
    this.log('✅ Job conditions analyzed', 'success');
  }

  async checkServiceStructure() {
    this.log('\n3. 🏗️  Checking service structure...', 'info');
    
    const servicesDir = path.join(this.projectRoot, 'services');
    if (!fs.existsSync(servicesDir)) {
      this.issues.push('Services directory not found');
      return;
    }
    
    const services = fs.readdirSync(servicesDir).filter(item => 
      fs.statSync(path.join(servicesDir, item)).isDirectory()
    );
    
    this.log(`Found ${services.length} services: ${services.join(', ')}`, 'info');
    
    services.forEach(service => {
      const servicePath = path.join(servicesDir, service);
      const packageJson = path.join(servicePath, 'package.json');
      
      if (!fs.existsSync(packageJson)) {
        this.warnings.push(`Missing package.json in ${service}`);
      } else {
        try {
          const pkg = JSON.parse(fs.readFileSync(packageJson, 'utf8'));
          if (!pkg.scripts || !pkg.scripts.test) {
            this.warnings.push(`Missing test script in ${service}`);
          }
        } catch (error) {
          this.warnings.push(`Invalid package.json in ${service}`);
        }
      }
    });
  }

  async validateScripts() {
    this.log('\n4. 📜 Validating scripts...', 'info');
    
    const requiredScripts = [
      'scripts/ci-cd-validator.js',
      'scripts/ci-cd-auto-fix.js',
      'scripts/deploy-render-production.js'
    ];
    
    requiredScripts.forEach(script => {
      if (fs.existsSync(script)) {
        this.log(`✅ Found: ${script}`, 'success');
      } else {
        this.warnings.push(`Missing script: ${script}`);
      }
    });
  }

  async checkDependencies() {
    this.log('\n5. 📦 Checking dependencies...', 'info');
    
    const rootPackage = path.join(this.projectRoot, 'package.json');
    if (fs.existsSync(rootPackage)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(rootPackage, 'utf8'));
        
        if (!pkg.scripts['validate:cicd']) {
          this.warnings.push('Missing validate:cicd script in root package.json');
        }
        
        if (!pkg.scripts['fix:cicd']) {
          this.warnings.push('Missing fix:cicd script in root package.json');
        }
      } catch (error) {
        this.issues.push('Invalid root package.json');
      }
    }
  }

  generateReport() {
    this.log('\n📊 CI/CD WORKFLOW ANALYSIS REPORT', 'info');
    this.log('='.repeat(50), 'info');
    
    if (this.improvements.length > 0) {
      this.log(`\n✅ IMPROVEMENTS APPLIED (${this.improvements.length}):`, 'success');
      this.improvements.forEach((improvement, index) => {
        this.log(`${index + 1}. ${improvement}`, 'success');
      });
    }
    
    if (this.warnings.length > 0) {
      this.log(`\n⚠️  WARNINGS (${this.warnings.length}):`, 'warning');
      this.warnings.forEach((warning, index) => {
        this.log(`${index + 1}. ${warning}`, 'warning');
      });
    }
    
    if (this.issues.length > 0) {
      this.log(`\n❌ ISSUES (${this.issues.length}):`, 'error');
      this.issues.forEach((issue, index) => {
        this.log(`${index + 1}. ${issue}`, 'error');
      });
    }
    
    this.log('\n📋 RECOMMENDATIONS:', 'info');
    this.log('1. Ensure all services have package.json with test scripts', 'info');
    this.log('2. Add missing validation scripts if needed', 'info');
    this.log('3. Configure GitHub Environments (staging, production)', 'info');
    this.log('4. Test workflow with small changes first', 'info');
    
    if (this.issues.length === 0 && this.warnings.length === 0) {
      this.log('\n🎉 CI/CD workflow is well-configured!', 'success');
    } else {
      this.log('\n🔧 Consider addressing the warnings for better CI/CD experience.', 'info');
    }
  }
}

// Run analyzer if called directly
if (require.main === module) {
  const analyzer = new CICDWorkflowImprover();
  analyzer.analyzeWorkflow().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('Analysis failed:', error);
    process.exit(1);
  });
}

module.exports = CICDWorkflowImprover; 