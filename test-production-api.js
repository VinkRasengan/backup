const axios = require('axios');

// Production API URL
const API_BASE_URL = 'https://factcheck-backend-api.vercel.app/api';

async function testProductionAPI() {
  console.log('🧪 Testing Production API...');
  console.log('🌐 API Base URL:', API_BASE_URL);

  try {
    // Test health endpoint
    console.log('\n📊 Testing health endpoint...');
    const healthResponse = await axios.get(`${API_BASE_URL.replace('/api', '')}/health`);
    console.log('✅ Health check:', healthResponse.data);

    // Test public endpoints
    console.log('\n🔓 Testing public endpoints...');
    
    // Test conversation starters (should work without auth)
    try {
      const startersResponse = await axios.get(`${API_BASE_URL}/chat/starters`);
      console.log('✅ Chat starters:', startersResponse.data.starters?.length, 'items');
    } catch (error) {
      console.log('❌ Chat starters failed:', error.response?.status, error.response?.data?.error);
    }

    // Test protected endpoints (should fail without auth)
    console.log('\n🔒 Testing protected endpoints (should fail without auth)...');
    
    try {
      await axios.get(`${API_BASE_URL}/users/profile`);
      console.log('❌ Profile endpoint should require auth');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Profile endpoint correctly requires auth');
      } else {
        console.log('❌ Unexpected error:', error.response?.status);
      }
    }

    try {
      await axios.post(`${API_BASE_URL}/chat/message`, { message: 'test' });
      console.log('❌ Chat endpoint should require auth');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Chat endpoint correctly requires auth');
      } else {
        console.log('❌ Unexpected error:', error.response?.status);
      }
    }

    try {
      await axios.post(`${API_BASE_URL}/links/check`, { url: 'https://google.com' });
      console.log('❌ Link check endpoint should require auth');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Link check endpoint correctly requires auth');
      } else {
        console.log('❌ Unexpected error:', error.response?.status);
      }
    }

    console.log('\n🎉 Production API test completed!');
    console.log('\n📝 Next steps:');
    console.log('1. Configure environment variables in Vercel dashboard');
    console.log('2. Test with real Firebase authentication');
    console.log('3. Deploy frontend with updated API URL');

  } catch (error) {
    console.error('❌ Production API test failed:', error.message);
    
    if (error.code === 'ENOTFOUND') {
      console.log('🔍 API not deployed yet. Run: cd server && vercel --prod');
    } else if (error.response) {
      console.log('📊 Response status:', error.response.status);
      console.log('📄 Response data:', error.response.data);
    }
  }
}

// Test with Firebase Auth token (if provided)
async function testWithAuth(idToken) {
  console.log('\n🔐 Testing with Firebase Auth token...');
  
  const authHeaders = {
    'Authorization': `Bearer ${idToken}`,
    'Content-Type': 'application/json'
  };

  try {
    // Test profile endpoint
    const profileResponse = await axios.get(`${API_BASE_URL}/users/profile`, {
      headers: authHeaders
    });
    console.log('✅ Profile:', profileResponse.data);

    // Test chat message
    const chatResponse = await axios.post(`${API_BASE_URL}/chat/message`, {
      message: 'Cách nhận biết phishing?'
    }, {
      headers: authHeaders
    });
    console.log('✅ Chat response:', chatResponse.data.response?.content?.substring(0, 100) + '...');

    // Test link check
    const linkResponse = await axios.post(`${API_BASE_URL}/links/check`, {
      url: 'https://google.com'
    }, {
      headers: authHeaders
    });
    console.log('✅ Link check:', linkResponse.data.result?.finalScore);

  } catch (error) {
    console.error('❌ Authenticated test failed:', error.response?.data || error.message);
  }
}

// Run tests
testProductionAPI();

// If Firebase ID token is provided as argument, test authenticated endpoints
const idToken = process.argv[2];
if (idToken) {
  testWithAuth(idToken);
} else {
  console.log('\n💡 To test authenticated endpoints, run:');
  console.log('node test-production-api.js <firebase-id-token>');
}
