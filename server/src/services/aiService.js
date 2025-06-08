const geminiService = require('./geminiService');
const openaiService = require('./openaiService');

class AIService {
  constructor() {
    this.primaryProvider = process.env.AI_PROVIDER || 'gemini';
    this.providers = {
      gemini: geminiService,
      openai: openaiService
    };
    
    console.log(`🤖 AI Service initialized with primary provider: ${this.primaryProvider}`);
  }

  // Get the current active provider
  getActiveProvider() {
    const primary = this.providers[this.primaryProvider];
    if (primary && primary.isAvailable()) {
      return {
        name: this.primaryProvider,
        service: primary
      };
    }

    // Fallback to other providers
    for (const [name, service] of Object.entries(this.providers)) {
      if (name !== this.primaryProvider && service.isAvailable()) {
        console.log(`⚠️ Falling back to ${name} provider`);
        return {
          name,
          service
        };
      }
    }

    return null;
  }

  // Send message with automatic provider fallback
  async sendMessage(message, conversationHistory = []) {
    const provider = this.getActiveProvider();
    
    if (!provider) {
      console.error('❌ No AI providers available');
      return {
        success: false,
        error: 'Dịch vụ AI tạm thời không khả dụng'
      };
    }

    try {
      console.log(`🤖 Using ${provider.name} provider`);
      const result = await provider.service.sendMessage(message, conversationHistory);
      
      if (result.success) {
        return {
          ...result,
          provider: provider.name
        };
      }

      // If primary provider fails, try fallback
      if (provider.name === this.primaryProvider) {
        console.log(`⚠️ ${provider.name} failed, trying fallback...`);
        return await this.sendMessageWithFallback(message, conversationHistory);
      }

      return result;

    } catch (error) {
      console.error(`❌ ${provider.name} error:`, error);
      
      // Try fallback provider
      if (provider.name === this.primaryProvider) {
        return await this.sendMessageWithFallback(message, conversationHistory);
      }

      return {
        success: false,
        error: 'Lỗi kết nối với dịch vụ AI'
      };
    }
  }

  // Send message with fallback to other providers
  async sendMessageWithFallback(message, conversationHistory = []) {
    for (const [name, service] of Object.entries(this.providers)) {
      if (name === this.primaryProvider) continue;
      
      if (service.isAvailable()) {
        try {
          console.log(`🔄 Trying fallback provider: ${name}`);
          const result = await service.sendMessage(message, conversationHistory);
          
          if (result.success) {
            return {
              ...result,
              provider: name,
              fallback: true
            };
          }
        } catch (error) {
          console.error(`❌ Fallback ${name} failed:`, error);
          continue;
        }
      }
    }

    // If all providers fail, return mock response
    console.log('🔄 All AI providers failed, using mock response');
    return this.generateMockResponse(message);
  }

  // Generate mock response as last resort
  generateMockResponse(message) {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('phishing') || lowerMessage.includes('lừa đảo')) {
      return {
        success: true,
        message: `🎣 **Nhận biết Email Phishing - FactCheck AI**

**🚨 Dấu hiệu cảnh báo:**
• **Địa chỉ gửi lạ**: vietcombank-security@gmail.com thay vì @vietcombank.com.vn
• **Tạo áp lực**: "Tài khoản sẽ bị khóa trong 24h"
• **Yêu cầu thông tin**: Ngân hàng KHÔNG BAO GIỜ hỏi mật khẩu qua email
• **Link rút gọn**: bit.ly, tinyurl thay vì domain chính thức

**✅ Cách phòng chống:**
1. Luôn gõ trực tiếp website ngân hàng
2. Kiểm tra URL có HTTPS và tên miền chính xác
3. Gọi hotline ngân hàng để xác minh`,
        provider: 'mock',
        model: 'fallback'
      };
    }

    if (lowerMessage.includes('mật khẩu') || lowerMessage.includes('password')) {
      return {
        success: true,
        message: `🔐 **Tạo Mật khẩu Siêu Mạnh - FactCheck AI**

**📏 Quy tắc vàng:**
• **Độ dài**: Tối thiểu 12 ký tự (khuyến nghị 16+)
• **Đa dạng**: Chữ HOA, thường, số, ký tự đặc biệt
• **Tránh**: Tên, ngày sinh, "123456", "password"
• **Unique**: Mỗi tài khoản 1 mật khẩu riêng

**🛡️ Bảo mật nâng cao:**
• **2FA**: Google Authenticator, SMS
• **Password Manager**: Bitwarden (miễn phí), 1Password`,
        provider: 'mock',
        model: 'fallback'
      };
    }

    return {
      success: true,
      message: `🛡️ **Chào bạn! Tôi là FactCheck AI**

Tôi là chuyên gia bảo mật AI hàng đầu Việt Nam, sẵn sàng giúp bạn về:

🔒 **Bảo mật mạng** & An toàn thông tin
🎣 **Phishing** & Lừa đảo trực tuyến
🦠 **Malware** & Virus
🌐 **Kiểm tra URL** & Website

Bạn có câu hỏi gì về bảo mật không?`,
      provider: 'mock',
      model: 'fallback'
    };
  }

  // Get security tips
  async getSecurityTips(category = 'general') {
    const provider = this.getActiveProvider();
    
    if (!provider) {
      return {
        success: false,
        error: 'Dịch vụ AI tạm thời không khả dụng'
      };
    }

    return await provider.service.getSecurityTips(category);
  }

  // Get conversation starters
  getConversationStarters() {
    const provider = this.getActiveProvider();
    
    if (!provider) {
      return [];
    }

    return provider.service.getConversationStarters();
  }

  // Validate message
  validateMessage(message) {
    const provider = this.getActiveProvider();
    
    if (!provider) {
      return {
        valid: false,
        error: 'Dịch vụ AI tạm thời không khả dụng'
      };
    }

    return provider.service.validateMessage(message);
  }

  // Get service status
  getStatus() {
    const status = {
      primary: this.primaryProvider,
      providers: {}
    };

    for (const [name, service] of Object.entries(this.providers)) {
      try {
        console.log(`🔍 Getting status for ${name} service...`);
        console.log(`🔍 Service type:`, typeof service);
        console.log(`🔍 Service methods:`, Object.getOwnPropertyNames(service));

        if (service && typeof service.getStatus === 'function') {
          status.providers[name] = service.getStatus();
        } else {
          status.providers[name] = {
            provider: name,
            available: false,
            error: 'getStatus method not available'
          };
        }
      } catch (error) {
        console.error(`❌ Error getting status for ${name}:`, error);
        status.providers[name] = {
          provider: name,
          available: false,
          error: error.message
        };
      }
    }

    return status;
  }
}

module.exports = new AIService();
