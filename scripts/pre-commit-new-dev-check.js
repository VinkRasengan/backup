#!/usr/bin/env node

/**
 * Pre-commit Hook for New Developer Workflow
 * Validates that changes don't break the new developer experience
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class PreCommitNewDevCheck {
  constructor() {
    this.projectRoot = process.cwd();
    this.issues = [];
    this.warnings = [];
    this.passed = [];
  }

  async runChecks() {
    console.log('🔍 Pre-commit: New Developer Workflow Check');
    console.log('='.repeat(50));

    try {
      // Quick validation checks
      await this.checkEssentialFiles();
      await this.checkPackageJsonScripts();
      await this.checkEnvExample();
      await this.checkSetupScripts();
      await this.quickEnvironmentTest();
      
      // Generate report
      this.generateReport();
      
      return this.issues.length === 0;

    } catch (error) {
      console.error('❌ Pre-commit check failed:', error.message);
      return false;
    }
  }

  async checkEssentialFiles() {
    console.log('\n📁 Checking essential files...');
    
    const essentialFiles = [
      { path: '.env.example', name: 'Environment template' },
      { path: 'package.json', name: 'Root package.json' },
      { path: 'README.md', name: 'README documentation' },
      { path: 'DEVELOPER_SETUP.md', name: 'Developer setup guide' },
      { path: 'scripts/setup-microservices.js', name: 'Setup script' },
      { path: 'scripts/validate-env-config.js', name: 'Environment validation' },
      { path: 'scripts/test-env-loading.js', name: 'Environment loading test' }
    ];

    for (const file of essentialFiles) {
      const fullPath = path.join(this.projectRoot, file.path);
      if (fs.existsSync(fullPath)) {
        this.passed.push(`✅ ${file.name} exists`);
      } else {
        this.issues.push(`❌ Missing ${file.name}: ${file.path}`);
      }
    }
  }

  async checkPackageJsonScripts() {
    console.log('\n📦 Checking package.json scripts...');
    
    try {
      const packageJson = JSON.parse(fs.readFileSync(path.join(this.projectRoot, 'package.json'), 'utf8'));
      
      const requiredScripts = [
        'setup:full',
        'install:all',
        'env:validate',
        'env:test',
        'start',
        'stop'
      ];

      for (const script of requiredScripts) {
        if (packageJson.scripts && packageJson.scripts[script]) {
          this.passed.push(`✅ Script '${script}' exists`);
        } else {
          this.issues.push(`❌ Missing npm script: ${script}`);
        }
      }

      // Check setup:full includes dependency installation
      if (packageJson.scripts && packageJson.scripts['setup:full']) {
        const setupFullScript = packageJson.scripts['setup:full'];
        if (setupFullScript.includes('install:all')) {
          this.passed.push('✅ setup:full includes dependency installation');
        } else {
          this.issues.push('❌ setup:full missing dependency installation');
        }
      }

    } catch (error) {
      this.issues.push('❌ Cannot read package.json');
    }
  }

  async checkEnvExample() {
    console.log('\n🔧 Checking .env.example...');
    
    const envExamplePath = path.join(this.projectRoot, '.env.example');
    if (!fs.existsSync(envExamplePath)) {
      this.issues.push('❌ .env.example file missing');
      return;
    }

    try {
      const envContent = fs.readFileSync(envExamplePath, 'utf8');
      
      const requiredVars = [
        'NODE_ENV',
        'FIREBASE_PROJECT_ID',
        'JWT_SECRET',
        'REACT_APP_API_URL',
        'AUTH_SERVICE_URL',
        'LINK_SERVICE_URL',
        'COMMUNITY_SERVICE_URL'
      ];

      for (const varName of requiredVars) {
        if (envContent.includes(`${varName}=`)) {
          this.passed.push(`✅ .env.example has ${varName}`);
        } else {
          this.issues.push(`❌ .env.example missing ${varName}`);
        }
      }

      // Check for localhost URLs in example
      const localhostCount = (envContent.match(/localhost/g) || []).length;
      if (localhostCount > 0) {
        this.passed.push(`✅ .env.example uses localhost for local dev (${localhostCount} instances)`);
      }

    } catch (error) {
      this.issues.push('❌ Cannot read .env.example');
    }
  }

  async checkSetupScripts() {
    console.log('\n🚀 Checking setup scripts...');
    
    const setupScripts = [
      'scripts/setup-microservices.js',
      'scripts/validate-env-config.js',
      'scripts/test-env-loading.js'
    ];

    for (const script of setupScripts) {
      const scriptPath = path.join(this.projectRoot, script);
      if (fs.existsSync(scriptPath)) {
        try {
          // Check if script is executable (has proper shebang)
          const content = fs.readFileSync(scriptPath, 'utf8');
          if (content.startsWith('#!/usr/bin/env node')) {
            this.passed.push(`✅ ${script} is properly configured`);
          } else {
            this.warnings.push(`⚠️  ${script} missing shebang`);
          }
        } catch (error) {
          this.warnings.push(`⚠️  Cannot read ${script}`);
        }
      } else {
        this.issues.push(`❌ Missing setup script: ${script}`);
      }
    }
  }

  async quickEnvironmentTest() {
    console.log('\n🧪 Running quick environment test...');
    
    // Only run if .env exists
    const envPath = path.join(this.projectRoot, '.env');
    if (!fs.existsSync(envPath)) {
      this.warnings.push('⚠️  No .env file for testing (expected in development)');
      return;
    }

    try {
      // Quick validation test
      execSync('node scripts/validate-env-config.js', { 
        stdio: 'pipe',
        timeout: 10000 
      });
      this.passed.push('✅ Environment validation passes');
    } catch (error) {
      this.warnings.push('⚠️  Environment validation has issues');
    }

    try {
      // Quick environment loading test
      execSync('node scripts/test-env-loading.js', { 
        stdio: 'pipe',
        timeout: 15000 
      });
      this.passed.push('✅ Environment loading test passes');
    } catch (error) {
      this.warnings.push('⚠️  Environment loading test has issues');
    }
  }

  generateReport() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 PRE-COMMIT NEW DEVELOPER CHECK RESULTS');
    console.log('='.repeat(50));

    const total = this.passed.length + this.issues.length + this.warnings.length;

    console.log(`\n📈 Summary: ${total} checks completed`);
    console.log(`   ✅ Passed: ${this.passed.length}`);
    console.log(`   ❌ Issues: ${this.issues.length}`);
    console.log(`   ⚠️  Warnings: ${this.warnings.length}`);

    if (this.issues.length > 0) {
      console.log('\n❌ ISSUES (Must fix before commit):');
      this.issues.forEach(issue => console.log(`   ${issue}`));
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      this.warnings.forEach(warning => console.log(`   ${warning}`));
    }

    if (this.passed.length > 0 && this.issues.length === 0) {
      console.log('\n✅ PASSED CHECKS:');
      this.passed.slice(0, 5).forEach(check => console.log(`   ${check}`));
      if (this.passed.length > 5) {
        console.log(`   ... and ${this.passed.length - 5} more`);
      }
    }

    console.log('\n' + '='.repeat(50));
    
    if (this.issues.length > 0) {
      console.log('❌ COMMIT BLOCKED - Fix issues above');
      console.log('💡 These issues would break the new developer workflow');
      console.log('💡 New developers need: .env in root → npm run setup:full → npm start');
    } else {
      console.log('✅ NEW DEVELOPER WORKFLOW PROTECTED');
      console.log('💡 Changes are safe for new developer experience');
    }

    if (this.warnings.length > 0) {
      console.log(`⚠️  ${this.warnings.length} warnings - review recommended`);
    }
  }
}

// Run check if called directly
if (require.main === module) {
  const checker = new PreCommitNewDevCheck();
  checker.runChecks().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Pre-commit check failed:', error);
    process.exit(1);
  });
}

module.exports = PreCommitNewDevCheck;
