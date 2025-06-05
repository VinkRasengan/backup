const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { validateRequest, schemas } = require('../middleware/validation');

// @route   POST /api/comments/:linkId
// @desc    Add a comment to a link
// @access  Private
router.post('/:linkId', 
  validateRequest(schemas.addComment),
  commentController.addComment
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

// @route   GET /api/comments/user/my-comments
// @desc    Get user's comments with pagination
// @access  Private
router.get('/user/my-comments', commentController.getUserComments);

module.exports = router;
