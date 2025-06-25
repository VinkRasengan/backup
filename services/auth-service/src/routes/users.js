const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const firebaseAuth = require('../middleware/firebaseAuth');
const { validateRequest, schemas } = require('../middleware/validation');

// @route   GET /users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile',
  firebaseAuth.authenticate,
  userController.getProfile
);

// @route   PUT /users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile',
  firebaseAuth.authenticate,
  validateRequest(schemas.updateProfile),
  userController.updateProfile
);

// @route   GET /users/stats
// @desc    Get user statistics
// @access  Private
router.get('/stats',
  firebaseAuth.authenticate,
  userController.getStats
);

// @route   GET /users/dashboard
// @desc    Get user dashboard data
// @access  Private
router.get('/dashboard',
  firebaseAuth.authenticate,
  userController.getDashboard
);

// @route   PUT /users/:userId/roles
// @desc    Update user roles (admin only)
// @access  Private (Admin)
router.put('/:userId/roles',
  firebaseAuth.authenticate,
  firebaseAuth.requireRole(['admin']),
  validateRequest(schemas.updateRoles),
  userController.updateRoles
);

// @route   DELETE /users/account
// @desc    Delete user account
// @access  Private
router.delete('/account',
  firebaseAuth.authenticate,
  userController.deleteAccount
);

// @route   GET /users
// @desc    List users (admin only)
// @access  Private (Admin)
router.get('/',
  firebaseAuth.authenticate,
  firebaseAuth.requireRole(['admin']),
  userController.listUsers
);

module.exports = router;
