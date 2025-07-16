const express = require('express');
const router = express.Router();
const securityAggregatorService = require('../services/securityAggregatorService');
const screenshotService = require('../services/screenshotService');
const virusTotalService = require('../services/virusTotalService');
const { authMiddleware: AuthMiddleware } = require('../utils/logger');
const { validateRequest, schemas } = require('../middleware/validation');
const logger = require('../utils/logger');

// Logger already initialized
// Simple auth middleware for security routes
const authMiddleware = {
  authenticate: (req, res, next) => {
    // Simple auth check - in production this should validate JWT
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
  }
};

// @route   GET /security/status
// @desc    Get security services status
// @access  Public
router.get('/status', async (req, res, next) => {
  try {
    const [securityStatus, screenshotStatus] = await Promise.allSettled([
      securityAggregatorService.getServiceStatus(),
      screenshotService.getStatus()
    ]);

    const status = {
      security: securityStatus.status === 'fulfilled' ? securityStatus.value : { error: securityStatus.reason.message },
      screenshot: screenshotStatus.status === 'fulfilled' ? screenshotStatus.value : { error: screenshotStatus.reason.message },
      timestamp: new Date().toISOString()
    };

    res.json(status);
  } catch (error) {
    logger.logError(error, req);
    next(error);
  }
});

// @route   POST /security/virustotal/scan
// @desc    Scan URL with VirusTotal
// @access  Public
router.post('/virustotal/scan', async (req, res, next) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required'
      });
    }

    logger.info('VirusTotal scan request', { url });

    const result = await virusTotalService.submitUrl(url);

    res.json({
      success: true,
      result
    });

  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({
      success: false,
      error: error.message || 'VirusTotal scan failed'
    });
  }
});

// @route   POST /security/virustotal/report
// @desc    Get VirusTotal analysis report
// @access  Public
router.post('/virustotal/report', async (req, res, next) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required'
      });
    }

    logger.info('VirusTotal report request', { url });

    const result = await virusTotalService.analyzeUrl(url);

    res.json({
      success: true,
      result
    });

  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({
      success: false,
      error: error.message || 'VirusTotal report failed'
    });
  }
});

// @route   POST /security/analyze
// @desc    Perform detailed security analysis
// @access  Private
router.post('/analyze',
  authMiddleware.authenticate,
  validateRequest(schemas.securityAnalyze),
  async (req, res, next) => {
    try {
      const { url } = req.body;
      const userId = req.user.userId;

      logger.withCorrelationId(req.correlationId).info('Security analysis request', {
        url,
        userId
      });

      const analysis = await securityAggregatorService.analyzeUrl(url);

      res.json({
        success: true,
        analysis
      });

    } catch (error) {
      logger.logError(error, req);
      next(error);
    }
  }
);

// @route   POST /security/screenshot
// @desc    Take screenshot of URL
// @access  Private
router.post('/screenshot',
  authMiddleware.authenticate,
  validateRequest(schemas.screenshot),
  async (req, res, next) => {
    try {
      const { url } = req.body;
      const userId = req.user.userId;

      logger.withCorrelationId(req.correlationId).info('Screenshot request', {
        url,
        userId
      });

      const screenshot = await screenshotService.takeScreenshotWithRetry(url);

      res.json({
        success: true,
        screenshot
      });

    } catch (error) {
      logger.logError(error, req);
      next(error);
    }
  }
);

// @route   POST /security/batch-screenshot
// @desc    Take screenshots of multiple URLs
// @access  Private
router.post('/batch-screenshot',
  authMiddleware.authenticate,
  validateRequest(schemas.batchScreenshot),
  async (req, res, next) => {
    try {
      const { urls, options = {} } = req.body;
      const userId = req.user.userId;

      logger.withCorrelationId(req.correlationId).info('Batch screenshot request', {
        urlCount: urls.length,
        userId
      });

      const results = await screenshotService.captureMultiple(urls, options);

      res.json({
        success: true,
        results: results.results,
        summary: results.summary
      });

    } catch (error) {
      logger.logError(error, req);
      next(error);
    }
  }
);

module.exports = router;
