const { auth } = require('../config/firebase');
const logger = require('../utils/logger');

// Logger already initialized

/**
 * Firebase authentication middleware for Auth Service
 * Directly verifies Firebase ID tokens without calling external services
 */
const firebaseAuthMiddleware = async (req, res, next) => {
  try {
    // Skip auth for health checks and public endpoints
    if (req.path.includes('/health') || req.path.includes('/metrics') || req.path.includes('/info')) {
      return next();
    }

    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.debug('No auth token provided', { path: req.path, method: req.method });
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      // Verify Firebase ID token directly
      const decodedToken = await auth.verifyIdToken(token);
      
      // Create user info object
      const userInfo = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified,
        displayName: decodedToken.name,
        picture: decodedToken.picture,
        roles: decodedToken.roles || [], // Custom claims for roles
        permissions: decodedToken.permissions || [] // Custom claims for permissions
      };

      // Add user info to request object
      req.user = userInfo;

      // Also add to headers for backward compatibility
      req.headers['x-user-id'] = userInfo.uid;
      req.headers['x-user-email'] = userInfo.email;

      logger.debug('User authenticated', { 
        userId: decodedToken.uid, 
        email: decodedToken.email,
        path: req.path,
        method: req.method
      });

      next();
    } catch (tokenError) {
      logger.warn('Invalid auth token', { 
        error: tokenError.message,
        path: req.path,
        method: req.method
      });
      
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired authentication token',
        code: 'INVALID_TOKEN'
      });
    }
  } catch (error) {
    logger.error('Firebase auth middleware error', { error: error.message });
    
    return res.status(500).json({
      success: false,
      error: 'Authentication service error',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * Middleware that checks for specific roles
 * Use this after firebaseAuthMiddleware for role-based access control
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const userRoles = req.user.roles || [];
    const hasRequiredRole = roles.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
      logger.warn('Insufficient permissions', {
        userId: req.user.uid,
        requiredRoles: roles,
        userRoles: userRoles,
        path: req.path,
        method: req.method
      });

      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        details: {
          required: roles,
          current: userRoles
        }
      });
    }

    next();
  };
};

/**
 * Optional auth middleware - doesn't fail if no token provided
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Continue without auth
      return next();
    }

    const token = authHeader.substring(7);

    try {
      const decodedToken = await auth.verifyIdToken(token);
      
      const userInfo = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified,
        displayName: decodedToken.name,
        picture: decodedToken.picture,
        roles: decodedToken.roles || [],
        permissions: decodedToken.permissions || []
      };

      req.user = userInfo;
      req.headers['x-user-id'] = userInfo.uid;
      req.headers['x-user-email'] = userInfo.email;

      logger.debug('Optional auth successful', { userId: decodedToken.uid });
    } catch (tokenError) {
      // Continue without auth if token is invalid
      logger.debug('Optional auth failed, continuing without auth', { error: tokenError.message });
    }

    next();
  } catch (error) {
    logger.error('Optional auth middleware error', { error: error.message });
    // Continue without auth on error
    next();
  }
};

module.exports = {
  authenticate: firebaseAuthMiddleware,
  requireRole,
  optionalAuth
};
