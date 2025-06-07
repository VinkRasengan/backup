const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

// Simple Firebase Auth Routes
// Handles Firebase ID token authentication

// Test route
router.get('/test', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Simple Firebase auth routes working!',
    timestamp: new Date().toISOString(),
    authType: 'firebase'
  });
});

// Login endpoint - accepts Firebase ID token
router.post('/login', async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        error: 'Firebase ID token required',
        code: 'TOKEN_MISSING'
      });
    }

    // Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // Return user data
    res.json({
      message: 'Login successful',
      user: {
        id: decodedToken.uid,
        email: decodedToken.email,
        firstName: decodedToken.name?.split(' ')[0] || '',
        lastName: decodedToken.name?.split(' ')[1] || '',
        displayName: decodedToken.name,
        emailVerified: decodedToken.email_verified,
        authType: 'firebase'
      }
    });

  } catch (error) {
    console.error('Firebase login error:', error);
    
    if (error.code && error.code.startsWith('auth/')) {
      return res.status(401).json({
        error: 'Invalid Firebase token',
        code: 'INVALID_TOKEN'
      });
    }

    res.status(500).json({
      error: 'Authentication service error',
      code: 'AUTH_SERVICE_ERROR'
    });
  }
});

// Register endpoint - accepts Firebase ID token
router.post('/register', async (req, res) => {
  try {
    const { idToken, firstName, lastName } = req.body;

    if (!idToken) {
      return res.status(400).json({
        error: 'Firebase ID token required',
        code: 'TOKEN_MISSING'
      });
    }

    // Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // Return user data
    res.json({
      message: 'Registration successful',
      user: {
        id: decodedToken.uid,
        email: decodedToken.email,
        firstName: firstName || decodedToken.name?.split(' ')[0] || '',
        lastName: lastName || decodedToken.name?.split(' ')[1] || '',
        displayName: decodedToken.name,
        emailVerified: decodedToken.email_verified,
        authType: 'firebase'
      }
    });

  } catch (error) {
    console.error('Firebase register error:', error);
    
    if (error.code && error.code.startsWith('auth/')) {
      return res.status(401).json({
        error: 'Invalid Firebase token',
        code: 'INVALID_TOKEN'
      });
    }

    res.status(500).json({
      error: 'Authentication service error',
      code: 'AUTH_SERVICE_ERROR'
    });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Access token required',
        code: 'TOKEN_MISSING'
      });
    }

    const token = authHeader.substring(7);
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    res.json({
      user: {
        id: decodedToken.uid,
        email: decodedToken.email,
        firstName: decodedToken.name?.split(' ')[0] || '',
        lastName: decodedToken.name?.split(' ')[1] || '',
        displayName: decodedToken.name,
        emailVerified: decodedToken.email_verified,
        authType: 'firebase'
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    
    res.status(401).json({
      error: 'Invalid or expired token',
      code: 'INVALID_TOKEN'
    });
  }
});

// Logout (client-side for Firebase)
router.post('/logout', (req, res) => {
  res.json({
    message: 'Logout successful',
    note: 'Firebase logout is handled client-side'
  });
});

// Password reset (handled by Firebase)
router.post('/forgot-password', (req, res) => {
  res.json({
    message: 'Password reset is handled by Firebase Auth on the client side',
    note: 'Use Firebase sendPasswordResetEmail() method'
  });
});

// Email verification (handled by Firebase)
router.post('/verify-email', (req, res) => {
  res.json({
    message: 'Email verification is handled by Firebase Auth',
    note: 'Use Firebase sendEmailVerification() method'
  });
});

module.exports = router;
