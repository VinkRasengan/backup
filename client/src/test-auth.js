// Test authentication flow
import { auth } from './config/firebase';
import { chatAPI } from './services/api';

export const testAuth = async () => {
  console.log('🧪 Testing authentication...');
  
  try {
    // Check current user
    const user = auth.currentUser;
    console.log('Current user:', user?.email || 'Not logged in');
    
    if (user) {
      // Get ID token
      const token = await user.getIdToken();
      console.log('ID Token (first 20 chars):', token.substring(0, 20) + '...');
      
      // Test API calls
      console.log('Testing API calls...');
      
      // Test conversation starters (public)
      try {
        const starters = await chatAPI.getConversationStarters();
        console.log('✅ Conversation starters:', starters.data.starters?.length);
      } catch (error) {
        console.error('❌ Conversation starters failed:', error.response?.data || error.message);
      }
      
      // Test conversations (protected)
      try {
        const conversations = await chatAPI.getConversations();
        console.log('✅ Conversations:', conversations.data.conversations?.length);
      } catch (error) {
        console.error('❌ Conversations failed:', error.response?.data || error.message);
      }
      
      // Test send message (protected)
      try {
        const response = await chatAPI.sendMessage({
          message: 'Test message'
        });
        console.log('✅ Send message successful');
      } catch (error) {
        console.error('❌ Send message failed:', error.response?.data || error.message);
      }
      
    } else {
      console.log('❌ User not logged in');
    }
    
  } catch (error) {
    console.error('❌ Auth test failed:', error);
  }
};

// Add to window for testing in browser console
window.testAuth = testAuth;
