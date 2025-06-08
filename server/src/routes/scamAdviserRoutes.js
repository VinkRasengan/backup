const express = require('express');
const scamAdviserService = require('../services/scamAdviserService');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * Check URL with ScamAdviser API
 * POST /api/scamadviser/check
 */
router.post('/check', authenticateToken, async (req, res) => {
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

    console.log(`ScamAdviser check requested by user ${req.user.uid} for URL: ${url}`);

    // Call ScamAdviser service
    const result = await scamAdviserService.analyzeUrl(url);

    res.json({
      success: true,
      data: result,
      checkedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('ScamAdviser route error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while checking URL with ScamAdviser'
    });
  }
});

/**
 * Get ScamAdviser service status
 * GET /api/scamadviser/status
 */
router.get('/status', async (req, res) => {
  try {
    const hasApiKey = !!process.env.SCAMADVISER_API_KEY;
    
    res.json({
      success: true,
      data: {
        available: hasApiKey,
        service: 'ScamAdviser API',
        configured: hasApiKey ? 'Yes' : 'No - API key missing'
      }
    });

  } catch (error) {
    console.error('ScamAdviser status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get ScamAdviser service status'
    });
  }
});

module.exports = router;
