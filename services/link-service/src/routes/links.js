const express = require('express');
const router = express.Router();
const linkController = require('../controllers/linkController');
const AuthMiddleware = require('../../../shared/middleware/auth');
const { validateRequest, schemas } = require('../middleware/validation');

// Initialize auth middleware
const authMiddleware = new AuthMiddleware(process.env.AUTH_SERVICE_URL);

// @route   POST /links/check
// @desc    Check a link for security and credibility
// @access  Public (optional auth for saving results)
router.post('/check',
  authMiddleware.optionalAuth,
  validateRequest(schemas.checkLink),
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
