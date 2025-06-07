// Hybrid Authentication Middleware
// Supports both Firebase tokens and JWT tokens
const jwt = require('jsonwebtoken');

// Try to load Firebase
let useFirebase = false;
let auth;

try {
  const firebase = require('../config/firebase');
  auth = firebase.auth;
  useFirebase = true;
  console.log('✅ Hybrid Auth Middleware: Firebase available');
} catch (error) {
  console.warn('⚠️ Hybrid Auth Middleware: Firebase not available, using JWT only');
  useFirebase = false;
}

class HybridAuthMiddleware {
  // Authenticate token (Firebase ID token or JWT)
  async authenticateToken(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          error: 'Access token required',
          code: 'TOKEN_MISSING'
        });
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix

      // Try Firebase first if available
      if (useFirebase) {
        try {
          const decodedToken = await auth.verifyIdToken(token);
          req.user = {
            userId: decodedToken.uid,
            email: decodedToken.email,
            isVerified: decodedToken.email_verified,
            authType: 'firebase'
          };
          return next();
        } catch (firebaseError) {
          console.log('🔄 Firebase token invalid, trying JWT...');
          // Fall through to JWT verification
        }
      }

      // Try JWT verification
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        req.user = {
          userId: decoded.userId,
          email: decoded.email,
          authType: 'jwt'
        };
        return next();
      } catch (jwtError) {
        console.error('❌ Both Firebase and JWT verification failed');
        return res.status(401).json({
          error: 'Invalid or expired token',
          code: 'INVALID_TOKEN'
        });
      }

    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(500).json({
        error: 'Authentication service error',
        code: 'AUTH_SERVICE_ERROR'
      });
    }
  }

  // Optional authentication (for public endpoints that can benefit from user context)
  async optionalAuth(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // No token provided, continue without user context
        req.user = null;
        return next();
      }

      const token = authHeader.substring(7);

      // Try Firebase first if available
      if (useFirebase) {
        try {
          const decodedToken = await auth.verifyIdToken(token);
          req.user = {
            userId: decodedToken.uid,
            email: decodedToken.email,
            isVerified: decodedToken.email_verified,
            authType: 'firebase'
          };
          return next();
        } catch (firebaseError) {
          // Fall through to JWT
        }
      }

      // Try JWT
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        req.user = {
          userId: decoded.userId,
          email: decoded.email,
          authType: 'jwt'
        };
        return next();
      } catch (jwtError) {
        // Invalid token, but continue without user context
        req.user = null;
        return next();
      }

    } catch (error) {
      // On error, continue without user context
      req.user = null;
      next();
    }
  }

  // Admin authentication
  async authenticateAdmin(req, res, next) {
    try {
      await this.authenticateToken(req, res, () => {
        // Check if user is admin
        // TODO: Implement admin check logic
        const isAdmin = req.user.email?.endsWith('@factcheck.com') || 
                       req.user.email === 'admin@example.com';

        if (!isAdmin) {
          return res.status(403).json({
            error: 'Admin access required',
            code: 'ADMIN_REQUIRED'
          });
        }

        next();
      });
    } catch (error) {
      next(error);
    }
  }

  // Rate limiting by user
  async rateLimitByUser(req, res, next) {
    try {
      // Simple in-memory rate limiting
      const userId = req.user?.userId;
      if (!userId) {
        return next(); // Skip rate limiting for unauthenticated users
      }

      global.userRateLimit = global.userRateLimit || new Map();
      const now = Date.now();
      const windowMs = 15 * 60 * 1000; // 15 minutes
      const maxRequests = 100;

      const userRequests = global.userRateLimit.get(userId) || [];
      const recentRequests = userRequests.filter(time => now - time < windowMs);

      if (recentRequests.length >= maxRequests) {
        return res.status(429).json({
          error: 'Too many requests',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil(windowMs / 1000)
        });
      }

      recentRequests.push(now);
      global.userRateLimit.set(userId, recentRequests);

      next();
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new HybridAuthMiddleware();
