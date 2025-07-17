#!/usr/bin/env node

/**
 * Render Service Configuration Helper
 * Generates the exact configuration needed for each Render service
 */

const services = [
  {
    name: 'link-service',
    renderName: 'link-service-2j0c',
    port: 3002,
    url: 'https://link-service-2j0c.onrender.com'
  },
  {
    name: 'phishtank-service', 
    renderName: 'phishtank-service',
    port: 3007,
    url: 'https://phishtank-service.onrender.com'
  },
  {
    name: 'api-gateway',
    renderName: 'backup-zhhs',
    port: 8080,
    url: 'https://backup-zhhs.onrender.com'
  },
  {
    name: 'criminalip-service',
    renderName: 'criminalip-service',
    port: 3008,
    url: 'https://criminalip-service.onrender.com'
  }
];

function generateServiceConfig(service) {
  return `
## ${service.name.toUpperCase()} Configuration

**Service Name:** ${service.renderName}
**URL:** ${service.url}

### Build & Deploy Settings:
- **Environment:** Docker
- **Dockerfile Path:** \`./services/${service.name}/Dockerfile.render\`
- **Docker Context:** \`.\` (root directory)
- **Build Command:** (leave empty - Docker will handle)
- **Start Command:** (leave empty - Docker will handle)

### Environment Variables:
\`\`\`
NODE_ENV=production
PORT=10000
FIREBASE_PROJECT_ID=[your-firebase-project-id]
FIREBASE_CLIENT_EMAIL=[your-firebase-client-email]  
FIREBASE_PRIVATE_KEY=[your-firebase-private-key]
JWT_SECRET=[your-jwt-secret]
\`\`\`

### Service-Specific Variables:
${getServiceSpecificEnvVars(service.name)}

### Health Check:
- **Health Check Path:** \`/health\`
- **Health Check Grace Period:** 60 seconds

---
`;
}

function getServiceSpecificEnvVars(serviceName) {
  const envVars = {
    'link-service': `\`\`\`
VIRUSTOTAL_API_KEY=[your-virustotal-key]
SCAMADVISER_API_KEY=[your-scamadviser-key]
IPQUALITYSCORE_API_KEY=[your-ipqualityscore-key]
\`\`\``,
    'phishtank-service': `\`\`\`
PHISHTANK_API_KEY=[your-phishtank-key]
\`\`\``,
    'criminalip-service': `\`\`\`
CRIMINALIP_API_KEY=[your-criminalip-key]
\`\`\``,
    'api-gateway': `\`\`\`
# Service URLs
AUTH_SERVICE_URL=https://factcheck-auth-service.onrender.com
LINK_SERVICE_URL=https://link-service-2j0c.onrender.com
COMMUNITY_SERVICE_URL=https://factcheck-community-service.onrender.com
CHAT_SERVICE_URL=https://factcheck-chat-service.onrender.com
NEWS_SERVICE_URL=https://factcheck-news-service.onrender.com
ADMIN_SERVICE_URL=https://factcheck-admin-service.onrender.com
PHISHTANK_SERVICE_URL=https://phishtank-service.onrender.com
CRIMINALIP_SERVICE_URL=https://criminalip-service.onrender.com

# CORS Configuration
CORS_ORIGIN=https://factcheck-frontend.onrender.com
\`\`\``
  };
  
  return envVars[serviceName] || '(No additional environment variables needed)';
}

function generateFullGuide() {
  let guide = `# Render Service Configuration Guide

## 🚨 Critical Fix for Build Issues

The main problem is that your Render services are configured to use Node.js environment instead of Docker. This causes the "npm install" build command to fail because it can't find the node_modules directories.

## 🔧 Fix Steps for Each Service

`;

  services.forEach(service => {
    guide += generateServiceConfig(service);
  });

  guide += `
## 🚀 Deployment Order

Deploy services in this order to avoid dependency issues:

1. **auth-service** (no dependencies)
2. **link-service** 
3. **phishtank-service**
4. **criminalip-service**
5. **community-service** (depends on auth)
6. **chat-service** (depends on auth)
7. **news-service** (depends on auth)
8. **admin-service** (depends on all services)
9. **api-gateway** (depends on all services)
10. **frontend** (depends on api-gateway)

## 🧪 Testing Commands

After deployment, test each service:

\`\`\`bash
# Test individual services
curl https://link-service-2j0c.onrender.com/health
curl https://phishtank-service.onrender.com/health
curl https://criminalip-service.onrender.com/health
curl https://backup-zhhs.onrender.com/health

# Test API Gateway routing
curl https://backup-zhhs.onrender.com/api/links/health
curl https://backup-zhhs.onrender.com/api/phishtank/health
\`\`\`

## 🔍 Troubleshooting

### If build still fails:
1. Check that Dockerfile path is exactly: \`./services/[service-name]/Dockerfile.render\`
2. Verify Docker Context is set to: \`.\` (root directory)
3. Ensure Environment is set to: \`Docker\`
4. Clear build cache in Render dashboard

### If service won't start:
1. Check environment variables are set correctly
2. Verify health check endpoint exists
3. Check service logs for specific errors
4. Ensure PORT=10000 is set

### If services can't communicate:
1. Update service URLs in API Gateway environment variables
2. Check CORS configuration
3. Verify all services are deployed and healthy

## 📞 Support

If issues persist:
1. Check Render build logs for specific errors
2. Verify all steps above are completed
3. Contact Render support with error details
`;

  return guide;
}

// Generate and save the configuration guide
const configGuide = generateFullGuide();

require('fs').writeFileSync('RENDER_SERVICE_CONFIG_GUIDE.md', configGuide);

console.log('✅ Generated RENDER_SERVICE_CONFIG_GUIDE.md');
console.log('📖 This guide contains the exact configuration for each of your Render services');
console.log('🔧 Follow the steps in the guide to fix the build issues');

// Also generate a quick reference
const quickRef = `# Quick Render Fix Reference

## Main Issue: Services using Node.js instead of Docker

## Quick Fix for each service:
1. Go to service in Render Dashboard
2. Settings → Build & Deploy
3. Change Environment to: **Docker**
4. Set Dockerfile Path to: \`./services/[service-name]/Dockerfile.render\`
5. Set Docker Context to: \`.\`
6. Clear Build Command and Start Command (leave empty)
7. Add environment variables from the main guide
8. Deploy

## Services to fix:
- link-service-2j0c
- phishtank-service  
- backup-zhhs (api-gateway)
- criminalip-service

## Test after deployment:
\`\`\`bash
curl https://link-service-2j0c.onrender.com/health
curl https://phishtank-service.onrender.com/health
curl https://backup-zhhs.onrender.com/health
curl https://criminalip-service.onrender.com/health
\`\`\`
`;

require('fs').writeFileSync('RENDER_QUICK_FIX.md', quickRef);
console.log('✅ Generated RENDER_QUICK_FIX.md for immediate reference');
