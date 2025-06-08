const axios = require('axios');

async function checkSubscriptionStatus() {
  const apiKey = '26a9e8085dmsh56a3ed6cf875fe7p15706jsn3244eb2976af';
  
  console.log('🔍 Checking ScamAdviser API subscription status...\n');
  
  try {
    const response = await axios.get('https://scamadviser1.p.rapidapi.com/v1/trust/single', {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'scamadviser1.p.rapidapi.com'
      },
      params: { domain: 'google.com' },
      timeout: 10000
    });
    
    console.log('✅ SUCCESS! API is working correctly.');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ ERROR: ', error.message);
    
    if (error.response?.status === 403) {
      console.log('\n📝 SOLUTION REQUIRED:');
      console.log('You need to subscribe to ScamAdviser API on RapidAPI:');
      console.log('1. Go to: https://rapidapi.com/scamadviser/api/scamadviser1');
      console.log('2. Click "Subscribe to Test"');
      console.log('3. Choose Free plan');
      console.log('4. Confirm subscription');
      console.log('5. Try running this test again');
      
    } else if (error.response?.status === 429) {
      console.log('\n⏰ RATE LIMIT:');
      console.log('Too many requests. Wait a few minutes and try again.');
      
    } else if (error.response?.status === 401) {
      console.log('\n🔑 INVALID KEY:');
      console.log('Your API key may be incorrect or expired.');
      console.log('Check your RapidAPI dashboard for the correct key.');
      
    } else {
      console.log('\n🔧 UNKNOWN ERROR:');
      console.log('Status:', error.response?.status);
      console.log('Response:', error.response?.data);
    }
  }
}

checkSubscriptionStatus();
