#!/usr/bin/env node

/**
 * CI/CD Auto-Fix Script
 * Automatically fixes common CI/CD issues detected by the validator
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class CICDAutoFix {
  constructor() {
    this.projectRoot = process.cwd();
    this.fixesApplied = [];
    this.errors = [];
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
   * Main auto-fix function
   */
  async autoFix() {
    this.log('🔧 CI/CD Auto-Fix Tool', 'info');
    this.log('==========================================', 'info');

    try {
      await this.fixDependencyConflicts();
      await this.fixFirebaseVersions();
      await this.fixNodeEngineRequirements();
      await this.fixPuppeteerConfig();
      await this.createEnvExample();
      await this.createMissingFiles();
      await this.fixMissingEngines();
      await this.fixScriptCompatibility();
      await this.updateGitignore();
      
      this.generateReport();
      
    } catch (error) {
      this.log(`💥 Auto-fix failed: ${error.message}`, 'error');
      this.errors.push(error.message);
    }
  }

  /**
   * Fix dependency version conflicts across all packages
   */
  async fixDependencyConflicts() {
    this.log('\n1. 📦 Fixing dependency version conflicts...', 'info');
    
    const packages = this.getAllPackageJsons();
    const dependencyMap = {};
    
    // Collect all dependencies to find conflicts
    packages.forEach(({ path: pkgPath, content }) => {
      const deps = { ...content.dependencies, ...content.devDependencies };
      
      Object.entries(deps || {}).forEach(([name, version]) => {
        if (!dependencyMap[name]) {
          dependencyMap[name] = [];
        }
        dependencyMap[name].push({ version, path: pkgPath, content });
      });
    });
    
    // Find and fix common conflicts
    const commonDepsToStandardize = {
      'axios': '^1.6.2',
      'cors': '^2.8.5', 
      'express': '^4.18.2',
      'dotenv': '^16.3.1',
      'jsonwebtoken': '^9.0.2',
      'redis': '^4.6.10',
      'uuid': '^11.1.0',
      'helmet': '^7.1.0',
      'morgan': '^1.10.0',
      'joi': '^17.11.0',
      'express-rate-limit': '^7.1.5',
      'express-validator': '^7.0.1'
    };
    
    let conflictsFixed = 0;
    
    Object.entries(commonDepsToStandardize).forEach(([depName, targetVersion]) => {
      if (dependencyMap[depName]) {
        const versions = dependencyMap[depName];
        const uniqueVersions = [...new Set(versions.map(v => v.version))];
        
        if (uniqueVersions.length > 1) {
          // Fix conflicts by standardizing to target version
          versions.forEach(({ path: pkgPath, content }) => {
            const fullPath = this.getPackageFullPath(pkgPath);
            
            if (fullPath && fs.existsSync(fullPath)) {
              try {
                const pkg = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
                let updated = false;
                
                if (pkg.dependencies && pkg.dependencies[depName] && pkg.dependencies[depName] !== targetVersion) {
                  pkg.dependencies[depName] = targetVersion;
                  updated = true;
                }
                
                if (pkg.devDependencies && pkg.devDependencies[depName] && pkg.devDependencies[depName] !== targetVersion) {
                  pkg.devDependencies[depName] = targetVersion;
                  updated = true;
                }
                
                if (updated) {
                  fs.writeFileSync(fullPath, JSON.stringify(pkg, null, 2) + '\n');
                  conflictsFixed++;
                  this.log(`  ✅ Standardized ${depName} in ${pkgPath} to ${targetVersion}`, 'success');
                }
              } catch (error) {
                this.errors.push(`Failed to fix ${depName} conflict in ${pkgPath}: ${error.message}`);
              }
            }
          });
        }
      }
    });
    
    if (conflictsFixed > 0) {
      this.fixesApplied.push({
        type: 'dependency_conflicts',
        message: `Fixed ${conflictsFixed} dependency version conflicts`
      });
    } else {
      this.log('  ✅ No dependency conflicts to fix', 'success');
    }
  }

  /**
   * Fix dependency version conflicts across all packages
   */
  async fixDependencyConflicts() {
    this.log('\n1. 📦 Fixing dependency version conflicts...', 'info');
    
    const packages = this.getAllPackageJsons();
    const dependencyMap = {};
    
    // Collect all dependencies to find conflicts
    packages.forEach(({ path: pkgPath, content }) => {
      const deps = { ...content.dependencies, ...content.devDependencies };
      
      Object.entries(deps || {}).forEach(([name, version]) => {
        if (!dependencyMap[name]) {
          dependencyMap[name] = [];
        }
        dependencyMap[name].push({ version, path: pkgPath, content });
      });
    });
    
    // Find and fix common conflicts
    const commonDepsToStandardize = {
      'axios': '^1.6.2',
      'cors': '^2.8.5', 
      'express': '^4.18.2',
      'dotenv': '^16.3.1',
      'jsonwebtoken': '^9.0.2',
      'redis': '^4.6.10',
      'uuid': '^11.1.0',
      'helmet': '^7.1.0',
      'morgan': '^1.10.0',
      'joi': '^17.11.0',
      'express-rate-limit': '^7.1.5',
      'express-validator': '^7.0.1'
    };
    
    let conflictsFixed = 0;
    
    Object.entries(commonDepsToStandardize).forEach(([depName, targetVersion]) => {
      if (dependencyMap[depName]) {
        const versions = dependencyMap[depName];
        const uniqueVersions = [...new Set(versions.map(v => v.version))];
        
        if (uniqueVersions.length > 1) {
          // Fix conflicts by standardizing to target version
          versions.forEach(({ path: pkgPath, content }) => {
            const fullPath = this.getPackageFullPath(pkgPath);
            
            if (fullPath && fs.existsSync(fullPath)) {
              try {
                const pkg = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
                let updated = false;
                
                if (pkg.dependencies && pkg.dependencies[depName] && pkg.dependencies[depName] !== targetVersion) {
                  pkg.dependencies[depName] = targetVersion;
                  updated = true;
                }
                
                if (pkg.devDependencies && pkg.devDependencies[depName] && pkg.devDependencies[depName] !== targetVersion) {
                  pkg.devDependencies[depName] = targetVersion;
                  updated = true;
                }
                
                if (updated) {
                  fs.writeFileSync(fullPath, JSON.stringify(pkg, null, 2) + '\n');
                  conflictsFixed++;
                  this.log(`  ✅ Standardized ${depName} in ${pkgPath} to ${targetVersion}`, 'success');
                }
              } catch (error) {
                this.errors.push(`Failed to fix ${depName} conflict in ${pkgPath}: ${error.message}`);
              }
            }
          });
        }
      }
    });
    
    if (conflictsFixed > 0) {
      this.fixesApplied.push({
        type: 'dependency_conflicts',
        message: `Fixed ${conflictsFixed} dependency version conflicts`
      });
    } else {
      this.log('  ✅ No dependency conflicts to fix', 'success');
    }
  }

  /**
   * Fix Firebase Admin SDK versions
   */
  async fixFirebaseVersions() {
    this.log('\n2. 🔥 Fixing Firebase Admin SDK versions...', 'info');
    
    const targetVersion = '^12.0.0';
    const servicesDirs = [
      'services/auth-service',
      'services/community-service', 
      'services/link-service',
      'services/chat-service',
      'services/news-service',
      'services/admin-service'
    ];

    for (const serviceDir of servicesDirs) {
      const packagePath = path.join(this.projectRoot, serviceDir, 'package.json');
      
      if (fs.existsSync(packagePath)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
          
          if (pkg.dependencies && pkg.dependencies['firebase-admin']) {
            const currentVersion = pkg.dependencies['firebase-admin'];
            
            if (currentVersion !== targetVersion) {
              pkg.dependencies['firebase-admin'] = targetVersion;
              fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n');
              
              this.fixesApplied.push({
                type: 'firebase_version',
                message: `Updated Firebase Admin in ${serviceDir}: ${currentVersion} → ${targetVersion}`
              });
              
              this.log(`  ✅ Fixed ${serviceDir}: ${currentVersion} → ${targetVersion}`, 'success');
            } else {
              this.log(`  ✅ ${serviceDir} already has correct version`, 'success');
            }
          }
        } catch (error) {
          this.errors.push(`Failed to update Firebase version in ${serviceDir}: ${error.message}`);
          this.log(`  ❌ Failed to fix ${serviceDir}: ${error.message}`, 'error');
        }
      }
    }
  }

  /**
   * Fix Node.js engine requirements
   */
  async fixNodeEngineRequirements() {
    this.log('\n3. 📋 Fixing Node.js engine requirements...', 'info');
    
    const targetEngines = {
      "node": ">=18.0.0",
      "npm": ">=9.0.0"
    };

    const packagePaths = [
      { path: 'package.json', name: 'root' },
      { path: 'client/package.json', name: 'client' },
      { path: 'shared/package.json', name: 'shared' }
    ];

    // Add all service package.json files
    const servicesDir = path.join(this.projectRoot, 'services');
    if (fs.existsSync(servicesDir)) {
      const services = fs.readdirSync(servicesDir);
      services.forEach(service => {
        packagePaths.push({
          path: `services/${service}/package.json`,
          name: `services/${service}`
        });
      });
    }

    for (const { path: pkgPath, name } of packagePaths) {
      const fullPath = path.join(this.projectRoot, pkgPath);
      
      if (fs.existsSync(fullPath)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
          let updated = false;

          if (!pkg.engines) {
            pkg.engines = {};
            updated = true;
          }

          // Update Node.js requirement
          if (!pkg.engines.node) {
            pkg.engines.node = targetEngines.node;
            updated = true;
            this.log(`  ✅ Added Node.js requirement to ${name}`, 'success');
          } else if (pkg.engines.node !== targetEngines.node) {
            const oldVersion = pkg.engines.node;
            pkg.engines.node = targetEngines.node;
            updated = true;
            this.log(`  ✅ Updated Node.js requirement in ${name}: ${oldVersion} → ${targetEngines.node}`, 'success');
          }

          // Update npm requirement for main packages
          if (['root', 'client'].includes(name)) {
            if (!pkg.engines.npm) {
              pkg.engines.npm = targetEngines.npm;
              updated = true;
              this.log(`  ✅ Added npm requirement to ${name}`, 'success');
            }
          }

          if (updated) {
            fs.writeFileSync(fullPath, JSON.stringify(pkg, null, 2) + '\n');
            this.fixesApplied.push({
              type: 'node_engines',
              message: `Updated engines in ${name}`
            });
          }

        } catch (error) {
          this.errors.push(`Failed to update engines in ${name}: ${error.message}`);
          this.log(`  ❌ Failed to fix ${name}: ${error.message}`, 'error');
        }
      }
    }
  }

  /**
   * Fix Puppeteer configuration
   */
  async fixPuppeteerConfig() {
    this.log('\n4. 🤖 Fixing Puppeteer configuration...', 'info');
    
    const linkServicePkg = path.join(this.projectRoot, 'services', 'link-service', 'package.json');
    
    if (fs.existsSync(linkServicePkg)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(linkServicePkg, 'utf8'));
        
        if (pkg.dependencies && pkg.dependencies.puppeteer) {
          let updated = false;
          
          if (!pkg.config) {
            pkg.config = {};
            updated = true;
          }
          
          if (!pkg.config.puppeteer) {
            pkg.config.puppeteer = {};
            updated = true;
          }
          
          if (!pkg.config.puppeteer.skipDownload) {
            pkg.config.puppeteer.skipDownload = true;
            updated = true;
            
            this.fixesApplied.push({
              type: 'puppeteer_config',
              message: 'Added Puppeteer skipDownload configuration to prevent Chromium download'
            });
            
            this.log('  ✅ Added skipDownload: true to Puppeteer config', 'success');
            this.log('  🎯 This prevents ~200MB Chromium download during CI/CD', 'info');
          } else {
            this.log('  ✅ Puppeteer already configured correctly', 'success');
          }
          
          if (updated) {
            fs.writeFileSync(linkServicePkg, JSON.stringify(pkg, null, 2) + '\n');
          }
        }
      } catch (error) {
        this.errors.push(`Failed to fix Puppeteer config: ${error.message}`);
        this.log(`  ❌ Failed to fix Puppeteer config: ${error.message}`, 'error');
      }
    }
  }

  /**
   * Create comprehensive .env.example
   */
  async createEnvExample() {
    this.log('\n5. 📄 Creating .env.example template...', 'info');
    
    const envExamplePath = path.join(this.projectRoot, '.env.example');
    
    const envTemplate = `# FactCheck Platform Environment Variables
# Copy this file to .env and fill in your actual values

# =================================
# REQUIRED - Firebase Configuration
# =================================
# Get these from Firebase Console > Project Settings > Service Accounts
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nYOUR_PRIVATE_KEY_HERE\\n-----END PRIVATE KEY-----"

# =================================
# REQUIRED - Security
# =================================
# Generate a strong JWT secret (minimum 32 characters)
# Use: npm run generate:jwt
JWT_SECRET=your_jwt_secret_minimum_32_characters_long

# =================================
# REQUIRED - AI Services
# =================================
# Get from https://makersuite.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key

# =================================
# OPTIONAL - Third-Party APIs
# =================================
# Get from VirusTotal (for link security scanning)
VIRUSTOTAL_API_KEY=your_virustotal_api_key

# Get from ScamAdviser (for domain reputation)
SCAMADVISER_API_KEY=your_scamadviser_api_key

# Get from NewsAPI (for news aggregation)
NEWSAPI_API_KEY=your_newsapi_api_key

# Get from ScreenshotOne (for website screenshots)
SCREENSHOTONE_API_KEY=your_screenshotone_api_key
SCREENSHOTONE_SECRET=your_screenshotone_secret

# Google Safe Browsing API
GOOGLE_SAFE_BROWSING_API_KEY=your_google_safe_browsing_api_key

# PhishTank API (currently disabled - not accepting new registrations)
PHISHTANK_API_KEY=disabled

# =================================
# DEPLOYMENT - Service URLs
# =================================
# For production deployment (Render, Docker, K8s)
AUTH_SERVICE_URL=http://localhost:3001
LINK_SERVICE_URL=http://localhost:3002
COMMUNITY_SERVICE_URL=http://localhost:3003
CHAT_SERVICE_URL=http://localhost:3004
NEWS_SERVICE_URL=http://localhost:3005
ADMIN_SERVICE_URL=http://localhost:3006

# Frontend (React)
REACT_APP_API_URL=http://localhost:8080
REACT_APP_FIREBASE_API_KEY=your_firebase_web_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_firebase_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_firebase_app_id

# =================================
# DEVELOPMENT - Optional
# =================================
# Environment mode
NODE_ENV=development

# Port configuration (optional - defaults are set)
PORT=8080
CLIENT_PORT=3000

# CORS allowed origins (comma-separated)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080

# Redis configuration (optional - for caching)
REDIS_URL=redis://localhost:6379

# Monitoring
ENABLE_MONITORING=true
PROMETHEUS_PORT=9090
GRAFANA_PORT=3010

# =================================
# SECURITY - Optional
# =================================
# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Session configuration
SESSION_SECRET=your_session_secret_for_development

# =================================
# FEATURE FLAGS - Optional
# =================================
# Enable/disable features
ENABLE_CHAT=true
ENABLE_NEWS=true
ENABLE_SCREENSHOTS=true
ENABLE_VIRUS_SCANNING=true
ENABLE_PHISHING_DETECTION=true

# =================================
# LOGGING - Optional
# =================================
LOG_LEVEL=info
LOG_FORMAT=combined`;

    try {
      if (!fs.existsSync(envExamplePath)) {
        fs.writeFileSync(envExamplePath, envTemplate);
        
        this.fixesApplied.push({
          type: 'env_example',
          message: 'Created comprehensive .env.example template'
        });
        
        this.log('  ✅ Created .env.example with all required variables', 'success');
      } else {
        this.log('  ✅ .env.example already exists', 'success');
      }
    } catch (error) {
      this.errors.push(`Failed to create .env.example: ${error.message}`);
      this.log(`  ❌ Failed to create .env.example: ${error.message}`, 'error');
    }
  }

  /**
   * Create missing critical files
   */
  async createMissingFiles() {
    this.log('\n6. 📄 Creating missing critical files...', 'info');
    
    const requiredFiles = [
      {
        path: 'DEVELOPER_SETUP.md',
        critical: false,
        content: this.getDeveloperSetupContent()
      }
    ];
    
    for (const file of requiredFiles) {
      const filePath = path.join(this.projectRoot, file.path);
      
      if (!fs.existsSync(filePath)) {
        try {
          fs.writeFileSync(filePath, file.content);
          this.fixesApplied.push({
            type: 'missing_file',
            message: `Created ${file.path}`
          });
          this.log(`  ✅ Created ${file.path}`, 'success');
        } catch (error) {
          this.errors.push(`Failed to create ${file.path}: ${error.message}`);
        }
      } else {
        this.log(`  ✅ ${file.path} already exists`, 'success');
      }
    }
  }

  /**
   * Get all package.json files (matching validator logic)
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
    
    // Shared package.json
    const sharedPkg = path.join(this.projectRoot, 'shared', 'package.json');
    if (fs.existsSync(sharedPkg)) {
      packages.push({
        path: 'shared',
        content: JSON.parse(fs.readFileSync(sharedPkg, 'utf8'))
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
   * Get full path for package.json
   */
  getPackageFullPath(pkgPath) {
    if (pkgPath === 'root') {
      return path.join(this.projectRoot, 'package.json');
    } else if (pkgPath === 'client') {
      return path.join(this.projectRoot, 'client', 'package.json');
    } else if (pkgPath === 'shared') {
      return path.join(this.projectRoot, 'shared', 'package.json');
    } else if (pkgPath.startsWith('services/')) {
      return path.join(this.projectRoot, pkgPath, 'package.json');
    }
    return null;
  }

  /**
   * Get DEVELOPER_SETUP.md content
   */
  getDeveloperSetupContent() {
    return `# 🚀 Developer Setup Guide

Quick setup guide for new developers.

## ⚡ Quick Setup (5 minutes)

\`\`\`bash
git clone https://github.com/VinkRasengan/backup.git
cd backup
npm run validate:cicd  # Check for issues
npm run fix:cicd       # Auto-fix issues
npm run setup          # Install dependencies
# Edit .env with your Firebase credentials
npm start              # Start all services
\`\`\`

## 📋 Requirements

- Node.js 18+
- npm 9+
- Firebase account (free)

## 🔧 Environment Setup

1. Copy .env.example to .env
2. Get Firebase credentials from Firebase Console
3. Add your API keys to .env
4. Run npm start

## 🎯 Next Steps

- Frontend: http://localhost:3000
- API Gateway: http://localhost:8080
- Services: Ports 3001-3006

For issues, run: \`npm run validate:cicd\`
`;
  }

  /**
   * Fix missing engines in all package.json files
   */
  async fixMissingEngines() {
    this.log('\n7. ⚙️  Ensuring all packages have engine requirements...', 'info');
    
    // This is handled by fixNodeEngineRequirements, so just log
    this.log('  ✅ Handled in Node.js engine requirements section', 'success');
  }

  /**
   * Fix script compatibility issues
   */
  async fixScriptCompatibility() {
    this.log('\n8. 📜 Checking script compatibility...', 'info');
    
    // For now, just recommend manual review
    this.log('  ℹ️  Manual review recommended for:', 'info');
    this.log('     - curl commands (may need fallbacks for Windows)', 'info');
    this.log('     - tail commands (platform-specific behavior)', 'info');
    this.log('     - Process killing commands (already handled in scripts)', 'info');
  }

  /**
   * Update .gitignore to ensure .env is ignored
   */
  async updateGitignore() {
    this.log('\n9. 🚫 Updating .gitignore...', 'info');
    
    const gitignorePath = path.join(this.projectRoot, '.gitignore');
    
    try {
      if (fs.existsSync(gitignorePath)) {
        const content = fs.readFileSync(gitignorePath, 'utf8');
        
        const requiredEntries = [
          '.env',
          '.env.local',
          '.env.development.local',
          '.env.test.local',
          '.env.production.local'
        ];
        
        let updated = false;
        let newContent = content;
        
        requiredEntries.forEach(entry => {
          if (!content.includes(entry)) {
            newContent += `\n${entry}`;
            updated = true;
          }
        });
        
        if (updated) {
          fs.writeFileSync(gitignorePath, newContent);
          this.fixesApplied.push({
            type: 'gitignore',
            message: 'Updated .gitignore to include environment files'
          });
          this.log('  ✅ Updated .gitignore with environment files', 'success');
        } else {
          this.log('  ✅ .gitignore already includes environment files', 'success');
        }
      } else {
        this.log('  ⚠️  .gitignore not found - consider creating one', 'warning');
      }
    } catch (error) {
      this.errors.push(`Failed to update .gitignore: ${error.message}`);
      this.log(`  ❌ Failed to update .gitignore: ${error.message}`, 'error');
    }
  }

  /**
   * Generate auto-fix report
   */
  generateReport() {
    this.log('\n🔧 AUTO-FIX REPORT', 'info');
    this.log('='.repeat(50), 'info');
    
    if (this.fixesApplied.length > 0) {
      this.log(`\n✅ FIXES APPLIED (${this.fixesApplied.length}):`, 'success');
      this.fixesApplied.forEach((fix, index) => {
        this.log(`${index + 1}. ${fix.message}`, 'success');
      });
    }
    
    if (this.errors.length > 0) {
      this.log(`\n❌ ERRORS (${this.errors.length}):`, 'error');
      this.errors.forEach((error, index) => {
        this.log(`${index + 1}. ${error}`, 'error');
      });
    }
    
    this.log('\n📊 SUMMARY:', 'info');
    this.log(`   Fixes Applied: ${this.fixesApplied.length}`, 'success');
    this.log(`   Errors: ${this.errors.length}`, this.errors.length > 0 ? 'error' : 'success');
    
    if (this.fixesApplied.length > 0) {
      this.log('\n🎯 NEXT STEPS:', 'info');
      this.log('1. Run: npm run install:all', 'info');
      this.log('2. Review and update .env file with your credentials', 'info');
      this.log('3. Run: npm run validate:cicd (to verify fixes)', 'info');
      this.log('4. Run: npm start (to test everything works)', 'info');
    }
    
    if (this.fixesApplied.length === 0 && this.errors.length === 0) {
      this.log('\n🎉 No fixes needed! Your project is already well-configured.', 'success');
    }
  }

  /**
   * Get all package.json files (matching validator logic)
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
    
    // Shared package.json
    const sharedPkg = path.join(this.projectRoot, 'shared', 'package.json');
    if (fs.existsSync(sharedPkg)) {
      packages.push({
        path: 'shared',
        content: JSON.parse(fs.readFileSync(sharedPkg, 'utf8'))
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
   * Get full path for package.json
   */
  getPackageFullPath(pkgPath) {
    if (pkgPath === 'root') {
      return path.join(this.projectRoot, 'package.json');
    } else if (pkgPath === 'client') {
      return path.join(this.projectRoot, 'client', 'package.json');
    } else if (pkgPath === 'shared') {
      return path.join(this.projectRoot, 'shared', 'package.json');
    } else if (pkgPath.startsWith('services/')) {
      return path.join(this.projectRoot, pkgPath, 'package.json');
    }
    return null;
  }

  /**
   * Get DEVELOPER_SETUP.md content
   */
  getDeveloperSetupContent() {
    return `# 🚀 Developer Setup Guide

Quick setup guide for new developers.

## ⚡ Quick Setup (5 minutes)

\`\`\`bash
git clone https://github.com/VinkRasengan/backup.git
cd backup
npm run validate:cicd  # Check for issues
npm run fix:cicd       # Auto-fix issues
npm run setup          # Install dependencies
# Edit .env with your Firebase credentials
npm start              # Start all services
\`\`\`

## 📋 Requirements

- Node.js 18+
- npm 9+
- Firebase account (free)

## 🔧 Environment Setup

1. Copy .env.example to .env
2. Get Firebase credentials from Firebase Console
3. Add your API keys to .env
4. Run npm start

## 🎯 Next Steps

- Frontend: http://localhost:3000
- API Gateway: http://localhost:8080
- Services: Ports 3001-3006

For issues, run: \`npm run validate:cicd\`
`;
  }
}

// Run auto-fix if called directly
if (require.main === module) {
  const autoFix = new CICDAutoFix();
  autoFix.autoFix().then(() => {
    process.exit(0);
  }).catch(() => {
    process.exit(1);
  });
}

module.exports = CICDAutoFix; 