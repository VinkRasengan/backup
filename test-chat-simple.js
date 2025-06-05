// Simple test for chat API
const http = require('http');

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testChatAPI() {
  console.log('🧪 Testing Chat API...');

  try {
    // Test conversation starters (public)
    console.log('\n📝 Testing conversation starters...');
    const startersResult = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/chat/starters',
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    console.log('Status:', startersResult.status);
    if (startersResult.status === 200) {
      console.log('✅ Starters loaded:', startersResult.data.starters?.length, 'items');
      console.log('First starter:', startersResult.data.starters?.[0]);
    } else {
      console.log('❌ Failed:', startersResult.data);
    }

    // Test protected endpoint without auth
    console.log('\n🔒 Testing protected endpoint (should fail)...');
    const conversationsResult = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/chat/conversations',
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    console.log('Status:', conversationsResult.status);
    if (conversationsResult.status === 401) {
      console.log('✅ Correctly requires authentication');
    } else {
      console.log('❌ Unexpected result:', conversationsResult.data);
    }

    console.log('\n🎉 Basic API test completed!');
    console.log('\n💡 Next steps:');
    console.log('1. Open http://localhost:3000/chat in browser');
    console.log('2. Login with your account');
    console.log('3. Open browser console (F12)');
    console.log('4. Run: debugAPI()');
    console.log('5. Try sending a message');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testChatAPI();
