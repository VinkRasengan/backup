#!/usr/bin/env node

/**
 * Script to generate environment variables for Render deployment
 * This script helps create the correct environment variables for each service
 */

const fs = require('fs');
const path = require('path');

// Service configurations
const SERVICES = {
  'api-gateway': {
    name: 'API Gateway',
    port: 8080,
    envVars: [
      'NODE_ENV=production',
      'PORT=10000',
      'JWT_SECRET',
      'AUTH_SERVICE_URL',
      'LINK_SERVICE_URL', 
      'COMMUNITY_SERVICE_URL',
      'CHAT_SERVICE_URL',
      'NEWS_SERVICE_URL',
      'ADMIN_SERVICE_URL',
      'PHISHTANK_SERVICE_URL',
      'CRIMINALIP_SERVICE_URL',
      'ALLOWED_ORIGINS'
    ]
  },
  'auth-service': {
    name: 'Auth Service',
    port: 3001,
    envVars: [
      'NODE_ENV=production',
      'PORT=10000',
      'JWT_SECRET',
      'FIREBASE_PROJECT_ID',
      'FIREBASE_CLIENT_EMAIL',
      'FIREBASE_PRIVATE_KEY'
    ]
  },
  'link-service': {
    name: 'Link Service', 
    port: 3002,
    envVars: [
      'NODE_ENV=production',
      'PORT=10000',
      'FIREBASE_PROJECT_ID',
      'FIREBASE_CLIENT_EMAIL',
      'FIREBASE_PRIVATE_KEY',
      'VIRUSTOTAL_API_KEY',
      'GOOGLE_SAFE_BROWSING_API_KEY',
      'SCAMADVISER_API_KEY',
      'IPQUALITYSCORE_API_KEY',
      'SCREENSHOTLAYER_API_KEY'
    ]
  },
  'community-service': {
    name: 'Community Service',
    port: 3003,
    envVars: [
      'NODE_ENV=production',
      'PORT=10000',
      'FIREBASE_PROJECT_ID',
      'FIREBASE_CLIENT_EMAIL', 
      'FIREBASE_PRIVATE_KEY'
    ]
  },
  'chat-service': {
    name: 'Chat Service',
    port: 3004,
    envVars: [
      'NODE_ENV=production',
      'PORT=10000',
      'GEMINI_API_KEY',
      'FIREBASE_PROJECT_ID',
      'FIREBASE_CLIENT_EMAIL',
      'FIREBASE_PRIVATE_KEY'
    ]
  },
  'news-service': {
    name: 'News Service',
    port: 3005,
    envVars: [
      'NODE_ENV=production',
      'PORT=10000',
      'NEWSAPI_API_KEY',
      'NEWSDATA_API_KEY'
    ]
  },
  'admin-service': {
    name: 'Admin Service',
    port: 3006,
    envVars: [
      'NODE_ENV=production',
      'PORT=10000',
      'FIREBASE_PROJECT_ID',
      'FIREBASE_CLIENT_EMAIL',
      'FIREBASE_PRIVATE_KEY'
    ]
  },
  'frontend': {
    name: 'Frontend',
    port: 3000,
    envVars: [
      'REACT_APP_API_URL',
      'REACT_APP_API_GATEWAY_URL',
      'REACT_APP_FIREBASE_API_KEY',
      'REACT_APP_FIREBASE_AUTH_DOMAIN',
      'REACT_APP_FIREBASE_PROJECT_ID'
    ]
  }
};

// Default environment values
const DEFAULT_VALUES = {
  'NODE_ENV': 'production',
  'PORT': '10000',
  'JWT_SECRET': 'your-super-secret-jwt-key-change-this-in-production-factcheck-microservices-2024',
  'FIREBASE_PROJECT_ID': 'factcheck-1d6e8',
  'FIREBASE_CLIENT_EMAIL': 'firebase-adminsdk-fbsvc@factcheck-1d6e8.iam.gserviceaccount.com',
  'FIREBASE_PRIVATE_KEY': '"-----BEGIN PRIVATE KEY-----\\nYOUR_PRIVATE_KEY_HERE\\n-----END PRIVATE KEY-----\\n"',
  'GEMINI_API_KEY': 'AIzaSyDszcx_S3Wm65ACIprlmJLDu5FPmDfX1nE',
  'VIRUSTOTAL_API_KEY': 'your-virustotal-api-key',
  'GOOGLE_SAFE_BROWSING_API_KEY': 'your-google-safebrowsing-api-key',
  'SCAMADVISER_API_KEY': 'your-scamadviser-api-key',
  'IPQUALITYSCORE_API_KEY': 'WfHFgAIrlGZiZb2T8T1cVDoD0nR7BEeq',
  'SCREENSHOTLAYER_API_KEY': 'your-screenshotlayer-api-key',
  'NEWSAPI_API_KEY': 'your-newsapi-key',
  'NEWSDATA_API_KEY': 'your-newsdata-key',
  'AUTH_SERVICE_URL': 'https://backup-auth.onrender.com',
  'LINK_SERVICE_URL': 'https://backup-link.onrender.com',
  'COMMUNITY_SERVICE_URL': 'https://backup-community.onrender.com',
  'CHAT_SERVICE_URL': 'https://backup-chat.onrender.com',
  'NEWS_SERVICE_URL': 'https://backup-news.onrender.com',
  'ADMIN_SERVICE_URL': 'https://backup-admin.onrender.com',
  'PHISHTANK_SERVICE_URL': 'https://backup-phishtank.onrender.com',
  'CRIMINALIP_SERVICE_URL': 'https://backup-criminalip.onrender.com',
  'ALLOWED_ORIGINS': 'https://backup-frontend.onrender.com,https://backup-zhhs.onrender.com',
  'REACT_APP_API_URL': 'https://backup-zhhs.onrender.com',
  'REACT_APP_API_GATEWAY_URL': 'https://backup-zhhs.onrender.com',
  'REACT_APP_FIREBASE_API_KEY': 'AIzaSyDszcx_S3Wm65ACIprlmJLDu5FPmDfX1nE',
  'REACT_APP_FIREBASE_AUTH_DOMAIN': 'factcheck-1d6e8.firebaseapp.com',
  'REACT_APP_FIREBASE_PROJECT_ID': 'factcheck-1d6e8'
};

function generateServiceEnv(serviceName) {
  const service = SERVICES[serviceName];
  if (!service) {
    console.error(`❌ Unknown service: ${serviceName}`);
    return;
  }

  console.log(`\n🔧 Environment Variables for ${service.name}`);
  console.log('=' .repeat(50));
  console.log('Copy these to your Render service environment variables:\n');

  service.envVars.forEach(envVar => {
    const key = envVar.includes('=') ? envVar.split('=')[0] : envVar;
    const value = envVar.includes('=') ? envVar.split('=')[1] : DEFAULT_VALUES[key] || 'REPLACE_WITH_YOUR_VALUE';
    console.log(`${key}=${value}`);
  });

  console.log('\n📝 Notes:');
  console.log('- Replace "backup-*" URLs with your actual Render service URLs');
  console.log('- Update API keys with your actual keys');
  console.log('- PORT is automatically set by Render to 10000');
  console.log('- Use "Add from .env" feature in Render dashboard');
}

function generateAllEnvFiles() {
  console.log('🚀 Generating environment files for all services...\n');

  Object.keys(SERVICES).forEach(serviceName => {
    const service = SERVICES[serviceName];
    const envContent = service.envVars.map(envVar => {
      const key = envVar.includes('=') ? envVar.split('=')[0] : envVar;
      const value = envVar.includes('=') ? envVar.split('=')[1] : DEFAULT_VALUES[key] || 'REPLACE_WITH_YOUR_VALUE';
      return `${key}=${value}`;
    }).join('\n');

    const fileName = `.env.${serviceName}`;
    fs.writeFileSync(fileName, envContent);
    console.log(`✅ Created ${fileName}`);
  });

  console.log('\n🎉 All environment files generated!');
  console.log('📁 Files created:');
  Object.keys(SERVICES).forEach(serviceName => {
    console.log(`   - .env.${serviceName}`);
  });
}

function showUsage() {
  console.log('🔧 Render Environment Setup Script\n');
  console.log('Usage:');
  console.log('  node scripts/setup-render-env.js [service-name]');
  console.log('  node scripts/setup-render-env.js --all\n');
  console.log('Available services:');
  Object.keys(SERVICES).forEach(serviceName => {
    console.log(`  - ${serviceName}`);
  });
  console.log('\nExamples:');
  console.log('  node scripts/setup-render-env.js api-gateway');
  console.log('  node scripts/setup-render-env.js --all');
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
  showUsage();
} else if (args[0] === '--all') {
  generateAllEnvFiles();
} else if (args[0] === '--help' || args[0] === '-h') {
  showUsage();
} else {
  generateServiceEnv(args[0]);
}

module.exports = { generateServiceEnv, generateAllEnvFiles, SERVICES, DEFAULT_VALUES };
