const express = require('express');
const router = express.Router();

// Try to load Firestore comment controller first, fallback to regular controller
let commentController;
try {
    commentController = require('../controllers/firestoreCommentController');
    console.log('✅ Using Firestore comment controller');
} catch (error) {
    console.warn('⚠️ Firestore comment controller not available, trying regular controller:', error.message);
    try {
        commentController = require('../controllers/commentController');
        console.log('✅ Using regular comment controller');
    } catch (fallbackError) {
        console.error('❌ No comment controller available:', fallbackError.message);
        commentController = null;
    }
}

// Try to load authentication middleware
let authenticateToken;
try {
    const auth = require('../middleware/auth');
    authenticateToken = auth.authenticateToken;
} catch (error) {
    console.warn('⚠️ Auth middleware not available for comments routes');
    authenticateToken = (req, res, next) => next();
}

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

// Fallback handler if no comment controller is available
const fallbackHandler = (req, res) => {
    res.status(503).json({
        success: false,
        error: 'Comment service temporarily unavailable',
        message: 'Comment controller not loaded'
    });
};

// @route   POST /api/comments/:linkId
// @desc    Add a comment to a link
// @access  Private
router.post('/:linkId',
  authenticateToken,
  validateRequest(schemas.addComment),
  commentController ? commentController.createComment : fallbackHandler
);

// @route   GET /api/comments/:linkId
// @desc    Get comments for a link with pagination
// @access  Public
router.get('/:linkId', commentController ? commentController.getComments : fallbackHandler);

// @route   PUT /api/comments/comment/:commentId
// @desc    Update a comment
// @access  Private
router.put('/comment/:commentId',
  authenticateToken,
  validateRequest(schemas.updateComment),
  commentController ? commentController.updateComment : fallbackHandler
);

// @route   DELETE /api/comments/comment/:commentId
// @desc    Delete a comment
// @access  Private
router.delete('/comment/:commentId',
  authenticateToken,
  commentController ? commentController.deleteComment : fallbackHandler
);

// @route   GET /api/comments/:linkId/stats
// @desc    Get comment statistics for a link
// @access  Public
router.get('/:linkId/stats', commentController ? commentController.getCommentStats : fallbackHandler);

module.exports = router;
