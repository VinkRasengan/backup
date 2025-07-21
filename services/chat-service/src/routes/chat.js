const express = require('express');
const router = express.Router();
const geminiService = require('../services/geminiService');

// Load environment variables from root .env
require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });

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

    console.log('📤 Processing Gemini request:', { message: message.substring(0, 50) + '...' });
    
    // Debug: Check service status
    const serviceStatus = geminiService.getStatus();
    console.log('🔧 GeminiService status in route:', serviceStatus);
    console.log('🔧 Environment check:', { 
      hasApiKey: !!process.env.GEMINI_API_KEY,
      apiKeyPrefix: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 10) + '...' : 'none'
    });

    // Call real Gemini API
    const geminiResult = await geminiService.generateResponse(message.trim());
    
    console.log('🔧 Gemini result:', { 
      success: geminiResult.success, 
      fallback: geminiResult.fallback,
      hasUsage: !!geminiResult.usage,
      responseLength: geminiResult.response ? geminiResult.response.length : 0
    });
    
    if (!geminiResult.success) {
      console.error('Gemini API failed:', geminiResult.error);
    }

    // Log usage if available
    if (geminiResult.usage) {
      console.log('📊 Gemini usage:', geminiResult.usage);
    }

    const responseData = {
      success: true,
      data: {
        response: {
          content: geminiResult.response,
          timestamp: new Date().toISOString(),
          type: geminiResult.fallback ? 'fallback_response' : 'ai_response',
          model: 'gemini-2.5-flash',
          usage: geminiResult.usage || null
        },
        message: geminiResult.response // Fallback for different frontend response handling
      }
    };

    // Add warning if using fallback
    if (geminiResult.fallback) {
      responseData.data.warning = 'Using fallback response - Gemini API temporarily unavailable';
    }

    res.json(responseData);

  } catch (error) {
    console.error('Gemini chat error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process message',
      data: {
        response: {
          content: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau ít phút. 🔧',
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
  const geminiStatus = geminiService.getStatus();
  
  res.json({
    success: true,
    status: geminiStatus.available ? 'Gemini AI service available' : 'Gemini API not configured - using fallback',
    gemini: geminiStatus,
    features: {
      chatbot: true,
      linkAnalysis: true,
      factChecking: true,
      realAI: geminiStatus.available
    },
    message: geminiStatus.available 
      ? 'Real Gemini AI is working properly' 
      : 'Fallback responses active - configure GEMINI_API_KEY for full AI features'
  });
});

module.exports = router;
