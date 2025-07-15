const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { validateRequest, schemas } = require('../middleware/validation');

// Create instance of AuthController
const authController = new AuthController();

// @route   POST /auth/register
// @desc    Register user - sync user data after Firebase Auth registration
// @access  Public
router.post('/register',
  validateRequest(schemas.register),
  authController.register
);

// @route   POST /auth/login
// @desc    Login user - sync user data after Firebase Auth login
// @access  Public
router.post('/login',
  validateRequest(schemas.login),
  authController.login
);

// @route   POST /auth/logout
// @desc    Logout user
// @access  Public
router.post('/logout',
  authController.logout
);

// @route   POST /auth/refresh-token
// @desc    Refresh JWT token
// @access  Public
router.post('/refresh-token',
  validateRequest(schemas.refreshToken),
  authController.refreshToken
);

// @route   POST /auth/verify-token
// @desc    Verify JWT token (for other services)
// @access  Public (service-to-service)
router.post('/verify-token',
  validateRequest(schemas.verifyToken),
  authController.verifyToken
);

// @route   POST /auth/verify-email
// @desc    Email verification info (handled by Firebase Auth)
// @access  Public
router.post('/verify-email',
  authController.verifyEmail
);

module.exports = router;
