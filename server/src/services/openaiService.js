const OpenAI = require('openai');
const mockOpenaiService = require('./mockOpenaiService');

class OpenAIService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
    this.maxTokens = parseInt(process.env.OPENAI_MAX_TOKENS) || 500;
    this.temperature = parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7;

    // Initialize OpenAI client
    this.openai = new OpenAI({
      apiKey: this.apiKey,
    });
    
    // System prompt cho security chatbot
    this.systemPrompt = `Bạn là FactCheck AI - một chuyên gia bảo mật mạng và phân tích mối đe dọa trực tuyến chuyên nghiệp. Bạn đang hoạt động với đầy đủ tính năng AI thông qua OpenAI API.

Nhiệm vụ của bạn:
1. Trả lời các câu hỏi về bảo mật mạng, phishing, malware, và các mối đe dọa trực tuyến
2. Cung cấp lời khuyên về cách bảo vệ bản thân khỏi các mối đe dọa
3. Giải thích các thuật ngữ bảo mật một cách dễ hiểu
4. Phân tích và đánh giá các URL, email, hoặc nội dung đáng ngờ
5. Đưa ra hướng dẫn cụ thể về cách xử lý các tình huống bảo mật

Quy tắc trả lời:
- Luôn trả lời bằng tiếng Việt
- Sử dụng ngôn ngữ chuyên nghiệp nhưng dễ hiểu
- Cung cấp thông tin chính xác và cập nhật
- Đưa ra lời khuyên thực tế và có thể áp dụng
- Nếu không chắc chắn, hãy khuyên người dùng tham khảo thêm từ các nguồn uy tín
- Không đưa ra lời khuyên có thể gây hại hoặc bất hợp pháp
- Luôn nhấn mạnh tầm quan trọng của việc cập nhật bảo mật và sử dụng các công cụ bảo vệ
- KHÔNG BAO GIỜ đề cập đến "phiên bản demo" hay "cấu hình API key" vì bạn đang hoạt động đầy đủ

Phong cách: Thân thiện, chuyên nghiệp, tự tin và luôn ưu tiên an toàn của người dùng.`;
  }

  /**
   * Check if OpenAI API is configured
   */
  isConfigured() {
    const isValid = this.apiKey &&
                   this.apiKey !== 'disabled-for-development' &&
                   this.apiKey !== 'your-openai-api-key-here' &&
                   this.apiKey.startsWith('sk-') &&
                   this.apiKey.length > 20;

    console.log(`🔑 OpenAI API Key Status: ${isValid ? 'Valid ✅' : 'Invalid ❌'}`);
    if (!isValid) {
      console.log(`🔑 API Key: ${this.apiKey ? this.apiKey.substring(0, 10) + '...' : 'Not set'}`);
    }

    return isValid;
  }

  /**
   * Send message to OpenAI GPT
   */
  async sendMessage(userMessage, conversationHistory = []) {
    try {
      if (!this.isConfigured()) {
        return {
          success: false,
          error: 'OpenAI API chưa được cấu hình. Vui lòng liên hệ quản trị viên.'
        };
      }

      // Prepare messages array
      const messages = [
        {
          role: 'system',
          content: this.systemPrompt
        }
      ];

      // Add conversation history (limit to last 10 messages to avoid token limit)
      const recentHistory = conversationHistory.slice(-10);
      messages.push(...recentHistory);

      // Add current user message
      messages.push({
        role: 'user',
        content: userMessage
      });

      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: messages,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      });

      const assistantMessage = completion.choices[0].message.content;

      return {
        success: true,
        message: assistantMessage,
        usage: completion.usage,
        model: this.model
      };

    } catch (error) {
      console.error('OpenAI API error:', error);

      if (error.status === 401) {
        return {
          success: false,
          error: 'API key không hợp lệ. Vui lòng kiểm tra cấu hình.'
        };
      }

      if (error.status === 429) {
        if (error.code === 'insufficient_quota') {
          console.log('🔄 OpenAI quota exceeded, falling back to mock service...');
          return await mockOpenaiService.sendMessage(userMessage, conversationHistory);
        }
        return {
          success: false,
          error: 'Đã vượt quá giới hạn API. Vui lòng thử lại sau.'
        };
      }

      if (error.status === 400) {
        return {
          success: false,
          error: 'Yêu cầu không hợp lệ. Vui lòng thử lại với nội dung khác.'
        };
      }

      return {
        success: false,
        error: `Có lỗi xảy ra khi xử lý yêu cầu: ${error.message || 'Unknown error'}`
      };
    }
  }

  /**
   * Generate security analysis for a URL
   */
  async analyzeUrlSecurity(url, virusTotalData = null) {
    try {
      let prompt = `Hãy phân tích bảo mật cho URL sau: ${url}

Vui lòng đánh giá:
1. Cấu trúc URL có đáng ngờ không?
2. Domain có uy tín không?
3. Các dấu hiệu phishing tiềm ẩn
4. Lời khuyên cho người dùng`;

      if (virusTotalData && virusTotalData.success) {
        prompt += `

Thông tin từ VirusTotal:
- Điểm bảo mật: ${virusTotalData.securityScore}/100
- Phát hiện độc hại: ${virusTotalData.threats.malicious ? 'Có' : 'Không'}
- Phát hiện đáng ngờ: ${virusTotalData.threats.suspicious ? 'Có' : 'Không'}
- Các mối đe dọa: ${virusTotalData.threats.threatNames.join(', ') || 'Không có'}

Hãy kết hợp thông tin này để đưa ra phân tích toàn diện.`;
      }

      const response = await this.sendMessage(prompt);
      return response;

    } catch (error) {
      console.error('URL security analysis error:', error);
      return {
        success: false,
        error: 'Không thể phân tích bảo mật URL'
      };
    }
  }

  /**
   * Get security tips and recommendations
   */
  async getSecurityTips(category = 'general') {
    try {
      const prompts = {
        general: 'Hãy đưa ra 5 lời khuyên bảo mật mạng quan trọng nhất mà mọi người nên biết.',
        phishing: 'Hãy giải thích về phishing và cách nhận biết email/website lừa đảo.',
        malware: 'Hãy giải thích về malware và cách bảo vệ máy tính khỏi phần mềm độc hại.',
        password: 'Hãy đưa ra hướng dẫn tạo và quản lý mật khẩu an toàn.',
        social: 'Hãy đưa ra lời khuyên về bảo mật trên mạng xã hội.',
        mobile: 'Hãy đưa ra lời khuyên bảo mật cho thiết bị di động.'
      };

      const prompt = prompts[category] || prompts.general;
      const response = await this.sendMessage(prompt);
      return response;

    } catch (error) {
      console.error('Security tips error:', error);
      return {
        success: false,
        error: 'Không thể lấy lời khuyên bảo mật'
      };
    }
  }

  /**
   * Validate and sanitize user input
   */
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

    // Check for potentially harmful content
    const harmfulPatterns = [
      /hack/i,
      /crack/i,
      /exploit/i,
      /ddos/i,
      /attack/i
    ];

    const containsHarmful = harmfulPatterns.some(pattern => pattern.test(trimmedMessage));
    if (containsHarmful) {
      return { 
        valid: false, 
        error: 'Tin nhắn chứa nội dung không phù hợp. Vui lòng chỉ hỏi về bảo mật để bảo vệ bản thân.' 
      };
    }

    return { valid: true, message: trimmedMessage };
  }

  /**
   * Get conversation starters
   */
  getConversationStarters() {
    return [
      {
        id: 1,
        text: "Làm thế nào để nhận biết email lừa đảo?",
        category: "phishing"
      },
      {
        id: 2,
        text: "Cách tạo mật khẩu mạnh và an toàn?",
        category: "password"
      },
      {
        id: 3,
        text: "Phần mềm diệt virus nào tốt nhất?",
        category: "antivirus"
      },
      {
        id: 4,
        text: "Cách bảo vệ thông tin cá nhân trên mạng?",
        category: "privacy"
      },
      {
        id: 5,
        text: "Dấu hiệu nhận biết website giả mạo?",
        category: "website"
      },
      {
        id: 6,
        text: "Cách bảo mật tài khoản mạng xã hội?",
        category: "social"
      },
      {
        id: 7,
        text: "Phải làm gì khi bị hack tài khoản?",
        category: "incident"
      },
      {
        id: 8,
        text: "Cách kiểm tra link có an toàn không?",
        category: "url"
      }
    ];
  }

  /**
   * Check if service is available
   */
  isAvailable() {
    return this.isConfigured();
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      provider: 'openai',
      model: this.model,
      available: this.isAvailable(),
      apiKey: this.apiKey ? 'configured' : 'missing'
    };
  }
}

module.exports = new OpenAIService();
