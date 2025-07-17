#!/usr/bin/env node

/**
 * Update Render Deployment for Full Docker Migration
 * Updates deployment scripts and configurations for Docker-based deployment
 */

const fs = require('fs');
const path = require('path');

class RenderDockerUpdater {
  constructor() {
    this.services = [
      'auth-service',
      'link-service', 
      'community-service',
      'chat-service',
      'news-service',
      'admin-service',
      'phishtank-service',
      'criminalip-service',
      'api-gateway'
    ];
    
    this.updates = [];
    this.errors = [];
  }

  log(message, type = 'info') {
    const icons = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      fix: '🔧'
    };
    console.log(`${icons[type]} ${message}`);
  }

  // Update render.yaml for full Docker deployment
  updateRenderYaml() {
    this.log('Updating render.yaml for Docker deployment...', 'info');
    
    const renderConfig = {
      services: []
    };

    // Add each service with Docker configuration
    this.services.forEach(serviceName => {
      const serviceConfig = {
        type: 'web',
        name: `${serviceName}-docker`,
        env: 'docker',
        dockerfilePath: `./services/${serviceName}/Dockerfile.render`,
        dockerContext: '.',
        repo: 'https://github.com/VinkRasengan/backup',
        branch: 'main',
        healthCheckPath: '/health',
        plan: 'free',
        region: 'singapore',
        envVars: [
          { key: 'NODE_ENV', value: 'production' },
          { key: 'PORT', value: '10000' },
          { key: 'FIREBASE_PROJECT_ID', sync: false },
          { key: 'FIREBASE_CLIENT_EMAIL', sync: false },
          { key: 'FIREBASE_PRIVATE_KEY', sync: false },
          { key: 'JWT_SECRET', sync: false }
        ]
      };

      // Add service-specific environment variables
      const serviceEnvVars = this.getServiceEnvVars(serviceName);
      serviceConfig.envVars.push(...serviceEnvVars);

      renderConfig.services.push(serviceConfig);
    });

    // Add frontend (static site)
    renderConfig.services.push({
      type: 'static',
      name: 'frontend-docker',
      buildCommand: 'cd client && npm ci && npm run build',
      staticPublishPath: './client/build',
      repo: 'https://github.com/VinkRasengan/backup',
      branch: 'main',
      region: 'global',
      envVars: [
        { key: 'REACT_APP_API_URL', value: 'https://api-gateway-docker.onrender.com' },
        { key: 'GENERATE_SOURCEMAP', value: 'false' }
      ]
    });

    try {
      fs.writeFileSync('render-docker.yaml', JSON.stringify(renderConfig, null, 2));
      this.log('Created render-docker.yaml configuration', 'success');
      this.updates.push('Created render-docker.yaml');
      return true;
    } catch (error) {
      this.log(`Failed to create render-docker.yaml: ${error.message}`, 'error');
      this.errors.push(`Failed to create render-docker.yaml: ${error.message}`);
      return false;
    }
  }

  // Get service-specific environment variables
  getServiceEnvVars(serviceName) {
    const envVars = {
      'link-service': [
        { key: 'VIRUSTOTAL_API_KEY', sync: false },
        { key: 'SCAMADVISER_API_KEY', sync: false },
        { key: 'IPQUALITYSCORE_API_KEY', sync: false }
      ],
      'chat-service': [
        { key: 'GEMINI_API_KEY', sync: false }
      ],
      'news-service': [
        { key: 'NEWSAPI_API_KEY', sync: false },
        { key: 'NEWSDATA_API_KEY', sync: false }
      ],
      'phishtank-service': [
        { key: 'PHISHTANK_API_KEY', sync: false }
      ],
      'criminalip-service': [
        { key: 'CRIMINALIP_API_KEY', sync: false }
      ],
      'api-gateway': [
        { key: 'AUTH_SERVICE_URL', value: 'https://auth-service-docker.onrender.com' },
        { key: 'LINK_SERVICE_URL', value: 'https://link-service-docker.onrender.com' },
        { key: 'COMMUNITY_SERVICE_URL', value: 'https://community-service-docker.onrender.com' },
        { key: 'CHAT_SERVICE_URL', value: 'https://chat-service-docker.onrender.com' },
        { key: 'NEWS_SERVICE_URL', value: 'https://news-service-docker.onrender.com' },
        { key: 'ADMIN_SERVICE_URL', value: 'https://admin-service-docker.onrender.com' },
        { key: 'PHISHTANK_SERVICE_URL', value: 'https://phishtank-service-docker.onrender.com' },
        { key: 'CRIMINALIP_SERVICE_URL', value: 'https://criminalip-service-docker.onrender.com' },
        { key: 'CORS_ORIGIN', value: 'https://frontend-docker.onrender.com' }
      ]
    };
    
    return envVars[serviceName] || [];
  }

  // Create Docker deployment script
  createDockerDeploymentScript() {
    const deployScript = `#!/usr/bin/env node

/**
 * Render Docker Deployment Script
 * Deploys all services using Docker configuration
 */

const axios = require('axios');

class RenderDockerDeployer {
  constructor() {
    this.apiKey = process.env.RENDER_API_KEY;
    this.baseUrl = 'https://api.render.com/v1';
    
    if (!this.apiKey) {
      throw new Error('RENDER_API_KEY environment variable is required');
    }
  }

  async deployService(serviceName) {
    try {
      console.log(\`🚀 Deploying \${serviceName}-docker...\`);
      
      const response = await axios.post(
        \`\${this.baseUrl}/services/\${serviceName}-docker/deploys\`,
        {},
        {
          headers: {
            'Authorization': \`Bearer \${this.apiKey}\`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log(\`✅ \${serviceName}-docker deployment triggered\`);
      return response.data;
      
    } catch (error) {
      console.error(\`❌ Failed to deploy \${serviceName}-docker:\`, error.response?.data || error.message);
      throw error;
    }
  }

  async deployAllServices() {
    const services = [
      'criminalip-service',  // Start with simplest
      'phishtank-service',
      'auth-service',
      'community-service', 
      'chat-service',
      'news-service',
      'admin-service',
      'link-service',        // Complex dependencies
      'api-gateway'          // Depends on others, deploy last
    ];

    const results = [];
    
    for (const service of services) {
      try {
        await this.deployService(service);
        results.push({ service, status: 'success' });
        
        // Wait between deployments to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 5000));
        
      } catch (error) {
        results.push({ service, status: 'failed', error: error.message });
      }
    }
    
    return results;
  }

  printResults(results) {
    console.log('\\n' + '='.repeat(60));
    console.log('🎉 Docker Deployment Results');
    console.log('='.repeat(60));
    
    const successful = results.filter(r => r.status === 'success');
    const failed = results.filter(r => r.status === 'failed');
    
    if (successful.length > 0) {
      console.log(\`\\n✅ Successfully deployed (\${successful.length}):\`);
      successful.forEach(r => console.log(\`   • \${r.service}-docker\`));
    }
    
    if (failed.length > 0) {
      console.log(\`\\n❌ Failed deployments (\${failed.length}):\`);
      failed.forEach(r => console.log(\`   • \${r.service}-docker: \${r.error}\`));
    }
    
    console.log('\\n🔗 Service URLs:');
    successful.forEach(r => {
      console.log(\`   • https://\${r.service}-docker.onrender.com\`);
    });
  }
}

async function main() {
  try {
    const deployer = new RenderDockerDeployer();
    const results = await deployer.deployAllServices();
    deployer.printResults(results);
    
    const hasFailures = results.some(r => r.status === 'failed');
    process.exit(hasFailures ? 1 : 0);
    
  } catch (error) {
    console.error('💥 Deployment failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = RenderDockerDeployer;
`;

    try {
      fs.writeFileSync('scripts/deploy-render-docker.js', deployScript);
      this.log('Created Docker deployment script', 'success');
      this.updates.push('Created scripts/deploy-render-docker.js');
      return true;
    } catch (error) {
      this.log(`Failed to create deployment script: ${error.message}`, 'error');
      this.errors.push(`Failed to create deployment script: ${error.message}`);
      return false;
    }
  }

  // Create migration checklist
  createMigrationChecklist() {
    const checklist = `# Docker Migration Checklist

## 📋 Pre-Migration Checklist

- [ ] All Dockerfile.render files exist and are optimized
- [ ] Environment variables documented for each service
- [ ] Current service URLs and configurations backed up
- [ ] render-docker.yaml configuration reviewed

## 🚀 Migration Steps

### Phase 1: Failed Services (Priority)

#### CriminalIP Service
- [ ] Create new Docker service: \`criminalip-service-docker\`
- [ ] Configure Dockerfile path: \`./services/criminalip-service/Dockerfile.render\`
- [ ] Set environment variables
- [ ] Deploy and test: \`curl https://criminalip-service-docker.onrender.com/health\`
- [ ] Delete old service after success

#### PhishTank Service  
- [ ] Create new Docker service: \`phishtank-service-docker\`
- [ ] Configure Dockerfile path: \`./services/phishtank-service/Dockerfile.render\`
- [ ] Set environment variables
- [ ] Deploy and test: \`curl https://phishtank-service-docker.onrender.com/health\`
- [ ] Delete old service after success

#### Link Service
- [ ] Create new Docker service: \`link-service-docker\`
- [ ] Configure Dockerfile path: \`./services/link-service/Dockerfile.render\`
- [ ] Set environment variables (VIRUSTOTAL_API_KEY, etc.)
- [ ] Deploy and test: \`curl https://link-service-docker.onrender.com/health\`
- [ ] Delete old service after success

#### API Gateway
- [ ] Create new Docker service: \`api-gateway-docker\`
- [ ] Configure Dockerfile path: \`./services/api-gateway/Dockerfile.render\`
- [ ] Update service URLs to point to Docker services
- [ ] Set environment variables
- [ ] Deploy and test: \`curl https://api-gateway-docker.onrender.com/health\`
- [ ] Delete old service after success

### Phase 2: Working Services (Optional)

#### Auth Service
- [ ] Create new Docker service: \`auth-service-docker\`
- [ ] Migrate configuration
- [ ] Test and switch traffic

#### Chat Service
- [ ] Create new Docker service: \`chat-service-docker\`
- [ ] Migrate configuration
- [ ] Test and switch traffic

#### Community Service
- [ ] Create new Docker service: \`community-service-docker\`
- [ ] Migrate configuration
- [ ] Test and switch traffic

#### Admin Service
- [ ] Create new Docker service: \`admin-service-docker\`
- [ ] Migrate configuration
- [ ] Test and switch traffic

#### News Service
- [ ] Create new Docker service: \`news-service-docker\`
- [ ] Migrate configuration
- [ ] Test and switch traffic

## 🧪 Post-Migration Testing

- [ ] All health endpoints responding
- [ ] API Gateway routing working
- [ ] Frontend connecting to new API Gateway
- [ ] All external API integrations working
- [ ] Performance monitoring shows improvements

## 🔄 Final Steps

- [ ] Update DNS/domain configurations if needed
- [ ] Update CI/CD pipeline to use Docker deployment
- [ ] Update documentation with new service URLs
- [ ] Monitor services for 24-48 hours
- [ ] Clean up old failed services

## 📊 Success Metrics

- [ ] Build times reduced to 5-8 minutes
- [ ] Zero build failures
- [ ] All services healthy and responding
- [ ] Consistent deployment process across all services
`;

    try {
      fs.writeFileSync('DOCKER_MIGRATION_CHECKLIST.md', checklist);
      this.log('Created migration checklist', 'success');
      this.updates.push('Created DOCKER_MIGRATION_CHECKLIST.md');
      return true;
    } catch (error) {
      this.log(`Failed to create checklist: ${error.message}`, 'error');
      this.errors.push(`Failed to create checklist: ${error.message}`);
      return false;
    }
  }

  // Main execution
  async run() {
    this.log('🚀 Updating Render deployment for Docker migration...', 'info');
    
    // Update render.yaml
    this.updateRenderYaml();
    
    // Create deployment script
    this.createDockerDeploymentScript();
    
    // Create migration checklist
    this.createMigrationChecklist();
    
    // Print summary
    this.printSummary();
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    this.log('🎉 Docker Migration Update Summary', 'success');
    console.log('='.repeat(60));

    if (this.updates.length > 0) {
      this.log(`✅ Successfully created ${this.updates.length} files:`, 'success');
      this.updates.forEach(update => console.log(`   • ${update}`));
    }

    if (this.errors.length > 0) {
      this.log(`❌ ${this.errors.length} errors encountered:`, 'error');
      this.errors.forEach(error => console.log(`   • ${error}`));
    }

    console.log('\n📖 Next Steps:');
    console.log('   1. Review RENDER_DOCKER_MIGRATION_GUIDE.md');
    console.log('   2. Follow DOCKER_MIGRATION_CHECKLIST.md');
    console.log('   3. Start with CriminalIP Service (simplest)');
    console.log('   4. Use render-docker.yaml as configuration reference');
    console.log('   5. Test each service after migration');
  }
}

// Run the updater
if (require.main === module) {
  const updater = new RenderDockerUpdater();
  updater.run().catch(error => {
    console.error('💥 Update script failed:', error.message);
    process.exit(1);
  });
}

module.exports = RenderDockerUpdater;
