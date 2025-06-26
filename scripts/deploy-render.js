#!/usr/bin/env node

/**
 * Render Deployment Script
 * Automates deployment to Render platform
 */

const fs = require('fs');
const path = require('path');

class RenderDeployer {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.services = [
      {
        name: 'factcheck-auth',
        type: 'web',
        path: 'services/auth-service',
        port: 3001,
        priority: 1
      },
      {
        name: 'factcheck-link',
        type: 'web', 
        path: 'services/link-service',
        port: 3002,
        priority: 2
      },
      {
        name: 'factcheck-community',
        type: 'web',
        path: 'services/community-service', 
        port: 3003,
        priority: 2
      },
      {
        name: 'factcheck-chat',
        type: 'web',
        path: 'services/chat-service',
        port: 3004,
        priority: 2
      },
      {
        name: 'factcheck-news',
        type: 'web',
        path: 'services/news-service',
        port: 3005,
        priority: 3
      },
      {
        name: 'factcheck-admin',
        type: 'web',
        path: 'services/admin-service',
        port: 3006,
        priority: 3
      },
      {
        name: 'factcheck-phishtank',
        type: 'web',
        path: 'services/phishtank-service',
        port: 3007,
        priority: 3
      },
      {
        name: 'factcheck-criminalip',
        type: 'web',
        path: 'services/criminalip-service',
        port: 3008,
        priority: 3
      },
      {
        name: 'factcheck-api-gateway',
        type: 'web',
        path: 'services/api-gateway',
        port: 8080,
        priority: 4
      },
      {
        name: 'factcheck-frontend',
        type: 'static',
        path: 'client',
        port: 3000,
        priority: 5
      }
    ];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      warning: '\x1b[33m',
      error: '\x1b[31m',
      reset: '\x1b[0m'
    };
    
    console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
  }

  generateRenderYaml(service) {
    const baseConfig = {
      services: [{
        type: service.type === 'static' ? 'static' : 'web',
        name: service.name,
        env: service.type === 'static' ? 'static' : 'node',
        plan: 'free',
        region: 'oregon'
      }]
    };

    if (service.type === 'static') {
      // Frontend configuration
      baseConfig.services[0] = {
        ...baseConfig.services[0],
        buildCommand: 'npm install && npm run build',
        staticPublishPath: './build',
        envVars: [
          { key: 'REACT_APP_API_URL', value: 'https://factcheck-api-gateway.onrender.com' },
          { key: 'REACT_APP_FIREBASE_API_KEY', sync: false },
          { key: 'REACT_APP_FIREBASE_AUTH_DOMAIN', sync: false },
          { key: 'REACT_APP_FIREBASE_PROJECT_ID', sync: false },
          { key: 'REACT_APP_FIREBASE_STORAGE_BUCKET', sync: false },
          { key: 'REACT_APP_FIREBASE_MESSAGING_SENDER_ID', sync: false },
          { key: 'REACT_APP_FIREBASE_APP_ID', sync: false },
          { key: 'GENERATE_SOURCEMAP', value: 'false' }
        ]
      };
    } else {
      // Backend service configuration
      baseConfig.services[0] = {
        ...baseConfig.services[0],
        buildCommand: `cd ${service.path} && npm install`,
        startCommand: `cd ${service.path} && npm start`,
        healthCheckPath: '/health',
        envVars: [
          { key: 'PORT', value: service.port.toString() },
          { key: 'NODE_ENV', value: 'production' },
          { key: 'JWT_SECRET', generateValue: true }
        ]
      };

      // Add service-specific environment variables
      if (service.name === 'factcheck-api-gateway') {
        baseConfig.services[0].envVars.push(
          { key: 'AUTH_SERVICE_URL', value: 'https://factcheck-auth.onrender.com' },
          { key: 'LINK_SERVICE_URL', value: 'https://factcheck-link.onrender.com' },
          { key: 'COMMUNITY_SERVICE_URL', value: 'https://factcheck-community.onrender.com' },
          { key: 'CHAT_SERVICE_URL', value: 'https://factcheck-chat.onrender.com' },
          { key: 'NEWS_SERVICE_URL', value: 'https://factcheck-news.onrender.com' },
          { key: 'ADMIN_SERVICE_URL', value: 'https://factcheck-admin.onrender.com' },
          { key: 'PHISHTANK_SERVICE_URL', value: 'https://factcheck-phishtank.onrender.com' },
          { key: 'CRIMINALIP_SERVICE_URL', value: 'https://factcheck-criminalip.onrender.com' }
        );
      }

      if (service.name !== 'factcheck-api-gateway') {
        baseConfig.services[0].envVars.push(
          { key: 'AUTH_SERVICE_URL', value: 'https://factcheck-auth.onrender.com' }
        );
      }

      // Add Firebase config for services that need it
      if (['factcheck-auth', 'factcheck-community', 'factcheck-chat', 'factcheck-news', 'factcheck-admin'].includes(service.name)) {
        baseConfig.services[0].envVars.push(
          { key: 'FIREBASE_PROJECT_ID', sync: false },
          { key: 'FIREBASE_PRIVATE_KEY', sync: false },
          { key: 'FIREBASE_CLIENT_EMAIL', sync: false }
        );
      }

      // Add API keys for specific services
      if (service.name === 'factcheck-link') {
        baseConfig.services[0].envVars.push(
          { key: 'VIRUSTOTAL_API_KEY', sync: false },
          { key: 'SCAMADVISER_API_KEY', sync: false },
          { key: 'IPQUALITYSCORE_API_KEY', sync: false }
        );
      }

      if (service.name === 'factcheck-chat') {
        baseConfig.services[0].envVars.push(
          { key: 'GEMINI_API_KEY', sync: false }
        );
      }

      if (service.name === 'factcheck-news') {
        baseConfig.services[0].envVars.push(
          { key: 'NEWSAPI_API_KEY', sync: false },
          { key: 'NEWSDATA_API_KEY', sync: false }
        );
      }

      if (service.name === 'factcheck-phishtank') {
        baseConfig.services[0].envVars.push(
          { key: 'PHISHTANK_API_KEY', sync: false }
        );
      }

      if (service.name === 'factcheck-criminalip') {
        baseConfig.services[0].envVars.push(
          { key: 'CRIMINALIP_API_KEY', sync: false }
        );
      }
    }

    return baseConfig;
  }

  generateDeploymentGuide() {
    const guide = `# 🚀 Render Deployment Guide - Updated

## 📋 Services Deployment Order

Deploy in this order to ensure dependencies are available:

${this.services
  .sort((a, b) => a.priority - b.priority)
  .map((service, index) => `${index + 1}. **${service.name}** (${service.type}) - Port ${service.port}`)
  .join('\n')}

## 🔧 Quick Deploy Steps

### 1. Create Render Account
- Go to https://render.com
- Sign up with GitHub account
- Connect your repository

### 2. Deploy Services One by One

For each service, create a new Web Service (or Static Site for frontend):

#### Service URLs (update these in your environment):
\`\`\`
AUTH_SERVICE_URL=https://factcheck-auth.onrender.com
LINK_SERVICE_URL=https://factcheck-link.onrender.com
COMMUNITY_SERVICE_URL=https://factcheck-community.onrender.com
CHAT_SERVICE_URL=https://factcheck-chat.onrender.com
NEWS_SERVICE_URL=https://factcheck-news.onrender.com
ADMIN_SERVICE_URL=https://factcheck-admin.onrender.com
PHISHTANK_SERVICE_URL=https://factcheck-phishtank.onrender.com
CRIMINALIP_SERVICE_URL=https://factcheck-criminalip.onrender.com
API_GATEWAY_URL=https://factcheck-api-gateway.onrender.com
FRONTEND_URL=https://factcheck-frontend.onrender.com
\`\`\`

### 3. Environment Variables Required

#### All Services:
- NODE_ENV=production
- JWT_SECRET=(auto-generated)

#### Firebase Services:
- FIREBASE_PROJECT_ID
- FIREBASE_PRIVATE_KEY
- FIREBASE_CLIENT_EMAIL

#### API Keys:
- GEMINI_API_KEY
- VIRUSTOTAL_API_KEY
- SCAMADVISER_API_KEY
- NEWSAPI_API_KEY
- PHISHTANK_API_KEY
- CRIMINALIP_API_KEY

### 4. Build Commands

Each service uses: \`cd services/[service-name] && npm install\`
Frontend uses: \`npm install && npm run build\`

## ⚠️ Important Notes

1. **Free Tier Limitations**: Services sleep after 15 minutes
2. **Cold Starts**: First request takes longer
3. **Build Time**: Keep under 20 minutes
4. **Memory**: 512MB RAM limit per service

## 🔗 Final URLs

After deployment, update your frontend to use:
- API Gateway: https://factcheck-api-gateway.onrender.com
- Frontend: https://factcheck-frontend.onrender.com
`;

    return guide;
  }

  async createDeploymentFiles() {
    this.log('🔧 Creating Render deployment files...', 'info');

    // Create render.yaml for each service
    for (const service of this.services) {
      const config = this.generateRenderYaml(service);
      const yamlContent = `# Render deployment configuration for ${service.name}
# Generated automatically - do not edit manually

${JSON.stringify(config, null, 2).replace(/"/g, '').replace(/,/g, '').replace(/\{/g, '').replace(/\}/g, '').replace(/\[/g, '').replace(/\]/g, '')}`;

      const filePath = path.join(this.projectRoot, 'docs', 'deployment', `render-${service.name.replace('factcheck-', '')}.yaml`);
      
      // Create a proper YAML format
      const yamlLines = [
        `# Render deployment configuration for ${service.name}`,
        '# Generated automatically - do not edit manually',
        '',
        'services:',
        `  - type: ${config.services[0].type}`,
        `    name: ${config.services[0].name}`,
        `    env: ${config.services[0].env}`,
        `    plan: ${config.services[0].plan}`,
        `    region: ${config.services[0].region}`
      ];

      if (config.services[0].buildCommand) {
        yamlLines.push(`    buildCommand: ${config.services[0].buildCommand}`);
      }
      if (config.services[0].startCommand) {
        yamlLines.push(`    startCommand: ${config.services[0].startCommand}`);
      }
      if (config.services[0].staticPublishPath) {
        yamlLines.push(`    staticPublishPath: ${config.services[0].staticPublishPath}`);
      }
      if (config.services[0].healthCheckPath) {
        yamlLines.push(`    healthCheckPath: ${config.services[0].healthCheckPath}`);
      }

      if (config.services[0].envVars && config.services[0].envVars.length > 0) {
        yamlLines.push('    envVars:');
        config.services[0].envVars.forEach(envVar => {
          yamlLines.push(`      - key: ${envVar.key}`);
          if (envVar.value) {
            yamlLines.push(`        value: ${envVar.value}`);
          } else if (envVar.generateValue) {
            yamlLines.push(`        generateValue: true`);
          } else if (envVar.sync === false) {
            yamlLines.push(`        sync: false`);
          }
        });
      }

      fs.writeFileSync(filePath, yamlLines.join('\n'));
      this.log(`✅ Created ${filePath}`, 'success');
    }

    // Create deployment guide
    const guidePath = path.join(this.projectRoot, 'RENDER_DEPLOYMENT_GUIDE.md');
    fs.writeFileSync(guidePath, this.generateDeploymentGuide());
    this.log(`✅ Created ${guidePath}`, 'success');

    this.log('🎉 Render deployment files created successfully!', 'success');
    this.log('📖 Check RENDER_DEPLOYMENT_GUIDE.md for deployment instructions', 'info');
  }

  async deploy() {
    try {
      await this.createDeploymentFiles();
    } catch (error) {
      this.log(`💥 Deployment preparation failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const deployer = new RenderDeployer();
  deployer.deploy();
}

module.exports = RenderDeployer;
