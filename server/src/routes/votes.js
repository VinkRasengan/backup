const express = require('express');
const router = express.Router();
const voteController = require('../controllers/voteController');
const { validateRequest, schemas } = require('../middleware/validation');

// @route   POST /api/votes/:linkId
// @desc    Submit or update a vote for a link
// @access  Private
router.post('/:linkId', 
  validateRequest(schemas.submitVote),
  voteController.submitVote
);

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
