#!/usr/bin/env node

/**
 * Debug Community Service
 * This script helps debug why the community service is not responding
 */

const https = require('https');

const COMMUNITY_SERVICE_URL = 'https://community-service-n3ou.onrender.com';

function testEndpoint(path, description) {
  return new Promise((resolve) => {
    const url = COMMUNITY_SERVICE_URL + path;
    console.log(`🔍 Testing ${description}: ${url}`);
    
    const req = https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`📊 Status: ${res.statusCode} ${res.statusMessage}`);
        console.log(`📝 Headers:`, res.headers);
        if (data) {
          console.log(`📄 Response (first 200 chars):`, data.substring(0, 200));
        }
        resolve({ 
          path, 
          status: res.statusCode, 
          success: res.statusCode < 400,
          data: data.substring(0, 500),
          headers: res.headers
        });
      });
    });
    
    req.on('error', (error) => {
      console.log(`❌ Error: ${error.message}`);
      console.log(`🔍 Error code: ${error.code}`);
      resolve({ 
        path, 
        error: error.message, 
        code: error.code,
        success: false 
      });
    });
    
    req.setTimeout(30000, () => {
      req.destroy();
      console.log(`⏰ Timeout after 30 seconds`);
      resolve({ 
        path, 
        error: 'Timeout', 
        success: false 
      });
    });
  });
}

async function debugCommunityService() {
  console.log('🔧 Debugging Community Service...\n');
  
  const endpoints = [
    { path: '/', description: 'Root endpoint' },
    { path: '/health', description: 'Health check' },
    { path: '/links', description: 'Links endpoint' },
    { path: '/api/links', description: 'API Links endpoint' }
  ];
  
  for (const endpoint of endpoints) {
    console.log('='.repeat(60));
    const result = await testEndpoint(endpoint.path, endpoint.description);
    console.log('');
    
    if (result.success) {
      console.log('✅ This endpoint is working!');
    } else {
      console.log('❌ This endpoint has issues');
      
      // Provide specific debugging advice
      if (result.error === 'Timeout') {
        console.log('💡 Suggestion: Service might be starting up or overloaded');
      } else if (result.code === 'ENOTFOUND') {
        console.log('💡 Suggestion: DNS resolution failed - service might not be deployed');
      } else if (result.code === 'ECONNREFUSED') {
        console.log('💡 Suggestion: Service is not listening on the expected port');
      } else if (result.status >= 500) {
        console.log('💡 Suggestion: Internal server error - check service logs');
      }
    }
    console.log('');
  }
  
  console.log('🎯 DEBUGGING SUMMARY:');
  console.log('If all endpoints are failing:');
  console.log('1. Check Render service logs for errors');
  console.log('2. Verify the service is using the correct PORT environment variable');
  console.log('3. Ensure the service has proper health check endpoint');
  console.log('4. Check if the service needs specific environment variables');
  
  console.log('\n📋 NEXT STEPS:');
  console.log('1. Go to Render dashboard > Community Service > Logs');
  console.log('2. Look for startup errors or port binding issues');
  console.log('3. Check if NODE_ENV=production is set');
  console.log('4. Verify the service is listening on process.env.PORT');
}

if (require.main === module) {
  debugCommunityService().catch(console.error);
}

module.exports = { debugCommunityService };
