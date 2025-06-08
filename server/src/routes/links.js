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

// Test routes for debugging third party results
// @route   POST /api/links/test-check
// @desc    Test link checking without authentication (for debugging)
// @access  Public
router.post('/test-check', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required'
      });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid URL format'
      });
    }

    console.log('🧪 Test checking link:', url);

    // Use crawler service directly
    const crawlerService = require('../services/crawlerService');
    const result = await crawlerService.checkLink(url);

    console.log('✅ Test result:', {
      url: result.url,
      status: result.status,
      thirdPartyResultsCount: result.thirdPartyResults?.length || 0
    });

    res.json({
      success: true,
      result: result,
      message: 'Test check completed successfully'
    });

  } catch (error) {
    console.error('❌ Test check error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   GET /api/links/test-third-party
// @desc    Test third party results generation
// @access  Public
router.get('/test-third-party', async (req, res) => {
  try {
    console.log('🧪 Testing third party results generation...');

    const crawlerService = require('../services/crawlerService');

    // Mock data for testing
    const mockVirusTotalData = {
      success: true,
      securityScore: 85,
      threats: { malicious: false, suspicious: false }
    };

    const mockScamAdviserData = {
      success: true,
      trustScore: 75,
      riskLevel: 'low'
    };

    const thirdPartyResults = crawlerService.generateThirdPartyResults(
      mockVirusTotalData,
      mockScamAdviserData
    );

    console.log('✅ Generated third party results:', thirdPartyResults.length, 'services');

    res.json({
      success: true,
      data: {
        count: thirdPartyResults.length,
        services: thirdPartyResults
      },
      message: 'Third party results generated successfully'
    });

  } catch (error) {
    console.error('❌ Third party test error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
