#!/usr/bin/env node

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
      console.log(`🚀 Deploying ${serviceName}-docker...`);
      
      const response = await axios.post(
        `${this.baseUrl}/services/${serviceName}-docker/deploys`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log(`✅ ${serviceName}-docker deployment triggered`);
      return response.data;
      
    } catch (error) {
      console.error(`❌ Failed to deploy ${serviceName}-docker:`, error.response?.data || error.message);
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
    console.log('\n' + '='.repeat(60));
    console.log('🎉 Docker Deployment Results');
    console.log('='.repeat(60));
    
    const successful = results.filter(r => r.status === 'success');
    const failed = results.filter(r => r.status === 'failed');
    
    if (successful.length > 0) {
      console.log(`\n✅ Successfully deployed (${successful.length}):`);
      successful.forEach(r => console.log(`   • ${r.service}-docker`));
    }
    
    if (failed.length > 0) {
      console.log(`\n❌ Failed deployments (${failed.length}):`);
      failed.forEach(r => console.log(`   • ${r.service}-docker: ${r.error}`));
    }
    
    console.log('\n🔗 Service URLs:');
    successful.forEach(r => {
      console.log(`   • https://${r.service}-docker.onrender.com`);
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
