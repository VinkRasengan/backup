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

module.exports = router;
