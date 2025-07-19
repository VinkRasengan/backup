#!/usr/bin/env node
/**
 * Full Docker Setup Script for New Developers
 * Handles complete setup: dependencies, Docker images, and environment validation
 */

const { exec, spawn } = require('child_process');
const util = require('util');
const fs = require('fs');
const path = require('path');
const os = require('os');

const execAsync = util.promisify(exec);

class FullDockerSetup {
  constructor() {
    this.isWindows = os.platform() === 'win32';
    this.rootDir = path.resolve(__dirname, '..');
    this.envPath = path.join(this.rootDir, '.env');
    this.envExamplePath = path.join(this.rootDir, '.env.example');
  }

  /**
   * Main setup method
   */
  async setup() {
    console.log('🚀 FactCheck Platform - Full Docker Setup');
    console.log('==========================================');
    console.log('⏱️  This process may take 5-10 minutes for first-time setup\n');
    
    try {
      // Step 1: Check prerequisites
      await this.checkPrerequisites();
      
      // Step 2: Setup environment
      await this.setupEnvironment();

      // Step 3: Copy environment to all services
      await this.copyEnvironmentToServices();

      // Step 4: Install dependencies
      await this.installDependencies();
      
      // Step 5: Setup monitoring directories
      await this.setupMonitoring();

      // Step 6: Build Docker images
      await this.buildDockerImages();

      // Step 7: Validate setup
      await this.validateSetup();

      // Step 8: Show completion message
      this.showCompletionMessage();
      
    } catch (error) {
      console.error('❌ Setup failed:', error.message);
      console.log('\n🔧 Troubleshooting tips:');
      console.log('• Make sure Docker is running');
      console.log('• Check your .env file has valid credentials');
      console.log('• Try running: npm run setup:full again');
      process.exit(1);
    }
  }

  /**
   * Check prerequisites
   */
  async checkPrerequisites() {
    console.log('1. 🔍 Checking prerequisites...');
    
    // Check Node.js version
    const nodeVersion = process.version;
    console.log(`  ✅ Node.js: ${nodeVersion}`);
    
    // Check npm
    try {
      const { stdout } = await execAsync('npm --version');
      console.log(`  ✅ npm: v${stdout.trim()}`);
    } catch (error) {
      throw new Error('npm not found. Please install Node.js and npm.');
    }
    
    // Check Docker
    try {
      const { stdout } = await execAsync('docker --version');
      console.log(`  ✅ Docker: ${stdout.trim()}`);
    } catch (error) {
      throw new Error('Docker not found. Please install Docker Desktop.');
    }
    
    // Check Docker Compose
    try {
      const { stdout } = await execAsync('docker-compose --version');
      console.log(`  ✅ Docker Compose: ${stdout.trim()}`);
    } catch (error) {
      throw new Error('Docker Compose not found. Please install Docker Desktop.');
    }
    
    // Check if Docker is running
    try {
      await execAsync('docker info', { timeout: 10000 });
      console.log('  ✅ Docker daemon is running');
    } catch (error) {
      throw new Error('Docker daemon is not running. Please start Docker Desktop.');
    }
  }

  /**
   * Setup environment
   */
  async setupEnvironment() {
    console.log('\n2. 🔧 Setting up environment...');
    
    // Check if .env exists
    if (!fs.existsSync(this.envPath)) {
      if (fs.existsSync(this.envExamplePath)) {
        fs.copyFileSync(this.envExamplePath, this.envPath);
        console.log('  ✅ Created .env from template');
        console.log('  🚨 IMPORTANT: Please edit .env with your actual credentials!');
      } else {
        throw new Error('.env.example not found. Cannot create .env file.');
      }
    } else {
      console.log('  ✅ .env file exists');
    }
    
    // Load and validate environment
    require('dotenv').config({ path: this.envPath });
    
    const requiredVars = [
      'FIREBASE_PROJECT_ID',
      'FIREBASE_CLIENT_EMAIL',
      'FIREBASE_PRIVATE_KEY',
      'JWT_SECRET'
    ];
    
    const missingVars = requiredVars.filter(varName => {
      const value = process.env[varName];
      return !value || value.includes('your-') || value.includes('Your-');
    });
    
    if (missingVars.length > 0) {
      console.log('  ⚠️  Missing or template values found in .env:');
      missingVars.forEach(varName => {
        console.log(`    - ${varName}`);
      });
      console.log('\n  📝 Please edit .env file with your actual credentials before continuing.');
      console.log('  💡 You can continue setup and fix credentials later, but services may not work properly.');
      
      // Ask user if they want to continue
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise(resolve => {
        rl.question('  ❓ Continue setup anyway? (y/N): ', resolve);
      });
      rl.close();
      
      if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
        throw new Error('Setup cancelled. Please update .env file and try again.');
      }
    } else {
      console.log('  ✅ Environment variables validated');
    }
  }

  /**
   * Copy environment file to all services and client
   */
  async copyEnvironmentToServices() {
    console.log('\n3. 📋 Copying environment to all services...');

    if (!fs.existsSync(this.envPath)) {
      console.log('  ⚠️  .env file not found, skipping copy');
      return;
    }

    // Get all service directories
    const servicesDir = path.join(this.rootDir, 'services');
    const clientDir = path.join(this.rootDir, 'client');

    let copiedCount = 0;

    // Copy to services
    if (fs.existsSync(servicesDir)) {
      const services = fs.readdirSync(servicesDir).filter(item => {
        const servicePath = path.join(servicesDir, item);
        return fs.statSync(servicePath).isDirectory() &&
               fs.existsSync(path.join(servicePath, 'package.json'));
      });

      for (const service of services) {
        const serviceEnvPath = path.join(servicesDir, service, '.env');
        try {
          fs.copyFileSync(this.envPath, serviceEnvPath);
          console.log(`  ✅ Copied .env to ${service}`);
          copiedCount++;
        } catch (error) {
          console.log(`  ⚠️  Failed to copy .env to ${service}: ${error.message}`);
        }
      }
    }

    // Copy to client
    if (fs.existsSync(clientDir)) {
      const clientEnvPath = path.join(clientDir, '.env');
      try {
        fs.copyFileSync(this.envPath, clientEnvPath);
        console.log('  ✅ Copied .env to client');
        copiedCount++;
      } catch (error) {
        console.log(`  ⚠️  Failed to copy .env to client: ${error.message}`);
      }
    }

    console.log(`  📊 Environment copied to ${copiedCount} locations`);
    console.log('  💡 All services and client now have access to environment variables');
  }

  /**
   * Install dependencies
   */
  async installDependencies() {
    console.log('\n3. 📦 Installing dependencies...');
    console.log('  ⏱️  This may take a few minutes...');
    
    // Install root dependencies
    console.log('  📦 Installing root dependencies...');
    await this.runCommand('npm install --ignore-scripts', this.rootDir);
    
    // Install client dependencies
    const clientDir = path.join(this.rootDir, 'client');
    if (fs.existsSync(clientDir)) {
      console.log('  📦 Installing client dependencies...');
      await this.runCommand('npm install', clientDir);
    }
    
    // Install service dependencies
    const servicesDir = path.join(this.rootDir, 'services');
    if (fs.existsSync(servicesDir)) {
      const services = fs.readdirSync(servicesDir).filter(item => {
        const servicePath = path.join(servicesDir, item);
        return fs.statSync(servicePath).isDirectory() && 
               fs.existsSync(path.join(servicePath, 'package.json'));
      });
      
      console.log(`  📦 Installing dependencies for ${services.length} services...`);
      for (const service of services) {
        const servicePath = path.join(servicesDir, service);
        console.log(`    - ${service}`);
        await this.runCommand('npm install', servicePath);
      }
    }
    
    console.log('  ✅ All dependencies installed');
  }

  /**
   * Setup monitoring directories
   */
  async setupMonitoring() {
    console.log('\n5. 📊 Setting up monitoring...');

    try {
      const MonitoringDirCreator = require('./create-monitoring-dirs.js');
      const creator = new MonitoringDirCreator();
      creator.create();
      console.log('  ✅ Monitoring directories created');
    } catch (error) {
      console.log('  ⚠️  Could not create monitoring directories:', error.message);
    }
  }

  /**
   * Build Docker images
   */
  async buildDockerImages() {
    console.log('\n6. 🐳 Building Docker images...');
    console.log('  ⏱️  This may take 5-10 minutes for first build...');
    
    try {
      // Stop any existing containers first
      console.log('  🛑 Stopping existing containers...');
      await execAsync('docker-compose -f docker-compose.dev.yml down --remove-orphans', { 
        cwd: this.rootDir,
        timeout: 60000 
      });
      
      // Build all images
      console.log('  🔨 Building all Docker images...');
      const buildCommand = 'docker-compose -f docker-compose.dev.yml build --no-cache';
      
      // Show real-time output
      await this.runCommandWithOutput(buildCommand, this.rootDir);
      
      console.log('  ✅ All Docker images built successfully');
      
    } catch (error) {
      throw new Error(`Failed to build Docker images: ${error.message}`);
    }
  }

  /**
   * Validate setup
   */
  async validateSetup() {
    console.log('\n7. ✅ Validating setup...');
    
    // Check if Docker images exist
    try {
      const { stdout } = await execAsync('docker images --format "table {{.Repository}}:{{.Tag}}"');
      const images = stdout.split('\n').filter(line => line.includes('backup_') || line.includes('factcheck'));
      
      if (images.length > 0) {
        console.log(`  ✅ Found ${images.length} Docker images`);
      } else {
        console.log('  ⚠️  No project Docker images found');
      }
    } catch (error) {
      console.log('  ⚠️  Could not check Docker images');
    }
    
    // Test Docker Compose configuration
    try {
      await execAsync('docker-compose -f docker-compose.dev.yml config', { 
        cwd: this.rootDir,
        timeout: 30000 
      });
      console.log('  ✅ Docker Compose configuration is valid');
    } catch (error) {
      console.log('  ⚠️  Docker Compose configuration has warnings (this may be normal)');
    }
    
    console.log('  ✅ Setup validation completed');
  }

  /**
   * Show completion message
   */
  showCompletionMessage() {
    console.log('\n🎉 Setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('  1. npm start           # Start all services with Docker');
    console.log('  2. Open http://localhost:3000 in your browser');
    console.log('  3. npm stop            # Stop all services when done');
    console.log('\n🔧 Useful commands:');
    console.log('  • npm run status       # Check service status');
    console.log('  • npm run logs         # View all service logs');
    console.log('  • npm run health       # Check service health');
    console.log('\n💡 Tips:');
    console.log('  • All services run in Docker containers');
    console.log('  • Data is persisted in Docker volumes');
    console.log('  • Edit .env file to update configuration');
    console.log('\n✨ Happy coding! 🚀');
  }

  /**
   * Run command with promise
   */
  async runCommand(command, cwd = this.rootDir) {
    return new Promise((resolve, reject) => {
      exec(command, { cwd, timeout: 300000 }, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve({ stdout, stderr });
        }
      });
    });
  }

  /**
   * Run command with real-time output
   */
  async runCommandWithOutput(command, cwd = this.rootDir) {
    return new Promise((resolve, reject) => {
      const child = exec(command, { cwd, timeout: 600000 });
      
      child.stdout.on('data', (data) => {
        process.stdout.write(data);
      });
      
      child.stderr.on('data', (data) => {
        process.stderr.write(data);
      });
      
      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Command failed with code ${code}`));
        }
      });
      
      child.on('error', reject);
    });
  }
}

// Run setup if called directly
if (require.main === module) {
  const setup = new FullDockerSetup();
  setup.setup().catch(console.error);
}

module.exports = FullDockerSetup;
