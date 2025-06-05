const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testChatAPI() {
  console.log('🧪 Testing Chat API...');

  try {
    // Test conversation starters (public endpoint)
    console.log('\n📝 Testing conversation starters...');
    const startersResponse = await axios.get(`${API_BASE_URL}/chat/starters`);
    console.log('✅ Conversation starters:', startersResponse.data.starters?.length, 'items');
    console.log('First starter:', startersResponse.data.starters?.[0]);

    // Test protected endpoints (should fail without auth)
    console.log('\n🔒 Testing protected endpoints...');
    
    try {
      await axios.get(`${API_BASE_URL}/chat/conversations`);
      console.log('❌ Should require authentication');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Conversations endpoint correctly requires auth');
      } else {
        console.log('❌ Unexpected error:', error.response?.status, error.response?.data);
      }
    }

    try {
      await axios.post(`${API_BASE_URL}/chat/message`, {
        message: 'Test message'
      });
      console.log('❌ Should require authentication');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Send message endpoint correctly requires auth');
      } else {
        console.log('❌ Unexpected error:', error.response?.status, error.response?.data);
      }
    }

    console.log('\n🎉 Chat API test completed!');
    console.log('\n💡 To test with authentication:');
    console.log('1. Login to the frontend');
    console.log('2. Get Firebase ID token from browser dev tools');
    console.log('3. Run: node test-chat-api.js <firebase-id-token>');

  } catch (error) {
    console.error('❌ Chat API test failed:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    }
  }
}

async function testWithAuth(idToken) {
  console.log('\n🔐 Testing with authentication...');
  
  const headers = {
    'Authorization': `Bearer ${idToken}`,
    'Content-Type': 'application/json'
  };

  try {
    // Test get conversations
    console.log('📋 Testing get conversations...');
    const conversationsResponse = await axios.get(`${API_BASE_URL}/chat/conversations`, {
      headers
    });
    console.log('✅ Conversations:', conversationsResponse.data.conversations?.length || 0, 'found');

    // Test send message
    console.log('💬 Testing send message...');
    const messageResponse = await axios.post(`${API_BASE_URL}/chat/message`, {
      message: 'Cách nhận biết phishing?'
    }, {
      headers
    });
    console.log('✅ Message sent successfully');
    console.log('Response preview:', messageResponse.data.response?.content?.substring(0, 100) + '...');

    // Test get conversations again (should have new conversation)
    console.log('📋 Testing get conversations after message...');
    const newConversationsResponse = await axios.get(`${API_BASE_URL}/chat/conversations`, {
      headers
    });
    console.log('✅ Conversations after message:', newConversationsResponse.data.conversations?.length || 0, 'found');

  } catch (error) {
    console.error('❌ Authenticated test failed:', error.response?.data || error.message);
  }
}

// Run tests
testChatAPI();

// If Firebase ID token is provided, test authenticated endpoints
const idToken = process.argv[2];
if (idToken) {
  testWithAuth(idToken);
}
