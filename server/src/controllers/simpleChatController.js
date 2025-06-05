const { v4: uuidv4 } = require('uuid');

class SimpleChatController {
  constructor() {
    // Try to load OpenAI service
    try {
      this.openaiService = require('../services/openaiService');
      console.log('✅ OpenAI service loaded in SimpleChatController');
    } catch (error) {
      console.warn('⚠️ OpenAI service not available:', error.message);
      this.openaiService = null;
    }

    // Try to load database
    try {
      this.database = require('../config/database');
      console.log('✅ Database loaded in SimpleChatController');
    } catch (error) {
      console.warn('⚠️ Database not available:', error.message);
      this.database = null;
    }
  }

  // Get conversation starters
  getConversationStarters(req, res) {
    res.json({
      starters: [
        "Làm thế nào để nhận biết email lừa đảo?",
        "Cách kiểm tra một trang web có an toàn không?",
        "Những dấu hiệu của tin giả trên mạng xã hội?",
        "Cách bảo vệ thông tin cá nhân khi duyệt web?",
        "Phân tích link này có an toàn không?"
      ]
    });
  }

  // Get security tips
  getSecurityTips(req, res) {
    const category = req.query.category || 'general';
    
    const tips = {
      general: [
        "Luôn cập nhật phần mềm và hệ điều hành",
        "Sử dụng mật khẩu mạnh và duy nhất cho mỗi tài khoản",
        "Kích hoạt xác thực hai yếu tố khi có thể",
        "Cẩn thận với email và tin nhắn đáng ngờ"
      ],
      phishing: [
        "Kiểm tra địa chỉ email người gửi",
        "Không click vào link đáng ngờ",
        "Xác minh thông tin qua kênh chính thức",
        "Chú ý đến lỗi chính tả và ngữ pháp"
      ],
      malware: [
        "Chỉ tải phần mềm từ nguồn tin cậy",
        "Sử dụng phần mềm diệt virus",
        "Không mở file đính kèm đáng ngờ",
        "Thường xuyên sao lưu dữ liệu"
      ]
    };

    res.json({
      category,
      tips: tips[category] || tips.general
    });
  }

  // Send message to OpenAI (public endpoint)
  async sendOpenAIMessage(req, res) {
    try {
      const { message } = req.body;

      if (!message || message.trim().length === 0) {
        return res.status(400).json({
          error: 'Message is required',
          code: 'INVALID_MESSAGE'
        });
      }

      // Try OpenAI service if available
      if (this.openaiService && this.openaiService.isConfigured()) {
        console.log('🤖 Using OpenAI service for public message');
        const response = await this.openaiService.sendMessage(message, []);

        if (response.success) {
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
        } else {
          console.warn('OpenAI service failed:', response.error);
        }
      }

      // Fallback to mock response
      const mockResponse = this.generateMockResponse(message);
      res.json({
        data: {
          message: 'Phản hồi từ FactCheck AI (Demo Mode)',
          response: {
            content: mockResponse,
            createdAt: new Date().toISOString(),
            source: 'mock'
          }
        }
      });

    } catch (error) {
      console.error('SendOpenAIMessage error:', error);
      res.status(500).json({
        error: 'Có lỗi xảy ra khi xử lý tin nhắn',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Send message (authenticated endpoint)
  async sendMessage(req, res) {
    try {
      const { message, conversationId } = req.body;
      const userId = req.user?.userId || 'anonymous';

      if (!message || message.trim().length === 0) {
        return res.status(400).json({
          error: 'Message is required',
          code: 'INVALID_MESSAGE'
        });
      }

      // Create or get conversation
      let conversation = null;
      if (conversationId) {
        conversation = { id: conversationId, title: 'Cuộc trò chuyện' };
      } else {
        conversation = {
          id: uuidv4(),
          title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
          userId,
          createdAt: new Date().toISOString()
        };
      }

      // Try OpenAI service
      let aiResponse = null;
      if (this.openaiService && this.openaiService.isConfigured()) {
        console.log('🤖 Using OpenAI service for authenticated message');
        aiResponse = await this.openaiService.sendMessage(message, []);
      }

      if (!aiResponse || !aiResponse.success) {
        // Fallback to mock response
        const mockContent = this.generateMockResponse(message);
        aiResponse = {
          success: true,
          message: mockContent
        };
      }

      // Store conversation and messages if database is available
      if (this.database && this.database.isConnected) {
        try {
          // Store conversation
          await this.database.pool.query(
            'INSERT INTO conversations (id, user_id, title, created_at, updated_at) VALUES ($1, $2, $3, $4, $4) ON CONFLICT (id) DO NOTHING',
            [conversation.id, userId, conversation.title, new Date()]
          );

          // Store user message
          await this.database.pool.query(
            'INSERT INTO chat_messages (id, conversation_id, user_id, role, content, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
            [uuidv4(), conversation.id, userId, 'user', message, new Date()]
          );

          // Store AI response
          await this.database.pool.query(
            'INSERT INTO chat_messages (id, conversation_id, user_id, role, content, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
            [uuidv4(), conversation.id, userId, 'assistant', aiResponse.message, new Date()]
          );

        } catch (dbError) {
          console.warn('Database storage failed:', dbError.message);
        }
      }

      res.json({
        message: 'Tin nhắn đã được gửi thành công',
        conversation: {
          id: conversation.id,
          title: conversation.title
        },
        response: {
          content: aiResponse.message,
          createdAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('SendMessage error:', error);
      res.status(500).json({
        error: 'Có lỗi xảy ra khi xử lý tin nhắn',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Get conversation history
  async getConversation(req, res) {
    try {
      const { conversationId } = req.params;
      const userId = req.user?.userId || 'anonymous';

      if (this.database && this.database.isConnected) {
        const messagesResult = await this.database.pool.query(
          'SELECT * FROM chat_messages WHERE conversation_id = $1 ORDER BY created_at ASC',
          [conversationId]
        );

        const messages = messagesResult.rows.map(row => ({
          id: row.id,
          role: row.role,
          content: row.content,
          createdAt: row.created_at
        }));

        res.json({ messages });
      } else {
        // Fallback - return empty conversation
        res.json({ messages: [] });
      }

    } catch (error) {
      console.error('GetConversation error:', error);
      res.status(500).json({
        error: 'Không thể tải cuộc trò chuyện',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Get user's conversations
  async getConversations(req, res) {
    try {
      const userId = req.user?.userId || 'anonymous';
      const { page = 1, limit = 20 } = req.query;

      if (this.database && this.database.isConnected) {
        const offset = (page - 1) * limit;
        const conversationsResult = await this.database.pool.query(
          'SELECT * FROM conversations WHERE user_id = $1 ORDER BY updated_at DESC LIMIT $2 OFFSET $3',
          [userId, limit, offset]
        );

        const conversations = conversationsResult.rows.map(row => ({
          id: row.id,
          title: row.title,
          messageCount: row.message_count || 0,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        }));

        res.json({ conversations });
      } else {
        // Fallback - return empty list
        res.json({ conversations: [] });
      }

    } catch (error) {
      console.error('GetConversations error:', error);
      res.status(500).json({
        error: 'Không thể tải danh sách cuộc trò chuyện',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Delete conversation
  async deleteConversation(req, res) {
    try {
      const { conversationId } = req.params;
      const userId = req.user?.userId || 'anonymous';

      if (this.database && this.database.isConnected) {
        await this.database.pool.query(
          'DELETE FROM conversations WHERE id = $1 AND user_id = $2',
          [conversationId, userId]
        );
      }

      res.json({ message: 'Cuộc trò chuyện đã được xóa' });

    } catch (error) {
      console.error('DeleteConversation error:', error);
      res.status(500).json({
        error: 'Không thể xóa cuộc trò chuyện',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Generate mock response for fallback
  generateMockResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('email') || lowerMessage.includes('phishing')) {
      return 'Để nhận biết email lừa đảo, hãy kiểm tra: 1) Địa chỉ email người gửi có đáng tin không, 2) Có lỗi chính tả hay ngữ pháp không, 3) Có yêu cầu thông tin nhạy cảm không, 4) Link trong email có dẫn đến trang web chính thức không.';
    }
    
    if (lowerMessage.includes('link') || lowerMessage.includes('website')) {
      return 'Để kiểm tra tính an toàn của một website: 1) Kiểm tra URL có chính xác không, 2) Tìm chứng chỉ SSL (https://), 3) Đọc đánh giá từ người dùng khác, 4) Sử dụng công cụ kiểm tra như VirusTotal, 5) Cẩn thận với các trang yêu cầu thông tin cá nhân.';
    }
    
    if (lowerMessage.includes('tin giả') || lowerMessage.includes('fake news')) {
      return 'Dấu hiệu nhận biết tin giả: 1) Tiêu đề quá giật gân, 2) Không có nguồn tin rõ ràng, 3) Ngôn ngữ cảm xúc quá mức, 4) Thông tin mâu thuẫn với các nguồn uy tín, 5) Được chia sẻ từ tài khoản ẩn danh hoặc không đáng tin.';
    }
    
    return 'Cảm ơn bạn đã sử dụng FactCheck AI! Tôi có thể giúp bạn về: kiểm tra link, nhận biết email lừa đảo, phân tích tin giả, và các vấn đề bảo mật khác. Hãy hỏi tôi một câu hỏi cụ thể!';
  }
}

module.exports = new SimpleChatController();
