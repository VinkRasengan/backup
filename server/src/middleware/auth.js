// Unified Authentication Middleware
let auth, db, collections;

try {
  // Try to load Firebase config
  const firebaseConfig = process.env.NODE_ENV === 'production'
    ? require('../config/firebase-production')
    : require('../config/firebase-emulator');

  auth = firebaseConfig.auth;
  db = firebaseConfig.db;
  collections = firebaseConfig.collections;

  console.log('✅ Auth Middleware: Firebase config loaded successfully');
} catch (error) {
  console.error('❌ Auth Middleware: Firebase config failed to load:', error.message);

  // Fallback: Try to load Firebase admin directly
  try {
    const admin = require('firebase-admin');
    auth = admin.auth();
    db = admin.firestore();
    collections = {
      USERS: 'users',
      LINKS: 'links',
      VOTES: 'votes',
      COMMENTS: 'comments'
    };
    console.log('✅ Auth Middleware: Using Firebase admin fallback');
  } catch (fallbackError) {
    console.error('❌ Auth Middleware: All Firebase options failed:', fallbackError.message);
    throw new Error('Authentication middleware cannot initialize');
  }
}

const authenticateToken = async (req, res, next) => {
  try {
    console.log('🔍 Auth Debug - Request URL:', req.url);
    console.log('🔍 Auth Debug - Request method:', req.method);

    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1]; // Bearer TOKEN

    console.log('🔍 Auth Debug - Auth header:', authHeader ? 'Present' : 'Missing');
    console.log('🔍 Auth Debug - Token extracted:', token ? 'Yes' : 'No');

    if (!token) {
      console.log('❌ Auth Debug - No token provided');
      return res.status(401).json({
        error: 'Access token required',
        code: 'TOKEN_MISSING'
      });
    }

    // Verify Firebase ID token
    const decodedToken = await auth.verifyIdToken(token);

    // Get user data from Firestore
    const userDoc = await db.collection(collections.USERS).doc(decodedToken.uid).get();

    if (userDoc.exists) {
      const userData = userDoc.data();
      req.user = {
        userId: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified,
        ...userData
      };
    } else {
      // Create user document if it doesn't exist (first time login)
      const userData = {
        email: decodedToken.email,
        firstName: decodedToken.name?.split(' ')[0] || '',
        lastName: decodedToken.name?.split(' ')[1] || '',
        isVerified: decodedToken.email_verified,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        stats: {
          linksChecked: 0
        }
      };

      await db.collection(collections.USERS).doc(decodedToken.uid).set(userData);

      req.user = {
        userId: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified,
        ...userData
      };
    }

    next();
  } catch (error) {
    console.error('Token verification error:', error);

    // Check if token is expired
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        error: 'Token expired',
        code: 'TOKEN_EXPIRED',
        message: 'Please refresh your token and try again'
      });
    }

    return res.status(403).json({
      error: 'Invalid or expired token',
      code: 'TOKEN_INVALID',
      details: error.message
    });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1];

    if (!token) {
      req.user = null;
      return next();
    }

    // Verify Firebase ID token
    const decodedToken = await auth.verifyIdToken(token);

    // Check if user exists in Firestore
    const userDoc = await db.collection(collections.USERS).doc(decodedToken.uid).get();

    if (userDoc.exists) {
      const userData = userDoc.data();
      req.user = {
        userId: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified,
        ...userData
      };
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    req.user = null;
    next();
  }
};

// Middleware to require email verification
const requireEmailVerification = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }

  if (!req.user.emailVerified) {
    return res.status(403).json({
      error: 'Email verification required. Please verify your email address to access this feature.',
      code: 'EMAIL_NOT_VERIFIED'
    });
  }

  next();
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireEmailVerification
};
