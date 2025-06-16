const express = require('express');
const router = express.Router();

// Mock votes endpoints

// Submit or update vote for a link
router.post('/:linkId', (req, res) => {
  const { linkId } = req.params;
  const { voteType } = req.body; // 'safe', 'unsafe', 'suspicious'

  res.json({
    success: true,
    message: 'Vote recorded successfully',
    vote: {
      id: Date.now().toString(),
      linkId,
      userId: 'user@example.com',
      voteType,
      createdAt: new Date().toISOString()
    }
  });
});

// Get vote statistics for a link
router.get('/:linkId/stats', (req, res) => {
  const { linkId } = req.params;

  res.json({
    success: true,
    data: {
      linkId,
      safe: Math.floor(Math.random() * 50) + 10,
      unsafe: Math.floor(Math.random() * 20) + 5,
      suspicious: Math.floor(Math.random() * 15) + 3,
      total: Math.floor(Math.random() * 85) + 18
    }
  });
});

// Get user's vote for a specific link
router.get('/:linkId/user', (req, res) => {
  const { linkId } = req.params;

  // Mock: randomly return a vote or null
  const hasVote = Math.random() > 0.5;

  if (hasVote) {
    const voteTypes = ['safe', 'unsafe', 'suspicious'];
    const randomVote = voteTypes[Math.floor(Math.random() * voteTypes.length)];

    res.json({
      success: true,
      data: {
        id: Date.now().toString(),
        linkId,
        userId: 'user@example.com',
        voteType: randomVote,
        createdAt: new Date().toISOString()
      }
    });
  } else {
    res.json({
      success: true,
      data: null
    });
  }
});

// Get optimized vote data (stats + user vote)
router.get('/:linkId/optimized', (req, res) => {
  const { linkId } = req.params;

  const stats = {
    safe: Math.floor(Math.random() * 50) + 10,
    unsafe: Math.floor(Math.random() * 20) + 5,
    suspicious: Math.floor(Math.random() * 15) + 3,
    total: Math.floor(Math.random() * 85) + 18
  };

  // Mock: randomly return a vote or null
  const hasVote = Math.random() > 0.5;
  let userVote = null;

  if (hasVote) {
    const voteTypes = ['safe', 'unsafe', 'suspicious'];
    const randomVote = voteTypes[Math.floor(Math.random() * voteTypes.length)];

    userVote = {
      id: Date.now().toString(),
      linkId,
      userId: 'user@example.com',
      voteType: randomVote,
      createdAt: new Date().toISOString()
    };
  }

  res.json({
    success: true,
    data: {
      linkId,
      stats,
      userVote
    }
  });
});

// Delete user's vote
router.delete('/:linkId', (req, res) => {
  const { linkId } = req.params;

  res.json({
    success: true,
    message: 'Vote removed successfully',
    linkId
  });
});

// Legacy route for backward compatibility
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

// Legacy delete route
router.delete('/:id', (req, res) => {
  res.json({
    success: true,
    message: 'Vote removed successfully'
  });
});

module.exports = router;
