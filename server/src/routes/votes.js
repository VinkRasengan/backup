const express = require('express');
const router = express.Router();

// Try Firestore controller first, fallback to regular controller
let voteController;
try {
  voteController = require('../controllers/firestoreVoteController');
  console.log('✅ Using Firestore Vote Controller');
} catch (error) {
  console.warn('⚠️ Firestore Vote Controller not available, using fallback');
  try {
    voteController = require('../controllers/voteController');
  } catch (fallbackError) {
    console.error('❌ No vote controller available');
    voteController = {
      submitVote: (req, res) => res.status(503).json({ error: 'Vote service unavailable' }),
      getVoteStats: (req, res) => res.status(503).json({ error: 'Vote service unavailable' }),
      getUserVote: (req, res) => res.status(503).json({ error: 'Vote service unavailable' }),
      deleteVote: (req, res) => res.status(503).json({ error: 'Vote service unavailable' })
    };
  }
}

// @route   POST /api/votes/:linkId
// @desc    Submit or update a vote for a link
// @access  Private
router.post('/:linkId', voteController.submitVote);

// @route   GET /api/votes/:linkId/stats
// @desc    Get vote statistics for a link
// @access  Public
router.get('/:linkId/stats', voteController.getVoteStats);

// @route   GET /api/votes/:linkId/user
// @desc    Get user's vote for a specific link
// @access  Private
router.get('/:linkId/user', voteController.getUserVote);

// @route   DELETE /api/votes/:linkId
// @desc    Delete user's vote for a link
// @access  Private
router.delete('/:linkId', voteController.deleteVote);

module.exports = router;
