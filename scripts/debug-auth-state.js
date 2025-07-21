#!/usr/bin/env node

/**
 * Debug Authentication State
 * Check if user is properly authenticated and tokens are valid
 */

const axios = require('axios');

// Configuration
const API_GATEWAY_URL = 'http://localhost:8080';

async function debugAuthState() {
  console.log('🔍 Debugging Authentication State');
  console.log('='.repeat(60));

  // Check if we can access localStorage (this would be in browser)
  console.log('📱 Simulating browser localStorage check...');
  
  // Simulate different auth scenarios
  const authScenarios = [
    {
      name: 'No Auth Headers',
      headers: { 'Content-Type': 'application/json' }
    },
    {
      name: 'Invalid Token',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer invalid-token-123'
      }
    },
    {
      name: 'Valid Format Token (but expired)',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjE2NzAyNzk4MjQifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vZmFjdGNoZWNrLTFkNmU4IiwiYXVkIjoiZmFjdGNoZWNrLTFkNmU4IiwiYXV0aF90aW1lIjoxNzM3NDU0NzI5LCJ1c2VyX2lkIjoidGVzdDEyMyIsInN1YiI6InRlc3QxMjMiLCJpYXQiOjE3Mzc0NTQ3MjksImV4cCI6MTczNzQ1ODMyOSwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZpcmViYXNlIjp7ImlkZW50aXRpZXMiOnsiZW1haWwiOlsidGVzdEBleGFtcGxlLmNvbSJdfSwic2lnbl9pbl9wcm92aWRlciI6InBhc3N3b3JkIn19.expired'
      }
    }
  ];

  for (const scenario of authScenarios) {
    console.log(`\n🧪 Testing: ${scenario.name}`);
    console.log('Headers:', JSON.stringify(scenario.headers, null, 2));
    
    // Test user vote endpoint
    try {
      const response = await axios({
        method: 'GET',
        url: `${API_GATEWAY_URL}/api/votes/test123/user`,
        headers: scenario.headers,
        timeout: 10000,
        validateStatus: () => true
      });

      console.log(`📊 Response: ${response.status}`);
      console.log(`📄 Data: ${JSON.stringify(response.data, null, 2)}`);
      
      if (response.status === 200 && response.data.success) {
        console.log('✅ Request successful');
      } else if (response.status === 400 && response.data.error === 'User ID required') {
        console.log('⚠️  User ID required - auth token not providing user ID');
      } else {
        console.log(`❌ Unexpected response: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    
    console.log('-'.repeat(40));
  }

  // Test auth middleware directly
  console.log('\n🔍 Testing Auth Middleware Behavior');
  console.log('='.repeat(60));

  // Test with userId in query parameter (fallback method)
  console.log('\n🧪 Testing with userId in query parameter:');
  try {
    const response = await axios({
      method: 'GET',
      url: `${API_GATEWAY_URL}/api/votes/test123/user?userId=test-user-123`,
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
      validateStatus: () => true
    });

    console.log(`📊 Response: ${response.status}`);
    console.log(`📄 Data: ${JSON.stringify(response.data, null, 2)}`);
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  // Test with userId in request body (for POST requests)
  console.log('\n🧪 Testing vote submission with userId in body:');
  try {
    const response = await axios({
      method: 'POST',
      url: `${API_GATEWAY_URL}/api/votes/test123`,
      headers: { 'Content-Type': 'application/json' },
      data: {
        voteType: 'upvote',
        userId: 'test-user-123'
      },
      timeout: 10000,
      validateStatus: () => true
    });

    console.log(`📊 Response: ${response.status}`);
    console.log(`📄 Data: ${JSON.stringify(response.data, null, 2)}`);
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  // Test community service directly (bypass API Gateway)
  console.log('\n🔍 Testing Community Service Directly');
  console.log('='.repeat(60));

  try {
    const response = await axios({
      method: 'GET',
      url: `http://localhost:3003/api/votes/test123/user`,
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
      validateStatus: () => true
    });

    console.log(`📊 Direct Community Service Response: ${response.status}`);
    console.log(`📄 Data: ${JSON.stringify(response.data, null, 2)}`);
  } catch (error) {
    console.log(`❌ Direct Community Service Error: ${error.message}`);
  }

  console.log('\n📋 Summary & Recommendations');
  console.log('='.repeat(60));
  console.log('1. If "User ID required" error appears, user is not authenticated');
  console.log('2. Frontend should check if user is logged in before calling getUserVote');
  console.log('3. Frontend should handle null/empty user state gracefully');
  console.log('4. Consider adding userId as query parameter for better debugging');
  console.log('5. Check browser localStorage for auth tokens');
  console.log('6. Verify Firebase Auth state in browser console');
}

// Run debug
if (require.main === module) {
  debugAuthState().catch(error => {
    console.error('❌ Debug failed:', error);
    process.exit(1);
  });
}
