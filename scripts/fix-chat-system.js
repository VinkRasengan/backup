#!/usr/bin/env node

/**
 * Chat System Fix Script
 * This script simplifies the chat system to use only GPT API
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Chat System - GPT Only Mode...\n');

// 1. Create simplified chat controller
const simplifiedChatController = `// Simplified Chat Controller - GPT Only
const openaiService = require('../services/openaiService');

class ChatController {
  // Send message to GPT (no conversation history)
  async sendMessage(req, res, next) {
    try {
      const { message } = req.body;
      const userId = req.user.userId;

      console.log('📤 Sending message to GPT:', message);

      // Validate message
      const validation = openaiService.validateMessage(message);
      if (!validation.valid) {
        return res.status(400).json({
          error: validation.error,
          code: 'INVALID_MESSAGE'
        });
      }

      // Send message directly to OpenAI (no conversation history)
      const aiResponse = await openaiService.sendMessage(validation.message, []);

      if (!aiResponse.success) {
        return res.status(500).json({
          error: aiResponse.error,
          code: 'AI_SERVICE_ERROR'
        });
      }

      res.json({
        message: 'Tin nhắn đã được gửi thành công',
        response: {
          content: aiResponse.message,
          createdAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('❌ Error sending message:', error);
      next(error);
    }
  }

  // Return empty conversations (no persistence)
  async getConversations(req, res, next) {
    try {
      console.log('📋 Getting conversations (simplified mode)');
      
      res.json({
        conversations: [],
        pagination: {
          currentPage: 1,
          totalCount: 0,
          hasNext: false,
          hasPrev: false
        }
      });

    } catch (error) {
      console.error('❌ Error getting conversations:', error);
      next(error);
    }
  }

  // Return empty conversation (no persistence)
  async getConversation(req, res, next) {
    try {
      console.log('💬 Getting conversation (simplified mode)');
      
      res.json({
        conversation: {},
        messages: []
      });

    } catch (error) {
      console.error('❌ Error getting conversation:', error);
      next(error);
    }
  }

  // No-op delete (no persistence)
  async deleteConversation(req, res, next) {
    try {
      res.json({
        message: 'Cuộc trò chuyện đã được xóa thành công'
      });
    } catch (error) {
      next(error);
    }
  }

  // Get conversation starters
  async getConversationStarters(req, res, next) {
    try {
      const starters = openaiService.getConversationStarters();
      
      res.json({
        starters
      });

    } catch (error) {
      next(error);
    }
  }

  // Get security tips
  async getSecurityTips(req, res, next) {
    try {
      const { category = 'general' } = req.query;
      
      const response = await openaiService.getSecurityTips(category);
      
      if (!response.success) {
        return res.status(500).json({
          error: response.error,
          code: 'AI_SERVICE_ERROR'
        });
      }

      res.json({
        category,
        tips: response.message
      });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ChatController();
`;

// 2. Create simplified chat routes
const simplifiedChatRoutes = `const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authenticateToken } = require('../middleware/auth');
const { validateChatMessage, validatePagination } = require('../middleware/validation');

// Public endpoints (no auth required)
router.get('/starters', chatController.getConversationStarters);
router.get('/tips', chatController.getSecurityTips);

// Protected endpoints (require authentication)
router.use(authenticateToken);

// Send message to GPT (simplified - no conversation persistence)
router.post('/message', validateChatMessage, chatController.sendMessage);

// Get conversation history (simplified - returns empty)
router.get('/conversations/:conversationId', chatController.getConversation);

// Get user's conversations list (simplified - returns empty)
router.get('/conversations', validatePagination, chatController.getConversations);

// Delete conversation (simplified - no-op)
router.delete('/conversations/:conversationId', chatController.deleteConversation);

module.exports = router;
`;

// 3. Update frontend to handle simplified responses
const simplifiedChatPage = `// Update ChatPage.js to handle simplified chat
// This will be added to the existing ChatPage.js

// Add this to the sendMessage function to handle simplified responses
const sendMessage = async (messageText = newMessage) => {
  if (!messageText.trim()) return;

  try {
    setIsSending(true);
    console.log('📤 Sending message (GPT only):', messageText);
    
    const response = await chatAPI.sendMessage({
      message: messageText
    });
    
    console.log('✅ GPT response:', response.data);

    // Add user message immediately
    const userMessage = {
      role: 'user',
      content: messageText,
      createdAt: new Date().toISOString()
    };

    // Add AI response
    const aiMessage = {
      role: 'assistant',
      content: response.data.response.content,
      createdAt: response.data.response.createdAt
    };

    setMessages(prev => [...prev, userMessage, aiMessage]);
    setNewMessage('');

  } catch (error) {
    console.error('❌ Error sending message:', error);
    
    let errorMessage = 'Không thể gửi tin nhắn';
    if (error.response?.data?.error) {
      errorMessage = error.response.data.error;
    }
    
    toast.error(errorMessage);
  } finally {
    setIsSending(false);
  }
};
`;

try {
  // Backup original files
  console.log('📋 Creating backups...');
  
  const chatControllerPath = path.join(__dirname, '../server/src/controllers/chatController.js');
  const chatRoutesPath = path.join(__dirname, '../server/src/routes/chat.js');
  
  if (fs.existsSync(chatControllerPath)) {
    fs.copyFileSync(chatControllerPath, chatControllerPath + '.backup');
    console.log('✅ Backed up chatController.js');
  }
  
  if (fs.existsSync(chatRoutesPath)) {
    fs.copyFileSync(chatRoutesPath, chatRoutesPath + '.backup');
    console.log('✅ Backed up chat.js routes');
  }

  // Write simplified files
  console.log('🔧 Writing simplified chat system...');
  
  fs.writeFileSync(chatControllerPath, simplifiedChatController);
  console.log('✅ Updated chatController.js');
  
  fs.writeFileSync(chatRoutesPath, simplifiedChatRoutes);
  console.log('✅ Updated chat.js routes');

  // Create instructions file
  const instructionsPath = path.join(__dirname, '../docs/chat-system-simplified.md');
  const instructions = \`# 🚀 Simplified Chat System - GPT Only

## Changes Made

### 1. Simplified Chat Controller
- ✅ Removed Firestore conversation persistence
- ✅ Direct GPT API calls only
- ✅ No conversation history storage
- ✅ Simplified error handling

### 2. Updated Routes
- ✅ All endpoints still available
- ✅ Conversations endpoints return empty data
- ✅ Message endpoint sends directly to GPT

### 3. Benefits
- ✅ No database dependencies for chat
- ✅ Faster responses
- ✅ Simpler debugging
- ✅ No 404 errors from missing collections

## Testing

1. **Start server:**
   \\\`\\\`\\\`bash
   npm run server
   \\\`\\\`\\\`

2. **Test endpoints:**
   \\\`\\\`\\\`bash
   node scripts/test-chat-api.js
   \\\`\\\`\\\`

3. **Frontend testing:**
   - Go to /chat page
   - Send a message
   - Should get GPT response immediately

## Environment Variables Required

\\\`\\\`\\\`env
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_MAX_TOKENS=500
OPENAI_TEMPERATURE=0.7
\\\`\\\`\\\`

## Rollback

If you need to restore the original system:

\\\`\\\`\\\`bash
cp server/src/controllers/chatController.js.backup server/src/controllers/chatController.js
cp server/src/routes/chat.js.backup server/src/routes/chat.js
\\\`\\\`\\\`

## Next Steps

1. ✅ Test the simplified system
2. ⏳ Add conversation persistence later if needed
3. ⏳ Implement user-specific chat history
4. ⏳ Add advanced GPT features
\`;

  fs.writeFileSync(instructionsPath, instructions);
  console.log('✅ Created documentation');

  console.log('\\n🎉 Chat System Simplified Successfully!');
  console.log('\\n📋 Summary:');
  console.log('   ✅ Removed Firestore dependencies');
  console.log('   ✅ Direct GPT API integration');
  console.log('   ✅ Simplified error handling');
  console.log('   ✅ No conversation persistence');
  console.log('\\n🚀 Next Steps:');
  console.log('   1. Restart your server: npm run server');
  console.log('   2. Test the chat: node scripts/test-chat-api.js');
  console.log('   3. Try the frontend chat page');
  console.log('\\n💡 Note: Conversations are not saved in this simplified version.');

} catch (error) {
  console.error('❌ Error fixing chat system:', error);
  process.exit(1);
}
