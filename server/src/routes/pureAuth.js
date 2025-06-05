const express = require('express');
const router = express.Router();

// Load pure auth controller and middleware
const authController = require('../controllers/pureAuthController');
const authMiddleware = require('../middleware/pureAuth');

// Validation middleware
const validateRegistration = (req, res, next) => {
  const { email, password, firstName, lastName } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: 'Email and password are required',
      code: 'MISSING_FIELDS'
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      error: 'Password must be at least 6 characters long',
      code: 'WEAK_PASSWORD'
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      error: 'Invalid email format',
      code: 'INVALID_EMAIL'
    });
  }

  if (firstName && firstName.length > 50) {
    return res.status(400).json({
      error: 'First name too long (max 50 characters)',
      code: 'INVALID_FIRST_NAME'
    });
  }

  if (lastName && lastName.length > 50) {
    return res.status(400).json({
      error: 'Last name too long (max 50 characters)',
      code: 'INVALID_LAST_NAME'
    });
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: 'Email and password are required',
      code: 'MISSING_FIELDS'
    });
  }

  next();
};

const validatePasswordChange = (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      error: 'Current password and new password are required',
      code: 'MISSING_FIELDS'
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      error: 'New password must be at least 6 characters long',
      code: 'WEAK_PASSWORD'
    });
  }

  if (currentPassword === newPassword) {
    return res.status(400).json({
      error: 'New password must be different from current password',
      code: 'SAME_PASSWORD'
    });
  }

  next();
};

const validateProfileUpdate = (req, res, next) => {
  const { firstName, lastName, bio } = req.body;

  if (firstName && firstName.length > 50) {
    return res.status(400).json({
      error: 'First name too long (max 50 characters)',
      code: 'INVALID_FIRST_NAME'
    });
  }

  if (lastName && lastName.length > 50) {
    return res.status(400).json({
      error: 'Last name too long (max 50 characters)',
      code: 'INVALID_LAST_NAME'
    });
  }

  if (bio && bio.length > 500) {
    return res.status(400).json({
      error: 'Bio too long (max 500 characters)',
      code: 'INVALID_BIO'
    });
  }

  next();
};

// Public routes
router.get('/test', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Pure backend authentication working!',
    timestamp: new Date().toISOString(),
    features: [
      'JWT-based authentication',
      'PostgreSQL with in-memory fallback',
      'No Firebase dependencies',
      'Password hashing with bcrypt',
      'Rate limiting',
      'Security headers'
    ]
  });
});

// Health check for auth system
router.get('/health', async (req, res) => {
  try {
    const database = require('../config/database');
    const dbHealth = await database.healthCheck();
    
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: dbHealth,
      jwt: {
        configured: !!process.env.JWT_SECRET,
        algorithm: 'HS256'
      },
      features: {
        registration: true,
        login: true,
        passwordChange: true,
        profileUpdate: true,
        rateLimiting: true
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      error: error.message
    });
  }
});

// Authentication routes
router.post('/register', validateRegistration, authController.register);
router.post('/login', validateLogin, authController.login);

// Password reset (placeholder for future implementation)
router.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({
      error: 'Email is required',
      code: 'MISSING_EMAIL'
    });
  }

  // TODO: Implement password reset functionality
  res.json({
    message: 'Password reset functionality will be implemented',
    note: 'For now, users can change password after login'
  });
});

// Email verification (placeholder for future implementation)
router.post('/verify-email', (req, res) => {
  res.json({
    message: 'Email verification functionality will be implemented',
    note: 'For now, all users are considered verified'
  });
});

// Protected routes (require authentication)
router.use(authMiddleware.authenticateToken);

// User profile routes
router.get('/me', authController.getCurrentUser);
router.put('/profile', validateProfileUpdate, authController.updateProfile);
router.post('/change-password', validatePasswordChange, authController.changePassword);

// Logout (client-side for JWT, but we can log it)
router.post('/logout', (req, res) => {
  // For JWT, logout is primarily client-side (remove token)
  // We could implement token blacklisting here if needed
  
  console.log(`User ${req.user.userId} logged out at ${new Date().toISOString()}`);
  
  res.json({
    message: 'Logout successful',
    note: 'Please remove the JWT token from client storage'
  });
});

// Admin routes (require admin privileges)
router.get('/admin/users', authMiddleware.authenticateAdmin, async (req, res) => {
  try {
    // TODO: Implement admin user listing
    res.json({
      message: 'Admin user listing will be implemented',
      users: [],
      totalCount: 0
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch users',
      code: 'ADMIN_FETCH_ERROR'
    });
  }
});

// Token refresh (optional - JWT tokens are stateless)
router.post('/refresh', (req, res) => {
  try {
    const { userId, email } = req.user;
    
    // Generate new token
    const jwt = require('jsonwebtoken');
    const newToken = jwt.sign(
      { userId, email },
      process.env.JWT_SECRET || 'fallback-secret-change-in-production',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.json({
      message: 'Token refreshed successfully',
      token: newToken
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to refresh token',
      code: 'TOKEN_REFRESH_ERROR'
    });
  }
});

module.exports = router;
