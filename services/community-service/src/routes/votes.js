const express = require('express');
const router = express.Router();

// Mock votes endpoints
router.post('/', (req, res) => {
  res.json({
    success: true,
    message: 'Vote recorded successfully',
    vote: {
      id: '1',
      postId: req.body.postId,
      userId: 'user@example.com',
      type: req.body.type, // 'up' or 'down'
      createdAt: new Date().toISOString()
    }
  });
});

router.delete('/:id', (req, res) => {
  res.json({
    success: true,
    message: 'Vote removed successfully'
  });
});

module.exports = router;
