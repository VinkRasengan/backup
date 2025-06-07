const express = require('express');
const router = express.Router();
const linkController = require('../controllers/linkController');
const { validateRequest, schemas } = require('../middleware/validation');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

// @route   POST /api/links/check
// @desc    Check a link for credibility
// @access  Private (requires authentication)
router.post('/check',
  authenticateToken,
  validateRequest(schemas.checkLink),
  linkController.checkLink
);

// @route   GET /api/links/history
// @desc    Get user's link check history
// @access  Private (requires authentication)
router.get('/history', authenticateToken, linkController.getHistory);

// @route   GET /api/links/:linkId
// @desc    Get specific link check result
// @access  Private (requires authentication)
router.get('/:linkId', authenticateToken, linkController.getLinkResult);

// @route   DELETE /api/links/:linkId
// @desc    Delete link check result
// @access  Private (requires authentication)
router.delete('/:linkId', authenticateToken, linkController.deleteLinkResult);

// @route   GET /api/links/community-feed
// @desc    Get community feed of links with votes and comments
// @access  Public (optional authentication for personalization)
router.get('/community-feed', optionalAuth, linkController.getCommunityFeed);

// @route   POST /api/links/submit-to-community
// @desc    Submit article to community for verification
// @access  Private (requires authentication)
router.post('/submit-to-community',
  authenticateToken,
  validateRequest(schemas.submitToCommunity),
  linkController.submitToCommunity
);

// @route   GET /api/links/trending
// @desc    Get trending/hot articles
// @access  Public
router.get('/trending', linkController.getTrendingArticles);

module.exports = router;
