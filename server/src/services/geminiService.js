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

  // Analyze URL/Website content for security assessment
  async analyzeUrl(url, additionalContext = '') {
    try {
      if (!this.generativeModel) {
        throw new Error('Gemini service not initialized');
      }

      const prompt = `Bạn là FactCheck AI - chuyên gia bảo mật mạng hàng đầu Việt Nam.

NHIỆM VỤ: Phân tích URL/website sau đây về mặt bảo mật và độ tin cậy:

URL: ${url}
${additionalContext ? `THÔNG TIN BỔ SUNG: ${additionalContext}` : ''}

HÃY PHÂN TÍCH:
1. **Đánh giá độ tin cậy** (0-100 điểm)
2. **Các dấu hiệu nguy hiểm** (nếu có)
3. **Khuyến nghị bảo mật** cụ thể
4. **Mức độ rủi ro** (Thấp/Trung bình/Cao/Rất cao)

YÊU CẦU:
- Trả lời bằng tiếng Việt
- Ngắn gọn, súc tích (tối đa 300 từ)
- Đưa ra điểm số cụ thể
- Lời khuyên thực tế

ĐỊNH DẠNG TRẢ LỜI:
🔍 **Phân tích bảo mật URL**

**Điểm tin cậy:** [0-100]/100
**Mức độ rủi ro:** [Thấp/Trung bình/Cao/Rất cao]

**Đánh giá:**
[Phân tích chi tiết]

**⚠️ Cảnh báo:**
[Các dấu hiệu nguy hiểm nếu có]

**✅ Khuyến nghị:**
[Lời khuyên cụ thể]`;

      console.log('🤖 Analyzing URL with Gemini...');

      const result = await this.generativeModel.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      if (!text) {
        throw new Error('Empty response from Gemini');
      }

      console.log('✅ Gemini URL analysis completed');

      // Extract score from response (simple regex)
      const scoreMatch = text.match(/\*\*Điểm tin cậy:\*\*\s*(\d+)/);
      const credibilityScore = scoreMatch ? parseInt(scoreMatch[1]) : null;

      // Extract risk level
      const riskMatch = text.match(/\*\*Mức độ rủi ro:\*\*\s*(Thấp|Trung bình|Cao|Rất cao)/);
      const riskLevel = riskMatch ? riskMatch[1] : 'Không xác định';

      return {
        success: true,
        analysis: text.trim(),
        credibilityScore,
        riskLevel,
        analyzedAt: new Date().toISOString(),
        model: this.model
      };

    } catch (error) {
      console.error('❌ Gemini URL analysis error:', error);
      return {
        success: false,
        error: error.message || 'Lỗi phân tích URL với Gemini AI',
        analysis: null,
        credibilityScore: null,
        riskLevel: 'Không xác định'
      };
    }
  }

  // Analyze community post content
  async analyzeCommunityPost(title, content, url = null) {
    try {
      if (!this.generativeModel) {
        throw new Error('Gemini service not initialized');
      }

      const prompt = `Bạn là FactCheck AI - chuyên gia phân tích thông tin và bảo mật.

NHIỆM VỤ: Phân tích bài viết cộng đồng sau đây:

TIÊU ĐỀ: ${title}
NỘI DUNG: ${content}
${url ? `URL LIÊN QUAN: ${url}` : ''}

HÃY ĐÁNH GIÁ:
1. **Độ tin cậy thông tin** (0-100 điểm)
2. **Dấu hiệu tin giả/lừa đảo** (nếu có)
3. **Lời khuyên xác minh**
4. **Mức độ cảnh báo** (Thấp/Trung bình/Cao)

YÊU CẦU:
- Trả lời bằng tiếng Việt
- Ngắn gọn (tối đa 250 từ)
- Đưa ra điểm số và lời khuyên cụ thể

ĐỊNH DẠNG:
📝 **Phân tích bài viết**

**Điểm tin cậy:** [0-100]/100
**Mức cảnh báo:** [Thấp/Trung bình/Cao]

**Nhận xét:**
[Đánh giá nội dung]

**🔍 Cách xác minh:**
[Hướng dẫn kiểm tra]

**💡 Lời khuyên:**
[Khuyến nghị cụ thể]`;

      console.log('🤖 Analyzing community post with Gemini...');

      const result = await this.generativeModel.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      if (!text) {
        throw new Error('Empty response from Gemini');
      }

      console.log('✅ Gemini post analysis completed');

      // Extract score and alert level
      const scoreMatch = text.match(/\*\*Điểm tin cậy:\*\*\s*(\d+)/);
      const trustScore = scoreMatch ? parseInt(scoreMatch[1]) : null;

      const alertMatch = text.match(/\*\*Mức cảnh báo:\*\*\s*(Thấp|Trung bình|Cao)/);
      const alertLevel = alertMatch ? alertMatch[1] : 'Thấp';

      return {
        success: true,
        analysis: text.trim(),
        trustScore,
        alertLevel,
        analyzedAt: new Date().toISOString(),
        model: this.model
      };

    } catch (error) {
      console.error('❌ Gemini post analysis error:', error);
      return {
        success: false,
        error: error.message || 'Lỗi phân tích bài viết với Gemini AI',
        analysis: null,
        trustScore: null,
        alertLevel: 'Thấp'
      };
    }
  }

  // Generate AI recommendations for community content
  async generateCommunityRecommendations(posts, comments = []) {
    try {
      if (!this.generativeModel) {
        throw new Error('Gemini service not initialized');
      }

      // Prepare content summary
      const postSummary = posts.slice(0, 5).map(post =>
        `- ${post.title}: ${post.content?.substring(0, 100)}...`
      ).join('\n');

      const commentSummary = comments.slice(0, 10).map(comment =>
        `- ${comment.content?.substring(0, 80)}...`
      ).join('\n');

      const prompt = `Bạn là FactCheck AI - chuyên gia bảo mật và phân tích thông tin.

NHIỆM VỤ: Dựa trên các bài viết và bình luận trong cộng đồng, hãy đưa ra lời khuyên bảo mật:

BÁI VIẾT GẦN ĐÂY:
${postSummary}

BÌNH LUẬN GẦN ĐÂY:
${commentSummary}

HÃY ĐƯA RA:
1. **3 lời khuyên bảo mật** phù hợp với nội dung
2. **Cảnh báo** về các mối đe dọa phổ biến
3. **Hướng dẫn** xác minh thông tin

YÊU CẦU:
- Ngắn gọn (tối đa 200 từ)
- Thực tế, hữu ích
- Phù hợp với người Việt Nam

ĐỊNH DẠNG:
💡 **Lời khuyên từ FactCheck AI**

**🛡️ Bảo mật:**
1. [Lời khuyên 1]
2. [Lời khuyên 2]
3. [Lời khuyên 3]

**⚠️ Cảnh báo:**
[Mối đe dọa cần chú ý]

**🔍 Xác minh:**
[Cách kiểm tra thông tin]`;

      console.log('🤖 Generating community recommendations with Gemini...');

      const result = await this.generativeModel.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      if (!text) {
        throw new Error('Empty response from Gemini');
      }

      console.log('✅ Gemini recommendations generated');

      return {
        success: true,
        recommendations: text.trim(),
        generatedAt: new Date().toISOString(),
        model: this.model
      };

    } catch (error) {
      console.error('❌ Gemini recommendations error:', error);
      return {
        success: false,
        error: error.message || 'Lỗi tạo lời khuyên với Gemini AI',
        recommendations: null
      };
    }
  }
}

module.exports = new GeminiService();
