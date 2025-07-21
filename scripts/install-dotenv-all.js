#!/usr/bin/env node

/**
 * Install dotenv in all services
 * Ensures all services can load environment variables from root .env
 */

const { exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class DotenvInstaller {
  constructor() {
    this.rootDir = process.cwd();
    this.services = [
      'auth-service',
      'link-service', 
      'community-service',
      'chat-service',
      'news-service',
      'admin-service',
      'api-gateway',
      'phishtank-service',
      'criminalip-service'
    ];
    this.successfulInstalls = [];
    this.errors = [];
  }

  /**
   * Main installation function
   */
  async install() {
    console.log('📦 Installing dotenv in all services');
    console.log('=' .repeat(50));

    try {
      await this.installInRoot();
      await this.installInServices();
      this.showResults();
    } catch (error) {
      console.error('❌ Installation failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Install dotenv in root
   */
  async installInRoot() {
    console.log('📦 Installing dotenv in root...');
    
    try {
      await this.execAsync('npm install dotenv --save', { cwd: this.rootDir });
      this.successfulInstalls.push('root');
      console.log('  ✅ Installed dotenv in root');
    } catch (error) {
      console.error('  ❌ Failed to install dotenv in root:', error.message);
      this.errors.push({ service: 'root', error: error.message });
    }
  }

  /**
   * Install dotenv in all services
   */
  async installInServices() {
    console.log('\n📦 Installing dotenv in services...');
    
    for (const service of this.services) {
      await this.installInService(service);
    }
  }

  /**
   * Install dotenv in individual service
   */
  async installInService(serviceName) {
    console.log(`  📦 Installing dotenv in ${serviceName}...`);
    
    const serviceDir = path.join(this.rootDir, 'services', serviceName);
    
    if (!fs.existsSync(serviceDir)) {
      console.log(`    ⚠️ Service directory not found: ${serviceName}`);
      return;
    }
    
    try {
      await this.execAsync('npm install dotenv --save', { cwd: serviceDir });
      this.successfulInstalls.push(serviceName);
      console.log(`    ✅ Installed dotenv in ${serviceName}`);
    } catch (error) {
      console.error(`    ❌ Failed to install dotenv in ${serviceName}:`, error.message);
      this.errors.push({ service: serviceName, error: error.message });
    }
  }

  /**
   * Show results
   */
  showResults() {
    console.log('\n📋 Installation Results');
    console.log('=' .repeat(30));
    
    if (this.successfulInstalls.length > 0) {
      console.log(`\n✅ Successfully installed dotenv in ${this.successfulInstalls.length} locations:`);
      this.successfulInstalls.forEach(service => {
        console.log(`  📦 ${service}`);
      });
    }

    if (this.errors.length > 0) {
      console.log(`\n❌ Failed to install dotenv in ${this.errors.length} locations:`);
      this.errors.forEach(({ service, error }) => {
        console.log(`  📦 ${service}: ${error}`);
      });
    }

    console.log('\n🎉 Installation completed!');
    console.log('💡 All services can now load environment variables from root .env');
    console.log('💡 Run "npm start" to test the updated configuration');
  }

  /**
   * Utility functions
   */
  execAsync(command, options = {}) {
    return new Promise((resolve, reject) => {
      exec(command, { timeout: 60000, ...options }, (error, stdout, stderr) => {
        if (error) reject(error);
        else resolve(stdout);
      });
    });
  }
}

// Run the installer
if (require.main === module) {
  const installer = new DotenvInstaller();
  installer.install().catch(console.error);
}

module.exports = DotenvInstaller;
