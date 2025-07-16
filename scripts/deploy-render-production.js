#!/usr/bin/env node

/**
 * Automated Render Production Deployment Script
 * Deploys all microservices to Render.com in the correct order
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const RENDER_API_BASE = 'https://api.render.com/v1';
const DEPLOYMENT_ORDER = [
  'auth-service',
  'link-service', 
  'community-service',
  'chat-service',
  'news-service',
  'admin-service',
  'phishtank-service',
  'criminalip-service',
  'api-gateway',
  'frontend'
];

const SERVICE_CONFIG = {
  'auth-service': {
    name: 'factcheck-auth-production',
    type: 'web_service',
    rootDir: 'services/auth-service',
    dockerfilePath: './Dockerfile',
    port: 3001,
    healthCheckPath: '/health'
  },
  'link-service': {
    name: 'factcheck-link-production',
    type: 'web_service', 
    rootDir: 'services/link-service',
    dockerfilePath: './Dockerfile',
    port: 3002,
    healthCheckPath: '/health'
  },
  'community-service': {
    name: 'factcheck-community-production',
    type: 'web_service',
    rootDir: 'services/community-service', 
    dockerfilePath: './Dockerfile',
    port: 3003,
    healthCheckPath: '/health'
  },
  'chat-service': {
    name: 'factcheck-chat-production',
    type: 'web_service',
    rootDir: 'services/chat-service',
    dockerfilePath: './Dockerfile', 
    port: 3004,
    healthCheckPath: '/health'
  },
  'news-service': {
    name: 'factcheck-news-production',
    type: 'web_service',
    rootDir: 'services/news-service',
    dockerfilePath: './Dockerfile',
    port: 3005,
    healthCheckPath: '/health'
  },
  'admin-service': {
    name: 'factcheck-admin-production',
    type: 'web_service',
    rootDir: 'services/admin-service',
    dockerfilePath: './Dockerfile',
    port: 3006,
    healthCheckPath: '/health'
  },
  'phishtank-service': {
    name: 'factcheck-phishtank-production',
    type: 'web_service',
    rootDir: 'services/phishtank-service',
    dockerfilePath: './Dockerfile',
    port: 3007,
    healthCheckPath: '/health'
  },
  'criminalip-service': {
    name: 'factcheck-criminalip-production',
    type: 'web_service',
    rootDir: 'services/criminalip-service',
    dockerfilePath: './Dockerfile',
    port: 3008,
    healthCheckPath: '/health'
  },
  'api-gateway': {
    name: 'factcheck-api-gateway-production',
    type: 'web_service',
    rootDir: 'services/api-gateway',
    dockerfilePath: './Dockerfile',
    port: 8080,
    healthCheckPath: '/health'
  },
  'frontend': {
    name: 'factcheck-frontend-production',
    type: 'static_site',
    rootDir: 'client',
    buildCommand: 'npm ci && npm run build',
    publishPath: './build'
  }
};

class RenderDeployer {
  constructor() {
    this.apiKey = process.env.RENDER_API_KEY;
    if (!this.apiKey) {
      throw new Error('RENDER_API_KEY environment variable is required');
    }
    
    this.headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    };
  }

  async makeRequest(method, endpoint, data = null) {
    try {
      const config = {
        method,
        url: `${RENDER_API_BASE}${endpoint}`,
        headers: this.headers
      };
      
      if (data) {
        config.data = data;
      }
      
      const response = await axios(config);
      return response.data;
    } catch (error) {
      console.error(`API request failed: ${error.message}`);
      if (error.response) {
        console.error('Response data:', error.response.data);
      }
      throw error;
    }
  }

  async getServices() {
    return await this.makeRequest('GET', '/services');
  }

  async createService(serviceConfig) {
    return await this.makeRequest('POST', '/services', serviceConfig);
  }

  async updateService(serviceId, serviceConfig) {
    return await this.makeRequest('PATCH', `/services/${serviceId}`, serviceConfig);
  }

  async deployService(serviceId) {
    return await this.makeRequest('POST', `/services/${serviceId}/deploys`);
  }

  async getServiceStatus(serviceId) {
    return await this.makeRequest('GET', `/services/${serviceId}`);
  }

  getEnvironmentVariables(serviceName) {
    const baseEnvVars = [
      { key: 'NODE_ENV', value: 'production' },
      { key: 'PORT', value: '10000' },
      { key: 'JWT_SECRET', value: process.env.JWT_SECRET },
      { key: 'FIREBASE_PROJECT_ID', value: process.env.FIREBASE_PROJECT_ID },
      { key: 'FIREBASE_CLIENT_EMAIL', value: process.env.FIREBASE_CLIENT_EMAIL },
      { key: 'FIREBASE_PRIVATE_KEY', value: process.env.FIREBASE_PRIVATE_KEY }
    ];

    // Service-specific environment variables
    const serviceEnvVars = {
      'api-gateway': [
        { key: 'AUTH_SERVICE_URL', value: 'https://factcheck-auth-production.onrender.com' },
        { key: 'LINK_SERVICE_URL', value: 'https://factcheck-link-production.onrender.com' },
        { key: 'COMMUNITY_SERVICE_URL', value: 'https://factcheck-community-production.onrender.com' },
        { key: 'CHAT_SERVICE_URL', value: 'https://factcheck-chat-production.onrender.com' },
        { key: 'NEWS_SERVICE_URL', value: 'https://factcheck-news-production.onrender.com' },
        { key: 'ADMIN_SERVICE_URL', value: 'https://factcheck-admin-production.onrender.com' },
        { key: 'PHISHTANK_SERVICE_URL', value: 'https://factcheck-phishtank-production.onrender.com' },
        { key: 'CRIMINALIP_SERVICE_URL', value: 'https://factcheck-criminalip-production.onrender.com' },
        { key: 'ALLOWED_ORIGINS', value: 'https://factcheck-frontend-production.onrender.com' }
      ],
      'link-service': [
        { key: 'VIRUSTOTAL_API_KEY', value: process.env.VIRUSTOTAL_API_KEY },
        { key: 'GEMINI_API_KEY', value: process.env.GEMINI_API_KEY }
      ],
      'chat-service': [
        { key: 'GEMINI_API_KEY', value: process.env.GEMINI_API_KEY }
      ],
      'news-service': [
        { key: 'NEWSAPI_API_KEY', value: process.env.NEWSAPI_API_KEY },
        { key: 'GEMINI_API_KEY', value: process.env.GEMINI_API_KEY }
      ],
      'frontend': [
        { key: 'REACT_APP_API_URL', value: 'https://factcheck-api-gateway-production.onrender.com' },
        { key: 'REACT_APP_FIREBASE_API_KEY', value: process.env.REACT_APP_FIREBASE_API_KEY || 'AIzaSyDszcx_S3Wm65ACIprlmJLDu5FPmDfX1nE' },
        { key: 'REACT_APP_FIREBASE_AUTH_DOMAIN', value: 'factcheck-1d6e8.firebaseapp.com' },
        { key: 'REACT_APP_FIREBASE_PROJECT_ID', value: process.env.FIREBASE_PROJECT_ID },
        { key: 'GENERATE_SOURCEMAP', value: 'false' }
      ]
    };

    return [...baseEnvVars, ...(serviceEnvVars[serviceName] || [])];
  }

  buildServiceConfig(serviceName) {
    const config = SERVICE_CONFIG[serviceName];
    const envVars = this.getEnvironmentVariables(serviceName);

    if (config.type === 'static_site') {
      return {
        type: 'static_site',
        name: config.name,
        repo: process.env.GITHUB_REPOSITORY || 'https://github.com/VinkRasengan/backup',
        branch: 'main',
        rootDir: config.rootDir,
        buildCommand: config.buildCommand,
        publishPath: config.publishPath,
        envVars: envVars.map(env => ({ key: env.key, value: env.value }))
      };
    } else {
      return {
        type: 'web_service',
        name: config.name,
        env: 'docker',
        repo: process.env.GITHUB_REPOSITORY || 'https://github.com/VinkRasengan/backup',
        branch: 'main',
        rootDir: config.rootDir,
        dockerfilePath: config.dockerfilePath,
        dockerContext: '.',
        healthCheckPath: config.healthCheckPath,
        envVars: envVars.map(env => ({ key: env.key, value: env.value }))
      };
    }
  }

  async deployAllServices() {
    console.log('🚀 Starting Render production deployment...\n');
    
    const results = [];
    
    for (const serviceName of DEPLOYMENT_ORDER) {
      console.log(`📦 Deploying ${serviceName}...`);
      
      try {
        const serviceConfig = this.buildServiceConfig(serviceName);
        
        // Check if service already exists
        const existingServices = await this.getServices();
        const existingService = existingServices.find(s => s.name === serviceConfig.name);
        
        let service;
        if (existingService) {
          console.log(`   ↻ Updating existing service: ${serviceConfig.name}`);
          service = await this.updateService(existingService.id, serviceConfig);
        } else {
          console.log(`   ✨ Creating new service: ${serviceConfig.name}`);
          service = await this.createService(serviceConfig);
        }
        
        // Trigger deployment
        console.log(`   🔄 Triggering deployment...`);
        const deployment = await this.deployService(service.id);
        
        results.push({
          service: serviceName,
          status: 'success',
          serviceId: service.id,
          deploymentId: deployment.id,
          url: service.serviceDetails?.url || `https://${serviceConfig.name}.onrender.com`
        });
        
        console.log(`   ✅ ${serviceName} deployment initiated successfully`);
        console.log(`   🌐 URL: https://${serviceConfig.name}.onrender.com\n`);
        
        // Wait a bit between deployments to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`   ❌ Failed to deploy ${serviceName}: ${error.message}\n`);
        results.push({
          service: serviceName,
          status: 'failed',
          error: error.message
        });
      }
    }
    
    return results;
  }

  printDeploymentSummary(results) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 DEPLOYMENT SUMMARY');
    console.log('='.repeat(60));
    
    const successful = results.filter(r => r.status === 'success');
    const failed = results.filter(r => r.status === 'failed');
    
    console.log(`✅ Successful: ${successful.length}`);
    console.log(`❌ Failed: ${failed.length}`);
    console.log(`📊 Total: ${results.length}\n`);
    
    if (successful.length > 0) {
      console.log('🎉 Successfully deployed services:');
      successful.forEach(result => {
        console.log(`   • ${result.service}: ${result.url}`);
      });
      console.log();
    }
    
    if (failed.length > 0) {
      console.log('💥 Failed deployments:');
      failed.forEach(result => {
        console.log(`   • ${result.service}: ${result.error}`);
      });
      console.log();
    }
    
    console.log('🔗 Main URLs:');
    console.log('   • Frontend: https://factcheck-frontend-production.onrender.com');
    console.log('   • API Gateway: https://factcheck-api-gateway-production.onrender.com');
    console.log('\n📝 Note: Services may take 5-10 minutes to fully start up.');
  }
}

async function main() {
  try {
    const deployer = new RenderDeployer();
    const results = await deployer.deployAllServices();
    deployer.printDeploymentSummary(results);
    
    // Exit with error code if any deployments failed
    const hasFailures = results.some(r => r.status === 'failed');
    process.exit(hasFailures ? 1 : 0);
    
  } catch (error) {
    console.error('💥 Deployment script failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { RenderDeployer };
