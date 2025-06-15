const express = require('express');
const router = express.Router();
const { sendGeminiMessage } = require('../services/geminiService');

// Test endpoint (public - no auth required)
router.get('/test', (req, res) => {
  res.json({ message: 'Chat routes working!' });
});

// AI service status (public endpoint - no auth required)
router.get('/status', (req, res) => {
  try {
    const aiService = require('../services/aiService');
    res.json(aiService.getStatus());
  } catch (error) {
    res.status(500).json({
      error: 'Unable to get AI service status',
      details: error.message
    });
  }
});

// Test route first
router.get('/test', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Chat routes are working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Try to load OpenAI service directly (bypass Firebase dependency)
let openaiService;
try {
  openaiService = require('../services/openaiService');
  console.log('✅ OpenAI service loaded successfully');
} catch (error) {
  console.warn('⚠️ OpenAI service failed to load:', error.message);
  openaiService = null;
}

// Try to load chat controller with error handling - Prioritize Firestore ChatController
let chatController;
try {
  // Try Firestore chat controller first (Firebase integration)
  chatController = require('../controllers/chatController');
  console.log('✅ Firestore chat controller loaded successfully');
} catch (firestoreError) {
  console.warn('⚠️ Firestore chat controller failed, trying simple controller:', firestoreError.message);
  try {
    chatController = require('../controllers/simpleChatController');
    console.log('✅ Simple chat controller loaded successfully');
  } catch (error) {
    console.error('❌ Both chat controllers failed to load:', error.message);

    // Fallback controller (no dependencies)
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
      sendOpenAIMessage: async (req, res) => {
        try {
          const { message, provider } = req.body;

          if (!message) {
            return res.status(400).json({ error: 'Message is required' });
          }

          // Prioritize Gemini API if specified or as default
          if (!provider || provider === 'gemini') {
            try {
              console.log('🤖 Using Gemini API for chat message');
              const geminiResponse = await sendGeminiMessage(message);

              if (geminiResponse.success) {
                // Increment user chat stats if user is authenticated
                if (req.user && req.user.userId) {
                  try {
                    const firebaseBackendController = require('../controllers/firebaseBackendController');
                    await firebaseBackendController.incrementUserStats(req.user.userId, 'chatMessages');
                  } catch (statsError) {
                    console.warn('⚠️ Failed to increment chat stats:', statsError.message);
                  }
                }

                return res.json({
                  data: {
                    message: 'Phản hồi từ FactCheck AI',
                    response: {
                      content: geminiResponse.response,
                      createdAt: new Date().toISOString(),
                      source: 'gemini'
                    }
                  }
                });
              }
            } catch (geminiError) {
              console.warn('⚠️ Gemini API failed, trying OpenAI fallback:', geminiError.message);
            }
          }

          // Fallback to OpenAI if Gemini fails or is specifically requested
          if (openaiService && openaiService.isConfigured()) {
            const response = await openaiService.sendMessage(message, []);

            if (response.success) {
              // Increment user chat stats if user is authenticated
              if (req.user && req.user.userId) {
                try {
                  const firebaseBackendController = require('../controllers/firebaseBackendController');
                  await firebaseBackendController.incrementUserStats(req.user.userId, 'chatMessages');
                } catch (statsError) {
                  console.warn('⚠️ Failed to increment chat stats:', statsError.message);
                }
              }

              return res.json({
                data: {
                  message: 'Phản hồi từ FactCheck AI',
                  response: {
                    content: response.message,
                    createdAt: new Date().toISOString(),
                    source: 'openai'
                  }
                }
              });
            }
          }

          // Return error if all services fail
          res.status(503).json({
            error: 'AI service không khả dụng',
            code: 'AI_SERVICE_ERROR',
            message: 'Dịch vụ AI tạm thời không khả dụng. Vui lòng thử lại sau.'
          });
        } catch (error) {
          console.error('Chat endpoint error:', error);
          res.status(500).json({
            error: 'Có lỗi xảy ra khi xử lý yêu cầu',
            code: 'INTERNAL_ERROR',
            message: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau.'
          });
        }
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
}

// Import middleware with fallbacks
let authenticateToken, validateChatMessage, validateWidgetMessage, validatePagination;

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
  validateWidgetMessage = validationMiddleware.validateWidgetMessage;
  validatePagination = validationMiddleware.validatePagination;
} catch (error) {
  console.warn('⚠️ Validation middleware not found, using fallback');
  validateChatMessage = (req, res, next) => {
    if (!req.body.message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    next();
  };
  validateWidgetMessage = (req, res, next) => {
    if (!req.body.message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    next();
  };
  validatePagination = (req, res, next) => next();
}

// Generate automatic responses for chat widget
function generateWidgetResponse(message) {
  const lowerMessage = message.toLowerCase();

  // Greetings
  if (lowerMessage.includes('xin chào') || lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return 'Xin chào! Tôi là FactCheck Assistant. Tôi có thể giúp bạn về các vấn đề bảo mật và kiểm tra thông tin. Bạn cần hỗ trợ gì?';
  }

  // Email phishing
  if (lowerMessage.includes('email') || lowerMessage.includes('phishing') || lowerMessage.includes('lừa đảo')) {
    return 'Để nhận biết email lừa đảo:\n• Kiểm tra địa chỉ email người gửi\n• Chú ý lỗi chính tả và ngữ pháp\n• Không click vào link đáng ngờ\n• Xác minh thông tin qua kênh chính thức';
  }

  // Website security
  if (lowerMessage.includes('website') || lowerMessage.includes('link') || lowerMessage.includes('trang web')) {
    return 'Để kiểm tra tính an toàn của website:\n• Kiểm tra URL có chính xác không\n• Tìm chứng chỉ SSL (https://)\n• Sử dụng công cụ kiểm tra như VirusTotal\n• Đọc đánh giá từ người dùng khác';
  }

  // Password security
  if (lowerMessage.includes('mật khẩu') || lowerMessage.includes('password')) {
    return 'Lời khuyên về mật khẩu an toàn:\n• Sử dụng ít nhất 12 ký tự\n• Kết hợp chữ hoa, chữ thường, số và ký tự đặc biệt\n• Không sử dụng thông tin cá nhân\n• Mỗi tài khoản một mật khẩu riêng\n• Kích hoạt xác thực 2 yếu tố';
  }

  // Fake news
  if (lowerMessage.includes('tin giả') || lowerMessage.includes('fake news') || lowerMessage.includes('tin tức')) {
    return 'Cách nhận biết tin giả:\n• Kiểm tra nguồn tin có uy tín không\n• So sánh với nhiều nguồn khác\n• Chú ý tiêu đề quá giật gân\n• Kiểm tra ngày tháng đăng tin\n• Tìm hiểu về tác giả';
  }

  // General security
  if (lowerMessage.includes('bảo mật') || lowerMessage.includes('an toàn') || lowerMessage.includes('security')) {
    return 'Lời khuyên bảo mật cơ bản:\n• Cập nhật phần mềm thường xuyên\n• Sử dụng phần mềm diệt virus\n• Cẩn thận khi tải file từ internet\n• Sao lưu dữ liệu quan trọng\n• Không chia sẻ thông tin cá nhân';
  }

  // Help or support
  if (lowerMessage.includes('giúp') || lowerMessage.includes('help') || lowerMessage.includes('hỗ trợ')) {
    return 'Tôi có thể giúp bạn về:\n• Nhận biết email lừa đảo\n• Kiểm tra tính an toàn của website\n• Tạo mật khẩu mạnh\n• Phân biệt tin thật/tin giả\n• Các vấn đề bảo mật khác\n\nHãy hỏi tôi một câu hỏi cụ thể!';
  }

  // Default response
  return 'Cảm ơn bạn đã liên hệ! Tôi là FactCheck Assistant, chuyên hỗ trợ về bảo mật và kiểm tra thông tin. Để được hỗ trợ tốt hơn, bạn có thể hỏi về: email lừa đảo, kiểm tra website, mật khẩu an toàn, hoặc phân biệt tin giả.';
}

// Public endpoints (no auth required)
router.get('/starters', (req, res) => chatController.getConversationStarters(req, res));
router.get('/tips', (req, res) => chatController.getSecurityTips(req, res));

// Chat widget endpoint - Always uses mock responses (no OpenAI API)
router.post('/widget', validateWidgetMessage, (req, res) => {
  try {
    const { message } = req.body;

    // Generate mock response based on message content
    const mockResponse = generateWidgetResponse(message);

    res.json({
      data: {
        message: 'Phản hồi từ FactCheck Assistant',
        response: {
          content: mockResponse,
          createdAt: new Date().toISOString(),
          source: 'widget'
        }
      }
    });
  } catch (error) {
    console.error('Widget chat error:', error);
    res.status(500).json({
      error: 'Có lỗi xảy ra khi xử lý tin nhắn',
      code: 'INTERNAL_ERROR'
    });
  }
});

// AI Chat endpoint - Uses OpenAI API when available
router.post('/openai', validateChatMessage, (req, res) => chatController.sendOpenAIMessage(req, res));

// Protected endpoints (require authentication)
router.use(authenticateToken);

// Send message to security chatbot
router.post('/message', validateChatMessage, (req, res, next) => chatController.sendMessage(req, res, next));

// Get conversation history
router.get('/conversations/:conversationId', (req, res, next) => chatController.getConversation(req, res, next));

// Get user's conversations list
router.get('/conversations', validatePagination, (req, res, next) => chatController.getConversations(req, res, next));

// Delete conversation
router.delete('/conversations/:conversationId', (req, res, next) => chatController.deleteConversation(req, res, next));

// Gemini chat endpoint
router.post('/gemini', async (req, res) => {
  try {
    console.log('Received Gemini chat request:', req.body);
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const response = await sendGeminiMessage(message);
    console.log('Gemini response:', response);
    
    res.json(response);
  } catch (error) {
    console.error('Error in Gemini chat endpoint:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

module.exports = router;
