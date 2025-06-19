#!/usr/bin/env node

/**
 * Unified Deployment Script
 * Integrates all new tech stack components and replaces multiple deployment scripts
 */

const { spawn, exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

class UnifiedDeployment {
  constructor() {
    this.platform = os.platform();
    this.isWindows = this.platform === 'win32';
    this.projectRoot = path.join(__dirname, '..');
    this.services = [
      'api-gateway',
      'auth-service',
      'link-service',
      'community-service',
      'chat-service',
      'news-service',
      'admin-service'
    ];
    
    this.deploymentModes = {
      local: 'Local development without Docker',
      docker: 'Docker Compose deployment',
      k8s: 'Kubernetes deployment',
      'k8s-istio': 'Kubernetes with Istio service mesh',
      'k8s-consul': 'Kubernetes with Consul Connect',
      test: 'Test environment with all integrations'
    };

    this.techStack = {
      circuitBreaker: true,
      eventBus: true,
      saga: true,
      serviceAuth: true,
      authRedundancy: true,
      contractTesting: true,
      integrationTesting: true,
      serviceMesh: false // Will be enabled based on deployment mode
    };
  }

  /**
   * Main deployment orchestrator
   */
  async deploy(mode = 'local', options = {}) {
    try {
      console.log(`🚀 Starting unified deployment in ${mode} mode...`);
      console.log(`Platform: ${this.platform}`);
      console.log('='.repeat(60));

      // Validate environment
      await this.validateEnvironment();

      // Setup tech stack components
      await this.setupTechStack(mode);

      // Deploy based on mode
      switch (mode) {
        case 'local':
          await this.deployLocal(options);
          break;
        case 'docker':
          await this.deployDocker(options);
          break;
        case 'k8s':
          await this.deployKubernetes(options);
          break;
        case 'k8s-istio':
          await this.deployKubernetesWithIstio(options);
          break;
        case 'k8s-consul':
          await this.deployKubernetesWithConsul(options);
          break;
        case 'test':
          await this.deployTestEnvironment(options);
          break;
        default:
          throw new Error(`Unknown deployment mode: ${mode}`);
      }

      // Post-deployment verification
      await this.verifyDeployment(mode);

      console.log('✅ Deployment completed successfully!');
      this.showAccessInfo(mode);

    } catch (error) {
      console.error('❌ Deployment failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Validate environment and prerequisites
   */
  async validateEnvironment() {
    console.log('🔍 Validating environment...');

    // Check Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    if (majorVersion < 16) {
      throw new Error(`Node.js 16+ required, found ${nodeVersion}`);
    }

    // Check if we're in the right directory
    try {
      await fs.access(path.join(this.projectRoot, 'package.json'));
      await fs.access(path.join(this.projectRoot, 'services'));
    } catch {
      throw new Error('Please run this script from the project root directory');
    }

    // Check for required environment files
    const envFiles = ['.env', 'services/auth-service/.env'];
    for (const envFile of envFiles) {
      try {
        await fs.access(path.join(this.projectRoot, envFile));
      } catch {
        console.warn(`⚠️  Environment file missing: ${envFile}`);
      }
    }

    console.log('✅ Environment validation passed');
  }

  /**
   * Setup tech stack components
   */
  async setupTechStack(mode) {
    console.log('🔧 Setting up tech stack components...');

    // Install dependencies for new components
    await this.installTechStackDependencies();

    // Setup Redis for event bus and caching
    if (mode !== 'local') {
      await this.setupRedis(mode);
    }

    // Setup monitoring and observability
    await this.setupMonitoring(mode);

    // Setup service mesh if required
    if (mode.includes('istio') || mode.includes('consul')) {
      this.techStack.serviceMesh = true;
      await this.setupServiceMesh(mode);
    }

    console.log('✅ Tech stack setup completed');
  }

  /**
   * Install dependencies for new tech stack components
   */
  async installTechStackDependencies() {
    console.log('📦 Installing tech stack dependencies...');

    const newDependencies = {
      'api-gateway': ['opossum', 'redis', 'jsonwebtoken'],
      'auth-service': ['redis', 'jsonwebtoken'],
      'shared': ['@pact-foundation/pact', '@pact-foundation/pact-node']
    };

    // Install shared dependencies
    for (const [service, deps] of Object.entries(newDependencies)) {
      if (service === 'shared') continue;
      
      const servicePath = path.join(this.projectRoot, 'services', service);
      try {
        await fs.access(servicePath);
        console.log(`Installing dependencies for ${service}...`);
        await this.runCommand('npm', ['install', ...deps], { cwd: servicePath });
      } catch (error) {
        console.warn(`⚠️  Could not install dependencies for ${service}: ${error.message}`);
      }
    }
  }

  /**
   * Setup Redis for event bus and caching
   */
  async setupRedis(mode) {
    console.log('🔴 Setting up Redis...');

    if (mode === 'docker' || mode.startsWith('k8s')) {
      // Redis will be handled by Docker Compose or Kubernetes
      console.log('Redis will be deployed with containers');
    } else {
      // Check if Redis is available locally
      try {
        await this.runCommand('redis-cli', ['ping']);
        console.log('✅ Redis is available locally');
      } catch {
        console.warn('⚠️  Redis not available locally. Please install Redis or use Docker mode.');
      }
    }
  }

  /**
   * Setup monitoring and observability
   */
  async setupMonitoring(mode) {
    console.log('📊 Setting up monitoring...');

    // Create monitoring configuration
    const monitoringConfig = {
      prometheus: {
        enabled: true,
        port: 9090
      },
      grafana: {
        enabled: mode !== 'local',
        port: 3001
      },
      jaeger: {
        enabled: mode.includes('k8s'),
        port: 16686
      }
    };

    // Save monitoring config
    await fs.writeFile(
      path.join(this.projectRoot, 'monitoring-config.json'),
      JSON.stringify(monitoringConfig, null, 2)
    );

    console.log('✅ Monitoring configuration created');
  }

  /**
   * Setup service mesh
   */
  async setupServiceMesh(mode) {
    console.log('🕸️  Setting up service mesh...');

    if (mode.includes('istio')) {
      console.log('Configuring Istio service mesh...');
      // Istio configuration will be applied during K8s deployment
    } else if (mode.includes('consul')) {
      console.log('Configuring Consul Connect...');
      // Consul configuration will be applied during K8s deployment
    }

    console.log('✅ Service mesh configuration prepared');
  }

  /**
   * Deploy in local mode
   */
  async deployLocal(options) {
    console.log('🏠 Deploying in local mode...');

    // Kill any existing processes
    await this.killExistingProcesses();

    // Install dependencies
    await this.installDependencies();

    // Start services with new tech stack
    await this.startLocalServices(options);
  }

  /**
   * Deploy with Docker
   */
  async deployDocker(options) {
    console.log('🐳 Deploying with Docker...');

    // Create enhanced docker-compose file
    await this.createEnhancedDockerCompose();

    // Build and start containers
    await this.runCommand('docker-compose', ['down', '--remove-orphans']);
    await this.runCommand('docker-compose', ['build', '--parallel']);
    await this.runCommand('docker-compose', ['up', '-d']);

    // Wait for services to be ready
    await this.waitForServices('docker');
  }

  /**
   * Deploy to Kubernetes
   */
  async deployKubernetes(options) {
    console.log('☸️  Deploying to Kubernetes...');

    // Apply Kubernetes manifests
    await this.applyKubernetesManifests();

    // Wait for services to be ready
    await this.waitForServices('k8s');
  }

  /**
   * Deploy to Kubernetes with Istio
   */
  async deployKubernetesWithIstio(options) {
    console.log('☸️🕸️  Deploying to Kubernetes with Istio...');

    // Check if Istio is installed
    try {
      await this.runCommand('istioctl', ['version']);
    } catch {
      throw new Error('Istio CLI not found. Please install Istio first.');
    }

    // Apply Istio configuration
    await this.runCommand('kubectl', ['apply', '-f', 'k8s/service-mesh/istio-config.yaml']);

    // Deploy services
    await this.deployKubernetes(options);
  }

  /**
   * Deploy to Kubernetes with Consul Connect
   */
  async deployKubernetesWithConsul(options) {
    console.log('☸️🔗 Deploying to Kubernetes with Consul Connect...');

    // Apply Consul Connect configuration
    await this.runCommand('kubectl', ['apply', '-f', 'k8s/service-mesh/consul-connect-config.yaml']);

    // Deploy services
    await this.deployKubernetes(options);
  }

  /**
   * Deploy test environment
   */
  async deployTestEnvironment(options) {
    console.log('🧪 Deploying test environment...');

    // Run integration tests
    await this.runCommand('node', ['scripts/run-integration-tests.js', 'all']);
  }

  /**
   * Kill existing processes
   */
  async killExistingProcesses() {
    console.log('🛑 Stopping existing processes...');

    if (this.isWindows) {
      try {
        await this.runCommand('taskkill', ['/F', '/IM', 'node.exe']);
      } catch {
        // No processes to kill
      }
    } else {
      try {
        await this.runCommand('pkill', ['-f', 'node']);
      } catch {
        // No processes to kill
      }
    }
  }

  /**
   * Install dependencies for all services
   */
  async installDependencies() {
    console.log('📦 Installing dependencies...');

    // Install root dependencies
    await this.runCommand('npm', ['install']);

    // Install service dependencies
    for (const service of this.services) {
      const servicePath = path.join(this.projectRoot, 'services', service);
      try {
        await fs.access(servicePath);
        console.log(`Installing dependencies for ${service}...`);
        await this.runCommand('npm', ['install'], { cwd: servicePath });
      } catch {
        console.warn(`⚠️  Service ${service} not found, skipping...`);
      }
    }

    // Install client dependencies
    const clientPath = path.join(this.projectRoot, 'client');
    try {
      await fs.access(clientPath);
      console.log('Installing client dependencies...');
      await this.runCommand('npm', ['install'], { cwd: clientPath });
    } catch {
      console.warn('⚠️  Client not found, skipping...');
    }
  }

  /**
   * Start local services with enhanced features
   */
  async startLocalServices(options) {
    console.log('🚀 Starting enhanced local services...');

    const services = [
      { name: 'api-gateway', port: 8080, path: 'services/api-gateway' },
      { name: 'auth-service', port: 3001, path: 'services/auth-service' },
      { name: 'link-service', port: 3002, path: 'services/link-service' },
      { name: 'community-service', port: 3003, path: 'services/community-service' },
      { name: 'chat-service', port: 3004, path: 'services/chat-service' },
      { name: 'news-service', port: 3005, path: 'services/news-service' },
      { name: 'admin-service', port: 3006, path: 'services/admin-service' }
    ];

    // Start services with enhanced environment
    for (const service of services) {
      const servicePath = path.join(this.projectRoot, service.path);
      try {
        await fs.access(servicePath);
        console.log(`Starting ${service.name} on port ${service.port}...`);
        
        const env = {
          ...process.env,
          PORT: service.port,
          NODE_ENV: 'development',
          REDIS_HOST: 'localhost',
          REDIS_PORT: 6379,
          CIRCUIT_BREAKER_ENABLED: 'true',
          EVENT_BUS_ENABLED: 'true',
          SERVICE_AUTH_ENABLED: 'true'
        };

        this.runCommand('npm', ['start'], { 
          cwd: servicePath, 
          env,
          detached: true 
        });
      } catch {
        console.warn(`⚠️  Could not start ${service.name}`);
      }
    }

    // Start client if available
    const clientPath = path.join(this.projectRoot, 'client');
    try {
      await fs.access(clientPath);
      console.log('Starting React client...');
      this.runCommand('npm', ['start'], { 
        cwd: clientPath, 
        detached: true 
      });
    } catch {
      console.warn('⚠️  Client not found, skipping...');
    }
  }

  /**
   * Utility function to run commands
   */
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

  /**
   * Show access information after deployment
   */
  showAccessInfo(mode) {
    console.log('\n🌐 Access Information:');
    console.log('='.repeat(40));
    
    if (mode === 'local') {
      console.log('Frontend: http://localhost:3000');
      console.log('API Gateway: http://localhost:8080');
      console.log('Auth Service: http://localhost:3001');
    } else if (mode === 'docker') {
      console.log('Frontend: http://localhost:3000');
      console.log('API Gateway: http://localhost:8080');
      console.log('Grafana: http://localhost:3001');
    } else if (mode.startsWith('k8s')) {
      console.log('Use kubectl port-forward to access services');
      console.log('kubectl port-forward svc/api-gateway 8080:8080');
    }

    console.log('\n📊 Monitoring:');
    console.log('Circuit Breaker Status: http://localhost:8080/circuit-breaker/status');
    console.log('Security Status: http://localhost:8080/security/status');
    console.log('Auth Redundancy: http://localhost:8080/auth/redundancy/status');
  }
}

// CLI handling
async function main() {
  const args = process.argv.slice(2);
  const mode = args[0] || 'local';
  const options = {};

  // Parse additional options
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      options[key] = value || true;
    }
  }

  const deployment = new UnifiedDeployment();

  if (mode === 'help' || mode === '--help') {
    console.log('Unified Deployment Script');
    console.log('Usage: node scripts/unified-deployment.js <mode> [options]');
    console.log('\nModes:');
    Object.entries(deployment.deploymentModes).forEach(([key, desc]) => {
      console.log(`  ${key.padEnd(12)} - ${desc}`);
    });
    console.log('\nOptions:');
    console.log('  --silent     - Suppress output');
    console.log('  --no-deps    - Skip dependency installation');
    console.log('  --no-tests   - Skip tests');
    return;
  }

  await deployment.deploy(mode, options);
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = UnifiedDeployment;
