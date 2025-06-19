#!/usr/bin/env node

/**
 * Tech Stack Setup Script
 * Automatically configures and installs all new tech stack components
 */

const { spawn, exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

class TechStackSetup {
  constructor() {
    this.platform = os.platform();
    this.isWindows = this.platform === 'win32';
    this.projectRoot = path.join(__dirname, '..');
    
    this.techComponents = {
      circuitBreaker: {
        name: 'Circuit Breaker Pattern',
        dependencies: ['opossum'],
        services: ['api-gateway'],
        status: false
      },
      eventBus: {
        name: 'Event-Driven Architecture',
        dependencies: ['redis'],
        services: ['all'],
        status: false
      },
      saga: {
        name: 'Saga Pattern',
        dependencies: ['uuid'],
        services: ['all'],
        status: false
      },
      serviceAuth: {
        name: 'Service Authentication',
        dependencies: ['jsonwebtoken', 'crypto'],
        services: ['all'],
        status: false
      },
      authRedundancy: {
        name: 'Auth Service Redundancy',
        dependencies: ['redis'],
        services: ['api-gateway', 'auth-service'],
        status: false
      },
      contractTesting: {
        name: 'Contract Testing',
        dependencies: ['@pact-foundation/pact', '@pact-foundation/pact-node'],
        services: ['all'],
        dev: true,
        status: false
      },
      integrationTesting: {
        name: 'Integration Testing',
        dependencies: ['jest', 'supertest'],
        services: ['all'],
        dev: true,
        status: false
      },
      monitoring: {
        name: 'Enhanced Monitoring',
        dependencies: ['prom-client'],
        services: ['all'],
        status: false
      }
    };
  }

  /**
   * Main setup orchestrator
   */
  async setup(options = {}) {
    try {
      console.log('🚀 Setting up enhanced tech stack...');
      console.log('='.repeat(50));

      // Check prerequisites
      await this.checkPrerequisites();

      // Install dependencies
      await this.installDependencies(options);

      // Setup components
      await this.setupComponents(options);

      // Create configuration files
      await this.createConfigFiles();

      // Update service configurations
      await this.updateServiceConfigurations();

      // Verify setup
      await this.verifySetup();

      console.log('\n✅ Tech stack setup completed successfully!');
      this.showSetupSummary();

    } catch (error) {
      console.error('❌ Tech stack setup failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Check prerequisites
   */
  async checkPrerequisites() {
    console.log('🔍 Checking prerequisites...');

    // Check Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    if (majorVersion < 18) {
      throw new Error(`Node.js 18+ required, found ${nodeVersion}`);
    }

    // Check if we're in the right directory
    try {
      await fs.access(path.join(this.projectRoot, 'package.json'));
      await fs.access(path.join(this.projectRoot, 'services'));
    } catch {
      throw new Error('Please run this script from the project root directory');
    }

    // Check for Docker (optional)
    try {
      await this.runCommand('docker', ['--version'], { silent: true });
      console.log('✅ Docker available');
    } catch {
      console.log('⚠️  Docker not available (optional for local development)');
    }

    // Check for kubectl (optional)
    try {
      await this.runCommand('kubectl', ['version', '--client'], { silent: true });
      console.log('✅ kubectl available');
    } catch {
      console.log('⚠️  kubectl not available (optional for Kubernetes deployment)');
    }

    console.log('✅ Prerequisites check completed');
  }

  /**
   * Install dependencies for all components
   */
  async installDependencies(options) {
    console.log('📦 Installing tech stack dependencies...');

    // Get all services
    const services = await this.getServices();

    // Install root dependencies
    const rootDeps = this.getAllDependencies(false);
    const rootDevDeps = this.getAllDependencies(true);

    if (rootDeps.length > 0) {
      console.log('Installing root dependencies...');
      await this.runCommand('npm', ['install', ...rootDeps], { cwd: this.projectRoot });
    }

    if (rootDevDeps.length > 0) {
      console.log('Installing root dev dependencies...');
      await this.runCommand('npm', ['install', '--save-dev', ...rootDevDeps], { cwd: this.projectRoot });
    }

    // Install service-specific dependencies
    for (const service of services) {
      const servicePath = path.join(this.projectRoot, 'services', service);
      try {
        await fs.access(servicePath);
        console.log(`Installing dependencies for ${service}...`);
        
        const serviceDeps = this.getServiceDependencies(service, false);
        const serviceDevDeps = this.getServiceDependencies(service, true);

        if (serviceDeps.length > 0) {
          await this.runCommand('npm', ['install', ...serviceDeps], { cwd: servicePath });
        }

        if (serviceDevDeps.length > 0) {
          await this.runCommand('npm', ['install', '--save-dev', ...serviceDevDeps], { cwd: servicePath });
        }

      } catch (error) {
        console.warn(`⚠️  Could not install dependencies for ${service}: ${error.message}`);
      }
    }

    console.log('✅ Dependencies installation completed');
  }

  /**
   * Setup individual components
   */
  async setupComponents(options) {
    console.log('🔧 Setting up tech stack components...');

    for (const [key, component] of Object.entries(this.techComponents)) {
      try {
        console.log(`Setting up ${component.name}...`);
        await this.setupComponent(key, component, options);
        component.status = true;
        console.log(`✅ ${component.name} setup completed`);
      } catch (error) {
        console.error(`❌ Failed to setup ${component.name}: ${error.message}`);
        component.status = false;
      }
    }
  }

  /**
   * Setup individual component
   */
  async setupComponent(key, component, options) {
    switch (key) {
      case 'circuitBreaker':
        await this.setupCircuitBreaker();
        break;
      case 'eventBus':
        await this.setupEventBus();
        break;
      case 'saga':
        await this.setupSaga();
        break;
      case 'serviceAuth':
        await this.setupServiceAuth();
        break;
      case 'authRedundancy':
        await this.setupAuthRedundancy();
        break;
      case 'contractTesting':
        await this.setupContractTesting();
        break;
      case 'integrationTesting':
        await this.setupIntegrationTesting();
        break;
      case 'monitoring':
        await this.setupMonitoring();
        break;
    }
  }

  /**
   * Setup circuit breaker
   */
  async setupCircuitBreaker() {
    // Circuit breaker files are already created
    // Just verify they exist
    const circuitBreakerPath = path.join(this.projectRoot, 'services/api-gateway/src/services/circuitBreaker.js');
    await fs.access(circuitBreakerPath);
  }

  /**
   * Setup event bus
   */
  async setupEventBus() {
    // Event bus files are already created
    // Create Redis configuration
    const redisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || '',
      db: 0
    };

    await fs.writeFile(
      path.join(this.projectRoot, 'redis-config.json'),
      JSON.stringify(redisConfig, null, 2)
    );
  }

  /**
   * Setup saga pattern
   */
  async setupSaga() {
    // Saga files are already created
    // Just verify they exist
    const sagaPath = path.join(this.projectRoot, 'services/shared/saga/sagaOrchestrator.js');
    await fs.access(sagaPath);
  }

  /**
   * Setup service authentication
   */
  async setupServiceAuth() {
    // Service auth files are already created
    // Generate initial service keys
    const serviceKeys = {};
    const services = await this.getServices();
    
    for (const service of services) {
      serviceKeys[service] = this.generateServiceKey();
    }

    await fs.writeFile(
      path.join(this.projectRoot, 'service-keys.json'),
      JSON.stringify(serviceKeys, null, 2)
    );
  }

  /**
   * Setup auth redundancy
   */
  async setupAuthRedundancy() {
    // Auth redundancy files are already created
    // Create auth instances configuration
    const authConfig = {
      instances: [
        { url: 'http://localhost:3001', priority: 1, healthy: true },
        { url: 'http://localhost:3011', priority: 2, healthy: true }
      ],
      healthCheckInterval: 30000,
      failoverTimeout: 5000
    };

    await fs.writeFile(
      path.join(this.projectRoot, 'auth-redundancy-config.json'),
      JSON.stringify(authConfig, null, 2)
    );
  }

  /**
   * Setup contract testing
   */
  async setupContractTesting() {
    // Create pacts directory
    const pactsDir = path.join(this.projectRoot, 'pacts');
    await fs.mkdir(pactsDir, { recursive: true });

    // Create contract test configuration
    const contractConfig = {
      pactDir: './pacts',
      logDir: './logs/pact',
      brokerUrl: process.env.PACT_BROKER_URL || '',
      brokerToken: process.env.PACT_BROKER_TOKEN || ''
    };

    await fs.writeFile(
      path.join(this.projectRoot, 'contract-test-config.json'),
      JSON.stringify(contractConfig, null, 2)
    );
  }

  /**
   * Setup integration testing
   */
  async setupIntegrationTesting() {
    // Create test reports directory
    const reportsDir = path.join(this.projectRoot, 'test-reports');
    await fs.mkdir(reportsDir, { recursive: true });

    // Create integration test configuration
    const integrationConfig = {
      testTimeout: 300000,
      healthCheckTimeout: 120000,
      dockerComposeFile: 'docker-compose.test.yml',
      services: await this.getServices()
    };

    await fs.writeFile(
      path.join(this.projectRoot, 'integration-test-config.json'),
      JSON.stringify(integrationConfig, null, 2)
    );
  }

  /**
   * Setup monitoring
   */
  async setupMonitoring() {
    // Create monitoring configuration
    const monitoringConfig = {
      prometheus: {
        enabled: true,
        port: 9090,
        scrapeInterval: '15s'
      },
      grafana: {
        enabled: true,
        port: 3001,
        adminUser: 'admin',
        adminPassword: 'admin'
      },
      jaeger: {
        enabled: false,
        port: 16686
      },
      metrics: {
        enabled: true,
        endpoint: '/metrics'
      }
    };

    await fs.writeFile(
      path.join(this.projectRoot, 'monitoring-config.json'),
      JSON.stringify(monitoringConfig, null, 2)
    );
  }

  /**
   * Create configuration files
   */
  async createConfigFiles() {
    console.log('📝 Creating configuration files...');

    // Create main tech stack configuration
    const techStackConfig = {
      version: '2.0.0',
      components: this.techComponents,
      deployment: {
        defaultMode: 'local',
        supportedModes: ['local', 'docker', 'k8s', 'k8s-istio', 'k8s-consul']
      },
      features: {
        circuitBreaker: true,
        eventBus: true,
        saga: true,
        serviceAuth: true,
        authRedundancy: true,
        contractTesting: true,
        integrationTesting: true,
        serviceMesh: false
      }
    };

    await fs.writeFile(
      path.join(this.projectRoot, 'tech-stack-config.json'),
      JSON.stringify(techStackConfig, null, 2)
    );

    console.log('✅ Configuration files created');
  }

  /**
   * Update service configurations
   */
  async updateServiceConfigurations() {
    console.log('⚙️  Updating service configurations...');

    const services = await this.getServices();
    
    for (const service of services) {
      try {
        await this.updateServiceConfig(service);
      } catch (error) {
        console.warn(`⚠️  Could not update config for ${service}: ${error.message}`);
      }
    }

    console.log('✅ Service configurations updated');
  }

  /**
   * Update individual service configuration
   */
  async updateServiceConfig(serviceName) {
    const servicePath = path.join(this.projectRoot, 'services', serviceName);
    const packageJsonPath = path.join(servicePath, 'package.json');
    
    try {
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      
      // Add tech stack scripts
      packageJson.scripts = {
        ...packageJson.scripts,
        'test:contracts': 'jest tests/contracts/',
        'test:integration': 'jest tests/integration/',
        'security:check': 'npm audit',
        'circuit-breaker:status': 'curl -s http://localhost:8080/circuit-breaker/status'
      };

      // Add tech stack dependencies if not present
      const serviceDeps = this.getServiceDependencies(serviceName, false);
      const serviceDevDeps = this.getServiceDependencies(serviceName, true);

      packageJson.dependencies = packageJson.dependencies || {};
      packageJson.devDependencies = packageJson.devDependencies || {};

      serviceDeps.forEach(dep => {
        if (!packageJson.dependencies[dep]) {
          packageJson.dependencies[dep] = 'latest';
        }
      });

      serviceDevDeps.forEach(dep => {
        if (!packageJson.devDependencies[dep]) {
          packageJson.devDependencies[dep] = 'latest';
        }
      });

      await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
    } catch (error) {
      // Service might not have package.json yet
      console.warn(`Could not update package.json for ${serviceName}`);
    }
  }

  /**
   * Verify setup
   */
  async verifySetup() {
    console.log('🔍 Verifying tech stack setup...');

    const verificationResults = {};

    for (const [key, component] of Object.entries(this.techComponents)) {
      try {
        verificationResults[key] = await this.verifyComponent(key, component);
      } catch (error) {
        verificationResults[key] = false;
        console.warn(`⚠️  Verification failed for ${component.name}: ${error.message}`);
      }
    }

    const successCount = Object.values(verificationResults).filter(Boolean).length;
    const totalCount = Object.keys(verificationResults).length;

    console.log(`✅ Verification completed: ${successCount}/${totalCount} components verified`);
  }

  /**
   * Verify individual component
   */
  async verifyComponent(key, component) {
    switch (key) {
      case 'circuitBreaker':
        return await fs.access(path.join(this.projectRoot, 'services/api-gateway/src/services/circuitBreaker.js')).then(() => true).catch(() => false);
      case 'eventBus':
        return await fs.access(path.join(this.projectRoot, 'services/shared/eventBus/eventBus.js')).then(() => true).catch(() => false);
      case 'saga':
        return await fs.access(path.join(this.projectRoot, 'services/shared/saga/sagaOrchestrator.js')).then(() => true).catch(() => false);
      case 'serviceAuth':
        return await fs.access(path.join(this.projectRoot, 'services/shared/security/serviceAuthManager.js')).then(() => true).catch(() => false);
      case 'authRedundancy':
        return await fs.access(path.join(this.projectRoot, 'services/shared/auth/authRedundancyManager.js')).then(() => true).catch(() => false);
      case 'contractTesting':
        return await fs.access(path.join(this.projectRoot, 'services/shared/testing/contractTestManager.js')).then(() => true).catch(() => false);
      case 'integrationTesting':
        return await fs.access(path.join(this.projectRoot, 'scripts/run-integration-tests.js')).then(() => true).catch(() => false);
      case 'monitoring':
        return await fs.access(path.join(this.projectRoot, 'monitoring-config.json')).then(() => true).catch(() => false);
      default:
        return false;
    }
  }

  /**
   * Utility functions
   */
  async getServices() {
    try {
      const servicesDir = path.join(this.projectRoot, 'services');
      const entries = await fs.readdir(servicesDir, { withFileTypes: true });
      return entries
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name)
        .filter(name => !name.startsWith('.') && name !== 'shared');
    } catch {
      return ['api-gateway', 'auth-service', 'link-service', 'community-service', 'chat-service', 'news-service', 'admin-service'];
    }
  }

  getAllDependencies(dev = false) {
    const deps = new Set();
    
    Object.values(this.techComponents).forEach(component => {
      if (component.dev === dev || (!component.dev && !dev)) {
        component.dependencies.forEach(dep => deps.add(dep));
      }
    });

    return Array.from(deps);
  }

  getServiceDependencies(serviceName, dev = false) {
    const deps = new Set();
    
    Object.values(this.techComponents).forEach(component => {
      if (component.dev === dev || (!component.dev && !dev)) {
        if (component.services.includes('all') || component.services.includes(serviceName)) {
          component.dependencies.forEach(dep => deps.add(dep));
        }
      }
    });

    return Array.from(deps);
  }

  generateServiceKey() {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
  }

  async runCommand(command, args = [], options = {}) {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        stdio: options.silent ? 'pipe' : 'inherit',
        shell: this.isWindows,
        ...options
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

  showSetupSummary() {
    console.log('\n📊 Tech Stack Setup Summary:');
    console.log('='.repeat(40));
    
    Object.entries(this.techComponents).forEach(([key, component]) => {
      const status = component.status ? '✅' : '❌';
      console.log(`${status} ${component.name}`);
    });

    console.log('\n🚀 Next Steps:');
    console.log('1. Run: npm run start (for local development)');
    console.log('2. Run: npm run deploy:docker (for Docker deployment)');
    console.log('3. Run: npm run test (for testing)');
    console.log('4. Check: npm run security:status');
    
    console.log('\n📖 Documentation:');
    console.log('- Circuit Breaker: http://localhost:8080/circuit-breaker/status');
    console.log('- Security Status: http://localhost:8080/security/status');
    console.log('- Auth Redundancy: http://localhost:8080/auth/redundancy/status');
  }
}

// CLI handling
async function main() {
  const args = process.argv.slice(2);
  const options = {};

  // Parse options
  for (const arg of args) {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      options[key] = value || true;
    }
  }

  const setup = new TechStackSetup();

  if (args.includes('--help') || args.includes('help')) {
    console.log('Tech Stack Setup Script');
    console.log('Usage: node scripts/setup-tech-stack.js [options]');
    console.log('\nOptions:');
    console.log('  --help           Show this help message');
    console.log('  --skip-deps      Skip dependency installation');
    console.log('  --verify-only    Only verify existing setup');
    return;
  }

  if (options['verify-only']) {
    await setup.verifySetup();
  } else {
    await setup.setup(options);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = TechStackSetup;
