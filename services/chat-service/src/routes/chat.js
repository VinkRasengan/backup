const express = require('express');
const router = express.Router();

// Mock chat endpoints
router.post('/message', (req, res) => {
  const { message } = req.body;
  
  // Simple mock AI response
  let aiResponse = "I'm here to help you with fraud detection and link verification. ";
  
  if (message.toLowerCase().includes('link') || message.toLowerCase().includes('url')) {
    aiResponse += "To check a link, you can use our link verification service. Would you like me to analyze a specific URL for you?";
  } else if (message.toLowerCase().includes('scam') || message.toLowerCase().includes('fraud')) {
    aiResponse += "I can help you identify potential scams. Please share the suspicious content or link you'd like me to analyze.";
  } else {
    aiResponse += "How can I assist you with fraud detection today?";
  }

  res.json({
    success: true,
    response: {
      id: Date.now().toString(),
      message: aiResponse,
      timestamp: new Date().toISOString(),
      type: 'ai'
    }
  });
});

router.post('/analyze-link', (req, res) => {
  const { url } = req.body;
  
  res.json({
    success: true,
    analysis: {
      url,
      riskLevel: 'low',
      confidence: 85,
      summary: 'This URL appears to be safe based on initial analysis.',
      recommendations: [
        'Always verify the website\'s SSL certificate',
        'Check for suspicious redirects',
        'Be cautious with personal information'
      ],
      timestamp: new Date().toISOString()
    }
  });
});

// Gemini AI chat endpoint
router.post('/gemini', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message?.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));

    // Enhanced AI responses based on message content
    let response = '';
    const messageText = message.toLowerCase();

    if (messageText.includes('xin chào') || messageText.includes('hello') || messageText.includes('hi')) {
      response = `Xin chào! Tôi là trợ lý FactCheck AI. Tôi có thể giúp bạn:
      
• 🔍 Kiểm tra tính xác thực của links và websites
• 🛡️ Phân tích rủi ro bảo mật 
• 📰 Xác minh thông tin và tin tức
• 💡 Tư vấn về an toàn mạng

Bạn cần hỗ trợ gì hôm nay?`;
    } else if (messageText.includes('link') || messageText.includes('url') || messageText.includes('website')) {
      response = `Để kiểm tra link an toàn, bạn có thể:

1. 📋 **Copy và paste link** vào đây, tôi sẽ phân tích ngay
2. 🔍 **Sử dụng công cụ Check Link** - nhấn vào menu bên trái
3. 🛡️ **Kiểm tra chứng chỉ SSL** và domain reputation

Hãy gửi link bạn muốn kiểm tra nhé!`;
    } else if (messageText.includes('lừa đảo') || messageText.includes('scam') || messageText.includes('phishing')) {
      response = `🚨 **Cách nhận biết lừa đảo online:**

**Dấu hiệu nghi ngờ:**
• Email/tin nhắn yêu cầu thông tin cá nhân
• Links rút gọn đáng ngờ  
• Offers "quá tốt để có thể tin được"
• Ngữ pháp kém, chính tả sai
• Urgent/pressure tactics

**Biện pháp bảo vệ:**
✅ Luôn xác minh nguồn gốc
✅ Không click links đáng ngờ
✅ Sử dụng FactCheck để kiểm tra
✅ Báo cáo cho cộng đồng

Bạn có link nào cần kiểm tra không?`;
    } else if (messageText.includes('bảo mật') || messageText.includes('security') || messageText.includes('an toàn')) {
      response = `🔒 **Tips bảo mật online quan trọng:**

**Mật khẩu mạnh:**
• Ít nhất 12 ký tự
• Kết hợp chữ, số, ký tự đặc biệt
• Khác nhau cho mỗi tài khoản
• Sử dụng password manager

**Duyệt web an toàn:**
• Kiểm tra HTTPS (ổ khóa xanh)
• Tránh WiFi công cộng cho việc quan trọng
• Cập nhật browser thường xuyên
• Sử dụng tools như FactCheck

Bạn cần tư vấn về vấn đề bảo mật nào?`;
    } else if (messageText.includes('cảm ơn') || messageText.includes('thank')) {
      response = `Rất vui được hỗ trợ bạn! 😊

Đừng quên:
• 🔄 **Chia sẻ** với bạn bè về FactCheck
• 💬 **Tham gia cộng đồng** để cập nhật thông tin mới
• 🛡️ **Luôn kiểm tra** trước khi tin tưởng thông tin online

Chúc bạn lướt web an toàn! Có gì cần hỗ trợ thêm, hãy nhắn tôi nhé!`;
    } else if (messageText.includes('factcheck') || messageText.includes('platform') || messageText.includes('tính năng')) {
      response = `🚀 **Các tính năng chính của FactCheck:**

**🔍 Link Checker:**
• Phân tích URL security
• Scan malware/phishing
• Trust score rating

**👥 Community:**
• Chia sẻ & đánh giá links
• Voting system
• Expert reviews

**📰 News Verification:**
• Fact-checking articles
• Source verification
• Fake news detection

**🤖 AI Assistant:**
• Real-time chat support
• Security recommendations
• Educational content

Bạn muốn khám phá tính năng nào trước?`;
    } else {
      // General intelligent response
      const responses = [
        `Tôi hiểu bạn đang quan tâm về "${message.substring(0, 30)}...". Với vai trò là trợ lý FactCheck AI, tôi có thể giúp bạn kiểm tra tính xác thực của thông tin, phân tích links và tư vấn về bảo mật online. Bạn có thể chia sẻ cụ thể hơn về điều bạn cần không?`,
        
        `Cảm ơn bạn đã chia sẻ! Tôi luôn sẵn sàng hỗ trợ các vấn đề về fact-checking và bảo mật. Để tôi có thể giúp tốt nhất, bạn có thể:

• Gửi link cần kiểm tra 🔍
• Hỏi về cách nhận biết fake news 📰  
• Tìm hiểu tips bảo mật 🛡️
• Khám phá tính năng platform 🚀`,

        `Đó là một câu hỏi thú vị! Là FactCheck AI, tôi được thiết kế để giúp người dùng an toàn hơn trên internet. Tôi có thể phân tích links, đánh giá độ tin cậy của thông tin, và chia sẻ kiến thức về cybersecurity. Có điều gì cụ thể bạn muốn tôi hỗ trợ không?`
      ];
      
      response = responses[Math.floor(Math.random() * responses.length)];
    }

    res.json({
      success: true,
      data: {
        response: {
          content: response,
          timestamp: new Date().toISOString(),
          type: 'ai_response'
        },
        message: response // Fallback for different frontend response handling
      }
    });

  } catch (error) {
    console.error('Gemini chat error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process message',
      data: {
        response: {
          content: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau ít phút.',
          timestamp: new Date().toISOString(),
          type: 'error'
        }
      }
    });
  }
});

// Chat starters endpoint
router.get('/starters', (req, res) => {
  res.json({
    success: true,
    starters: [
      "Cách kiểm tra link có an toàn không?",
      "Nhận biết email lừa đảo như thế nào?", 
      "Tips bảo mật mật khẩu hiệu quả",
      "Cách sử dụng FactCheck platform",
      "Phân biệt tin thật và fake news"
    ]
  });
});

// Test Gemini configuration
router.get('/test-gemini', (req, res) => {
  res.json({
    success: true,
    status: 'Mock AI service available',
    features: {
      chatbot: true,
      linkAnalysis: true,
      factChecking: true
    },
    message: 'AI chat service is working properly'
  });
});

module.exports = router;
