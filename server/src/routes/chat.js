const express = require('express');
const router = express.Router();

// Test route first
router.get('/test', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Chat routes are working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Try to load chat controller with error handling
let chatController;
try {
  chatController = require('../controllers/chatController');
  console.log('✅ Chat controller loaded successfully');
} catch (error) {
  console.error('❌ Chat controller failed to load:', error.message);
  console.error('Stack:', error.stack);

  // Fallback controller
  chatController = {
    getConversationStarters: (req, res) => {
      res.json({
        starters: [
          "Làm thế nào để nhận biết email lừa đảo?",
          "Cách tạo mật khẩu mạnh và an toàn?",
          "Cách bảo vệ thông tin cá nhân trên mạng?"
        ]
      });
    },
    getSecurityTips: (req, res) => {
      res.json({
        category: req.query.category || 'general',
        tips: 'Luôn cập nhật phần mềm và sử dụng mật khẩu mạnh.'
      });
    },
    sendOpenAIMessage: (req, res) => {
      res.json({
        data: {
          message: 'Phản hồi từ FactCheck AI (Fallback Mode)',
          response: {
            content: 'Xin chào! Tôi là FactCheck AI. Hiện tại hệ thống đang trong chế độ fallback. Vui lòng thử lại sau.',
            createdAt: new Date().toISOString(),
            source: 'fallback'
          }
        }
      });
    },
    sendMessage: (req, res) => {
      res.status(503).json({
        error: 'Chat service temporarily unavailable',
        code: 'SERVICE_UNAVAILABLE'
      });
    },
    getConversations: (req, res) => {
      res.json({
        conversations: [],
        pagination: {
          currentPage: 1,
          totalCount: 0,
          hasNext: false,
          hasPrev: false
        }
      });
    },
    getConversation: (req, res) => {
      res.status(404).json({
        error: 'Conversation not found',
        code: 'CONVERSATION_NOT_FOUND'
      });
    },
    deleteConversation: (req, res) => {
      res.status(404).json({
        error: 'Conversation not found',
        code: 'CONVERSATION_NOT_FOUND'
      });
    }
  };
}

// Import middleware with fallbacks
let authenticateToken, validateChatMessage, validatePagination;

try {
  const authMiddleware = require('../middleware/auth');
  authenticateToken = authMiddleware.authenticateToken;
} catch (error) {
  console.warn('⚠️ Auth middleware not found, using fallback');
  authenticateToken = (req, res, next) => {
    // Skip auth for now
    req.user = { userId: 'demo-user' };
    next();
  };
}

try {
  const validationMiddleware = require('../middleware/validation');
  validateChatMessage = validationMiddleware.validateChatMessage;
  validatePagination = validationMiddleware.validatePagination;
} catch (error) {
  console.warn('⚠️ Validation middleware not found, using fallback');
  validateChatMessage = (req, res, next) => {
    if (!req.body.message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    next();
  };
  validatePagination = (req, res, next) => next();
}

// Public endpoints (no auth required)
router.get('/starters', chatController.getConversationStarters);
router.get('/tips', chatController.getSecurityTips);
router.post('/openai', validateChatMessage, chatController.sendOpenAIMessage);

// Protected endpoints (require authentication)
router.use(authenticateToken);

// Send message to security chatbot
router.post('/message', validateChatMessage, chatController.sendMessage);

// Get conversation history
router.get('/conversations/:conversationId', chatController.getConversation);

// Get user's conversations list
router.get('/conversations', validatePagination, chatController.getConversations);

// Delete conversation
router.delete('/conversations/:conversationId', chatController.deleteConversation);

module.exports = router;
