const express = require('express');
const router = express.Router();

// Mock conversations endpoints
router.get('/', (req, res) => {
  res.json({
    success: true,
    conversations: [
      {
        id: '1',
        title: 'Link Verification Help',
        lastMessage: 'Thank you for the analysis!',
        lastMessageAt: new Date().toISOString(),
        messageCount: 5,
        createdAt: new Date(Date.now() - 86400000).toISOString() // 1 day ago
      }
    ]
  });
});

router.get('/:id', (req, res) => {
  res.json({
    success: true,
    conversation: {
      id: req.params.id,
      title: 'Link Verification Help',
      messages: [
        {
          id: '1',
          content: 'Hi, I need help checking if a link is safe',
          type: 'user',
          timestamp: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: '2',
          content: 'I\'d be happy to help you verify that link. Please share the URL you\'d like me to analyze.',
          type: 'ai',
          timestamp: new Date(Date.now() - 3500000).toISOString()
        }
      ],
      createdAt: new Date(Date.now() - 86400000).toISOString()
    }
  });
});

router.post('/', (req, res) => {
  res.json({
    success: true,
    message: 'Conversation created successfully',
    conversation: {
      id: Date.now().toString(),
      title: req.body.title || 'New Conversation',
      messages: [],
      createdAt: new Date().toISOString()
    }
  });
});

module.exports = router;
