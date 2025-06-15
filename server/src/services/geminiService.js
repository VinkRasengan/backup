const { GoogleGenerativeAI } = require('@google/generative-ai');
const { geminiConfig, getGeminiClient } = require('../config/gemini');
const logger = require('../utils/logger');

class GeminiService {
  constructor() {
    this.genAI = null;
    this.model = null;
    this.initialize();
  }

  async initialize() {
    try {
      this.genAI = getGeminiClient();
      this.model = this.genAI.getGenerativeModel({ model: geminiConfig.model });
      logger.info('✅ Gemini service initialized successfully');
    } catch (error) {
      logger.error('❌ Failed to initialize Gemini service:', error);
    }
  }

  isConfigured() {
    return !!this.genAI && !!this.model;
  }

  async sendMessage(message, history = []) {
    if (!this.isConfigured()) {
      throw new Error('Gemini service not initialized');
    }

    try {
      logger.info('🤖 Sending request to Gemini...', {
        messageLength: message.length,
        historyLength: history.length
      });

      const chat = this.model.startChat({
        history: history.map(msg => ({
          role: msg.role,
          parts: [{ text: msg.content }]
        })),
        generationConfig: geminiConfig.chatConfig
      });

      const result = await chat.sendMessage(message);
      const response = await result.response;
      const text = response.text();

      if (!text) {
        throw new Error('Empty response from Gemini');
      }

      logger.info('✅ Gemini response received', {
        responseLength: text.length
      });

      return {
        success: true,
        message: text,
        model: geminiConfig.model,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('❌ Gemini API error:', error);
      
      // Xử lý các lỗi cụ thể
      if (error.message.includes('API key')) {
        throw new Error('Lỗi xác thực Gemini API. Vui lòng kiểm tra API key.');
      }
      if (error.message.includes('quota')) {
        throw new Error('Tài khoản Gemini đã hết quota. Vui lòng kiểm tra billing và thêm credit vào tài khoản.');
      }
      
      throw new Error(error.message || 'Lỗi kết nối với Gemini AI');
    }
  }

  async analyzeUrl(url) {
    if (!this.isConfigured()) {
      throw new Error('Gemini service not initialized');
    }

    try {
      logger.info('🤖 Analyzing URL with Gemini...', { url });

      const prompt = `Analyze this URL for security and credibility: ${url}
      Please provide:
      1. Overall risk assessment
      2. Potential security concerns
      3. Credibility score (0-100)
      4. Recommendations`;

      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: geminiConfig.urlAnalysisConfig
      });

      const response = await result.response;
      const text = response.text();

      if (!text) {
        throw new Error('Empty response from Gemini');
      }

      logger.info('✅ Gemini URL analysis completed');

      // Parse response to extract structured data
      const analysis = this.parseAnalysisResponse(text);

      return {
        success: true,
        analysis: analysis.summary,
        credibilityScore: analysis.score,
        riskLevel: analysis.riskLevel,
        recommendations: analysis.recommendations,
        analyzedAt: new Date().toISOString(),
        model: geminiConfig.model
      };
    } catch (error) {
      logger.error('❌ Gemini URL analysis error:', error);
      return {
        success: false,
        error: error.message || 'Lỗi phân tích URL với Gemini AI',
        analyzedAt: new Date().toISOString()
      };
    }
  }

  parseAnalysisResponse(text) {
    // Implement parsing logic here
    // This is a simplified version
    const lines = text.split('\n');
    let summary = '';
    let score = 50; // Default score
    let riskLevel = 'medium';
    let recommendations = [];

    for (const line of lines) {
      if (line.includes('risk assessment')) {
        summary += line + '\n';
      } else if (line.includes('score')) {
        const scoreMatch = line.match(/\d+/);
        if (scoreMatch) {
          score = parseInt(scoreMatch[0]);
        }
      } else if (line.includes('risk level')) {
        if (line.toLowerCase().includes('high')) {
          riskLevel = 'high';
        } else if (line.toLowerCase().includes('low')) {
          riskLevel = 'low';
        }
      } else if (line.includes('recommend')) {
        recommendations.push(line);
      }
    }

    return {
      summary,
      score,
      riskLevel,
      recommendations
    };
  }

  getConversationStarters() {
    return [
      'Làm thế nào để bảo vệ tài khoản trực tuyến của tôi?',
      'Cách nhận biết email lừa đảo?',
      'Làm sao để tạo mật khẩu mạnh?',
      'Cách bảo vệ dữ liệu cá nhân trên mạng xã hội?',
      'Làm thế nào để phát hiện website giả mạo?',
      'Cách bảo vệ thiết bị di động khỏi mã độc?'
    ];
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

  // Check if service is available
  isAvailable() {
    return this.model !== null;
  }

  // Get service status
  getStatus() {
    return {
      provider: 'gemini',
      model: this.model ? geminiConfig.model : 'missing',
      available: this.isAvailable(),
      apiKey: this.genAI ? 'configured' : 'missing'
    };
  }

  // Analyze community post content
  async analyzeCommunityPost(title, content, url = null) {
    try {
      if (!this.model) {
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

      const result = await this.model.generateContent(prompt);
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
        model: geminiConfig.model
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
      if (!this.model) {
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

      const result = await this.model.generateContent(prompt);
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
        model: geminiConfig.model
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
