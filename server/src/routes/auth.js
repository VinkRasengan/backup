const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateRequest, schemas } = require('../middleware/validation');

// @route   POST /api/auth/register
// @desc    Sync user data after Firebase Auth registration
// @access  Public
router.post('/register',
  authController.register
);

// @route   POST /api/auth/login
// @desc    Sync user data after Firebase Auth login
// @access  Public
router.post('/login',
  authController.login
);

// @route   POST /api/auth/verify-email
// @desc    Email verification info (handled by Firebase Auth)
// @access  Public
router.post('/verify-email',
  authController.verifyEmail
);

// @route   POST /api/auth/resend-verification
// @desc    Resend email verification (handled by Firebase Auth client)
// @access  Public
router.post('/resend-verification',
  authController.resendVerificationEmail
);

// @route   POST /api/auth/forgot-password
// @desc    Password reset info (handled by Firebase Auth)
// @access  Public
router.post('/forgot-password',
  authController.forgotPassword
);

// @route   POST /api/auth/reset-password
// @desc    Password reset info (handled by Firebase Auth)
// @access  Public
router.post('/reset-password',
  authController.resetPassword
);

module.exports = router;
