#!/usr/bin/env node

/**
 * 🚀 RENDER DEPLOYMENT FIX SCRIPT
 * Fixes common deployment issues for Anti-Fraud Platform on Render
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 FIXING RENDER DEPLOYMENT ISSUES...');
console.log('=====================================');

// 1. Fix CORS configuration
function fixCORSConfig() {
  console.log('\n🌐 1. Fixing CORS Configuration...');
  
  const envPath = '.env';
  const envProductionPath = '.env.production';
  
  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Update ALLOWED_ORIGINS to include Render domains
    const newCorsConfig = 'ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080,https://frontend-eklp.onrender.com,https://factcheck-api-gateway.onrender.com,https://factcheck-frontend.onrender.com';
    
    if (envContent.includes('ALLOWED_ORIGINS=')) {
      envContent = envContent.replace(/ALLOWED_ORIGINS=.*/, newCorsConfig);
    } else {
      envContent += '\n' + newCorsConfig;
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log('   ✅ Updated .env CORS configuration');
  }
  
  // Update production env
  if (fs.existsSync(envProductionPath)) {
    console.log('   ✅ .env.production already exists');
  } else {
    console.log('   ⚠️  .env.production not found, create it manually');
  }
}

// 2. Fix API base URL configuration
function fixAPIConfiguration() {
  console.log('\n🔗 2. Fixing API Configuration...');
  
  const apiPath = 'client/src/services/api.js';
  
  if (fs.existsSync(apiPath)) {
    let apiContent = fs.readFileSync(apiPath, 'utf8');
    
    // Check if production URL is correctly set
    if (apiContent.includes('https://factcheck-api-gateway.onrender.com')) {
      console.log('   ✅ API production URL already configured');
    } else if (apiContent.includes("return '/';")) {
      // Fix relative URL issue
      apiContent = apiContent.replace(
        "return '/'; // Use relative URL for production",
        "return 'https://factcheck-api-gateway.onrender.com'; // Use API Gateway URL for production"
      );
      fs.writeFileSync(apiPath, apiContent);
      console.log('   ✅ Fixed relative URL issue in api.js');
    }
  } else {
    console.log('   ⚠️  api.js not found');
  }
}

// 3. Create missing static files
function createMissingStaticFiles() {
  console.log('\n📁 3. Creating Missing Static Files...');
  
  const publicDir = 'client/public';
  
  // Create manifest.json if missing
  const manifestPath = path.join(publicDir, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    const manifest = {
      "short_name": "FactCheck",
      "name": "Anti-Fraud Platform",
      "description": "Comprehensive platform for detecting and preventing online fraud, fake news, and malicious links",
      "icons": [
        {
          "src": "favicon.svg",
          "sizes": "any",
          "type": "image/svg+xml"
        }
      ],
      "start_url": ".",
      "display": "standalone",
      "theme_color": "#009688",
      "background_color": "#ffffff"
    };
    
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log('   ✅ Created manifest.json');
  } else {
    console.log('   ✅ manifest.json already exists');
  }
  
  // Create favicon.svg if missing
  const faviconPath = path.join(publicDir, 'favicon.svg');
  if (!fs.existsSync(faviconPath)) {
    const faviconSVG = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="32" height="32" rx="6" fill="#009688"/>
<path d="M16 6L17.45 12.35L24 13L17.45 21.65L16 28L14.55 21.65L8 13L14.55 12.35L16 6Z" fill="white"/>
</svg>`;
    
    fs.writeFileSync(faviconPath, faviconSVG);
    console.log('   ✅ Created favicon.svg');
  } else {
    console.log('   ✅ favicon.svg already exists');
  }
}

// 4. Check Render deployment configuration
function checkRenderConfig() {
  console.log('\n🚀 4. Checking Render Configuration...');
  
  const renderFiles = [
    'render-docker.yaml',
    'docker-compose.render.yml',
    'deploy-render-docker.ps1'
  ];
  
  renderFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`   ✅ ${file} exists`);
    } else {
      console.log(`   ⚠️  ${file} missing`);
    }
  });
}

// 5. Environment variables check
function checkEnvironmentVariables() {
  console.log('\n🔑 5. Environment Variables Check...');
  
  const requiredVars = [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_PRIVATE_KEY',
    'JWT_SECRET',
    'ALLOWED_ORIGINS'
  ];
  
  const envPath = '.env';
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    requiredVars.forEach(varName => {
      if (envContent.includes(`${varName}=`)) {
        console.log(`   ✅ ${varName} configured`);
      } else {
        console.log(`   ❌ ${varName} missing`);
      }
    });
  } else {
    console.log('   ❌ .env file not found');
  }
}

// Main execution
async function main() {
  try {
    fixCORSConfig();
    fixAPIConfiguration();
    createMissingStaticFiles();
    checkRenderConfig();
    checkEnvironmentVariables();
    
    console.log('\n🎉 DEPLOYMENT FIX COMPLETED!');
    console.log('=====================================');
    console.log('\n📋 NEXT STEPS FOR RENDER:');
    console.log('1. Push your code to GitHub');
    console.log('2. Redeploy all services on Render');
    console.log('3. Make sure environment variables are set in Render dashboard:');
    console.log('   - ALLOWED_ORIGINS (include your frontend domain)');
    console.log('   - All Firebase credentials');
    console.log('   - All API keys');
    console.log('\n🌐 Expected working URLs:');
    console.log('- Frontend: https://frontend-eklp.onrender.com');
    console.log('- API Gateway: https://factcheck-api-gateway.onrender.com');
    
  } catch (error) {
    console.error('❌ Error during deployment fix:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { fixCORSConfig, fixAPIConfiguration, createMissingStaticFiles };
