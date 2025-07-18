#!/usr/bin/env node

/**
 * Environment Configuration Validator
 * Validates environment variables and warns about localhost fallbacks
 */

const fs = require('fs');
const path = require('path');

class EnvironmentValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.info = [];
    this.projectRoot = process.cwd();
  }

  /**
   * Validate environment configuration
   */
  validate() {
    console.log('🔍 Validating Environment Configuration...\n');

    this.checkEnvironmentFile();
    this.validateServiceUrls();
    this.validateClientConfig();
    this.checkLocalhostUsage();
    this.validateProductionReadiness();

    this.printResults();
    return this.errors.length === 0;
  }

  /**
   * Check if .env file exists and is properly configured
   */
  checkEnvironmentFile() {
    const envPath = path.join(this.projectRoot, '.env');
    
    if (!fs.existsSync(envPath)) {
      this.errors.push('❌ .env file not found');
      this.info.push('💡 Copy .env.example to .env and configure your values');
      return;
    }

    // Load environment variables
    require('dotenv').config({ path: envPath });
    this.info.push('✅ .env file found and loaded');

    // Check for placeholder values
    const placeholderPatterns = ['your-', 'YOUR_', 'xxxxx', 'placeholder'];
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    for (const pattern of placeholderPatterns) {
      if (envContent.includes(pattern)) {
        this.warnings.push(`⚠️  .env file contains placeholder values (${pattern})`);
        break;
      }
    }
  }

  /**
   * Validate service URLs configuration
   */
  validateServiceUrls() {
    const serviceUrls = [
      'AUTH_SERVICE_URL',
      'LINK_SERVICE_URL', 
      'COMMUNITY_SERVICE_URL',
      'CHAT_SERVICE_URL',
      'NEWS_SERVICE_URL',
      'ADMIN_SERVICE_URL'
    ];

    const environment = process.env.NODE_ENV || 'development';
    
    for (const urlVar of serviceUrls) {
      const url = process.env[urlVar];
      
      if (!url) {
        this.errors.push(`❌ Missing required variable: ${urlVar}`);
        continue;
      }

      // Check for localhost in production
      if (environment === 'production' && (url.includes('localhost') || url.includes('127.0.0.1'))) {
        this.errors.push(`❌ Production environment using localhost: ${urlVar}=${url}`);
        this.info.push(`💡 Use actual service URLs in production`);
      }

      // Check for proper service names in Docker/K8s
      if (url.includes('localhost') && (process.env.DOCKER_ENV || process.env.KUBERNETES_SERVICE_HOST)) {
        this.warnings.push(`⚠️  Using localhost in containerized environment: ${urlVar}=${url}`);
        this.info.push(`💡 Use service names like: http://auth-service:3001`);
      }

      this.info.push(`✅ ${urlVar}: ${url}`);
    }
  }

  /**
   * Validate client configuration
   */
  validateClientConfig() {
    const clientVars = [
      'REACT_APP_API_URL',
      'REACT_APP_FIREBASE_API_KEY',
      'REACT_APP_FIREBASE_AUTH_DOMAIN',
      'REACT_APP_FIREBASE_PROJECT_ID'
    ];

    for (const varName of clientVars) {
      const value = process.env[varName];
      
      if (!value) {
        this.warnings.push(`⚠️  Missing client variable: ${varName}`);
        continue;
      }

      if (value.includes('your-') || value.includes('placeholder')) {
        this.warnings.push(`⚠️  Client variable has placeholder: ${varName}`);
      }

      this.info.push(`✅ ${varName}: ${value}`);
    }
  }

  /**
   * Check for localhost usage patterns
   */
  checkLocalhostUsage() {
    const localhostVars = [];
    
    for (const [key, value] of Object.entries(process.env)) {
      if (typeof value === 'string' && (value.includes('localhost') || value.includes('127.0.0.1'))) {
        localhostVars.push(`${key}=${value}`);
      }
    }

    if (localhostVars.length > 0) {
      this.warnings.push(`⚠️  Found ${localhostVars.length} localhost references:`);
      localhostVars.forEach(varEntry => this.info.push(`   🏠 ${varEntry}`));
      
      this.info.push('💡 Deployment recommendations:');
      this.info.push('   🐳 Docker: Use service names (e.g., http://auth-service:3001)');
      this.info.push('   ☸️  K8s: Use service names (e.g., http://auth-service:3001)');
      this.info.push('   🚀 Cloud: Use actual URLs (e.g., https://auth.yourdomain.com)');
    }
  }

  /**
   * Validate production readiness
   */
  validateProductionReadiness() {
    const environment = process.env.NODE_ENV || 'development';
    
    if (environment === 'production') {
      const requiredProdVars = [
        'FIREBASE_PROJECT_ID',
        'FIREBASE_PRIVATE_KEY',
        'JWT_SECRET',
        'REACT_APP_API_URL'
      ];

      for (const varName of requiredProdVars) {
        if (!process.env[varName]) {
          this.errors.push(`❌ Production requires: ${varName}`);
        }
      }

      // Check JWT secret strength
      const jwtSecret = process.env.JWT_SECRET;
      if (jwtSecret && jwtSecret.length < 32) {
        this.warnings.push('⚠️  JWT_SECRET should be at least 32 characters for production');
      }
    }
  }

  /**
   * Print validation results
   */
  printResults() {
    console.log('\n📊 Validation Results:');
    console.log('='.repeat(50));

    if (this.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.errors.forEach(error => console.log(error));
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      this.warnings.forEach(warning => console.log(warning));
    }

    if (this.info.length > 0) {
      console.log('\n💡 INFO:');
      this.info.forEach(info => console.log(info));
    }

    console.log('\n' + '='.repeat(50));
    
    if (this.errors.length === 0) {
      console.log('✅ Environment validation passed!');
    } else {
      console.log(`❌ Environment validation failed with ${this.errors.length} errors`);
    }

    if (this.warnings.length > 0) {
      console.log(`⚠️  ${this.warnings.length} warnings found - review recommended`);
    }
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new EnvironmentValidator();
  const success = validator.validate();
  process.exit(success ? 0 : 1);
}

module.exports = EnvironmentValidator;
