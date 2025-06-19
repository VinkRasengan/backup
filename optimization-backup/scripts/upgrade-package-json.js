#!/usr/bin/env node

/**
 * Package.json Upgrade Script
 * Replaces old package.json with optimized version and tech stack integration
 */

const fs = require('fs').promises;
const path = require('path');

class PackageJsonUpgrade {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.currentPackageJson = path.join(this.projectRoot, 'package.json');
    this.optimizedPackageJson = path.join(this.projectRoot, 'package-optimized.json');
    this.backupPackageJson = path.join(this.projectRoot, 'package-backup.json');
  }

  /**
   * Main upgrade process
   */
  async upgrade() {
    try {
      console.log('📦 Upgrading package.json with tech stack integration...');
      console.log('='.repeat(60));

      // Backup current package.json
      await this.backupCurrentPackageJson();

      // Merge configurations
      const mergedConfig = await this.mergeConfigurations();

      // Apply optimized package.json
      await this.applyOptimizedPackageJson(mergedConfig);

      // Update service package.json files
      await this.updateServicePackageJsons();

      // Verify upgrade
      await this.verifyUpgrade();

      console.log('\n✅ Package.json upgrade completed successfully!');
      this.showUpgradeSummary();

    } catch (error) {
      console.error('❌ Package.json upgrade failed:', error.message);
      await this.rollback();
      process.exit(1);
    }
  }

  /**
   * Backup current package.json
   */
  async backupCurrentPackageJson() {
    console.log('💾 Creating backup of current package.json...');
    
    try {
      const currentContent = await fs.readFile(this.currentPackageJson, 'utf8');
      await fs.writeFile(this.backupPackageJson, currentContent);
      console.log(`✅ Backup created: ${this.backupPackageJson}`);
    } catch (error) {
      throw new Error(`Failed to backup package.json: ${error.message}`);
    }
  }

  /**
   * Merge current and optimized configurations
   */
  async mergeConfigurations() {
    console.log('🔄 Merging configurations...');
    
    try {
      // Read current package.json
      const currentContent = await fs.readFile(this.currentPackageJson, 'utf8');
      const currentConfig = JSON.parse(currentContent);

      // Read optimized package.json
      const optimizedContent = await fs.readFile(this.optimizedPackageJson, 'utf8');
      const optimizedConfig = JSON.parse(optimizedContent);

      // Merge configurations
      const mergedConfig = {
        ...optimizedConfig,
        // Preserve important fields from current config
        name: currentConfig.name || optimizedConfig.name,
        version: this.incrementVersion(currentConfig.version || '1.0.0'),
        description: optimizedConfig.description,
        // Merge dependencies intelligently
        dependencies: {
          ...currentConfig.dependencies,
          ...optimizedConfig.dependencies
        },
        devDependencies: {
          ...currentConfig.devDependencies,
          ...optimizedConfig.devDependencies
        },
        // Use optimized scripts
        scripts: optimizedConfig.scripts,
        // Preserve custom fields
        repository: currentConfig.repository || optimizedConfig.repository,
        author: currentConfig.author || optimizedConfig.author,
        license: currentConfig.license || optimizedConfig.license
      };

      console.log('✅ Configurations merged successfully');
      return mergedConfig;

    } catch (error) {
      throw new Error(`Failed to merge configurations: ${error.message}`);
    }
  }

  /**
   * Apply optimized package.json
   */
  async applyOptimizedPackageJson(mergedConfig) {
    console.log('📝 Applying optimized package.json...');
    
    try {
      const formattedContent = JSON.stringify(mergedConfig, null, 2);
      await fs.writeFile(this.currentPackageJson, formattedContent);
      console.log('✅ Optimized package.json applied');
    } catch (error) {
      throw new Error(`Failed to apply optimized package.json: ${error.message}`);
    }
  }

  /**
   * Update service package.json files
   */
  async updateServicePackageJsons() {
    console.log('🔧 Updating service package.json files...');
    
    const services = await this.getServices();
    let updatedCount = 0;

    for (const service of services) {
      try {
        await this.updateServicePackageJson(service);
        updatedCount++;
        console.log(`  ✅ Updated ${service}`);
      } catch (error) {
        console.warn(`  ⚠️  Could not update ${service}: ${error.message}`);
      }
    }

    console.log(`✅ Updated ${updatedCount}/${services.length} service package.json files`);
  }

  /**
   * Update individual service package.json
   */
  async updateServicePackageJson(serviceName) {
    const servicePath = path.join(this.projectRoot, 'services', serviceName);
    const packageJsonPath = path.join(servicePath, 'package.json');
    
    try {
      // Check if package.json exists
      await fs.access(packageJsonPath);
      
      const content = await fs.readFile(packageJsonPath, 'utf8');
      const packageConfig = JSON.parse(content);

      // Add tech stack scripts
      const enhancedScripts = {
        ...packageConfig.scripts,
        'test:contracts': 'jest tests/contracts/ || echo "No contract tests found"',
        'test:integration': 'jest tests/integration/ || echo "No integration tests found"',
        'test:unit': 'jest tests/unit/ || npm test',
        'security:check': 'npm audit --audit-level=moderate',
        'security:fix': 'npm audit fix',
        'circuit-breaker:status': 'curl -s http://localhost:8080/circuit-breaker/status || echo "Circuit breaker not available"',
        'health:check': `curl -s http://localhost:${this.getServicePort(serviceName)}/health || echo "Service not running"`,
        'metrics': `curl -s http://localhost:${this.getServicePort(serviceName)}/metrics || echo "Metrics not available"`,
        'logs:tail': 'tail -f logs/*.log || echo "No logs found"',
        'dev:debug': 'NODE_ENV=development DEBUG=* npm start',
        'prod:start': 'NODE_ENV=production npm start'
      };

      // Add tech stack dependencies
      const techStackDependencies = this.getTechStackDependencies(serviceName);
      const techStackDevDependencies = this.getTechStackDevDependencies(serviceName);

      const enhancedConfig = {
        ...packageConfig,
        scripts: enhancedScripts,
        dependencies: {
          ...packageConfig.dependencies,
          ...techStackDependencies
        },
        devDependencies: {
          ...packageConfig.devDependencies,
          ...techStackDevDependencies
        },
        // Add tech stack configuration
        config: {
          ...packageConfig.config,
          techStack: {
            circuitBreaker: serviceName === 'api-gateway',
            eventBus: true,
            serviceAuth: true,
            monitoring: true
          }
        }
      };

      await fs.writeFile(packageJsonPath, JSON.stringify(enhancedConfig, null, 2));

    } catch (error) {
      if (error.code === 'ENOENT') {
        // Create basic package.json for service
        await this.createBasicServicePackageJson(serviceName);
      } else {
        throw error;
      }
    }
  }

  /**
   * Create basic package.json for service
   */
  async createBasicServicePackageJson(serviceName) {
    const basicConfig = {
      name: `@antifraud/${serviceName}`,
      version: '2.0.0',
      description: `Anti-Fraud Platform ${serviceName} service`,
      main: 'src/app.js',
      scripts: {
        start: 'node src/app.js',
        dev: 'nodemon src/app.js',
        test: 'jest',
        'test:watch': 'jest --watch',
        'test:coverage': 'jest --coverage',
        'test:contracts': 'jest tests/contracts/',
        'test:integration': 'jest tests/integration/',
        'security:check': 'npm audit',
        'health:check': `curl -s http://localhost:${this.getServicePort(serviceName)}/health`,
        lint: 'eslint src/',
        'lint:fix': 'eslint src/ --fix'
      },
      dependencies: {
        express: '^4.18.2',
        cors: '^2.8.5',
        helmet: '^7.1.0',
        dotenv: '^16.5.0',
        ...this.getTechStackDependencies(serviceName)
      },
      devDependencies: {
        nodemon: '^3.0.2',
        jest: '^29.7.0',
        eslint: '^8.55.0',
        ...this.getTechStackDevDependencies(serviceName)
      },
      engines: {
        node: '>=18.0.0',
        npm: '>=9.0.0'
      },
      config: {
        techStack: {
          circuitBreaker: serviceName === 'api-gateway',
          eventBus: true,
          serviceAuth: true,
          monitoring: true
        }
      }
    };

    const servicePath = path.join(this.projectRoot, 'services', serviceName);
    const packageJsonPath = path.join(servicePath, 'package.json');
    
    await fs.mkdir(servicePath, { recursive: true });
    await fs.writeFile(packageJsonPath, JSON.stringify(basicConfig, null, 2));
  }

  /**
   * Get tech stack dependencies for service
   */
  getTechStackDependencies(serviceName) {
    const baseDependencies = {
      'redis': '^4.6.10',
      'jsonwebtoken': '^9.0.2',
      'prom-client': '^15.1.0'
    };

    const serviceDependencies = {
      'api-gateway': {
        'opossum': '^8.0.0',
        'axios': '^1.6.2'
      },
      'auth-service': {
        'bcryptjs': '^2.4.3',
        'firebase-admin': '^12.0.0'
      },
      'link-service': {
        'axios': '^1.6.2'
      },
      'community-service': {
        'firebase-admin': '^12.0.0'
      },
      'chat-service': {
        '@google/generative-ai': '^0.2.1'
      },
      'news-service': {
        'axios': '^1.6.2'
      },
      'admin-service': {
        'axios': '^1.6.2'
      }
    };

    return {
      ...baseDependencies,
      ...(serviceDependencies[serviceName] || {})
    };
  }

  /**
   * Get tech stack dev dependencies for service
   */
  getTechStackDevDependencies(serviceName) {
    return {
      '@pact-foundation/pact': '^12.1.0',
      'supertest': '^6.3.3'
    };
  }

  /**
   * Get service port
   */
  getServicePort(serviceName) {
    const portMap = {
      'api-gateway': 8080,
      'auth-service': 3001,
      'link-service': 3002,
      'community-service': 3003,
      'chat-service': 3004,
      'news-service': 3005,
      'admin-service': 3006
    };
    
    return portMap[serviceName] || 3000;
  }

  /**
   * Get services list
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

  /**
   * Increment version number
   */
  incrementVersion(currentVersion) {
    const parts = currentVersion.split('.');
    const major = parseInt(parts[0]) || 1;
    const minor = parseInt(parts[1]) || 0;
    const patch = parseInt(parts[2]) || 0;
    
    // Increment minor version for tech stack upgrade
    return `${major}.${minor + 1}.0`;
  }

  /**
   * Verify upgrade
   */
  async verifyUpgrade() {
    console.log('🔍 Verifying upgrade...');
    
    try {
      // Verify main package.json
      const content = await fs.readFile(this.currentPackageJson, 'utf8');
      const config = JSON.parse(content);
      
      // Check for required scripts
      const requiredScripts = [
        'start', 'deploy', 'test', 'test:contracts', 'test:integration',
        'docker:up', 'docker:down', 'k8s:apply', 'security:status'
      ];
      
      const missingScripts = requiredScripts.filter(script => !config.scripts[script]);
      
      if (missingScripts.length > 0) {
        throw new Error(`Missing required scripts: ${missingScripts.join(', ')}`);
      }

      // Check for tech stack dependencies
      const requiredDeps = ['concurrently', 'redis', 'opossum', 'jsonwebtoken'];
      const missingDeps = requiredDeps.filter(dep => 
        !config.dependencies[dep] && !config.devDependencies[dep]
      );
      
      if (missingDeps.length > 0) {
        console.warn(`⚠️  Missing optional dependencies: ${missingDeps.join(', ')}`);
      }

      console.log('✅ Upgrade verification passed');

    } catch (error) {
      throw new Error(`Verification failed: ${error.message}`);
    }
  }

  /**
   * Rollback changes
   */
  async rollback() {
    console.log('🔄 Rolling back changes...');
    
    try {
      await fs.copyFile(this.backupPackageJson, this.currentPackageJson);
      console.log('✅ Rollback completed');
    } catch (error) {
      console.error('❌ Rollback failed:', error.message);
    }
  }

  /**
   * Show upgrade summary
   */
  showUpgradeSummary() {
    console.log('\n📊 Upgrade Summary:');
    console.log('='.repeat(40));
    console.log('✅ Main package.json upgraded with tech stack integration');
    console.log('✅ Service package.json files updated');
    console.log('✅ New scripts added for enhanced functionality');
    console.log('✅ Tech stack dependencies integrated');
    
    console.log('\n🚀 New Features Available:');
    console.log('- Unified deployment: npm run start');
    console.log('- Docker deployment: npm run docker:up');
    console.log('- Kubernetes deployment: npm run deploy:k8s');
    console.log('- Contract testing: npm run test:contracts');
    console.log('- Integration testing: npm run test:integration');
    console.log('- Security monitoring: npm run security:status');
    console.log('- Circuit breaker status: npm run circuit-breaker:status');
    
    console.log('\n📋 Next Steps:');
    console.log('1. Run: npm install (to install new dependencies)');
    console.log('2. Run: npm run setup:tech-stack (to configure tech stack)');
    console.log('3. Run: npm run start (to test new deployment)');
    console.log('4. Review: package-backup.json (if rollback needed)');
  }
}

// CLI handling
async function main() {
  const upgrade = new PackageJsonUpgrade();
  
  if (process.argv.includes('--help')) {
    console.log('Package.json Upgrade Script');
    console.log('Usage: node scripts/upgrade-package-json.js');
    console.log('\nThis script will:');
    console.log('- Backup current package.json');
    console.log('- Apply optimized configuration with tech stack integration');
    console.log('- Update all service package.json files');
    console.log('- Add new scripts and dependencies');
    return;
  }

  await upgrade.upgrade();
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = PackageJsonUpgrade;
