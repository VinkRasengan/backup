// Test OpenAI integration for production
const OpenAI = require('openai');

// You need to replace this with your real OpenAI API key
const OPENAI_API_KEY = 'sk-proj-your-real-openai-api-key-here';

async function testOpenAIProduction() {
  console.log('🧪 Testing OpenAI Production Integration...');
  
  if (!OPENAI_API_KEY || OPENAI_API_KEY.includes('your-real')) {
    console.log('❌ Please set your real OpenAI API key in this script');
    console.log('1. Get API key from: https://platform.openai.com/api-keys');
    console.log('2. Replace OPENAI_API_KEY in this script');
    console.log('3. Run: node test-openai-production.js');
    return;
  }

  try {
    const openai = new OpenAI({
      apiKey: OPENAI_API_KEY
    });

    console.log('🔧 Testing OpenAI API connection...');

    const systemPrompt = `Bạn là một chuyên gia bảo mật mạng và phân tích mối đe dọa trực tuyến với nhiều năm kinh nghiệm. 

Nhiệm vụ của bạn:
- Cung cấp lời khuyên chuyên nghiệp về bảo mật mạng
- Giúp người dùng nhận biết và phòng tránh các mối đe dọa trực tuyến
- Hướng dẫn các biện pháp bảo vệ thông tin cá nhân
- Phân tích và đánh giá rủi ro bảo mật

Phong cách trả lời:
- Sử dụng tiếng Việt
- Giải thích rõ ràng, dễ hiểu
- Cung cấp ví dụ cụ thể
- Đưa ra lời khuyên thực tế
- Sử dụng emoji phù hợp để làm nổi bật
- Cấu trúc câu trả lời có đầu mục rõ ràng

Chỉ trả lời các câu hỏi liên quan đến bảo mật mạng, an toàn thông tin, phòng chống lừa đảo trực tuyến.`;

    const testMessage = 'Cách nhận biết email phishing?';

    console.log('📤 Sending test message:', testMessage);

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: testMessage }
      ],
      max_tokens: 500,
      temperature: 0.7,
      presence_penalty: 0.1,
      frequency_penalty: 0.1
    });

    const response = completion.choices[0]?.message?.content;
    
    if (response) {
      console.log('✅ OpenAI Response received successfully!');
      console.log('📊 Usage:', completion.usage);
      console.log('🤖 Model:', completion.model);
      console.log('\n📝 Response preview:');
      console.log('─'.repeat(50));
      console.log(response.substring(0, 200) + '...');
      console.log('─'.repeat(50));
      
      console.log('\n🎉 OpenAI integration test successful!');
      console.log('\n📋 Next steps:');
      console.log('1. Set this API key in Firebase Functions:');
      console.log(`   firebase functions:config:set openai.api_key="${OPENAI_API_KEY}"`);
      console.log('2. Upgrade Firebase project to Blaze plan');
      console.log('3. Deploy functions: firebase deploy --only functions');
      console.log('4. Update frontend API URL to use Functions');
      console.log('5. Deploy frontend: firebase deploy --only hosting');
      
    } else {
      console.log('❌ No response received from OpenAI');
    }

  } catch (error) {
    console.error('❌ OpenAI test failed:', error.message);
    
    if (error.status === 401) {
      console.log('🔑 API key is invalid. Please check:');
      console.log('1. API key is correct');
      console.log('2. API key has not expired');
      console.log('3. Account has sufficient permissions');
    } else if (error.status === 429) {
      console.log('⏰ Rate limit or quota exceeded. Please check:');
      console.log('1. Account billing and credits');
      console.log('2. API usage limits');
      console.log('3. Try again after a few minutes');
    } else if (error.status === 400) {
      console.log('📝 Request format error. Please check:');
      console.log('1. Message format is correct');
      console.log('2. Model name is valid');
      console.log('3. Parameters are within limits');
    } else {
      console.log('🌐 Network or other error occurred');
    }
  }
}

// Run the test
testOpenAIProduction();
