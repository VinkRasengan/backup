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

module.exports = router;
