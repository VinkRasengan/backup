const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { validateRequest, schemas } = require('../middleware/validation');

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', userController.getProfile);

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', 
  validateRequest(schemas.updateProfile),
  userController.updateProfile
);

// @route   GET /api/users/dashboard
// @desc    Get user dashboard data
// @access  Private
router.get('/dashboard', userController.getDashboard);

// @route   DELETE /api/users/account
// @desc    Delete user account
// @access  Private
router.delete('/account', userController.deleteAccount);

module.exports = router;
