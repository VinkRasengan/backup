const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const AuthMiddleware = require('../../shared/middleware/auth');
const { validateRequest, schemas } = require('../middleware/validation');

// Initialize auth middleware
const authMiddleware = new AuthMiddleware();

// @route   GET /users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile',
  authMiddleware.authenticate,
  userController.getProfile
);

// @route   PUT /users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile',
  authMiddleware.authenticate,
  validateRequest(schemas.updateProfile),
  userController.updateProfile
);

// @route   GET /users/stats
// @desc    Get user statistics
// @access  Private
router.get('/stats',
  authMiddleware.authenticate,
  userController.getStats
);

// @route   GET /users/dashboard
// @desc    Get user dashboard data
// @access  Private
router.get('/dashboard',
  authMiddleware.authenticate,
  userController.getDashboard
);

// @route   PUT /users/:userId/roles
// @desc    Update user roles (admin only)
// @access  Private (Admin)
router.put('/:userId/roles',
  authMiddleware.authenticate,
  authMiddleware.requireRole(['admin']),
  validateRequest(schemas.updateRoles),
  userController.updateRoles
);

// @route   DELETE /users/account
// @desc    Delete user account
// @access  Private
router.delete('/account',
  authMiddleware.authenticate,
  userController.deleteAccount
);

// @route   GET /users
// @desc    List users (admin only)
// @access  Private (Admin)
router.get('/',
  authMiddleware.authenticate,
  authMiddleware.requireRole(['admin']),
  userController.listUsers
);

module.exports = router;
