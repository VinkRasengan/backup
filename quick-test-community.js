const https = require('https');

function testCommunityService() {
  const url = 'https://backup-8kfl.onrender.com/health';
  console.log('🔍 Testing Community Service:', url);
  
  https.get(url, (res) => {
    console.log(`✅ Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const jsonData = JSON.parse(data);
        console.log('✅ Response:', jsonData);
        console.log('✅ Community Service is working!');
      } catch (e) {
        console.log('✅ Response (raw):', data);
      }
    });
  }).on('error', (err) => {
    console.error('❌ Error:', err.message);
    console.log('⚠️  Community Service might not be available');
  });
  
  setTimeout(() => {
    console.log('⏰ Test timeout - checking if service responded...');
  }, 10000);
}

testCommunityService();
