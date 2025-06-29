#!/usr/bin/env node

/**
 * CI/CD Hidden Issues Validator
 * Comprehensive check for all potential CI/CD issues that could affect new developers
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');

class CICDValidator {
  constructor() {
    this.projectRoot = process.cwd();
    this.isWindows = os.platform() === 'win32';
    this.issues = [];
    this.warnings = [];
    this.fixes = [];
  }

  log(message, type = 'info') {
    const colors = {
      error: '\x1b[31m',
      warning: '\x1b[33m',
      success: '\x1b[32m',
      info: '\x1b[36m',
      reset: '\x1b[0m'
    };
    
    const color = colors[type] || colors.info;
    console.log(`${color}${message}${colors.reset}`);
  }

  /**
   * Main validation function
   */
  async validate() {
    this.log('🔍 CI/CD Hidden Issues Validator', 'info');
    this.log('==========================================', 'info');

    try {
      await this.checkDependencyVersions();
      await this.checkCrossPlatformIssues();
      await this.checkHeavyDependencies();
      await this.checkEnvironmentConsistency();
      await this.checkScriptCompatibility();
      await this.checkFirebaseSDKCompatibility();
      await this.checkPuppeteerConfiguration();
      await this.checkPortConflicts();
      await this.checkNodeVersionConsistency();
      await this.checkMissingFiles();
      
      this.generateReport();
      
      if (this.issues.length === 0) {
        this.log('🎉 No critical CI/CD issues found!', 'success');
        return true;
      } else {
        this.log(`❌ Found ${this.issues.length} critical issues`, 'error');
        return false;
      }
    } catch (error) {
      this.log(`💥 Validation failed: ${error.message}`, 'error');
      return false;
    }
  }

  /**
   * Check dependency version conflicts
   */
  async checkDependencyVersions() {
    this.log('\n1. 📦 Checking dependency versions...', 'info');
    
    const packages = this.getAllPackageJsons();
    const dependencyMap = {};
    
    // Collect all dependencies
    packages.forEach(({ path: pkgPath, content }) => {
      const deps = { ...content.dependencies, ...content.devDependencies };
      
      Object.entries(deps || {}).forEach(([name, version]) => {
        if (!dependencyMap[name]) {
          dependencyMap[name] = [];
        }
        dependencyMap[name].push({ version, path: pkgPath });
      });
    });
    
    // Check for conflicts
    Object.entries(dependencyMap).forEach(([name, versions]) => {
      const uniqueVersions = [...new Set(versions.map(v => v.version))];
      
      if (uniqueVersions.length > 1) {
        this.issues.push({
          type: 'dependency_conflict',
          message: `Dependency version conflict: ${name}`,
          details: versions,
          fix: `Standardize ${name} version across all services`
        });
      }
    });
    
    this.log(`  Found ${Object.keys(dependencyMap).length} unique dependencies`, 'info');
    this.log(`  Detected ${this.issues.filter(i => i.type === 'dependency_conflict').length} version conflicts`, 'warning');
  }

  /**
   * Check Firebase SDK compatibility
   */
  async checkFirebaseSDKCompatibility() {
    this.log('\n2. 🔥 Checking Firebase SDK compatibility...', 'info');
    
    const packages = this.getAllPackageJsons();
    const firebaseVersions = {};
    
    packages.forEach(({ path: pkgPath, content }) => {
      if (content.dependencies && content.dependencies['firebase-admin']) {
        firebaseVersions[pkgPath] = content.dependencies['firebase-admin'];
      }
    });
    
    const uniqueVersions = [...new Set(Object.values(firebaseVersions))];
    
    if (uniqueVersions.length > 1) {
      this.issues.push({
        type: 'firebase_version_conflict',
        message: 'Firebase Admin SDK version mismatch across services',
        details: firebaseVersions,
        fix: 'Update all services to use firebase-admin ^12.0.0'
      });
    } else if (uniqueVersions.length > 0) {
      this.log(`  ✅ All services use Firebase Admin ${uniqueVersions[0]}`, 'success');
    }
  }

  /**
   * Check Puppeteer configuration
   */
  async checkPuppeteerConfiguration() {
    this.log('\n3. 🤖 Checking Puppeteer configuration...', 'info');
    
    const linkServicePkg = path.join(this.projectRoot, 'services', 'link-service', 'package.json');
    
    if (fs.existsSync(linkServicePkg)) {
      const pkg = JSON.parse(fs.readFileSync(linkServicePkg, 'utf8'));
      
      if (pkg.dependencies && pkg.dependencies.puppeteer) {
        const hasSkipDownload = pkg.config && 
                              pkg.config.puppeteer && 
                              pkg.config.puppeteer.skipDownload;
        
        if (!hasSkipDownload) {
          this.issues.push({
            type: 'puppeteer_config',
            message: 'Puppeteer will download Chromium automatically (~200MB)',
            details: 'This can slow CI/CD and cause cross-platform issues',
            fix: 'Add "config": {"puppeteer": {"skipDownload": true}} to link-service package.json'
          });
        } else {
          this.log('  ✅ Puppeteer configured to skip Chromium download', 'success');
        }
      }
    }
  }

  /**
   * Check heavy dependencies
   */
  async checkHeavyDependencies() {
    this.log('\n4. 🐘 Checking heavy dependencies...', 'info');
    
    const heavyDeps = [
      { name: 'puppeteer', impact: 'Downloads Chromium (~200MB)', severity: 'high' },
      { name: '@pact-foundation/pact', impact: 'Large Ruby dependencies', severity: 'medium' },
      { name: 'firebase-admin', impact: 'Large SDK', severity: 'low' }
    ];
    
    const packages = this.getAllPackageJsons();
    
    heavyDeps.forEach(heavy => {
      packages.forEach(({ path: pkgPath, content }) => {
        const deps = { ...content.dependencies, ...content.devDependencies };
        
        if (deps[heavy.name]) {
          if (heavy.severity === 'high') {
            this.warnings.push({
              type: 'heavy_dependency',
              message: `Heavy dependency: ${heavy.name} in ${pkgPath}`,
              details: heavy.impact
            });
          }
        }
      });
    });
  }

  /**
   * Check Node.js version consistency
   */
  async checkNodeVersionConsistency() {
    this.log('\n5. 📋 Checking Node.js version consistency...', 'info');
    
    const packages = this.getAllPackageJsons();
    const nodeVersions = {};
    
    packages.forEach(({ path: pkgPath, content }) => {
      if (content.engines && content.engines.node) {
        nodeVersions[pkgPath] = content.engines.node;
      } else {
        this.warnings.push({
          type: 'missing_node_version',
          message: `Missing Node.js version requirement in ${pkgPath}`,
          fix: 'Add "engines": {"node": ">=18.0.0"} to package.json'
        });
      }
    });
    
    const uniqueVersions = [...new Set(Object.values(nodeVersions))];
    
    if (uniqueVersions.length > 1) {
      this.issues.push({
        type: 'node_version_conflict',
        message: 'Inconsistent Node.js version requirements',
        details: nodeVersions,
        fix: 'Standardize Node.js version requirement to >=18.0.0'
      });
    }
  }

  /**
   * Check cross-platform issues
   */
  async checkCrossPlatformIssues() {
    this.log('\n6. 🌍 Checking cross-platform compatibility...', 'info');
    
    // Check for Windows-specific commands in scripts
    const scriptFiles = this.findScriptFiles();
    
    scriptFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for problematic patterns
      const windowsPatterns = [
        /taskkill/g,
        /\.bat$/gm,
        /cmd \/c/g,
        /powershell/g
      ];
      
      const unixPatterns = [
        /pkill/g,
        /kill -9/g,
        /\.sh$/gm,
        /bash -c/g
      ];
      
      windowsPatterns.forEach(pattern => {
        if (pattern.test(content)) {
          this.warnings.push({
            type: 'windows_specific',
            message: `Windows-specific command found in ${file}`,
            details: 'May not work on Unix systems'
          });
        }
      });
      
      unixPatterns.forEach(pattern => {
        if (pattern.test(content)) {
          this.warnings.push({
            type: 'unix_specific',
            message: `Unix-specific command found in ${file}`,
            details: 'May not work on Windows'
          });
        }
      });
    });
  }

  /**
   * Check environment consistency
   */
  async checkEnvironmentConsistency() {
    this.log('\n7. 🔧 Checking environment configuration...', 'info');
    
    const envExample = path.join(this.projectRoot, '.env.example');
    const env = path.join(this.projectRoot, '.env');
    
    if (!fs.existsSync(envExample)) {
      this.issues.push({
        type: 'missing_env_example',
        message: '.env.example file is missing',
        fix: 'Create .env.example with all required environment variables'
      });
    }
    
    if (!fs.existsSync(env)) {
      this.warnings.push({
        type: 'missing_env',
        message: '.env file is missing',
        details: 'Developer will need to create this from .env.example'
      });
    }
  }

  /**
   * Check script compatibility
   */
  async checkScriptCompatibility() {
    this.log('\n8. 📜 Checking script compatibility...', 'info');
    
    const packages = this.getAllPackageJsons();
    
    packages.forEach(({ path: pkgPath, content }) => {
      if (content.scripts) {
        Object.entries(content.scripts).forEach(([name, script]) => {
          // Check for curl commands (not available on Windows by default)
          if (script.includes('curl') && !script.includes('|| echo')) {
            this.warnings.push({
              type: 'curl_dependency',
              message: `Script "${name}" in ${pkgPath} uses curl`,
              details: 'curl may not be available on Windows by default'
            });
          }
          
          // Check for tail commands
          if (script.includes('tail -f')) {
            this.warnings.push({
              type: 'tail_dependency',
              message: `Script "${name}" in ${pkgPath} uses tail`,
              details: 'tail may not work the same way on Windows'
            });
          }
        });
      }
    });
  }

  /**
   * Check port conflicts
   */
  async checkPortConflicts() {
    this.log('\n9. 🔌 Checking port configuration...', 'info');
    
    const defaultPorts = {
      'frontend': 3000,
      'auth-service': 3001,
      'link-service': 3002,
      'community-service': 3003,
      'chat-service': 3004,
      'news-service': 3005,
      'admin-service': 3006,
      'api-gateway': 8080
    };
    
    // Check if ports are properly documented
    const portsUsed = Object.values(defaultPorts);
    const duplicates = portsUsed.filter((port, index) => portsUsed.indexOf(port) !== index);
    
    if (duplicates.length > 0) {
      this.issues.push({
        type: 'port_conflict',
        message: 'Duplicate port assignments detected',
        details: duplicates,
        fix: 'Assign unique ports to each service'
      });
    }
  }

  /**
   * Check for missing critical files
   */
  async checkMissingFiles() {
    this.log('\n10. 📄 Checking required files...', 'info');
    
    const requiredFiles = [
      { path: 'package.json', critical: true },
      { path: 'README.md', critical: false },
      { path: 'DEVELOPER_SETUP.md', critical: false },
      { path: '.gitignore', critical: true },
      { path: 'docker-compose.yml', critical: false }
    ];
    
    requiredFiles.forEach(file => {
      const filePath = path.join(this.projectRoot, file.path);
      
      if (!fs.existsSync(filePath)) {
        if (file.critical) {
          this.issues.push({
            type: 'missing_critical_file',
            message: `Critical file missing: ${file.path}`,
            fix: `Create ${file.path}`
          });
        } else {
          this.warnings.push({
            type: 'missing_optional_file',
            message: `Optional file missing: ${file.path}`,
            details: 'Consider creating for better developer experience'
          });
        }
      }
    });
  }

  /**
   * Get all package.json files
   */
  getAllPackageJsons() {
    const packages = [];
    
    // Root package.json
    const rootPkg = path.join(this.projectRoot, 'package.json');
    if (fs.existsSync(rootPkg)) {
      packages.push({
        path: 'root',
        content: JSON.parse(fs.readFileSync(rootPkg, 'utf8'))
      });
    }
    
    // Client package.json
    const clientPkg = path.join(this.projectRoot, 'client', 'package.json');
    if (fs.existsSync(clientPkg)) {
      packages.push({
        path: 'client',
        content: JSON.parse(fs.readFileSync(clientPkg, 'utf8'))
      });
    }
    
    // Service package.json files
    const servicesDir = path.join(this.projectRoot, 'services');
    if (fs.existsSync(servicesDir)) {
      const services = fs.readdirSync(servicesDir);
      
      services.forEach(service => {
        const servicePkg = path.join(servicesDir, service, 'package.json');
        if (fs.existsSync(servicePkg)) {
          packages.push({
            path: `services/${service}`,
            content: JSON.parse(fs.readFileSync(servicePkg, 'utf8'))
          });
        }
      });
    }
    
    return packages;
  }

  /**
   * Find all script files
   */
  findScriptFiles() {
    const scriptFiles = [];
    const scriptsDir = path.join(this.projectRoot, 'scripts');
    
    if (fs.existsSync(scriptsDir)) {
      const findInDir = (dir) => {
        const items = fs.readdirSync(dir);
        
        items.forEach(item => {
          const itemPath = path.join(dir, item);
          const stat = fs.statSync(itemPath);
          
          if (stat.isDirectory()) {
            findInDir(itemPath);
          } else if (item.endsWith('.js') || item.endsWith('.sh') || item.endsWith('.bat') || item.endsWith('.ps1')) {
            scriptFiles.push(itemPath);
          }
        });
      };
      
      findInDir(scriptsDir);
    }
    
    return scriptFiles;
  }

  /**
   * Generate comprehensive report
   */
  generateReport() {
    this.log('\n🔍 CI/CD VALIDATION REPORT', 'info');
    this.log('='.repeat(50), 'info');
    
    if (this.issues.length > 0) {
      this.log(`\n❌ CRITICAL ISSUES (${this.issues.length}):`, 'error');
      this.issues.forEach((issue, index) => {
        this.log(`\n${index + 1}. ${issue.message}`, 'error');
        if (issue.details) {
          this.log(`   Details: ${JSON.stringify(issue.details, null, 2)}`, 'error');
        }
        if (issue.fix) {
          this.log(`   Fix: ${issue.fix}`, 'warning');
        }
      });
    }
    
    if (this.warnings.length > 0) {
      this.log(`\n⚠️  WARNINGS (${this.warnings.length}):`, 'warning');
      this.warnings.forEach((warning, index) => {
        this.log(`\n${index + 1}. ${warning.message}`, 'warning');
        if (warning.details) {
          this.log(`   Details: ${warning.details}`, 'warning');
        }
        if (warning.fix) {
          this.log(`   Suggested fix: ${warning.fix}`, 'info');
        }
      });
    }
    
    this.log('\n📊 SUMMARY:', 'info');
    this.log(`   Critical Issues: ${this.issues.length}`, this.issues.length > 0 ? 'error' : 'success');
    this.log(`   Warnings: ${this.warnings.length}`, this.warnings.length > 0 ? 'warning' : 'success');
    
    if (this.issues.length === 0 && this.warnings.length === 0) {
      this.log('\n🎉 All checks passed! Your project is ready for new developers.', 'success');
    } else {
      this.log('\n🔧 Consider fixing these issues for a better CI/CD experience.', 'info');
      this.log('\n💡 TIP: Run "npm run fix:cicd" to automatically fix many of these issues!', 'warning');
    }
  }
}

// Run validator if called directly
if (require.main === module) {
  const validator = new CICDValidator();
  validator.validate().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = CICDValidator; 