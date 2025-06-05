// Test OpenAI service in Firebase Functions environment
const openaiService = require('./services/openaiService');

async function testOpenAI() {
  console.log('🧪 Testing OpenAI Service in Functions...');
  
  try {
    // Test configuration
    console.log('🔧 Checking configuration...');
    const isConfigured = openaiService.isConfigured();
    console.log('OpenAI configured:', isConfigured);

    // Test conversation starters
    console.log('\n📝 Testing conversation starters...');
    const starters = openaiService.getConversationStarters();
    console.log('Starters count:', starters.length);
    console.log('First starter:', starters[0]);

    // Test message validation
    console.log('\n✅ Testing message validation...');
    const validation = openaiService.validateMessage('Cách nhận biết phishing?');
    console.log('Validation result:', validation);

    // Test OpenAI API call
    console.log('\n🤖 Testing OpenAI API call...');
    const response = await openaiService.sendMessage('Cách tạo mật khẩu mạnh?');
    
    if (response.success) {
      console.log('✅ OpenAI Response received');
      console.log('Model:', response.model);
      console.log('Usage:', response.usage);
      console.log('Response preview:', response.message.substring(0, 100) + '...');
    } else {
      console.log('❌ OpenAI Response failed:', response.error);
    }

    console.log('\n🎉 OpenAI test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run test
testOpenAI();
