const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    
    if (!this.apiKey) {
      console.warn('⚠️ GEMINI_API_KEY not found in environment variables');
      this.genAI = null;
      this.generativeModel = null;
    } else {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      this.generativeModel = this.genAI.getGenerativeModel({ model: this.model });
      console.log('✅ Gemini service initialized successfully');
    }

    // Security-focused system prompt
    this.systemPrompt = `Bạn là FactCheck AI - chuyên gia bảo mật mạng hàng đầu Việt Nam.

NHIỆM VỤ:
- Tư vấn về bảo mật thông tin, an toàn mạng
- Phân tích và cảnh báo về lừa đảo, phishing, malware
- Hướng dẫn bảo vệ dữ liệu cá nhân
- Đánh giá tính an toàn của website, URL

PHONG CÁCH:
- Chuyên nghiệp, thân thiện
- Sử dụng tiếng Việt
- Đưa ra lời khuyên cụ thể, thực tế
- Sử dụng emoji phù hợp (🛡️, 🔒, ⚠️, ✅)

ĐỊNH DẠNG PHẢN HỒI:
- Tiêu đề rõ ràng với emoji
- Chia thành các mục ngắn gọn
- Đưa ra ví dụ cụ thể
- Kết thúc bằng lời khuyên hành động

Luôn ưu tiên an toàn và bảo mật trong mọi lời khuyên.`;
  }

  // Validate message input
  validateMessage(message) {
    if (!message || typeof message !== 'string') {
      return {
        valid: false,
        error: 'Tin nhắn không hợp lệ'
      };
    }

    const trimmedMessage = message.trim();
    if (trimmedMessage.length === 0) {
      return {
        valid: false,
        error: 'Tin nhắn không được để trống'
      };
    }

    if (trimmedMessage.length > 2000) {
      return {
        valid: false,
        error: 'Tin nhắn quá dài (tối đa 2000 ký tự)'
      };
    }

    return {
      valid: true,
      message: trimmedMessage
    };
  }

  // Send message to Gemini
  async sendMessage(message, conversationHistory = []) {
    try {
      if (!this.generativeModel) {
        throw new Error('Gemini service not initialized');
      }

      // Validate input
      const validation = this.validateMessage(message);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // Build conversation context
      let prompt = this.systemPrompt + '\n\n';
      
      // Add conversation history
      if (conversationHistory && conversationHistory.length > 0) {
        prompt += 'LỊCH SỬ CUỘC TRÒ CHUYỆN:\n';
        conversationHistory.forEach(msg => {
          const role = msg.role === 'user' ? 'Người dùng' : 'FactCheck AI';
          prompt += `${role}: ${msg.content}\n`;
        });
        prompt += '\n';
      }

      // Add current message
      prompt += `CÂUHỎI MỚI: ${validation.message}\n\nTRẢ LỜI:`;

      console.log('🤖 Sending request to Gemini...');
      
      const result = await this.generativeModel.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      if (!text) {
        throw new Error('Empty response from Gemini');
      }

      console.log('✅ Gemini response received');

      return {
        success: true,
        message: text.trim(),
        model: this.model,
        usage: {
          prompt_tokens: prompt.length,
          completion_tokens: text.length,
          total_tokens: prompt.length + text.length
        }
      };

    } catch (error) {
      console.error('❌ Gemini API error:', error);
      
      // Handle specific Gemini errors
      if (error.message?.includes('API_KEY_INVALID')) {
        return {
          success: false,
          error: 'API key không hợp lệ'
        };
      }
      
      if (error.message?.includes('QUOTA_EXCEEDED')) {
        return {
          success: false,
          error: 'Đã vượt quá giới hạn API'
        };
      }

      if (error.message?.includes('SAFETY')) {
        return {
          success: false,
          error: 'Nội dung không phù hợp với chính sách an toàn'
        };
      }

      return {
        success: false,
        error: error.message || 'Lỗi kết nối với Gemini AI'
      };
    }
  }

  // Get security tips
  async getSecurityTips(category = 'general') {
    const prompts = {
      general: 'Đưa ra 5 lời khuyên bảo mật mạng quan trọng nhất cho người dùng Việt Nam',
      password: 'Hướng dẫn tạo và quản lý mật khẩu an toàn',
      phishing: 'Cách nhận biết và phòng tránh email phishing',
      social: 'Bảo mật thông tin cá nhân trên mạng xã hội',
      wifi: 'An toàn khi sử dụng WiFi công cộng'
    };

    const prompt = prompts[category] || prompts.general;
    return await this.sendMessage(prompt);
  }

  // Get conversation starters
  getConversationStarters() {
    return [
      {
        id: 1,
        text: "Làm thế nào để nhận biết email lừa đảo?",
        category: "phishing"
      },
      {
        id: 2,
        text: "Cách tạo mật khẩu mạnh và an toàn",
        category: "password"
      },
      {
        id: 3,
        text: "Kiểm tra tính an toàn của một website",
        category: "website"
      },
      {
        id: 4,
        text: "Bảo vệ thông tin cá nhân trên mạng xã hội",
        category: "privacy"
      },
      {
        id: 5,
        text: "An toàn khi sử dụng WiFi công cộng",
        category: "wifi"
      },
      {
        id: 6,
        text: "Cách phòng tránh malware và virus",
        category: "malware"
      }
    ];
  }

  // Check if service is available
  isAvailable() {
    return this.generativeModel !== null;
  }

  // Get service status
  getStatus() {
    return {
      provider: 'gemini',
      model: this.model,
      available: this.isAvailable(),
      apiKey: this.apiKey ? 'configured' : 'missing'
    };
  }
}

module.exports = new GeminiService();
