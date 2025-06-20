const admin = require('firebase-admin');
const Logger = require('../../shared/utils/logger');

const logger = new Logger('community-service');

/**
 * Authentication middleware for Community Service
 * Extracts user information from Firebase ID token
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Skip auth for health checks and public endpoints, but allow auth for batch user votes
    if (req.path.includes('/health') || req.path.includes('/metrics') || req.path.includes('/info')) {
      return next();
    }

    // Allow auth processing for votes endpoints (but don't require it)
    const isVotesEndpoint = req.path.includes('/votes');
    const isBatchUserVotes = req.path.includes('/votes/batch/user');

    // For batch user votes, we need authentication
    if (isBatchUserVotes && (!authHeader || !authHeader.startsWith('Bearer '))) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required for batch user votes',
        code: 'AUTH_REQUIRED'
      });
    }

    // For other votes endpoints, auth is optional
    if (isVotesEndpoint && !isBatchUserVotes && (!authHeader || !authHeader.startsWith('Bearer '))) {
      return next();
    }

    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // For endpoints that don't require auth, continue without user info
      logger.debug('No auth token provided', { path: req.path, method: req.method });
      return next();
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      // Verify Firebase ID token
      const decodedToken = await admin.auth().verifyIdToken(token);
      
      // Add user info to request object
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified,
        displayName: decodedToken.name,
        picture: decodedToken.picture
      };

      // Also add to headers for backward compatibility
      req.headers['x-user-id'] = decodedToken.uid;
      req.headers['x-user-email'] = decodedToken.email;

      logger.debug('User authenticated', { 
        userId: decodedToken.uid, 
        email: decodedToken.email,
        path: req.path,
        method: req.method
      });

    } catch (tokenError) {
      logger.warn('Invalid auth token', { 
        error: tokenError.message,
        path: req.path,
        method: req.method
      });
      
      // For endpoints that require auth, return error
      if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired authentication token',
          code: 'INVALID_TOKEN'
        });
      }
      
      // For GET requests, continue without user info
    }

    next();
  } catch (error) {
    logger.error('Auth middleware error', { error: error.message });
    
    // Don't block requests due to auth middleware errors
    next();
  }
};

/**
 * Middleware that requires authentication
 * Use this for endpoints that must have a valid user
 */
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const token = authHeader.substring(7);

    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified,
        displayName: decodedToken.name,
        picture: decodedToken.picture
      };

      req.headers['x-user-id'] = decodedToken.uid;
      req.headers['x-user-email'] = decodedToken.email;

      logger.debug('User authenticated (required)', { 
        userId: decodedToken.uid, 
        email: decodedToken.email,
        path: req.path,
        method: req.method
      });

      next();
    } catch (tokenError) {
      logger.warn('Authentication failed', { 
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
    logger.error('Required auth middleware error', { error: error.message });
    
    return res.status(500).json({
      success: false,
      error: 'Authentication service error',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * Extract user ID from request (from token, body, query, or headers)
 * This is a helper function for routes that need user ID
 */
const getUserId = (req) => {
  // Priority order: authenticated user, body, query, headers
  if (req.user && req.user.uid) {
    return req.user.uid;
  }
  
  return req.body.userId || req.query.userId || req.headers['x-user-id'];
};

/**
 * Extract user email from request
 */
const getUserEmail = (req) => {
  if (req.user && req.user.email) {
    return req.user.email;
  }
  
  return req.body.userEmail || req.query.userEmail || req.headers['x-user-email'];
};

/**
 * Extract user display name from request
 */
const getUserDisplayName = (req) => {
  if (req.user && req.user.displayName) {
    return req.user.displayName;
  }
  
  return req.body.displayName || req.query.displayName || 'Anonymous User';
};

module.exports = {
  authMiddleware,
  requireAuth,
  getUserId,
  getUserEmail,
  getUserDisplayName
};
