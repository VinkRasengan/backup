const express = require('express');
const router = express.Router();

// Mock comments endpoints
router.get('/', (req, res) => {
  res.json({
    success: true,
    comments: [
      {
        id: '1',
        postId: '1',
        content: 'I agree, this looks very suspicious',
        author: 'user2@example.com',
        votes: 2,
        createdAt: new Date().toISOString()
      }
    ]
  });
});

router.post('/', (req, res) => {
  res.json({
    success: true,
    message: 'Comment added successfully',
    comment: {
      id: '2',
      postId: req.body.postId,
      content: req.body.content,
      author: 'user@example.com',
      votes: 0,
      createdAt: new Date().toISOString()
    }
  });
});

module.exports = router;
