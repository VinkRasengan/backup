const { db, collections, admin } = require('../config/firebase');
const openaiService = require('../services/openaiService');

class ChatController {
  // Send message to security chatbot
  async sendMessage(req, res, next) {
    try {
      const { message, conversationId } = req.body;
      const userId = req.user.userId;

      // Validate message
      const validation = openaiService.validateMessage(message);
      if (!validation.valid) {
        return res.status(400).json({
          error: validation.error,
          code: 'INVALID_MESSAGE'
        });
      }

      // Get or create conversation
      let conversation;
      if (conversationId) {
        const conversationDoc = await db.collection(collections.CONVERSATIONS).doc(conversationId).get();
        if (!conversationDoc.exists || conversationDoc.data().userId !== userId) {
          return res.status(404).json({
            error: 'Cuộc trò chuyện không tồn tại',
            code: 'CONVERSATION_NOT_FOUND'
          });
        }
        conversation = { id: conversationId, ...conversationDoc.data() };
      } else {
        // Create new conversation
        const newConversation = {
          userId,
          title: validation.message.substring(0, 50) + (validation.message.length > 50 ? '...' : ''),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          messageCount: 0
        };
        
        const conversationRef = await db.collection(collections.CONVERSATIONS).add(newConversation);
        conversation = { id: conversationRef.id, ...newConversation };
      }

      // Get conversation history
      const messagesQuery = await db.collection(collections.CHAT_MESSAGES)
        .where('conversationId', '==', conversation.id)
        .orderBy('createdAt', 'asc')
        .limit(20)
        .get();

      const conversationHistory = messagesQuery.docs.map(doc => {
        const data = doc.data();
        return {
          role: data.role,
          content: data.content
        };
      });

      // Send message to OpenAI
      const aiResponse = await openaiService.sendMessage(validation.message, conversationHistory);

      if (!aiResponse.success) {
        return res.status(500).json({
          error: aiResponse.error,
          code: 'AI_SERVICE_ERROR'
        });
      }

      // Save user message
      const userMessage = {
        conversationId: conversation.id,
        userId,
        role: 'user',
        content: validation.message,
        createdAt: new Date().toISOString()
      };
      await db.collection(collections.CHAT_MESSAGES).add(userMessage);

      // Save AI response
      const assistantMessage = {
        conversationId: conversation.id,
        userId,
        role: 'assistant',
        content: aiResponse.message,
        createdAt: new Date().toISOString(),
        metadata: {
          model: aiResponse.model,
          usage: aiResponse.usage
        }
      };
      await db.collection(collections.CHAT_MESSAGES).add(assistantMessage);

      // Update conversation
      await db.collection(collections.CONVERSATIONS).doc(conversation.id).update({
        updatedAt: new Date().toISOString(),
        messageCount: admin.firestore.FieldValue.increment(2),
        lastMessage: validation.message
      });

      // Update user stats
      await db.collection(collections.USERS).doc(userId).update({
        'stats.chatMessages': admin.firestore.FieldValue.increment(1),
        updatedAt: new Date().toISOString()
      });

      res.json({
        message: 'Tin nhắn đã được gửi thành công',
        conversation: {
          id: conversation.id,
          title: conversation.title
        },
        response: {
          content: aiResponse.message,
          createdAt: assistantMessage.createdAt
        }
      });

    } catch (error) {
      next(error);
    }
  }

  // Get conversation history
  async getConversation(req, res, next) {
    try {
      const { conversationId } = req.params;
      const userId = req.user.userId;

      // Get conversation
      const conversationDoc = await db.collection(collections.CONVERSATIONS).doc(conversationId).get();
      if (!conversationDoc.exists) {
        return res.status(404).json({
          error: 'Cuộc trò chuyện không tồn tại',
          code: 'CONVERSATION_NOT_FOUND'
        });
      }

      const conversation = conversationDoc.data();
      if (conversation.userId !== userId) {
        return res.status(403).json({
          error: 'Không có quyền truy cập',
          code: 'ACCESS_DENIED'
        });
      }

      // Get messages
      const messagesQuery = await db.collection(collections.CHAT_MESSAGES)
        .where('conversationId', '==', conversationId)
        .orderBy('createdAt', 'asc')
        .get();

      const messages = messagesQuery.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      res.json({
        conversation: {
          id: conversationId,
          ...conversation
        },
        messages
      });

    } catch (error) {
      next(error);
    }
  }

  // Get user's conversations list
  async getConversations(req, res, next) {
    try {
      const userId = req.user.userId;
      const { page = 1, limit = 20 } = req.query;

      console.log('🔍 Getting conversations for user:', userId);

      // Get conversations with simpler query
      const conversationsQuery = await db.collection(collections.CONVERSATIONS)
        .where('userId', '==', userId)
        .orderBy('updatedAt', 'desc')
        .limit(parseInt(limit))
        .get();

      console.log('📊 Found conversations:', conversationsQuery.size);

      const conversations = conversationsQuery.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          updatedAt: data.updatedAt,
          messageCount: data.messageCount || 0,
          lastMessage: data.lastMessage
        };
      });

      res.json({
        conversations,
        pagination: {
          currentPage: parseInt(page),
          totalCount: conversations.length,
          hasNext: false,
          hasPrev: false
        }
      });

    } catch (error) {
      console.error('❌ Error getting conversations:', error);
      next(error);
    }
  }

  // Delete conversation
  async deleteConversation(req, res, next) {
    try {
      const { conversationId } = req.params;
      const userId = req.user.userId;

      // Check if conversation exists and belongs to user
      const conversationDoc = await db.collection(collections.CONVERSATIONS).doc(conversationId).get();
      if (!conversationDoc.exists) {
        return res.status(404).json({
          error: 'Cuộc trò chuyện không tồn tại',
          code: 'CONVERSATION_NOT_FOUND'
        });
      }

      const conversation = conversationDoc.data();
      if (conversation.userId !== userId) {
        return res.status(403).json({
          error: 'Không có quyền truy cập',
          code: 'ACCESS_DENIED'
        });
      }

      // Delete all messages in conversation
      const messagesQuery = await db.collection(collections.CHAT_MESSAGES)
        .where('conversationId', '==', conversationId)
        .get();

      const batch = db.batch();
      messagesQuery.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Delete conversation
      batch.delete(conversationDoc.ref);

      await batch.commit();

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

  // Send message to OpenAI directly (no auth required for frontend)
  async sendOpenAIMessage(req, res, next) {
    try {
      const { message } = req.body;

      // Validate message
      const validation = openaiService.validateMessage(message);
      if (!validation.valid) {
        return res.status(400).json({
          error: validation.error,
          code: 'INVALID_MESSAGE'
        });
      }

      // Send message to OpenAI without conversation history
      const aiResponse = await openaiService.sendMessage(validation.message, []);

      if (!aiResponse.success) {
        // Fallback to mock response
        const mockResponse = this.generateMockResponse(validation.message);

        return res.json({
          data: {
            message: 'Phản hồi từ FactCheck AI (Offline Mode)',
            response: {
              content: mockResponse,
              createdAt: new Date().toISOString(),
              source: 'mock'
            }
          }
        });
      }

      res.json({
        data: {
          message: 'Phản hồi từ FactCheck AI',
          response: {
            content: aiResponse.message,
            createdAt: new Date().toISOString(),
            source: 'openai'
          }
        }
      });

    } catch (error) {
      // Fallback to mock response on error
      const mockResponse = this.generateMockResponse(req.body.message || '');

      res.json({
        data: {
          message: 'Phản hồi từ FactCheck AI (Offline Mode)',
          response: {
            content: mockResponse,
            createdAt: new Date().toISOString(),
            source: 'mock'
          }
        }
      });
    }
  }

  // Generate mock response for fallback
  generateMockResponse(message) {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('phishing') || lowerMessage.includes('lừa đảo')) {
      return `🎣 **Nhận biết Email Phishing - FactCheck AI**

**🚨 Dấu hiệu cảnh báo:**
• **Địa chỉ gửi lạ**: vietcombank-security@gmail.com thay vì @vietcombank.com.vn
• **Tạo áp lực**: "Tài khoản sẽ bị khóa trong 24h"
• **Yêu cầu thông tin**: Ngân hàng KHÔNG BAO GIỜ hỏi mật khẩu qua email
• **Link rút gọn**: bit.ly, tinyurl thay vì domain chính thức

**✅ Cách phòng chống:**
1. Luôn gõ trực tiếp website ngân hàng
2. Kiểm tra URL có HTTPS và tên miền chính xác
3. Gọi hotline ngân hàng để xác minh`;
    }

    if (lowerMessage.includes('mật khẩu') || lowerMessage.includes('password')) {
      return `🔐 **Tạo Mật khẩu Siêu Mạnh - FactCheck AI**

**📏 Quy tắc vàng:**
• **Độ dài**: Tối thiểu 12 ký tự (khuyến nghị 16+)
• **Đa dạng**: Chữ HOA, thường, số, ký tự đặc biệt
• **Tránh**: Tên, ngày sinh, "123456", "password"
• **Unique**: Mỗi tài khoản 1 mật khẩu riêng

**🛡️ Bảo mật nâng cao:**
• **2FA**: Google Authenticator, SMS
• **Password Manager**: Bitwarden (miễn phí), 1Password`;
    }

    return `🛡️ **Chào bạn! Tôi là FactCheck AI**

Tôi là chuyên gia bảo mật AI hàng đầu Việt Nam, sẵn sàng giúp bạn về:

🔒 **Bảo mật mạng** & An toàn thông tin
🎣 **Phishing** & Lừa đảo trực tuyến
🦠 **Malware** & Virus
🌐 **Kiểm tra URL** & Website

Bạn có câu hỏi gì về bảo mật không?`;
  }
}

module.exports = new ChatController();
