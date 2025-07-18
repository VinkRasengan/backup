#!/usr/bin/env node

/**
 * Fix API Configuration Issues
 * This script ensures all API calls use the correct URLs for production
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing API configuration issues...');

// Files that need API URL fixes
const filesToFix = [
  'client/src/services/api.js',
  'client/src/services/communityAPI.js',
  'client/src/utils/apiConfig.js',
  'client/src/config/gemini.js',
  'client/src/services/scamAdviserService.js'
];

function fixApiConfiguration() {
  filesToFix.forEach(filePath => {
    const fullPath = path.join(__dirname, filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return;
    }
    
    console.log(`📝 Fixing ${filePath}...`);
    
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Ensure the getApiBaseUrl function prioritizes REACT_APP_API_URL
    const newGetApiBaseUrl = `const getApiBaseUrl = () => {
  // Use environment variable if set (production should have this)
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  // Fallback based on environment
  if (process.env.NODE_ENV === 'production') {
    // For production, use relative URLs that will be handled by _redirects
    return '';
  }

  return 'http://localhost:8080'; // Development fallback (API Gateway port)
};`;

    // Replace the getApiBaseUrl function
    content = content.replace(
      /const getApiBaseUrl = \(\) => \{[\s\S]*?\};/g,
      newGetApiBaseUrl
    );
    
    // Also fix any hardcoded URLs
    content = content.replace(/https:\/\/api-gateway-3lr5\.onrender\.com/g, 'process.env.REACT_APP_API_URL || ""');
    content = content.replace(/https:\/\/backup-zhhs\.onrender\.com/g, 'process.env.REACT_APP_API_URL || ""');
    
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Fixed ${filePath}`);
  });
}

function createApiTestScript() {
  console.log('📝 Creating API test script...');
  
  const testScript = `#!/usr/bin/env node

/**
 * Test API Endpoints
 * This script tests all critical API endpoints to ensure they're working
 */

const https = require('https');
const http = require('http');

const API_BASE_URL = 'https://api-gateway-3lr5.onrender.com';

const endpoints = [
  '/health',
  '/api/auth/test',
  '/api/users/profile',
  '/api/community/links',
  '/api/chat/test'
];

function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    const url = API_BASE_URL + endpoint;
    const client = url.startsWith('https') ? https : http;
    
    console.log(\`🔍 Testing: \${url}\`);
    
    const req = client.get(url, (res) => {
      console.log(\`✅ \${endpoint}: \${res.statusCode}\`);
      resolve({ endpoint, status: res.statusCode, success: res.statusCode < 500 });
    });
    
    req.on('error', (error) => {
      console.log(\`❌ \${endpoint}: \${error.message}\`);
      resolve({ endpoint, error: error.message, success: false });
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      console.log(\`⏰ \${endpoint}: Timeout\`);
      resolve({ endpoint, error: 'Timeout', success: false });
    });
  });
}

async function runTests() {
  console.log('🧪 Testing API endpoints...');
  
  const results = [];
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    results.push(result);
  }
  
  console.log('\\n📊 Test Results:');
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(\`\${status} \${result.endpoint}: \${result.status || result.error}\`);
  });
  
  const successCount = results.filter(r => r.success).length;
  console.log(\`\\n🎯 \${successCount}/\${results.length} endpoints working\`);
}

if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };
`;

  fs.writeFileSync(path.join(__dirname, 'test-api-endpoints.js'), testScript, 'utf8');
  console.log('✅ API test script created');
}

// Run fixes
try {
  fixApiConfiguration();
  createApiTestScript();
  
  console.log('\n🎉 API configuration fixes completed!');
  console.log('🧪 Run "node test-api-endpoints.js" to test API endpoints');
  
} catch (error) {
  console.error('❌ Error fixing API configuration:', error.message);
  process.exit(1);
}
