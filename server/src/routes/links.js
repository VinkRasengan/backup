const express = require('express');
const router = express.Router();
const linkController = require('../controllers/linkController');
const { validateRequest, schemas } = require('../middleware/validation');

// @route   POST /api/links/check
// @desc    Check a link for credibility
// @access  Private
router.post('/check', 
  validateRequest(schemas.checkLink),
  linkController.checkLink
);

// @route   GET /api/links/history
// @desc    Get user's link check history
// @access  Private
router.get('/history', linkController.getHistory);

// @route   GET /api/links/:linkId
// @desc    Get specific link check result
// @access  Private
router.get('/:linkId', linkController.getLinkResult);

// @route   DELETE /api/links/:linkId
// @desc    Delete link check result
// @access  Private
router.delete('/:linkId', linkController.deleteLinkResult);

// @route   GET /api/links/community-feed
// @desc    Get community feed of links with votes and comments
// @access  Private
router.get('/community-feed', linkController.getCommunityFeed);

// @route   POST /api/links/submit-to-community
// @desc    Submit article to community for verification
// @access  Private
router.post('/submit-to-community',
  validateRequest(schemas.submitToCommunity),
  linkController.submitToCommunity
);

// @route   GET /api/links/trending
// @desc    Get trending/hot articles
// @access  Public
router.get('/trending', linkController.getTrendingArticles);

module.exports = router;
