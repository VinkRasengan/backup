#!/usr/bin/env node

/**
 * Environment Setup and Validation Script
 * Helps new developers set up their environment correctly
 */

const fs = require('fs');
const path = require('path');

class EnvironmentSetup {
  constructor() {
    this.projectRoot = process.cwd();
    this.envPath = path.join(this.projectRoot, '.env');
    this.examplePath = path.join(this.projectRoot, '.env.example');
  }

  async setup() {
    console.log('🔧 FactCheck Platform - Environment Setup');
    console.log('==========================================');

    try {
      // Step 1: Create .env.example if doesn't exist
      await this.createEnvExample();
      
      // Step 2: Check if .env exists
      await this.checkEnvFile();
      
      // Step 3: Validate required variables
      await this.validateEnvironment();
      
      // Step 4: Check for common dependency conflicts
      await this.checkDependencyConflicts();
      
      // Step 5: Show next steps
      this.showNextSteps();
      
    } catch (error) {
      console.error('❌ Environment setup failed:', error.message);
      process.exit(1);
    }
  }

  async createEnvExample() {
    console.log('1. 📝 Creating .env.example template...');
    
    // Generate a secure JWT secret
    const { generateJWTSecret } = require('./generate-jwt-secret');
    const jwtSecret = generateJWTSecret();
    
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
# Auto-generated secure JWT secret (64 characters)
JWT_SECRET=${jwtSecret}

# =================================
# REQUIRED - AI Services
# =================================
# Get from https://makersuite.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key

# =================================
# OPTIONAL - Third-party API Keys
# =================================
# These are optional - services will work without them using mock data
VIRUSTOTAL_API_KEY=your_virustotal_api_key
SCAMADVISER_API_KEY=your_scamadviser_api_key
NEWSAPI_API_KEY=your_newsapi_api_key
PHISHTANK_API_KEY=your_phishtank_api_key
CRIMINALIP_API_KEY=your_criminalip_api_key
IPQUALITYSCORE_API_KEY=your_ipqualityscore_api_key

# =================================
# DEVELOPMENT - Service URLs
# =================================
# These are auto-configured for local development
AUTH_SERVICE_URL=http://localhost:3001
LINK_SERVICE_URL=http://localhost:3002
COMMUNITY_SERVICE_URL=http://localhost:3003
CHAT_SERVICE_URL=http://localhost:3004
NEWS_SERVICE_URL=http://localhost:3005
ADMIN_SERVICE_URL=http://localhost:3006

# =================================
# DEVELOPMENT - CORS Configuration
# =================================
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080

# =================================
# FRONTEND - React App Config
# =================================
REACT_APP_API_URL=http://localhost:8080
REACT_APP_FIREBASE_API_KEY=your_firebase_web_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_firebase_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_firebase_app_id

# =================================
# OPTIONAL - Development Settings
# =================================
NODE_ENV=development
ENABLE_MONITORING=true
DEBUG=false

# =================================
# INSTRUCTIONS
# =================================
# 1. Copy this file: cp .env.example .env (or copy .env.example .env on Windows)
# 2. Fill in your Firebase credentials (required)
# 3. Generate a strong JWT_SECRET (required)
# 4. Get Gemini API key (required for AI features)
# 5. Other API keys are optional for development`;

    if (!fs.existsSync(this.examplePath)) {
      fs.writeFileSync(this.examplePath, envTemplate);
      console.log('  ✅ Created .env.example');
    } else {
      console.log('  ℹ️ .env.example already exists');
    }
  }

  async checkEnvFile() {
    console.log('2. 🔍 Checking .env file...');
    
    if (!fs.existsSync(this.envPath)) {
      console.log('  ⚠️ .env file not found');
      console.log('  📋 Creating .env from template...');
      
      if (fs.existsSync(this.examplePath)) {
        fs.copyFileSync(this.examplePath, this.envPath);
        console.log('  ✅ Created .env from .env.example');
        console.log('  🚨 IMPORTANT: You must edit .env with your actual credentials!');
      } else {
        throw new Error('.env.example not found. Cannot create .env file.');
      }
    } else {
      console.log('  ✅ .env file exists');
    }
  }

  async validateEnvironment() {
    console.log('3. ✅ Validating environment variables...');
    
    // Load .env file
    require('dotenv').config({ path: this.envPath });
    
    const requiredVars = [
      'FIREBASE_PROJECT_ID',
      'FIREBASE_CLIENT_EMAIL', 
      'FIREBASE_PRIVATE_KEY',
      'JWT_SECRET',
      'GEMINI_API_KEY'
    ];

    // React app environment variables
    const reactVars = [
      'REACT_APP_API_URL',
      'REACT_APP_FIREBASE_API_KEY',
      'REACT_APP_FIREBASE_AUTH_DOMAIN',
      'REACT_APP_FIREBASE_PROJECT_ID',
      'REACT_APP_FIREBASE_STORAGE_BUCKET',
      'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
      'REACT_APP_FIREBASE_APP_ID'
    ];
    
    const warnings = [];
    const errors = [];
    
    // Validate backend environment variables
    for (const varName of requiredVars) {
      const value = process.env[varName];
      
      if (!value) {
        errors.push(`${varName} is missing`);
      } else if (value.includes('your_') || value.includes('YOUR_') || value.includes('xxxxx')) {
        warnings.push(`${varName} still has placeholder value`);
      } else if (varName === 'JWT_SECRET' && value.length < 32) {
        warnings.push(`${varName} should be at least 32 characters long`);
      } else if (varName === 'JWT_SECRET' && value.length >= 32) {
        console.log(`  ✅ ${varName} is properly set (${value.length} characters)`);
      } else {
        console.log(`  ✅ ${varName} is set`);
      }
    }

    // Validate React app environment variables
    console.log('\n  🔍 Validating React app environment variables...');
    for (const varName of reactVars) {
      const value = process.env[varName];
      
      if (!value) {
        warnings.push(`${varName} is missing (frontend may not work properly)`);
      } else if (value.includes('your_') || value.includes('YOUR_') || value.includes('xxxxx')) {
        warnings.push(`${varName} still has placeholder value`);
      } else {
        console.log(`  ✅ ${varName} is set`);
      }
    }

    // Check if REACT_APP_FIREBASE_PROJECT_ID matches FIREBASE_PROJECT_ID
    if (process.env.REACT_APP_FIREBASE_PROJECT_ID && process.env.FIREBASE_PROJECT_ID) {
      if (process.env.REACT_APP_FIREBASE_PROJECT_ID !== process.env.FIREBASE_PROJECT_ID) {
        warnings.push('REACT_APP_FIREBASE_PROJECT_ID does not match FIREBASE_PROJECT_ID');
      }
    }
    
    // Show warnings
    if (warnings.length > 0) {
      console.log('\n  ⚠️ WARNINGS:');
      warnings.forEach(warning => console.log(`    - ${warning}`));
    }
    
    // Show errors
    if (errors.length > 0) {
      console.log('\n  ❌ ERRORS:');
      errors.forEach(error => console.log(`    - ${error}`));
      console.log('\n  🔧 Please edit .env file and fill in the required values.');
      throw new Error(`Missing ${errors.length} required environment variables`);
    }
    
    if (warnings.length > 0) {
      console.log('\n  ⚠️ Environment has warnings but can continue...');
      console.log('  💡 For full functionality, consider updating the warned variables.');
    } else {
      console.log('  ✅ All required environment variables are properly set');
    }
  }

  /**
   * Check for common dependency conflicts
   */
  async checkDependencyConflicts() {
    console.log('4. 📦 Checking dependency conflicts...');
    
    const conflicts = [];
    
    // Check Firebase Admin version consistency
    const firebaseVersions = await this.checkFirebaseVersions();
    if (firebaseVersions.conflicts.length > 0) {
      conflicts.push('Firebase Admin versions conflicts detected');
      console.log('  ⚠️  Firebase Admin versions:', firebaseVersions.versions);
    }
    
    // Check Node.js version consistency
    const nodeVersions = await this.checkNodeVersions();
    if (nodeVersions.conflicts.length > 0) {
      conflicts.push('Node.js version requirements inconsistent');
      console.log('  ⚠️  Node.js version conflicts:', nodeVersions.conflicts);
    }
    
    // Check for heavy dependencies
    const heavyDeps = await this.checkHeavyDependencies();
    if (heavyDeps.length > 0) {
      console.log('  ⚠️  Heavy dependencies detected:', heavyDeps);
      console.log('      These may slow down CI/CD and cause cross-platform issues');
    }
    
    if (conflicts.length === 0) {
      console.log('  ✅ No dependency conflicts detected');
    } else {
      console.log('  ⚠️  Conflicts detected:', conflicts.length);
    }
    
    return conflicts;
  }
  
  /**
   * Check Firebase Admin SDK versions across services
   */
  async checkFirebaseVersions() {
    const versions = {};
    const conflicts = [];
    
    const servicesDirs = ['auth-service', 'community-service', 'link-service', 'chat-service', 'news-service', 'admin-service'];
    
    for (const service of servicesDirs) {
      const packagePath = path.join(this.projectRoot, 'services', service, 'package.json');
      if (fs.existsSync(packagePath)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
          if (pkg.dependencies && pkg.dependencies['firebase-admin']) {
            versions[service] = pkg.dependencies['firebase-admin'];
          }
        } catch (error) {
          console.log(`    ⚠️  Could not read ${service}/package.json`);
        }
      }
    }
    
    // Check if all versions are the same
    const versionValues = Object.values(versions);
    const uniqueVersions = [...new Set(versionValues)];
    
    if (uniqueVersions.length > 1) {
      conflicts.push('Multiple Firebase Admin versions found');
    }
    
    return { versions, conflicts };
  }
  
  /**
   * Check Node.js version requirements
   */
  async checkNodeVersions() {
    const versions = {};
    const conflicts = [];
    
    // Check root package.json
    try {
      const rootPkg = JSON.parse(fs.readFileSync(path.join(this.projectRoot, 'package.json'), 'utf8'));
      if (rootPkg.engines && rootPkg.engines.node) {
        versions.root = rootPkg.engines.node;
      }
    } catch (error) {
      conflicts.push('Could not read root package.json');
    }
    
    // Check client package.json
    try {
      const clientPkg = JSON.parse(fs.readFileSync(path.join(this.projectRoot, 'client', 'package.json'), 'utf8'));
      if (clientPkg.engines && clientPkg.engines.node) {
        versions.client = clientPkg.engines.node;
      } else {
        conflicts.push('Client package.json missing Node.js version requirement');
      }
    } catch (error) {
      conflicts.push('Could not read client/package.json');
    }
    
    return { versions, conflicts };
  }
  
  /**
   * Check for heavy dependencies that may cause CI/CD issues
   */
  async checkHeavyDependencies() {
    const heavyDeps = [];
    
    // Check link-service for Puppeteer
    const linkServicePkg = path.join(this.projectRoot, 'services', 'link-service', 'package.json');
    if (fs.existsSync(linkServicePkg)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(linkServicePkg, 'utf8'));
        if (pkg.dependencies && pkg.dependencies.puppeteer) {
          heavyDeps.push({
            service: 'link-service',
            dependency: 'puppeteer',
            version: pkg.dependencies.puppeteer,
            issue: 'Downloads Chromium (~200MB), may fail cross-platform'
          });
        }
      } catch (error) {
        // Ignore
      }
    }
    
    return heavyDeps;
  }
  
  /**
   * Fix dependency conflicts
   */
  async fixDependencyConflicts() {
    console.log('5. 🔧 Fixing dependency conflicts...');
    
    // This would typically run npm install to resolve conflicts
    // For now, just recommend manual fixes
    console.log('  ℹ️  To fix conflicts:');
    console.log('     1. Run: npm run install:all');
    console.log('     2. Check package-lock.json files for conflicts');
    console.log('     3. Consider using npm audit to check for vulnerabilities');
  }

  showNextSteps() {
    console.log('\n🎉 Environment setup complete!');
    console.log('\n📋 Next steps for new developers:');
    console.log('  1. npm run install:all  # Install all dependencies (this may take a few minutes)');
    console.log('  2. npm start           # Start all services in development mode');
    console.log('  3. Open http://localhost:3000 in your browser');
    console.log('\n💡 Alternative startup methods:');
    console.log('  - npm run docker       # Run with Docker (requires Docker installed)');
    console.log('  - npm run quick-start  # Cross-platform quick start');
    console.log('\n🔧 Useful commands:');
    console.log('  - npm run status       # Check service status');
    console.log('  - npm stop            # Stop all services');
    console.log('  - npm run health      # Health check all services');
    console.log('  - npm run validate     # Validate deployment');
    console.log('\n📊 Monitoring & Development:');
    console.log('  - Frontend:            http://localhost:3000');
    console.log('  - API Gateway:         http://localhost:8080');
    console.log('  - Grafana Dashboard:   http://localhost:3010 (user: admin, pass: admin123)');
    console.log('  - Prometheus:          http://localhost:9090');
    console.log('\n🔧 If you need to update .env:');
    console.log('  - Edit .env file directly (in project root)');
    console.log('  - Run: npm run env:setup (to re-validate)');
    console.log('  - No need to copy .env to individual services - they auto-detect it!');
    console.log('\n⚠️  Important notes:');
    console.log('  - Keep .env file in project ROOT only');
    console.log('  - Never commit .env file to git');
    console.log('  - All services automatically load from root .env');
    console.log('  - React app variables must start with REACT_APP_');
  }
}

// Run if called directly
if (require.main === module) {
  const setup = new EnvironmentSetup();
  setup.setup().catch(console.error);
}

module.exports = EnvironmentSetup; 