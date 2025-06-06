const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');

// Try to load validation middleware, fallback if not available
let validateRequest, schemas;
try {
    const validation = require('../middleware/validation');
    validateRequest = validation.validateRequest;
    schemas = validation.schemas;
} catch (error) {
    console.warn('⚠️ Validation middleware not available for comments routes');
    validateRequest = (schema) => (req, res, next) => next();
    schemas = {};
}

// @route   POST /api/comments/:linkId
// @desc    Add a comment to a link
// @access  Private
router.post('/:linkId',
  validateRequest(schemas.addComment),
  commentController.createComment
);

// @route   GET /api/comments/:linkId
// @desc    Get comments for a link with pagination
// @access  Public
router.get('/:linkId', commentController.getComments);

// @route   PUT /api/comments/comment/:commentId
// @desc    Update a comment
// @access  Private
router.put('/comment/:commentId',
  validateRequest(schemas.updateComment),
  commentController.updateComment
);

// @route   DELETE /api/comments/comment/:commentId
// @desc    Delete a comment
// @access  Private
router.delete('/comment/:commentId', commentController.deleteComment);

// @route   GET /api/comments/:linkId/stats
// @desc    Get comment statistics for a link
// @access  Public
router.get('/:linkId/stats', commentController.getCommentStats);

module.exports = router;
