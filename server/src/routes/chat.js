const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authenticateToken } = require('../middleware/auth');
const { validateChatMessage, validatePagination } = require('../middleware/validation');

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
