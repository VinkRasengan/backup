#!/usr/bin/env node

/**
 * 🔧 RENDER ENVIRONMENT VARIABLES GENERATOR
 * Generates environment variables format for Render Dashboard
 */

const fs = require('fs');
const path = require('path');

console.log('🔑 RENDER ENVIRONMENT VARIABLES GENERATOR');
console.log('==========================================');

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File ${filePath} not found`);
    return {};
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const envVars = {};

  lines.forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#') && line.includes('=')) {
      const [key, ...valueParts] = line.split('=');
      let value = valueParts.join('=');
      
      // Remove quotes if present
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      
      envVars[key] = value;
    }
  });

  return envVars;
}

function generateRenderEnvVars() {
  console.log('\n📋 ENVIRONMENT VARIABLES FOR RENDER DASHBOARD:');
  console.log('===============================================');
  
  const envProd = parseEnvFile('.env.production');
  
  // Essential variables for API Gateway
  const apiGatewayVars = [
    'NODE_ENV',
    'PORT',
    'ALLOWED_ORIGINS',
    'JWT_SECRET',
    'FIREBASE_PROJECT_ID',
    'FIREBASE_CLIENT_EMAIL', 
    'FIREBASE_PRIVATE_KEY',
    'AUTH_SERVICE_URL',
    'LINK_SERVICE_URL',
    'COMMUNITY_SERVICE_URL',
    'CHAT_SERVICE_URL',
    'NEWS_SERVICE_URL',
    'ADMIN_SERVICE_URL',
    'CRIMINALIP_SERVICE_URL',
    'PHISHTANK_SERVICE_URL'
  ];

  console.log('\n🔗 API GATEWAY SERVICE ENVIRONMENT VARIABLES:');
  console.log('==============================================');
  
  apiGatewayVars.forEach(varName => {
    const value = envProd[varName];
    if (value) {
      console.log(`${varName}=${value}`);
    } else {
      console.log(`${varName}=<NOT_SET>`);
    }
  });

  // Frontend variables
  console.log('\n🌐 FRONTEND SERVICE ENVIRONMENT VARIABLES:');
  console.log('==========================================');
  
  const frontendVars = [
    'NODE_ENV',
    'REACT_APP_API_URL',
    'REACT_APP_FIREBASE_API_KEY',
    'REACT_APP_FIREBASE_AUTH_DOMAIN',
    'REACT_APP_FIREBASE_PROJECT_ID'
  ];

  frontendVars.forEach(varName => {
    const value = envProd[varName];
    if (value) {
      console.log(`${varName}=${value}`);
    } else {
      console.log(`${varName}=<NOT_SET>`);
    }
  });

  // Missing variables check
  console.log('\n⚠️  MISSING VARIABLES CHECK:');
  console.log('=============================');
  
  const requiredVars = ['NODE_ENV', 'ALLOWED_ORIGINS', 'FIREBASE_PROJECT_ID', 'JWT_SECRET'];
  let missingVars = [];
  
  requiredVars.forEach(varName => {
    if (!envProd[varName]) {
      missingVars.push(varName);
    }
  });

  if (missingVars.length > 0) {
    console.log('❌ Missing required variables:', missingVars.join(', '));
  } else {
    console.log('✅ All required variables present');
  }

  // Additional configuration needed
  console.log('\n📝 ADDITIONAL RENDER CONFIGURATION:');
  console.log('===================================');
  console.log('PORT=8080 (will be automatically set by Render)');
  console.log('REDIS_URL=<will be provided by Render Redis add-on if needed>');
}

function checkRenderConfiguration() {
  console.log('\n🚀 RENDER SERVICE CONFIGURATION CHECK:');
  console.log('======================================');
  
  console.log('\n✅ API Gateway Service Settings:');
  console.log('- Name: factcheck-api-gateway');
  console.log('- Type: Web Service');
  console.log('- Runtime: Node');
  console.log('- Root Directory: services/api-gateway');
  console.log('- Build Command: npm install');
  console.log('- Start Command: npm start');
  console.log('- Port: 8080 (auto-detected)');
  
  console.log('\n✅ Frontend Service Settings:');
  console.log('- Name: frontend-eklp (or your chosen name)');
  console.log('- Type: Static Site');
  console.log('- Runtime: Node');
  console.log('- Root Directory: client');
  console.log('- Build Command: npm install && npm run build');
  console.log('- Publish Directory: client/build');
}

// Main execution
function main() {
  generateRenderEnvVars();
  checkRenderConfiguration();

  console.log('\n🎯 NEXT STEPS:');
  console.log('==============');
  console.log('1. Copy the environment variables above');
  console.log('2. Paste them in Render Dashboard > Service > Environment');
  console.log('3. Deploy the service');
  console.log('4. Check logs for any errors');
  console.log('5. Test the API Gateway health endpoint');
  
  console.log('\n🔗 Test URLs after deployment:');
  console.log('- API Gateway Health: https://factcheck-api-gateway.onrender.com/health');
  console.log('- API Gateway Info: https://factcheck-api-gateway.onrender.com/info');
  console.log('- Frontend: https://frontend-eklp.onrender.com');
}

if (require.main === module) {
  main();
}

module.exports = { parseEnvFile, generateRenderEnvVars };
