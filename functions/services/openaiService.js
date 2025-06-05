const OpenAI = require('openai');
const logger = require('firebase-functions/logger');
const functions = require('firebase-functions');

class OpenAIService {
  constructor() {
    this.openai = null;
    this.model = 'gpt-3.5-turbo';
    this.maxTokens = 500;
    this.temperature = 0.7;
    
    this.systemPrompt = `Bạn là một chuyên gia bảo mật mạng và phân tích mối đe dọa trực tuyến với nhiều năm kinh nghiệm. 

Nhiệm vụ của bạn:
- Cung cấp lời khuyên chuyên nghiệp về bảo mật mạng
- Giúp người dùng nhận biết và phòng tránh các mối đe dọa trực tuyến
- Hướng dẫn các biện pháp bảo vệ thông tin cá nhân
- Phân tích và đánh giá rủi ro bảo mật

Phong cách trả lời:
- Sử dụng tiếng Việt
- Giải thích rõ ràng, dễ hiểu
- Cung cấp ví dụ cụ thể
- Đưa ra lời khuyên thực tế
- Sử dụng emoji phù hợp để làm nổi bật
- Cấu trúc câu trả lời có đầu mục rõ ràng

Chỉ trả lời các câu hỏi liên quan đến bảo mật mạng, an toàn thông tin, phòng chống lừa đảo trực tuyến.`;
  }

  isConfigured() {
    // Try to get API key from environment variables or Firebase config
    const apiKey = process.env.OPENAI_API_KEY ||
                   (typeof functions !== 'undefined' && functions.config().openai?.api_key);

    if (!apiKey) {
      logger.warn('OpenAI API key not configured');
      return false;
    }

    if (!this.openai) {
      this.openai = new OpenAI({
        apiKey: apiKey
      });
    }
    return true;
  }

  async sendMessage(userMessage, conversationHistory = []) {
    try {
      if (!this.isConfigured()) {
        return this.getFallbackResponse(userMessage);
      }

      // Validate message
      const validation = this.validateMessage(userMessage);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // Prepare messages for OpenAI
      const messages = [
        { role: 'system', content: this.systemPrompt }
      ];

      // Add conversation history (limit to last 10 messages)
      const recentHistory = conversationHistory.slice(-10);
      messages.push(...recentHistory);

      // Add current user message
      messages.push({ role: 'user', content: validation.message });

      logger.info('Sending request to OpenAI', { 
        messageCount: messages.length,
        model: this.model 
      });

      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: messages,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      });

      const response = completion.choices[0]?.message?.content;
      
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      logger.info('OpenAI response received', {
        usage: completion.usage,
        model: completion.model
      });

      return {
        success: true,
        message: response,
        usage: completion.usage,
        model: completion.model
      };

    } catch (error) {
      logger.error('OpenAI API error:', error);

      // Handle specific OpenAI errors
      if (error.status === 429) {
        if (error.code === 'insufficient_quota') {
          return {
            success: false,
            error: 'Tài khoản OpenAI đã hết quota. Vui lòng kiểm tra billing và thêm credit vào tài khoản.'
          };
        }
        return {
          success: false,
          error: 'Đã vượt quá giới hạn API. Vui lòng thử lại sau.'
        };
      }

      if (error.status === 401) {
        return {
          success: false,
          error: 'Lỗi xác thực OpenAI API. Vui lòng kiểm tra API key.'
        };
      }

      if (error.status === 400) {
        return {
          success: false,
          error: 'Yêu cầu không hợp lệ. Vui lòng thử lại với tin nhắn khác.'
        };
      }

      // Only fallback in development or if specifically configured
      if (process.env.NODE_ENV === 'development' || process.env.ALLOW_FALLBACK === 'true') {
        logger.warn('Development mode: falling back to mock response:', error.message);
        return this.getFallbackResponse(userMessage);
      }

      // In production, return proper error
      return {
        success: false,
        error: 'Dịch vụ AI tạm thời không khả dụng. Vui lòng thử lại sau.'
      };
    }
  }

  getFallbackResponse(userMessage) {
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('phishing') || lowerMessage.includes('lừa đảo')) {
      return {
        success: true,
        message: `🎣 **Cách nhận biết email phishing:**

1. **Kiểm tra địa chỉ gửi**: Email phishing thường sử dụng địa chỉ giả mạo hoặc tên miền tương tự các tổ chức uy tín.

2. **Nội dung khẩn cấp**: Thường tạo cảm giác cấp bách như "tài khoản sẽ bị khóa", "cần xác minh ngay".

3. **Liên kết đáng ngờ**: Hover chuột lên link để xem URL thực. Phishing thường dùng URL rút gọn hoặc tên miền giả.

4. **Yêu cầu thông tin cá nhân**: Ngân hàng, tổ chức uy tín không bao giờ yêu cầu mật khẩu qua email.

5. **Lỗi chính tả**: Email phishing thường có nhiều lỗi ngữ pháp, chính tả.

**Lời khuyên**: Luôn truy cập trực tiếp website chính thức thay vì click link trong email đáng ngờ.`,
        usage: { prompt_tokens: 50, completion_tokens: 100, total_tokens: 150 },
        model: 'fallback-response'
      };
    }

    if (lowerMessage.includes('mật khẩu') || lowerMessage.includes('password')) {
      return {
        success: true,
        message: `🔐 **Cách tạo mật khẩu mạnh:**

1. **Độ dài**: Tối thiểu 12 ký tự, càng dài càng tốt.

2. **Kết hợp đa dạng**: 
   - Chữ hoa (A-Z)
   - Chữ thường (a-z) 
   - Số (0-9)
   - Ký tự đặc biệt (!@#$%^&*)

3. **Tránh thông tin cá nhân**: Không dùng tên, ngày sinh, số điện thoại.

4. **Unique cho mỗi tài khoản**: Mỗi website/app một mật khẩu riêng.

5. **Sử dụng Password Manager**: LastPass, 1Password, Bitwarden để quản lý.

**Ví dụ mật khẩu mạnh**: MyC@t15Fluffy&Cute2024!

**Lời khuyên**: Bật 2FA (xác thực 2 bước) cho tất cả tài khoản quan trọng.`,
        usage: { prompt_tokens: 50, completion_tokens: 120, total_tokens: 170 },
        model: 'fallback-response'
      };
    }

    // Default response
    return {
      success: true,
      message: `🛡️ **Chào bạn!** 

Tôi là trợ lý AI chuyên về bảo mật mạng. Tôi có thể giúp bạn về:

• **Phishing & Lừa đảo**: Cách nhận biết và phòng tránh
• **Mật khẩu**: Tạo và quản lý mật khẩu an toàn  
• **Malware**: Bảo vệ khỏi virus và phần mềm độc hại
• **Bảo mật WiFi**: Thiết lập mạng an toàn
• **Mạng xã hội**: Bảo vệ thông tin cá nhân
• **Phân tích URL**: Đánh giá tính an toàn của website

Bạn có câu hỏi cụ thể nào về bảo mật không? Tôi sẽ cung cấp lời khuyên chi tiết và thực tế.

${!this.isConfigured() ? '*Lưu ý: OpenAI API chưa được cấu hình. Vui lòng liên hệ quản trị viên để kích hoạt tính năng AI.*' : ''}`,
      usage: { prompt_tokens: 30, completion_tokens: 80, total_tokens: 110 },
      model: 'fallback-response'
    };
  }

  validateMessage(message) {
    if (!message || typeof message !== 'string') {
      return { valid: false, error: 'Tin nhắn không hợp lệ' };
    }

    const trimmedMessage = message.trim();
    
    if (trimmedMessage.length === 0) {
      return { valid: false, error: 'Tin nhắn không được để trống' };
    }

    if (trimmedMessage.length > 1000) {
      return { valid: false, error: 'Tin nhắn quá dài (tối đa 1000 ký tự)' };
    }

    return { valid: true, message: trimmedMessage };
  }

  getConversationStarters() {
    return [
      "Làm thế nào để nhận biết email lừa đảo?",
      "Cách tạo mật khẩu mạnh và an toàn?",
      "Phần mềm diệt virus nào tốt nhất?",
      "Cách bảo vệ thông tin cá nhân trên mạng?",
      "Dấu hiệu nhận biết website giả mạo?",
      "Cách bảo mật tài khoản mạng xã hội?",
      "Phải làm gì khi bị hack tài khoản?",
      "Cách kiểm tra link có an toàn không?"
    ];
  }
}

module.exports = new OpenAIService();
