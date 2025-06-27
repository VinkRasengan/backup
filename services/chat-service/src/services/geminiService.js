// Load environment variables first
const path = require('path');
const fs = require('fs');

// Load from root .env file (same as app.js)
const rootEnvPath = path.join(__dirname, '../../../../.env');
if (fs.existsSync(rootEnvPath)) {
  require('dotenv').config({ path: rootEnvPath });
} else {
  require('dotenv').config();
}

const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.genAI = null;
    this.model = null;
    
    console.log('🔧 GeminiService initializing...', { 
      hasApiKey: !!this.apiKey,
      apiKeyPrefix: this.apiKey ? this.apiKey.substring(0, 10) + '...' : 'none',
      envPath: rootEnvPath
    });
    
    if (this.apiKey) {
      try {
        this.genAI = new GoogleGenerativeAI(this.apiKey);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        console.log('✅ Gemini API initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize Gemini API:', error.message);
      }
    } else {
      console.warn('⚠️ GEMINI_API_KEY not found - using fallback responses');
    }
  }

  /**
   * System prompt for FactCheck AI assistant
   */
  getSystemPrompt() {
    return `Bạn là trợ lý AI của FactCheck - nền tảng kiểm tra thông tin và bảo mật online hàng đầu tại Việt Nam.

NHÂN CÁCH & VAI TRÒ:
- Thân thiện, chuyên nghiệp, đáng tin cậy
- Chuyên gia về cybersecurity, fact-checking, và an toàn mạng
- Luôn ưu tiên bảo vệ người dùng khỏi các mối đe dọa online

KHẢ NĂNG CHÍNH:
🔍 Kiểm tra và phân tích links/websites
🛡️ Tư vấn bảo mật mạng
📰 Xác minh thông tin và tin tức  
🎯 Nhận biết lừa đảo, phishing, malware
💡 Giáo dục về an toàn mạng

NGUYÊN TẮC PHẢN HỒI:
- Luôn đưa ra lời khuyên an toàn, thận trọng
- Khuyến khích user sử dụng các tính năng của FactCheck platform
- Sử dụng emoji phù hợp để tạo sự thân thiện
- Đưa ra thông tin cụ thể, actionable advice
- Không đưa ra thông tin y tế, pháp lý, tài chính cụ thể

STYLE:
- Tiếng Việt tự nhiên, dễ hiểu
- Cấu trúc rõ ràng với bullet points
- Tone tích cực, hỗ trợ
- Độ dài vừa phải (không quá dài)

Hãy trả lời câu hỏi của người dùng theo phong cách và vai trò này.`;
  }

  /**
   * Generate AI response using Gemini
   */
  async generateResponse(userMessage) {
    try {
      if (!this.model) {
        throw new Error('Gemini API not configured');
      }

      // Combine system prompt with user message
      const fullPrompt = `${this.getSystemPrompt()}\n\nNgười dùng hỏi: "${userMessage}"\n\nTrả lời:`;

      const result = await this.model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();

      return {
        success: true,
        response: text.trim(),
        usage: {
          promptTokens: fullPrompt.length,
          completionTokens: text.length,
          totalTokens: fullPrompt.length + text.length
        }
      };

    } catch (error) {
      console.error('Gemini API Error:', error);
      
      // Return fallback response if API fails
      return this.getFallbackResponse(userMessage);
    }
  }

  /**
   * Fallback responses when Gemini API fails
   */
  getFallbackResponse(userMessage) {
    const messageText = userMessage.toLowerCase();
    
    let response = '';
    
    if (messageText.includes('xin chào') || messageText.includes('hello') || messageText.includes('hi')) {
      response = `Xin chào! 👋 Tôi là trợ lý FactCheck AI. Tôi có thể giúp bạn:

🔍 **Kiểm tra tính xác thực của links và websites**
🛡️ **Phân tích rủi ro bảo mật**
📰 **Xác minh thông tin và tin tức**
💡 **Tư vấn về an toàn mạng**

Bạn cần hỗ trợ gì hôm nay?`;
    } else if (messageText.includes('link') || messageText.includes('url') || messageText.includes('website')) {
      response = `🔗 **Để kiểm tra link an toàn, bạn có thể:**

1. **Sao chép và dán link** vào đây, tôi sẽ phân tích ngay
2. **Sử dụng công cụ Check Link** - nhấn vào menu bên trái
3. **Kiểm tra chứng chỉ SSL** và domain reputation

⚠️ **Dấu hiệu cảnh báo:**
• URL rút gọn đáng ngờ
• Domain lạ hoặc typo
• Yêu cầu thông tin cá nhân ngay lập tức

Hãy gửi link bạn muốn kiểm tra nhé!`;
    } else if (messageText.includes('lừa đảo') || messageText.includes('scam') || messageText.includes('phishing')) {
      response = `🚨 **Cách nhận biết lừa đảo online:**

**🎭 Dấu hiệu nghi ngờ:**
• Email/tin nhắn yêu cầu thông tin cá nhân
• Links rút gọn đáng ngờ
• Offers "quá tốt để có thể tin được"
• Ngữ pháp kém, chính tả sai
• Tạo áp lực phải hành động ngay

**🛡️ Biện pháp bảo vệ:**
✅ Luôn xác minh nguồn gốc
✅ Không click links đáng ngờ
✅ Sử dụng FactCheck để kiểm tra
✅ Báo cáo cho cộng đồng

Bạn có gặp tình huống đáng ngờ nào cần kiểm tra không?`;
    } else {
      response = `Cảm ơn bạn đã liên hệ! 😊 Tôi là trợ lý FactCheck AI, chuyên hỗ trợ về:

🔍 **Kiểm tra link và website**
🛡️ **Bảo mật mạng**  
📰 **Xác minh thông tin**
🎯 **Nhận biết lừa đảo**

Để tôi có thể hỗ trợ tốt nhất, bạn có thể:
• Chia sẻ cụ thể vấn đề cần giải quyết
• Gửi link cần kiểm tra
• Hỏi về cách bảo vệ an toàn online

Bạn cần hỗ trợ gì cụ thể?`;
    }

    return {
      success: true,
      response: response,
      fallback: true,
      error: 'Using fallback response due to API unavailability'
    };
  }

  /**
   * Check if Gemini service is available
   */
  isAvailable() {
    return !!(this.apiKey && this.genAI && this.model);
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      configured: !!this.apiKey,
      available: this.isAvailable(),
      model: 'gemini-1.5-flash',
      features: {
        textGeneration: true,
        conversational: true,
        multiTurn: true
      }
    };
  }
}

module.exports = new GeminiService(); 