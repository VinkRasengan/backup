const express = require('express');
const router = express.Router();

// Load Firebase-Backend controller and pure auth middleware
const authController = require('../controllers/firebaseBackendController');
const authMiddleware = require('../middleware/pureAuth');

// Validation middleware
const validateFirebaseSync = (req, res, next) => {
  const { idToken, firstName, lastName } = req.body;

  if (!idToken) {
    return res.status(400).json({
      error: 'Firebase ID token is required',
      code: 'TOKEN_MISSING'
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
    message: 'Firebase-Backend bridge working!',
    timestamp: new Date().toISOString(),
    architecture: {
      frontend: 'Firebase Auth (login/email verification)',
      backend: 'PostgreSQL + JWT (all features)',
      bridge: 'Firebase ID token → Backend JWT token'
    },
    features: [
      'Firebase Auth for login/registration',
      'Email verification via Firebase',
      'Backend JWT for API access',
      'PostgreSQL for all data storage',
      'In-memory fallback for development'
    ]
  });
});

// Health check
router.get('/health', async (req, res) => {
  try {
    const database = require('../config/database');
    const dbHealth = await database.healthCheck();
    
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: dbHealth,
      authentication: {
        frontend: 'Firebase Auth',
        backend: 'JWT tokens',
        bridge: 'Firebase ID token sync'
      },
      features: {
        userSync: true,
        profileUpdate: true,
        statsTracking: true,
        emailVerification: 'Firebase handled'
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      error: error.message
    });
  }
});

// Firebase user sync (login/register)
router.post('/sync', validateFirebaseSync, authController.syncFirebaseUser);

// Legacy endpoints for backward compatibility
router.post('/login', validateFirebaseSync, authController.syncFirebaseUser);
router.post('/register', validateFirebaseSync, authController.syncFirebaseUser);

// Email verification status (Firebase handles the actual verification)
router.post('/verify-email', (req, res) => {
  res.json({
    message: 'Email verification is handled by Firebase Auth',
    instructions: [
      '1. User registers/logs in with Firebase Auth',
      '2. Firebase sends verification email automatically',
      '3. User clicks verification link in email',
      '4. Firebase updates email_verified status',
      '5. Next login will sync verified status to backend'
    ]
  });
});

// Password reset (Firebase handles this)
router.post('/forgot-password', (req, res) => {
  res.json({
    message: 'Password reset is handled by Firebase Auth',
    instructions: [
      '1. Use Firebase Auth sendPasswordResetEmail() on frontend',
      '2. User receives reset email from Firebase',
      '3. User clicks reset link and sets new password',
      '4. Next login will work with new password'
    ]
  });
});

// Protected routes (require backend JWT token)
router.use(authMiddleware.authenticateToken);

// User profile management (backend only)
router.get('/me', authController.getCurrentUser);
router.put('/profile', validateProfileUpdate, authController.updateProfile);

// Logout (clear backend token)
router.post('/logout', (req, res) => {
  console.log(`User ${req.user.userId} logged out at ${new Date().toISOString()}`);
  
  res.json({
    message: 'Logout successful',
    instructions: [
      '1. Remove backend JWT token from client storage',
      '2. Call Firebase Auth signOut() on frontend',
      '3. Redirect user to login page'
    ]
  });
});

// User stats endpoints
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await authController.findUserById(userId);
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    const stats = user.stats || { linksChecked: 0, chatMessages: 0 };
    
    res.json({
      stats: {
        ...stats,
        joinedAt: user.created_at,
        lastLoginAt: user.last_login_at,
        totalDays: Math.floor((new Date() - new Date(user.created_at)) / (1000 * 60 * 60 * 24))
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch user stats',
      code: 'STATS_FETCH_ERROR'
    });
  }
});

// Increment user stats (for internal use)
router.post('/stats/increment', async (req, res) => {
  try {
    const { statType } = req.body;
    const userId = req.user.userId;
    
    if (!['linksChecked', 'chatMessages'].includes(statType)) {
      return res.status(400).json({
        error: 'Invalid stat type',
        code: 'INVALID_STAT_TYPE'
      });
    }

    await authController.incrementUserStats(userId, statType);
    
    res.json({
      message: `${statType} incremented successfully`
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to increment stats',
      code: 'STATS_INCREMENT_ERROR'
    });
  }
});

// Admin routes (require admin privileges)
router.get('/admin/users', authMiddleware.authenticateAdmin, async (req, res) => {
  try {
    // TODO: Implement admin user listing
    res.json({
      message: 'Admin user listing will be implemented',
      users: [],
      totalCount: 0,
      note: 'This endpoint will list all users for admin management'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch users',
      code: 'ADMIN_FETCH_ERROR'
    });
  }
});

module.exports = router;
