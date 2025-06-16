const express = require('express');
const router = express.Router();
const linkController = require('../controllers/linkController');
const AuthMiddleware = require('../../shared/middleware/auth');
const { validateRequest, schemas } = require('../middleware/validation');

// Initialize auth middleware
const authMiddleware = new AuthMiddleware(process.env.AUTH_SERVICE_URL);

// Test endpoint
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Link Service is working!',
    timestamp: new Date().toISOString()
  });
});

// Debug endpoint for API keys
router.get('/debug', (req, res) => {
  const { config } = require('../config/thirdPartyAPIs');
  res.json({
    success: true,
    apis: {
      googleSafeBrowsing: {
        enabled: config.googleSafeBrowsing.enabled,
        hasKey: !!process.env.GOOGLE_SAFE_BROWSING_API_KEY
      },
      phishTank: {
        enabled: config.phishTank.enabled,
        hasKey: !!process.env.PHISHTANK_API_KEY
      },
      scamAdviser: {
        enabled: config.scamAdviser.enabled,
        hasKey: !!process.env.SCAMADVISER_API_KEY
      },
      virusTotal: {
        enabled: config.virusTotal.enabled,
        hasKey: !!process.env.VIRUSTOTAL_API_KEY
      },
      criminalIP: {
        enabled: config.criminalIP.enabled,
        hasKey: !!process.env.CRIMINALIP_API_KEY
      },
      ipQualityScore: {
        enabled: config.ipQualityScore.enabled,
        hasKey: !!process.env.IPQUALITYSCORE_API_KEY
      }
    },
    timestamp: new Date().toISOString()
  });
});

// @route   POST /links/check
// @desc    Check a link for security and credibility
// @access  Public (temporarily bypassed for testing)
router.post('/check',
  // authMiddleware.optionalAuth, // Temporarily disabled
  // validateRequest(schemas.checkLink), // Temporarily disabled
  linkController.checkLink
);

// @route   POST /links/bulk-check
// @desc    Check multiple links at once
// @access  Public (optional auth for saving results)
router.post('/bulk-check',
  authMiddleware.optionalAuth,
  validateRequest(schemas.bulkCheck),
  linkController.bulkCheck
);

// @route   GET /links/history
// @desc    Get user's link check history
// @access  Private
router.get('/history',
  authMiddleware.authenticate,
  linkController.getHistory
);

// @route   GET /links/:linkId
// @desc    Get specific link check result
// @access  Private
router.get('/:linkId',
  authMiddleware.authenticate,
  linkController.getLinkResult
);

// @route   DELETE /links/:linkId
// @desc    Delete link check result
// @access  Private
router.delete('/:linkId',
  authMiddleware.authenticate,
  linkController.deleteLinkResult
);

module.exports = router;
