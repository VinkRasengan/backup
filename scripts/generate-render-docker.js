#!/usr/bin/env node

/**
 * Generate Render Docker Deployment Configuration
 * Creates render.yaml for Docker-based deployment
 */

const fs = require('fs');
const path = require('path');

class RenderDockerGenerator {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.services = [
      {
        name: 'factcheck-auth-docker',
        folder: 'auth-service',
        port: 10000,
        priority: 1,
        envVars: [
          'PORT=10000',
          'NODE_ENV=production',
          'JWT_SECRET=auto-generate',
          'FIREBASE_PROJECT_ID=sync',
          'FIREBASE_PRIVATE_KEY=sync',
          'FIREBASE_CLIENT_EMAIL=sync',
          'FIREBASE_DATABASE_URL=sync'
        ]
      },
      {
        name: 'factcheck-link-docker',
        folder: 'link-service',
        port: 10000,
        priority: 2,
        envVars: [
          'PORT=10000',
          'NODE_ENV=production',
          'JWT_SECRET=auto-generate',
          'AUTH_SERVICE_URL=https://factcheck-auth-docker.onrender.com',
          'VIRUSTOTAL_API_KEY=sync',
          'SCAMADVISER_API_KEY=sync',
          'IPQUALITYSCORE_API_KEY=sync'
        ]
      },
      {
        name: 'factcheck-community-docker',
        folder: 'community-service',
        port: 10000,
        priority: 2,
        envVars: [
          'PORT=10000',
          'NODE_ENV=production',
          'JWT_SECRET=auto-generate',
          'AUTH_SERVICE_URL=https://factcheck-auth-docker.onrender.com',
          'FIREBASE_PROJECT_ID=sync',
          'FIREBASE_PRIVATE_KEY=sync',
          'FIREBASE_CLIENT_EMAIL=sync'
        ]
      },
      {
        name: 'factcheck-chat-docker',
        folder: 'chat-service',
        port: 10000,
        priority: 2,
        envVars: [
          'PORT=10000',
          'NODE_ENV=production',
          'JWT_SECRET=auto-generate',
          'AUTH_SERVICE_URL=https://factcheck-auth-docker.onrender.com',
          'GEMINI_API_KEY=sync'
        ]
      },
      {
        name: 'factcheck-news-docker',
        folder: 'news-service',
        port: 10000,
        priority: 2,
        envVars: [
          'PORT=10000',
          'NODE_ENV=production',
          'JWT_SECRET=auto-generate',
          'AUTH_SERVICE_URL=https://factcheck-auth-docker.onrender.com',
          'NEWSAPI_API_KEY=sync',
          'NEWSDATA_API_KEY=sync'
        ]
      },
      {
        name: 'factcheck-admin-docker',
        folder: 'admin-service',
        port: 10000,
        priority: 2,
        envVars: [
          'PORT=10000',
          'NODE_ENV=production',
          'JWT_SECRET=auto-generate',
          'AUTH_SERVICE_URL=https://factcheck-auth-docker.onrender.com',
          'COMMUNITY_SERVICE_URL=https://factcheck-community-docker.onrender.com',
          'LINK_SERVICE_URL=https://factcheck-link-docker.onrender.com',
          'FIREBASE_PROJECT_ID=sync',
          'FIREBASE_PRIVATE_KEY=sync',
          'FIREBASE_CLIENT_EMAIL=sync'
        ]
      },
      {
        name: 'factcheck-phishtank-docker',
        folder: 'phishtank-service',
        port: 10000,
        priority: 2,
        envVars: [
          'PORT=10000',
          'NODE_ENV=production',
          'JWT_SECRET=auto-generate',
          'AUTH_SERVICE_URL=https://factcheck-auth-docker.onrender.com',
          'PHISHTANK_API_KEY=sync'
        ]
      },
      {
        name: 'factcheck-criminalip-docker',
        folder: 'criminalip-service',
        port: 10000,
        priority: 2,
        envVars: [
          'PORT=10000',
          'NODE_ENV=production',
          'JWT_SECRET=auto-generate',
          'AUTH_SERVICE_URL=https://factcheck-auth-docker.onrender.com',
          'CRIMINALIP_API_KEY=sync'
        ]
      },
      {
        name: 'factcheck-api-gateway-docker',
        folder: 'api-gateway',
        port: 10000,
        priority: 3,
        envVars: [
          'PORT=10000',
          'NODE_ENV=production',
          'JWT_SECRET=auto-generate',
          'AUTH_SERVICE_URL=https://factcheck-auth-docker.onrender.com',
          'LINK_SERVICE_URL=https://factcheck-link-docker.onrender.com',
          'COMMUNITY_SERVICE_URL=https://factcheck-community-docker.onrender.com',
          'CHAT_SERVICE_URL=https://factcheck-chat-docker.onrender.com',
          'NEWS_SERVICE_URL=https://factcheck-news-docker.onrender.com',
          'ADMIN_SERVICE_URL=https://factcheck-admin-docker.onrender.com',
          'PHISHTANK_SERVICE_URL=https://factcheck-phishtank-docker.onrender.com',
          'CRIMINALIP_SERVICE_URL=https://factcheck-criminalip-docker.onrender.com'
        ]
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

  generateRenderYaml() {
    const config = {
      services: []
    };

    // Add backend services
    for (const service of this.services) {
      const serviceConfig = {
        type: 'web',
        name: service.name,
        env: 'docker',
        plan: 'free',
        region: 'oregon',
        dockerfilePath: `./services/${service.folder}/Dockerfile`,
        dockerContext: '.',
        healthCheckPath: '/health',
        envVars: []
      };

      // Add environment variables
      for (const envVar of service.envVars) {
        const [key, value] = envVar.split('=');
        
        if (value === 'auto-generate') {
          serviceConfig.envVars.push({
            key: key,
            generateValue: true
          });
        } else if (value === 'sync') {
          serviceConfig.envVars.push({
            key: key,
            sync: false
          });
        } else {
          serviceConfig.envVars.push({
            key: key,
            value: value
          });
        }
      }

      config.services.push(serviceConfig);
    }

    // Add frontend service
    config.services.push({
      type: 'static',
      name: 'factcheck-frontend-docker',
      env: 'docker',
      plan: 'free',
      region: 'oregon',
      dockerfilePath: './client/Dockerfile',
      dockerContext: '.',
      envVars: [
        {
          key: 'REACT_APP_API_URL',
          value: 'https://factcheck-api-gateway-docker.onrender.com'
        },
        {
          key: 'REACT_APP_FIREBASE_API_KEY',
          sync: false
        },
        {
          key: 'REACT_APP_FIREBASE_AUTH_DOMAIN',
          sync: false
        },
        {
          key: 'REACT_APP_FIREBASE_PROJECT_ID',
          sync: false
        },
        {
          key: 'REACT_APP_FIREBASE_STORAGE_BUCKET',
          sync: false
        },
        {
          key: 'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
          sync: false
        },
        {
          key: 'REACT_APP_FIREBASE_APP_ID',
          sync: false
        },
        {
          key: 'GENERATE_SOURCEMAP',
          value: 'false'
        }
      ]
    });

    return config;
  }

  generateDockerComposeOverride() {
    const override = {
      version: '3.8',
      services: {}
    };

    // Add Render-specific overrides
    for (const service of this.services) {
      const serviceName = service.folder.replace('-service', '');
      override.services[serviceName] = {
        environment: [
          'PORT=10000',
          'NODE_ENV=production'
        ],
        ports: ['10000:10000']
      };
    }

    return override;
  }

  generateDeploymentInstructions() {
    const instructions = `# 🐳 Render Docker Deployment Instructions

## 📋 Generated Files:
- \`render-docker.yaml\` - Complete Render configuration
- \`docker-compose.render.yml\` - Local testing override
- \`deploy-render-docker.ps1\` - PowerShell deployment helper

## 🚀 Deployment Steps:

### Option 1: Individual Service Deployment (Recommended)

Deploy each service manually on Render dashboard:

${this.services
  .sort((a, b) => a.priority - b.priority)
  .map((service, index) => `${index + 1}. **${service.name}**
   - Environment: Docker
   - Root Directory: services/${service.folder}
   - Dockerfile Path: ./Dockerfile
   - Docker Context: .
   - Health Check: /health`)
  .join('\n\n')}

### Option 2: render.yaml Deployment

1. Upload \`render-docker.yaml\` to your repository root
2. Rename to \`render.yaml\`
3. Render will auto-deploy all services

## 🔧 Environment Variables:

Each service needs these environment variables (use "Add from .env"):

### Base Variables (all services):
\`\`\`
PORT=10000
NODE_ENV=production
JWT_SECRET=your-jwt-secret
\`\`\`

### Firebase Services (auth, community, chat, news, admin):
\`\`\`
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
\`\`\`

### API Keys (as needed):
\`\`\`
GEMINI_API_KEY=your-key
VIRUSTOTAL_API_KEY=your-key
SCAMADVISER_API_KEY=your-key
NEWSAPI_API_KEY=your-key
PHISHTANK_API_KEY=your-key
CRIMINALIP_API_KEY=your-key
\`\`\`

## 🎯 Final URLs:

After deployment:
- Frontend: https://factcheck-frontend-docker.onrender.com
- API Gateway: https://factcheck-api-gateway-docker.onrender.com
- Auth Service: https://factcheck-auth-docker.onrender.com

## 🔍 Testing:

Test each service health endpoint:
\`\`\`bash
curl https://factcheck-auth-docker.onrender.com/health
curl https://factcheck-api-gateway-docker.onrender.com/health
\`\`\`

## 💡 Tips:

1. Deploy Auth service first
2. Test health endpoints after each deployment
3. Update service URLs in API Gateway environment
4. Monitor build logs for Docker issues
5. Use Docker layer caching for faster builds
`;

    return instructions;
  }

  async generate() {
    try {
      this.log('🐳 Generating Render Docker deployment files...', 'info');

      // Generate render.yaml
      const renderConfig = this.generateRenderYaml();
      const renderYamlPath = path.join(this.projectRoot, 'render-docker.yaml');
      
      // Convert to YAML format manually (simple approach)
      let yamlContent = 'services:\n';
      
      for (const service of renderConfig.services) {
        yamlContent += `  - type: ${service.type}\n`;
        yamlContent += `    name: ${service.name}\n`;
        yamlContent += `    env: ${service.env}\n`;
        yamlContent += `    plan: ${service.plan}\n`;
        yamlContent += `    region: ${service.region}\n`;
        
        if (service.dockerfilePath) {
          yamlContent += `    dockerfilePath: ${service.dockerfilePath}\n`;
        }
        if (service.dockerContext) {
          yamlContent += `    dockerContext: ${service.dockerContext}\n`;
        }
        if (service.healthCheckPath) {
          yamlContent += `    healthCheckPath: ${service.healthCheckPath}\n`;
        }
        
        if (service.envVars && service.envVars.length > 0) {
          yamlContent += `    envVars:\n`;
          for (const envVar of service.envVars) {
            yamlContent += `      - key: ${envVar.key}\n`;
            if (envVar.value) {
              yamlContent += `        value: ${envVar.value}\n`;
            } else if (envVar.generateValue) {
              yamlContent += `        generateValue: true\n`;
            } else if (envVar.sync === false) {
              yamlContent += `        sync: false\n`;
            }
          }
        }
        yamlContent += '\n';
      }

      fs.writeFileSync(renderYamlPath, yamlContent);
      this.log(`✅ Created ${renderYamlPath}`, 'success');

      // Generate docker-compose override
      const dockerOverride = this.generateDockerComposeOverride();
      const dockerOverridePath = path.join(this.projectRoot, 'docker-compose.render.yml');
      fs.writeFileSync(dockerOverridePath, JSON.stringify(dockerOverride, null, 2));
      this.log(`✅ Created ${dockerOverridePath}`, 'success');

      // Generate instructions
      const instructions = this.generateDeploymentInstructions();
      const instructionsPath = path.join(this.projectRoot, 'RENDER_DOCKER_INSTRUCTIONS.md');
      fs.writeFileSync(instructionsPath, instructions);
      this.log(`✅ Created ${instructionsPath}`, 'success');

      this.log('🎉 Render Docker deployment files generated successfully!', 'success');
      this.log('📖 Check RENDER_DOCKER_INSTRUCTIONS.md for deployment guide', 'info');
      this.log('🚀 Run ./deploy-render-docker.ps1 for interactive deployment', 'info');

    } catch (error) {
      this.log(`💥 Generation failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const generator = new RenderDockerGenerator();
  generator.generate();
}

module.exports = RenderDockerGenerator;
