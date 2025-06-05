require('dotenv').config();
const openaiService = require('./src/services/openaiService');

async function testOpenAI() {
  console.log('🧪 Testing OpenAI Service...');
  console.log('API Key configured:', openaiService.isConfigured());
  console.log('API Key (first 10 chars):', process.env.OPENAI_API_KEY?.substring(0, 10) + '...');
  
  try {
    console.log('\n📝 Testing message validation...');
    const validation = openaiService.validateMessage('Cách nhận biết phishing?');
    console.log('Validation result:', validation);
    
    if (validation.valid) {
      console.log('\n🤖 Testing OpenAI API call...');
      const response = await openaiService.sendMessage(validation.message);
      console.log('OpenAI Response:', {
        success: response.success,
        message: response.message?.substring(0, 100) + '...',
        error: response.error,
        usage: response.usage
      });
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testOpenAI();
