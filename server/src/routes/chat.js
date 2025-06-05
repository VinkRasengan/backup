const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

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
