const express = require('express');
const router = express.Router();
const securityAggregatorService = require('../services/securityAggregatorService');
const screenshotService = require('../services/screenshotService');
const AuthMiddleware = require('../../shared/middleware/auth');
const { validateRequest, schemas } = require('../middleware/validation');
const { Logger } = require('@factcheck/shared');

const logger = new Logger('link-service');
const authMiddleware = new AuthMiddleware(process.env.AUTH_SERVICE_URL);

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
