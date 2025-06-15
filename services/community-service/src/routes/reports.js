const express = require('express');
const router = express.Router();

// Mock reports endpoints
router.get('/', (req, res) => {
  res.json({
    success: true,
    reports: [
      {
        id: '1',
        type: 'spam',
        targetId: '1',
        targetType: 'post',
        reason: 'This post contains spam content',
        reportedBy: 'user@example.com',
        status: 'pending',
        createdAt: new Date().toISOString()
      }
    ]
  });
});

router.post('/', (req, res) => {
  res.json({
    success: true,
    message: 'Report submitted successfully',
    report: {
      id: '2',
      type: req.body.type,
      targetId: req.body.targetId,
      targetType: req.body.targetType,
      reason: req.body.reason,
      reportedBy: 'user@example.com',
      status: 'pending',
      createdAt: new Date().toISOString()
    }
  });
});

module.exports = router;
