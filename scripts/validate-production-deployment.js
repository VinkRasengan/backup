#!/usr/bin/env node

/**
 * Production Deployment Validation Script
 * Validates all requirements before deploying to production
 */

const fs = require('fs');
const path = require('path');

class ProductionValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.checks = [];
  }

  addError(message) {
    this.errors.push(message);
    console.log(`❌ ERROR: ${message}`);
  }

  addWarning(message) {
    this.warnings.push(message);
    console.log(`⚠️  WARNING: ${message}`);
  }

  addSuccess(message) {
    this.checks.push(message);
    console.log(`✅ ${message}`);
  }

  checkFileExists(filePath, required = true) {
    if (fs.existsSync(filePath)) {
      this.addSuccess(`File exists: ${filePath}`);
      return true;
    } else {
      if (required) {
        this.addError(`Required file missing: ${filePath}`);
      } else {
        this.addWarning(`Optional file missing: ${filePath}`);
      }
      return false;
    }
  }

  checkEnvironmentVariable(varName, required = true) {
    if (process.env[varName]) {
      this.addSuccess(`Environment variable set: ${varName}`);
      return true;
    } else {
      if (required) {
        this.addError(`Required environment variable missing: ${varName}`);
      } else {
        this.addWarning(`Optional environment variable missing: ${varName}`);
      }
      return false;
    }
  }

  validateDockerfiles() {
    console.log('\n🐳 Validating Dockerfiles...');
    
    const services = [
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

    services.forEach(service => {
      const dockerfilePath = `services/${service}/Dockerfile`;
      if (this.checkFileExists(dockerfilePath)) {
        // Check Dockerfile content
        try {
          const content = fs.readFileSync(dockerfilePath, 'utf8');
          
          if (content.includes('HEALTHCHECK')) {
            this.addSuccess(`${service}: Health check configured`);
          } else {
            this.addWarning(`${service}: No health check in Dockerfile`);
          }

          if (content.includes('USER nodejs') || content.includes('USER node')) {
            this.addSuccess(`${service}: Non-root user configured`);
          } else {
            this.addWarning(`${service}: Running as root user`);
          }

          if (content.includes('EXPOSE')) {
            this.addSuccess(`${service}: Port exposed`);
          } else {
            this.addError(`${service}: No port exposed in Dockerfile`);
          }

        } catch (error) {
          this.addError(`${service}: Cannot read Dockerfile - ${error.message}`);
        }
      }
    });

    // Check client Dockerfile
    if (this.checkFileExists('client/Dockerfile')) {
      try {
        const content = fs.readFileSync('client/Dockerfile', 'utf8');
        if (content.includes('nginx')) {
          this.addSuccess('Frontend: Using nginx for production');
        } else {
          this.addWarning('Frontend: Not using nginx for production');
        }
      } catch (error) {
        this.addError(`Frontend: Cannot read Dockerfile - ${error.message}`);
      }
    }
  }

  validatePackageFiles() {
    console.log('\n📦 Validating package.json files...');
    
    // Root package.json
    if (this.checkFileExists('package.json')) {
      try {
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        
        if (pkg.engines && pkg.engines.node) {
          this.addSuccess(`Node.js version specified: ${pkg.engines.node}`);
        } else {
          this.addWarning('No Node.js version specified in engines');
        }

        if (pkg.scripts && pkg.scripts['deploy:render']) {
          this.addSuccess('Render deployment script available');
        } else {
          this.addWarning('No render deployment script found');
        }

      } catch (error) {
        this.addError(`Cannot parse root package.json: ${error.message}`);
      }
    }

    // Service package.json files
    const services = ['api-gateway', 'auth-service', 'link-service', 'community-service', 
                     'chat-service', 'news-service', 'admin-service'];
    
    services.forEach(service => {
      const pkgPath = `services/${service}/package.json`;
      if (this.checkFileExists(pkgPath)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
          
          if (pkg.scripts && pkg.scripts.start) {
            this.addSuccess(`${service}: Start script configured`);
          } else {
            this.addError(`${service}: No start script in package.json`);
          }

          if (pkg.engines && pkg.engines.node) {
            this.addSuccess(`${service}: Node.js version specified`);
          } else {
            this.addWarning(`${service}: No Node.js version specified`);
          }

        } catch (error) {
          this.addError(`${service}: Cannot parse package.json - ${error.message}`);
        }
      }
    });

    // Client package.json
    if (this.checkFileExists('client/package.json')) {
      try {
        const pkg = JSON.parse(fs.readFileSync('client/package.json', 'utf8'));
        
        if (pkg.scripts && pkg.scripts.build) {
          this.addSuccess('Frontend: Build script configured');
        } else {
          this.addError('Frontend: No build script in package.json');
        }

        if (pkg.homepage) {
          this.addSuccess('Frontend: Homepage URL configured');
        } else {
          this.addWarning('Frontend: No homepage URL specified');
        }

      } catch (error) {
        this.addError(`Frontend: Cannot parse package.json - ${error.message}`);
      }
    }
  }

  validateEnvironmentConfiguration() {
    console.log('\n🔧 Validating environment configuration...');
    
    // Check for environment files
    this.checkFileExists('.env', false);
    this.checkFileExists('.env.production');
    this.checkFileExists('.env.example', false);

    // Required environment variables for deployment
    const requiredEnvVars = [
      'RENDER_API_KEY',
      'FIREBASE_PROJECT_ID',
      'FIREBASE_PRIVATE_KEY',
      'FIREBASE_CLIENT_EMAIL',
      'JWT_SECRET',
      'GEMINI_API_KEY'
    ];

    requiredEnvVars.forEach(varName => {
      this.checkEnvironmentVariable(varName);
    });

    // Optional but recommended
    const optionalEnvVars = [
      'VIRUSTOTAL_API_KEY',
      'NEWSAPI_API_KEY',
      'REACT_APP_FIREBASE_API_KEY'
    ];

    optionalEnvVars.forEach(varName => {
      this.checkEnvironmentVariable(varName, false);
    });

    // Validate .env.production format
    if (fs.existsSync('.env.production')) {
      try {
        const envContent = fs.readFileSync('.env.production', 'utf8');
        
        if (envContent.includes('NODE_ENV=production')) {
          this.addSuccess('Production environment configured');
        } else {
          this.addError('NODE_ENV not set to production in .env.production');
        }

        if (envContent.includes('onrender.com')) {
          this.addSuccess('Render URLs configured in production env');
        } else {
          this.addWarning('No Render URLs found in production env');
        }

      } catch (error) {
        this.addError(`Cannot read .env.production: ${error.message}`);
      }
    }
  }

  validateGitHubActions() {
    console.log('\n🔄 Validating GitHub Actions...');
    
    const workflowPath = '.github/workflows/microservices-ci.yml';
    if (this.checkFileExists(workflowPath)) {
      try {
        const workflow = fs.readFileSync(workflowPath, 'utf8');
        
        if (workflow.includes('deploy-render-production')) {
          this.addSuccess('Render deployment job configured');
        } else {
          this.addError('No Render deployment job found in workflow');
        }

        if (workflow.includes('RENDER_API_KEY')) {
          this.addSuccess('Render API key secret configured');
        } else {
          this.addError('Render API key not configured in workflow');
        }

        if (workflow.includes('environment: production')) {
          this.addSuccess('Production environment protection configured');
        } else {
          this.addWarning('No production environment protection');
        }

      } catch (error) {
        this.addError(`Cannot read GitHub workflow: ${error.message}`);
      }
    }
  }

  validateDeploymentScripts() {
    console.log('\n📜 Validating deployment scripts...');
    
    const scripts = [
      'scripts/deploy-render-production.js',
      'scripts/health-check-production.js',
      'scripts/validate-production-deployment.js'
    ];

    scripts.forEach(script => {
      if (this.checkFileExists(script)) {
        try {
          const content = fs.readFileSync(script, 'utf8');
          if (content.includes('#!/usr/bin/env node')) {
            this.addSuccess(`${script}: Executable script header found`);
          } else {
            this.addWarning(`${script}: No executable header`);
          }
        } catch (error) {
          this.addError(`Cannot read ${script}: ${error.message}`);
        }
      }
    });
  }

  validateDocumentation() {
    console.log('\n📚 Validating documentation...');
    
    const docs = [
      'README.md',
      'RENDER_PRODUCTION_DEPLOYMENT_GUIDE.md',
      'DEPLOYMENT_CHECKLIST.md'
    ];

    docs.forEach(doc => {
      this.checkFileExists(doc, doc === 'README.md');
    });

    // Check if README has production deployment info
    if (fs.existsSync('README.md')) {
      try {
        const readme = fs.readFileSync('README.md', 'utf8');
        if (readme.includes('production') || readme.includes('deployment')) {
          this.addSuccess('README contains deployment information');
        } else {
          this.addWarning('README missing deployment information');
        }
      } catch (error) {
        this.addWarning('Cannot read README.md');
      }
    }
  }

  validateSecurityConfiguration() {
    console.log('\n🔒 Validating security configuration...');
    
    // Check for sensitive files that shouldn't be committed
    const sensitiveFiles = [
      '.env',
      'firebase-service-account.json',
      'private-key.pem'
    ];

    sensitiveFiles.forEach(file => {
      if (fs.existsSync(file)) {
        this.addWarning(`Sensitive file found: ${file} (ensure it's in .gitignore)`);
      } else {
        this.addSuccess(`Sensitive file not found: ${file}`);
      }
    });

    // Check .gitignore
    if (this.checkFileExists('.gitignore')) {
      try {
        const gitignore = fs.readFileSync('.gitignore', 'utf8');
        
        const requiredIgnores = ['.env', 'node_modules', '*.log', '.DS_Store'];
        requiredIgnores.forEach(pattern => {
          if (gitignore.includes(pattern)) {
            this.addSuccess(`Gitignore includes: ${pattern}`);
          } else {
            this.addWarning(`Gitignore missing: ${pattern}`);
          }
        });

      } catch (error) {
        this.addError(`Cannot read .gitignore: ${error.message}`);
      }
    }
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 PRODUCTION DEPLOYMENT VALIDATION SUMMARY');
    console.log('='.repeat(60));
    
    console.log(`✅ Successful checks: ${this.checks.length}`);
    console.log(`⚠️  Warnings: ${this.warnings.length}`);
    console.log(`❌ Errors: ${this.errors.length}`);
    
    const total = this.checks.length + this.warnings.length + this.errors.length;
    const successRate = ((this.checks.length / total) * 100).toFixed(1);
    console.log(`📈 Success rate: ${successRate}%`);

    if (this.errors.length === 0) {
      console.log('\n🎉 READY FOR PRODUCTION DEPLOYMENT!');
      console.log('All critical requirements are met.');
    } else {
      console.log('\n🚨 NOT READY FOR DEPLOYMENT');
      console.log('Please fix the following errors:');
      this.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }

    if (this.warnings.length > 0) {
      console.log('\n💡 Recommendations:');
      this.warnings.forEach((warning, index) => {
        console.log(`   ${index + 1}. ${warning}`);
      });
    }

    console.log('\n📝 Next steps:');
    if (this.errors.length === 0) {
      console.log('   1. Push your code to the main branch');
      console.log('   2. Monitor the GitHub Actions deployment');
      console.log('   3. Run health checks after deployment');
      console.log('   4. Verify all services are working correctly');
    } else {
      console.log('   1. Fix all errors listed above');
      console.log('   2. Re-run this validation script');
      console.log('   3. Proceed with deployment once all errors are resolved');
    }
  }

  async runAllValidations() {
    console.log('🔍 Starting production deployment validation...\n');
    
    this.validateDockerfiles();
    this.validatePackageFiles();
    this.validateEnvironmentConfiguration();
    this.validateGitHubActions();
    this.validateDeploymentScripts();
    this.validateDocumentation();
    this.validateSecurityConfiguration();
    
    this.printSummary();
    
    return this.errors.length === 0;
  }
}

async function main() {
  const validator = new ProductionValidator();
  
  try {
    const isValid = await validator.runAllValidations();
    process.exit(isValid ? 0 : 1);
  } catch (error) {
    console.error('💥 Validation failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { ProductionValidator };
