#!/usr/bin/env node

/**
 * Script để validate shared utilities setup
 * Kiểm tra consistency và performance
 */

const fs = require('fs');
const path = require('path');

class SharedUtilsValidator {
  constructor() {
    this.projectRoot = process.cwd();
    this.servicesDir = path.join(this.projectRoot, 'services');
    this.sharedDir = path.join(this.projectRoot, 'shared');
    
    this.issues = [];
    this.warnings = [];
    this.successes = [];
  }

  async validate() {
    console.log('🔍 Validating Shared Utils Setup...');
    console.log('='.repeat(50));

    try {
      // Check workspace configuration
      await this.validateWorkspace();
      
      // Check shared package
      await this.validateSharedPackage();
      
      // Check services
      await this.validateServices();
      
      // Check for duplicates
      await this.checkDuplicates();
      
      // Performance analysis
      await this.analyzePerformance();
      
      // Show results
      this.showResults();
      
    } catch (error) {
      console.error('❌ Validation failed:', error.message);
    }
  }

  async validateWorkspace() {
    console.log('1. 📦 Checking workspace configuration...');
    
    try {
      const packageJsonPath = path.join(this.projectRoot, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      if (!packageJson.workspaces) {
        this.issues.push('Root package.json missing workspaces configuration');
        return;
      }
      
      if (!packageJson.workspaces.includes('shared')) {
        this.issues.push('Shared package not included in workspaces');
      } else {
        this.successes.push('Shared package included in workspace');
      }
      
      if (!packageJson.workspaces.includes('services/*')) {
        this.issues.push('Services not included in workspaces');
      } else {
        this.successes.push('Services included in workspace');
      }
      
    } catch (error) {
      this.issues.push(`Failed to read root package.json: ${error.message}`);
    }
  }

  async validateSharedPackage() {
    console.log('2. 🔧 Checking shared package...');
    
    try {
      const sharedPackageJsonPath = path.join(this.sharedDir, 'package.json');
      
      if (!fs.existsSync(sharedPackageJsonPath)) {
        this.issues.push('Shared package.json not found');
        return;
      }
      
      const sharedPackageJson = JSON.parse(fs.readFileSync(sharedPackageJsonPath, 'utf8'));
      
      // Check package name
      if (sharedPackageJson.name !== '@factcheck/shared') {
        this.warnings.push(`Shared package name is ${sharedPackageJson.name}, expected @factcheck/shared`);
      } else {
        this.successes.push('Shared package name is correct');
      }
      
      // Check main entry
      const indexPath = path.join(this.sharedDir, 'index.js');
      if (!fs.existsSync(indexPath)) {
        this.issues.push('Shared index.js not found');
      } else {
        this.successes.push('Shared index.js exists');
        
        // Validate exports
        try {
          const sharedExports = require(indexPath);
          const expectedExports = ['Logger', 'HealthCheck', 'commonChecks', 'ResponseFormatter'];
          
          expectedExports.forEach(exportName => {
            if (!sharedExports[exportName]) {
              this.warnings.push(`Missing export: ${exportName}`);
            } else {
              this.successes.push(`Export available: ${exportName}`);
            }
          });
          
        } catch (error) {
          this.issues.push(`Failed to load shared exports: ${error.message}`);
        }
      }
      
      // Check utils directory
      const utilsPath = path.join(this.sharedDir, 'utils');
      if (!fs.existsSync(utilsPath)) {
        this.issues.push('Shared utils directory not found');
      } else {
        const utilFiles = ['logger.js', 'health-check.js', 'response.js'];
        utilFiles.forEach(file => {
          if (fs.existsSync(path.join(utilsPath, file))) {
            this.successes.push(`Utils file exists: ${file}`);
          } else {
            this.warnings.push(`Utils file missing: ${file}`);
          }
        });
      }
      
    } catch (error) {
      this.issues.push(`Failed to validate shared package: ${error.message}`);
    }
  }

  async validateServices() {
    console.log('3. 🚀 Checking services...');
    
    const services = fs.readdirSync(this.servicesDir).filter(item => {
      const servicePath = path.join(this.servicesDir, item);
      return fs.statSync(servicePath).isDirectory();
    });
    
    for (const serviceName of services) {
      try {
        const servicePath = path.join(this.servicesDir, serviceName);
        const packageJsonPath = path.join(servicePath, 'package.json');
        
        if (!fs.existsSync(packageJsonPath)) {
          this.warnings.push(`${serviceName}: No package.json found`);
          continue;
        }
        
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        
        // Check if using shared package
        if (packageJson.dependencies && packageJson.dependencies['@factcheck/shared']) {
          this.successes.push(`${serviceName}: Using @factcheck/shared`);
          
          // Check for duplicate dependencies
          const sharedDeps = ['winston', 'prom-client'];
          sharedDeps.forEach(dep => {
            if (packageJson.dependencies[dep]) {
              this.warnings.push(`${serviceName}: Duplicate dependency ${dep} (should be in shared)`);
            }
          });
          
        } else {
          this.warnings.push(`${serviceName}: Not using @factcheck/shared package`);
        }
        
        // Check for old import patterns
        await this.checkImportPatterns(servicePath, serviceName);
        
      } catch (error) {
        this.issues.push(`${serviceName}: Validation failed - ${error.message}`);
      }
    }
  }

  async checkImportPatterns(servicePath, serviceName) {
    const srcPath = path.join(servicePath, 'src');
    
    if (!fs.existsSync(srcPath)) {
      return;
    }
    
    try {
      await this.checkImportsInDirectory(srcPath, serviceName);
    } catch (error) {
      this.warnings.push(`${serviceName}: Failed to check imports - ${error.message}`);
    }
  }

  async checkImportsInDirectory(dirPath, serviceName) {
    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        await this.checkImportsInDirectory(filePath, serviceName);
      } else if (file.endsWith('.js')) {
        await this.checkImportsInFile(filePath, serviceName);
      }
    }
  }

  async checkImportsInFile(filePath, serviceName) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check for old import patterns
      const oldPatterns = [
        /require\(['"`]\.\.\/shared\/utils\/logger['"`]\)/,
        /require\(['"`]\.\.\/\.\.\/shared\/utils\/logger['"`]\)/,
        /require\(['"`]\.\.\/shared\/utils\/health-check['"`]\)/
      ];
      
      oldPatterns.forEach(pattern => {
        if (pattern.test(content)) {
          this.warnings.push(`${serviceName}: Old import pattern found in ${path.basename(filePath)}`);
        }
      });
      
      // Check for new import patterns
      if (content.includes("require('@factcheck/shared')")) {
        this.successes.push(`${serviceName}: Using new import pattern in ${path.basename(filePath)}`);
      }
      
    } catch (error) {
      // Silent fail for individual files
    }
  }

  async checkDuplicates() {
    console.log('4. 🔍 Checking for duplicates...');
    
    const services = fs.readdirSync(this.servicesDir).filter(item => {
      const servicePath = path.join(this.servicesDir, item);
      return fs.statSync(servicePath).isDirectory();
    });
    
    for (const serviceName of services) {
      const sharedPath = path.join(this.servicesDir, serviceName, 'shared');
      
      if (fs.existsSync(sharedPath)) {
        this.warnings.push(`${serviceName}: Still has duplicate shared folder`);
      } else {
        this.successes.push(`${serviceName}: No duplicate shared folder`);
      }
    }
  }

  async analyzePerformance() {
    console.log('5. 📊 Analyzing performance impact...');
    
    try {
      // Count total dependencies across services
      let totalDeps = 0;
      let sharedDeps = 0;
      
      const services = fs.readdirSync(this.servicesDir).filter(item => {
        const servicePath = path.join(this.servicesDir, item);
        return fs.statSync(servicePath).isDirectory();
      });
      
      for (const serviceName of services) {
        const packageJsonPath = path.join(this.servicesDir, serviceName, 'package.json');
        
        if (fs.existsSync(packageJsonPath)) {
          const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
          
          if (packageJson.dependencies) {
            totalDeps += Object.keys(packageJson.dependencies).length;
            
            if (packageJson.dependencies['@factcheck/shared']) {
              sharedDeps++;
            }
          }
        }
      }
      
      this.successes.push(`Total dependencies across services: ${totalDeps}`);
      this.successes.push(`Services using shared package: ${sharedDeps}/${services.length}`);
      
      if (sharedDeps === services.length) {
        this.successes.push('All services are using shared package - optimal setup!');
      } else {
        this.warnings.push(`${services.length - sharedDeps} services not using shared package`);
      }
      
    } catch (error) {
      this.warnings.push(`Performance analysis failed: ${error.message}`);
    }
  }

  showResults() {
    console.log('\n📋 VALIDATION RESULTS:');
    console.log('='.repeat(50));
    
    if (this.issues.length > 0) {
      console.log('\n❌ CRITICAL ISSUES:');
      this.issues.forEach(issue => console.log(`  • ${issue}`));
    }
    
    if (this.warnings.length > 0) {
      console.log('\n⚠️ WARNINGS:');
      this.warnings.forEach(warning => console.log(`  • ${warning}`));
    }
    
    if (this.successes.length > 0) {
      console.log('\n✅ SUCCESSES:');
      this.successes.forEach(success => console.log(`  • ${success}`));
    }
    
    // Overall score
    const totalChecks = this.issues.length + this.warnings.length + this.successes.length;
    const score = Math.round((this.successes.length / totalChecks) * 100);
    
    console.log(`\n📊 OVERALL SCORE: ${score}%`);
    
    if (score >= 90) {
      console.log('🏆 Excellent! Your shared utils setup is optimal.');
    } else if (score >= 70) {
      console.log('👍 Good setup, but some improvements recommended.');
    } else {
      console.log('⚠️ Setup needs improvement for optimal CI/CD performance.');
    }
    
    if (this.issues.length === 0 && this.warnings.length === 0) {
      console.log('\n🎉 Perfect! No issues found.');
      console.log('Your shared utilities are optimally configured for CI/CD!');
    } else {
      console.log('\n💡 RECOMMENDATIONS:');
      console.log('1. Run: node scripts/migrate-to-shared-package.js');
      console.log('2. Fix any critical issues listed above');
      console.log('3. Re-run this validation script');
    }
  }
}

// Run if called directly
if (require.main === module) {
  const validator = new SharedUtilsValidator();
  validator.validate().catch(console.error);
}

module.exports = SharedUtilsValidator;
