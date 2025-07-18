#!/usr/bin/env node

/**
 * Fix Production Deployment Issues
 * This script fixes all the issues preventing proper production deployment on Render
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing production deployment issues...');

// Current Render service URLs based on your deployment
const RENDER_SERVICES = {
  FRONTEND_URL: 'https://frontend-j8de.onrender.com',
  API_GATEWAY_URL: 'https://api-gateway-3lr5.onrender.com',
  AUTH_SERVICE_URL: 'https://backup-r5zz.onrender.com',
  LINK_SERVICE_URL: 'https://link-service-dtw1.onrender.com',
  COMMUNITY_SERVICE_URL: 'https://community-service-n3ou.onrender.com',
  CHAT_SERVICE_URL: 'https://chat-service-6993.onrender.com',
  NEWS_SERVICE_URL: 'https://news-service-71ni.onrender.com',
  ADMIN_SERVICE_URL: 'https://admin-service-ttvm.onrender.com',
  PHISHTANK_SERVICE_URL: 'https://phishtank-service.onrender.com',
  CRIMINALIP_SERVICE_URL: 'https://criminalip-service.onrender.com'
};

function updateRedirectsFile() {
  console.log('📝 Updating _redirects file...');
  
  const redirectsPath = path.join(__dirname, 'client/public/_redirects');
  const redirectsContent = `# Render Static Site Redirects - Production
# API routes - proxy to backend
/api/* ${RENDER_SERVICES.API_GATEWAY_URL}/api/:splat 200

# Health check
/health ${RENDER_SERVICES.API_GATEWAY_URL}/health 200

# SPA fallback for all other routes (React Router)
/* /index.html 200
`;

  fs.writeFileSync(redirectsPath, redirectsContent, 'utf8');
  console.log('✅ _redirects file updated');
}

function updateProductionEnv() {
  console.log('📝 Updating .env.production...');
  
  const envPath = path.join(__dirname, '.env.production');
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Update service URLs
  envContent = envContent.replace(/AUTH_SERVICE_URL=.*/g, `AUTH_SERVICE_URL=${RENDER_SERVICES.AUTH_SERVICE_URL}`);
  envContent = envContent.replace(/LINK_SERVICE_URL=.*/g, `LINK_SERVICE_URL=${RENDER_SERVICES.LINK_SERVICE_URL}`);
  envContent = envContent.replace(/COMMUNITY_SERVICE_URL=.*/g, `COMMUNITY_SERVICE_URL=${RENDER_SERVICES.COMMUNITY_SERVICE_URL}`);
  envContent = envContent.replace(/CHAT_SERVICE_URL=.*/g, `CHAT_SERVICE_URL=${RENDER_SERVICES.CHAT_SERVICE_URL}`);
  envContent = envContent.replace(/NEWS_SERVICE_URL=.*/g, `RENDER_SERVICES.NEWS_SERVICE_URL}`);
  envContent = envContent.replace(/ADMIN_SERVICE_URL=.*/g, `ADMIN_SERVICE_URL=${RENDER_SERVICES.ADMIN_SERVICE_URL}`);
  envContent = envContent.replace(/PHISHTANK_SERVICE_URL=.*/g, `PHISHTANK_SERVICE_URL=${RENDER_SERVICES.PHISHTANK_SERVICE_URL}`);
  envContent = envContent.replace(/CRIMINALIP_SERVICE_URL=.*/g, `CRIMINALIP_SERVICE_URL=${RENDER_SERVICES.CRIMINALIP_SERVICE_URL}`);
  
  // Update CORS and frontend URLs
  envContent = envContent.replace(/ALLOWED_ORIGINS=.*/g, `ALLOWED_ORIGINS=${RENDER_SERVICES.FRONTEND_URL}`);
  envContent = envContent.replace(/CORS_ORIGIN=.*/g, `CORS_ORIGIN=${RENDER_SERVICES.FRONTEND_URL}`);
  envContent = envContent.replace(/REACT_APP_API_URL=.*/g, `REACT_APP_API_URL=${RENDER_SERVICES.API_GATEWAY_URL}`);
  
  fs.writeFileSync(envPath, envContent, 'utf8');
  console.log('✅ .env.production updated');
}

function updateRenderTemplate() {
  console.log('📝 Updating render-environment-template.env...');
  
  const templatePath = path.join(__dirname, 'render-environment-template.env');
  if (fs.existsSync(templatePath)) {
    let templateContent = fs.readFileSync(templatePath, 'utf8');
    
    // Update URLs in template
    templateContent = templateContent.replace(/REACT_APP_API_URL=.*/g, `REACT_APP_API_URL=${RENDER_SERVICES.API_GATEWAY_URL}`);
    templateContent = templateContent.replace(/FRONTEND_URL=.*/g, `FRONTEND_URL=${RENDER_SERVICES.FRONTEND_URL}`);
    
    fs.writeFileSync(templatePath, templateContent, 'utf8');
    console.log('✅ render-environment-template.env updated');
  }
}

function createDeploymentSummary() {
  console.log('📋 Creating deployment summary...');
  
  const summary = `# Production Deployment Configuration Summary

## Current Render Services
- Frontend: ${RENDER_SERVICES.FRONTEND_URL}
- API Gateway: ${RENDER_SERVICES.API_GATEWAY_URL}
- Auth Service: ${RENDER_SERVICES.AUTH_SERVICE_URL}
- Link Service: ${RENDER_SERVICES.LINK_SERVICE_URL}
- Community Service: ${RENDER_SERVICES.COMMUNITY_SERVICE_URL}
- Chat Service: ${RENDER_SERVICES.CHAT_SERVICE_URL}
- News Service: ${RENDER_SERVICES.NEWS_SERVICE_URL}
- Admin Service: ${RENDER_SERVICES.ADMIN_SERVICE_URL}

## Environment Variables to Set in Render

### Frontend Service (${RENDER_SERVICES.FRONTEND_URL})
\`\`\`
REACT_APP_API_URL=${RENDER_SERVICES.API_GATEWAY_URL}
REACT_APP_FIREBASE_API_KEY=AIzaSyDszcx_S3Wm65ACIprlmJLDu5FPmDfX1nE
REACT_APP_FIREBASE_AUTH_DOMAIN=factcheck-1d6e8.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=factcheck-1d6e8
GENERATE_SOURCEMAP=false
\`\`\`

### API Gateway Service (${RENDER_SERVICES.API_GATEWAY_URL})
\`\`\`
NODE_ENV=production
PORT=10000
AUTH_SERVICE_URL=${RENDER_SERVICES.AUTH_SERVICE_URL}
LINK_SERVICE_URL=${RENDER_SERVICES.LINK_SERVICE_URL}
COMMUNITY_SERVICE_URL=${RENDER_SERVICES.COMMUNITY_SERVICE_URL}
CHAT_SERVICE_URL=${RENDER_SERVICES.CHAT_SERVICE_URL}
NEWS_SERVICE_URL=${RENDER_SERVICES.NEWS_SERVICE_URL}
ADMIN_SERVICE_URL=${RENDER_SERVICES.ADMIN_SERVICE_URL}
ALLOWED_ORIGINS=${RENDER_SERVICES.FRONTEND_URL}
CORS_ORIGIN=${RENDER_SERVICES.FRONTEND_URL}
JWT_SECRET=microservices_factcheck_platform_secret_key_development_2024_very_long_secure_key
\`\`\`

## Issues Fixed
1. ✅ Updated _redirects file to point to correct API Gateway
2. ✅ Fixed service URLs in .env.production
3. ✅ Updated CORS configuration
4. ✅ Ensured proper API routing

## Next Steps
1. Deploy the updated code to Render
2. Verify all environment variables are set correctly in Render dashboard
3. Test API endpoints and routing
4. Monitor logs for any remaining issues
`;

  fs.writeFileSync(path.join(__dirname, 'DEPLOYMENT_SUMMARY.md'), summary, 'utf8');
  console.log('✅ Deployment summary created');
}

// Run all fixes
try {
  updateRedirectsFile();
  updateProductionEnv();
  updateRenderTemplate();
  createDeploymentSummary();
  
  console.log('\n🎉 All production deployment issues have been fixed!');
  console.log('📋 Check DEPLOYMENT_SUMMARY.md for next steps');
  console.log('\n⚠️  Important: Make sure to update environment variables in Render dashboard');
  
} catch (error) {
  console.error('❌ Error fixing deployment issues:', error.message);
  process.exit(1);
}
