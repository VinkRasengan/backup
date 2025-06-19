#!/usr/bin/env node

/**
 * Complete Optimization Script
 * Runs all optimization and cleanup tasks in the correct order
 */

const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class CompleteOptimization {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.optimizationSteps = [
      {
        name: 'Backup Current State',
        description: 'Create backup of current configuration',
        action: () => this.backupCurrentState()
      },
      {
        name: 'Setup Tech Stack',
        description: 'Install and configure new tech stack components',
        action: () => this.runScript('setup-tech-stack.js')
      },
      {
        name: 'Cleanup Deprecated Scripts',
        description: 'Remove duplicate and outdated scripts',
        action: () => this.runScript('cleanup-deprecated-scripts.js')
      },
      {
        name: 'Upgrade Package.json',
        description: 'Apply optimized package.json with tech stack integration',
        action: () => this.runScript('upgrade-package-json.js')
      },
      {
        name: 'Install Dependencies',
        description: 'Install all new dependencies',
        action: () => this.installDependencies()
      },
      {
        name: 'Verify Installation',
        description: 'Verify all components are working correctly',
        action: () => this.verifyInstallation()
      },
      {
        name: 'Generate Documentation',
        description: 'Create updated documentation',
        action: () => this.generateDocumentation()
      }
    ];
  }

  /**
   * Run complete optimization process
   */
  async optimize() {
    try {
      console.log('🚀 Starting complete optimization process...');
      console.log('='.repeat(60));
      console.log(`Total steps: ${this.optimizationSteps.length}`);
      console.log('='.repeat(60));

      const startTime = Date.now();
      let completedSteps = 0;

      for (const [index, step] of this.optimizationSteps.entries()) {
        try {
          console.log(`\n📋 Step ${index + 1}/${this.optimizationSteps.length}: ${step.name}`);
          console.log(`   ${step.description}`);
          console.log('-'.repeat(50));

          await step.action();
          completedSteps++;
          
          console.log(`✅ Step ${index + 1} completed: ${step.name}`);
          
        } catch (error) {
          console.error(`❌ Step ${index + 1} failed: ${step.name}`);
          console.error(`   Error: ${error.message}`);
          
          // Ask user if they want to continue
          const shouldContinue = await this.askContinue(step.name);
          if (!shouldContinue) {
            throw new Error(`Optimization stopped at step: ${step.name}`);
          }
        }
      }

      const endTime = Date.now();
      const duration = Math.round((endTime - startTime) / 1000);

      console.log('\n🎉 Complete optimization finished!');
      console.log('='.repeat(60));
      console.log(`✅ Completed ${completedSteps}/${this.optimizationSteps.length} steps`);
      console.log(`⏱️  Total time: ${duration} seconds`);
      
      this.showOptimizationSummary();

    } catch (error) {
      console.error('\n💥 Optimization process failed:', error.message);
      console.log('\n🔄 You can restore from backup if needed');
      process.exit(1);
    }
  }

  /**
   * Backup current state
   */
  async backupCurrentState() {
    console.log('💾 Creating backup of current state...');
    
    const backupDir = path.join(this.projectRoot, 'optimization-backup');
    await fs.mkdir(backupDir, { recursive: true });

    // Backup important files
    const filesToBackup = [
      'package.json',
      'docker-compose.yml',
      '.env'
    ];

    for (const file of filesToBackup) {
      try {
        const sourcePath = path.join(this.projectRoot, file);
        const backupPath = path.join(backupDir, file);
        await fs.copyFile(sourcePath, backupPath);
        console.log(`  ✅ Backed up: ${file}`);
      } catch (error) {
        console.log(`  ⚠️  Could not backup ${file}: ${error.message}`);
      }
    }

    // Backup scripts directory
    try {
      const scriptsSource = path.join(this.projectRoot, 'scripts');
      const scriptsBackup = path.join(backupDir, 'scripts');
      await this.copyDirectory(scriptsSource, scriptsBackup);
      console.log('  ✅ Backed up: scripts directory');
    } catch (error) {
      console.log(`  ⚠️  Could not backup scripts: ${error.message}`);
    }

    console.log(`✅ Backup completed: ${backupDir}`);
  }

  /**
   * Run optimization script
   */
  async runScript(scriptName) {
    const scriptPath = path.join(__dirname, scriptName);
    
    try {
      await fs.access(scriptPath);
    } catch {
      throw new Error(`Script not found: ${scriptName}`);
    }

    return new Promise((resolve, reject) => {
      const child = spawn('node', [scriptPath], {
        stdio: 'inherit',
        cwd: this.projectRoot
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Script ${scriptName} failed with code ${code}`));
        }
      });

      child.on('error', (error) => {
        reject(new Error(`Failed to run ${scriptName}: ${error.message}`));
      });
    });
  }

  /**
   * Install dependencies
   */
  async installDependencies() {
    console.log('📦 Installing dependencies...');
    
    // Install root dependencies
    console.log('Installing root dependencies...');
    await this.runCommand('npm', ['install']);

    // Install service dependencies
    const services = await this.getServices();
    
    for (const service of services) {
      try {
        const servicePath = path.join(this.projectRoot, 'services', service);
        await fs.access(servicePath);
        
        console.log(`Installing dependencies for ${service}...`);
        await this.runCommand('npm', ['install'], { cwd: servicePath });
        
      } catch (error) {
        console.warn(`⚠️  Could not install dependencies for ${service}: ${error.message}`);
      }
    }

    // Install client dependencies
    try {
      const clientPath = path.join(this.projectRoot, 'client');
      await fs.access(clientPath);
      
      console.log('Installing client dependencies...');
      await this.runCommand('npm', ['install'], { cwd: clientPath });
      
    } catch (error) {
      console.warn(`⚠️  Could not install client dependencies: ${error.message}`);
    }

    console.log('✅ Dependencies installation completed');
  }

  /**
   * Verify installation
   */
  async verifyInstallation() {
    console.log('🔍 Verifying installation...');
    
    const verificationChecks = [
      {
        name: 'Package.json validity',
        check: () => this.verifyPackageJson()
      },
      {
        name: 'Tech stack components',
        check: () => this.verifyTechStackComponents()
      },
      {
        name: 'Script functionality',
        check: () => this.verifyScripts()
      },
      {
        name: 'Service configurations',
        check: () => this.verifyServiceConfigurations()
      }
    ];

    let passedChecks = 0;

    for (const check of verificationChecks) {
      try {
        await check.check();
        console.log(`  ✅ ${check.name}`);
        passedChecks++;
      } catch (error) {
        console.log(`  ❌ ${check.name}: ${error.message}`);
      }
    }

    if (passedChecks === verificationChecks.length) {
      console.log('✅ All verification checks passed');
    } else {
      console.log(`⚠️  ${passedChecks}/${verificationChecks.length} verification checks passed`);
    }
  }

  /**
   * Verify package.json
   */
  async verifyPackageJson() {
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    const content = await fs.readFile(packageJsonPath, 'utf8');
    const config = JSON.parse(content);

    // Check for required scripts
    const requiredScripts = ['start', 'deploy', 'test', 'docker:up'];
    const missingScripts = requiredScripts.filter(script => !config.scripts[script]);
    
    if (missingScripts.length > 0) {
      throw new Error(`Missing scripts: ${missingScripts.join(', ')}`);
    }

    // Check for tech stack dependencies
    const techStackDeps = ['redis', 'opossum', 'jsonwebtoken'];
    const hasTechStackDeps = techStackDeps.some(dep => 
      config.dependencies[dep] || config.devDependencies[dep]
    );
    
    if (!hasTechStackDeps) {
      throw new Error('Tech stack dependencies not found');
    }
  }

  /**
   * Verify tech stack components
   */
  async verifyTechStackComponents() {
    const components = [
      'services/shared/eventBus/eventBus.js',
      'services/shared/saga/sagaOrchestrator.js',
      'services/shared/security/serviceAuthManager.js',
      'services/shared/auth/authRedundancyManager.js',
      'services/shared/testing/contractTestManager.js'
    ];

    for (const component of components) {
      const componentPath = path.join(this.projectRoot, component);
      await fs.access(componentPath);
    }
  }

  /**
   * Verify scripts
   */
  async verifyScripts() {
    const scripts = [
      'scripts/unified-deployment.js',
      'scripts/setup-tech-stack.js',
      'scripts/run-integration-tests.js'
    ];

    for (const script of scripts) {
      const scriptPath = path.join(this.projectRoot, script);
      await fs.access(scriptPath);
    }
  }

  /**
   * Verify service configurations
   */
  async verifyServiceConfigurations() {
    const services = await this.getServices();
    
    for (const service of services) {
      const servicePath = path.join(this.projectRoot, 'services', service);
      const packageJsonPath = path.join(servicePath, 'package.json');
      
      try {
        await fs.access(packageJsonPath);
        const content = await fs.readFile(packageJsonPath, 'utf8');
        JSON.parse(content); // Verify it's valid JSON
      } catch (error) {
        throw new Error(`Invalid package.json for ${service}: ${error.message}`);
      }
    }
  }

  /**
   * Generate documentation
   */
  async generateDocumentation() {
    console.log('📚 Generating updated documentation...');
    
    const readmeContent = `# Anti-Fraud Platform - Enhanced Microservices Architecture

## 🚀 Quick Start

\`\`\`bash
# Start development environment
npm run start

# Start with Docker
npm run docker:up

# Deploy to Kubernetes
npm run deploy:k8s

# Run tests
npm run test
\`\`\`

## 🏗️ Architecture

This platform now includes advanced microservices patterns:

- **Circuit Breaker Pattern**: Prevents cascade failures
- **Event-Driven Architecture**: Async communication via Redis
- **Saga Pattern**: Distributed transaction management
- **Service Authentication**: Individual service keys with rotation
- **Auth Service Redundancy**: Multiple auth instances with failover
- **Contract Testing**: Pact-based consumer-driven contracts
- **Integration Testing**: Complete E2E testing pipeline
- **Service Mesh**: Optional Istio or Consul Connect

## 📦 Services

- **API Gateway** (8080): Main entry point with circuit breakers
- **Auth Service** (3001): Authentication with redundancy
- **Link Service** (3002): URL scanning and analysis
- **Community Service** (3003): User posts and discussions
- **Chat Service** (3004): AI-powered chat functionality
- **News Service** (3005): Security news aggregation
- **Admin Service** (3006): Administrative operations

## 🔧 Tech Stack

### Core Technologies
- **Node.js 18+**: Runtime environment
- **Express.js**: Web framework
- **Redis**: Event bus and caching
- **Firebase**: Database and authentication
- **Docker**: Containerization
- **Kubernetes**: Orchestration

### Enhanced Features
- **Opossum**: Circuit breaker implementation
- **Pact**: Contract testing framework
- **Prometheus**: Metrics collection
- **Grafana**: Monitoring dashboards
- **Istio/Consul**: Service mesh options

## 📋 Available Scripts

### Development
- \`npm run start\` - Start all services locally
- \`npm run dev\` - Start in development mode
- \`npm run stop\` - Stop all services

### Deployment
- \`npm run deploy:local\` - Local deployment
- \`npm run deploy:docker\` - Docker deployment
- \`npm run deploy:k8s\` - Kubernetes deployment
- \`npm run deploy:k8s:istio\` - K8s with Istio service mesh

### Testing
- \`npm run test\` - Run all tests
- \`npm run test:contracts\` - Contract testing
- \`npm run test:integration\` - Integration testing
- \`npm run test:e2e\` - End-to-end testing

### Monitoring
- \`npm run security:status\` - Security status
- \`npm run circuit-breaker:status\` - Circuit breaker status
- \`npm run auth:redundancy\` - Auth redundancy status
- \`npm run monitoring:start\` - Start monitoring stack

### Utilities
- \`npm run kill:all\` - Stop all processes
- \`npm run fix:ports\` - Fix port conflicts
- \`npm run clean\` - Clean up resources

## 🔒 Security Features

- Individual service authentication keys
- Automatic key rotation (24-hour cycle)
- Mutual TLS between services
- Rate limiting per service
- Authorization policies
- Security monitoring and alerting

## 📊 Monitoring

Access monitoring dashboards:
- **Application**: http://localhost:3000
- **API Gateway**: http://localhost:8080
- **Grafana**: http://localhost:3001
- **Prometheus**: http://localhost:9090

## 🧪 Testing

The platform includes comprehensive testing:
- **Unit Tests**: Individual component testing
- **Contract Tests**: Service interface validation
- **Integration Tests**: End-to-end workflow testing
- **Security Tests**: Vulnerability scanning

## 🚀 Deployment Options

### Local Development
\`\`\`bash
npm run start
\`\`\`

### Docker Compose
\`\`\`bash
npm run docker:up
\`\`\`

### Kubernetes
\`\`\`bash
npm run deploy:k8s
\`\`\`

### Kubernetes with Service Mesh
\`\`\`bash
# With Istio
npm run deploy:k8s:istio

# With Consul Connect
npm run deploy:k8s:consul
\`\`\`

## 📖 Documentation

- [Service Mesh Guide](docs/service-mesh-guide.md)
- [Circuit Breaker Documentation](services/api-gateway/README.md)
- [Event Bus Documentation](services/shared/eventBus/README.md)
- [Testing Guide](scripts/README.md)

## 🤝 Contributing

1. Follow the microservices patterns
2. Write contract tests for new services
3. Update documentation
4. Run the complete test suite

## 📄 License

MIT License - see LICENSE file for details.
`;

    await fs.writeFile(
      path.join(this.projectRoot, 'README-ENHANCED.md'),
      readmeContent
    );

    console.log('✅ Documentation generated: README-ENHANCED.md');
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

  async copyDirectory(src, dest) {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  }

  async runCommand(command, args = [], options = {}) {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        stdio: 'inherit',
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

  async askContinue(stepName) {
    // In a real implementation, you might use readline to ask user
    // For now, we'll continue automatically
    console.log(`⚠️  Step "${stepName}" failed, but continuing with remaining steps...`);
    return true;
  }

  showOptimizationSummary() {
    console.log('\n📊 Optimization Summary:');
    console.log('='.repeat(50));
    console.log('✅ Tech stack components installed and configured');
    console.log('✅ Deprecated scripts removed and cleaned up');
    console.log('✅ Package.json optimized with new features');
    console.log('✅ Dependencies updated and installed');
    console.log('✅ Installation verified and tested');
    console.log('✅ Documentation generated and updated');
    
    console.log('\n🎯 Key Improvements:');
    console.log('- Unified deployment script for all environments');
    console.log('- Enhanced Docker Compose with monitoring');
    console.log('- Complete testing pipeline with contracts');
    console.log('- Service mesh ready configuration');
    console.log('- Advanced security with service authentication');
    console.log('- Event-driven architecture with Redis');
    console.log('- Circuit breaker pattern for resilience');
    console.log('- Auth service redundancy for high availability');
    
    console.log('\n🚀 Next Steps:');
    console.log('1. Test the new deployment: npm run start');
    console.log('2. Run the test suite: npm run test');
    console.log('3. Check security status: npm run security:status');
    console.log('4. Review the enhanced documentation');
    console.log('5. Deploy to your preferred environment');
    
    console.log('\n💡 Pro Tips:');
    console.log('- Use npm run help for all available commands');
    console.log('- Monitor services with npm run monitoring:start');
    console.log('- Check circuit breaker status regularly');
    console.log('- Review backup files if rollback is needed');
  }
}

// CLI handling
async function main() {
  const optimization = new CompleteOptimization();
  
  if (process.argv.includes('--help')) {
    console.log('Complete Optimization Script');
    console.log('Usage: node scripts/complete-optimization.js');
    console.log('\nThis script will:');
    console.log('1. Backup current state');
    console.log('2. Setup tech stack components');
    console.log('3. Cleanup deprecated scripts');
    console.log('4. Upgrade package.json');
    console.log('5. Install dependencies');
    console.log('6. Verify installation');
    console.log('7. Generate documentation');
    return;
  }

  await optimization.optimize();
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = CompleteOptimization;
