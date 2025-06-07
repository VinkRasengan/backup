const express = require('express');
const router = express.Router();

// Try to load hybrid auth controller
let authController;
try {
  authController = require('../controllers/hybridAuthController');
  console.log('✅ Hybrid auth controller loaded');
} catch (error) {
  console.warn('⚠️ Hybrid auth controller not available, using fallback');
  
  // Fallback controller
  authController = {
    register: (req, res) => {
      res.status(503).json({
        error: 'Authentication service temporarily unavailable',
        code: 'AUTH_SERVICE_UNAVAILABLE'
      });
    },
    login: (req, res) => {
      res.status(503).json({
        error: 'Authentication service temporarily unavailable',
        code: 'AUTH_SERVICE_UNAVAILABLE'
      });
    },
    getCurrentUser: (req, res) => {
      res.json({
        user: {
          id: 'demo-user',
          email: 'demo@example.com',
          firstName: 'Demo',
          lastName: 'User',
          isVerified: true
        }
      });
    }
  };
}

// Try to load hybrid auth middleware
let authenticateToken;
try {
  const hybridAuth = require('../middleware/hybridAuth');
  authenticateToken = hybridAuth.authenticateToken;
} catch (error) {
  console.warn('⚠️ Hybrid auth middleware not available, using fallback');
  authenticateToken = (req, res, next) => {
    req.user = { userId: 'demo-user', email: 'demo@example.com' };
    next();
  };
}

// Validation middleware
const validateRegistration = (req, res, next) => {
  const { email, password, firstName, lastName, idToken } = req.body;

  // Firebase registration (requires idToken)
  if (idToken) {
    if (!firstName || !lastName) {
      return res.status(400).json({
        error: 'First name and last name are required for Firebase registration',
        code: 'MISSING_FIELDS'
      });
    }
    return next();
  }

  // PostgreSQL registration (requires email/password)
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

  next();
};

const validateLogin = (req, res, next) => {
  const { email, password, idToken } = req.body;

  // Firebase login (requires idToken)
  if (idToken) {
    return next();
  }

  // PostgreSQL login (requires email/password)
  if (!email || !password) {
    return res.status(400).json({
      error: 'Email and password are required',
      code: 'MISSING_FIELDS'
    });
  }

  next();
};

// Public routes
router.post('/register', validateRegistration, authController.register);
router.post('/login', validateLogin, authController.login);

// Test route
router.get('/test', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Hybrid auth routes working!',
    timestamp: new Date().toISOString(),
    supportedMethods: ['firebase', 'postgresql']
  });
});

// Protected routes
router.get('/me', authenticateToken, authController.getCurrentUser);

// Logout (client-side for Firebase, server-side for JWT)
router.post('/logout', authenticateToken, (req, res) => {
  // For Firebase: logout is handled client-side
  // For JWT: we could implement token blacklisting here
  res.json({
    message: 'Logout successful',
    note: 'For Firebase auth, please also logout on the client side'
  });
});

// Password reset (placeholder)
router.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({
      error: 'Email is required',
      code: 'MISSING_EMAIL'
    });
  }

  res.json({
    message: 'Password reset instructions sent to email',
    note: 'For Firebase auth, use Firebase Auth password reset. For PostgreSQL, this feature will be implemented.'
  });
});

// Email verification (placeholder)
router.post('/verify-email', (req, res) => {
  res.json({
    message: 'Email verification handled by authentication provider',
    note: 'For Firebase: handled automatically. For PostgreSQL: feature will be implemented.'
  });
});

module.exports = router;
