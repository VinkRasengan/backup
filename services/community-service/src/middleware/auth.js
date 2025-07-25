const admin = require('firebase-admin');
const logger = require('../utils/logger');

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

    const authHeader = req.headers.authorization;

    // Check for endpoints that require authentication
    const isVotesEndpoint = req.path.includes('/votes');
    const isBatchUserVotes = req.path.includes('/votes/batch/user');
    const isUserVoteEndpoint = req.path.includes('/votes/') && req.path.includes('/user');
    const isCommentsEndpoint = req.path.includes('/comments');

    // For user-specific endpoints, require authentication
    if ((isBatchUserVotes || isUserVoteEndpoint) && (!authHeader || !authHeader.startsWith('Bearer '))) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required for user-specific endpoints',
        code: 'AUTH_REQUIRED'
      });
    }

    // For other endpoints, auth is optional but we still try to process it
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // For endpoints that don't require auth, continue without user info
      logger.debug('No auth token provided', { path: req.path, method: req.method });
      return next();
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      // Verify Firebase ID token
      const decodedToken = await admin.auth().verifyIdToken(token);
      
      // Create user info object
      const userInfo = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified,
        displayName: decodedToken.name,
        picture: decodedToken.picture
      };

      // Add user info to request object (atomic assignment)
      Object.assign(req, { user: userInfo });

      // Also add to headers for backward compatibility (atomic assignments)
      Object.assign(req.headers, {
        'x-user-id': userInfo.uid,
        'x-user-email': userInfo.email
      });

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

      // For user-specific endpoints, return error
      if (isUserVoteEndpoint || isBatchUserVotes) {
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired authentication token',
          code: 'INVALID_TOKEN'
        });
      }

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
      
      // Create user info object
      const userInfo = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified,
        displayName: decodedToken.name,
        picture: decodedToken.picture
      };

      // Add user info to request object (atomic assignment)
      Object.assign(req, { user: userInfo });

      // Also add to headers for backward compatibility (atomic assignments)
      Object.assign(req.headers, {
        'x-user-id': userInfo.uid,
        'x-user-email': userInfo.email
      });

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
  
  // Try to get from request body/query first
  const displayName = req.body.displayName || req.query.displayName;
  if (displayName && displayName !== 'Anonymous User') {
    return displayName;
  }
  
  // Fallback to email username if available
  const email = getUserEmail(req);
  if (email) {
    return email.split('@')[0];
  }
  
  return 'Anonymous User';
};

module.exports = {
  authMiddleware,
  requireAuth,
  getUserId,
  getUserEmail,
  getUserDisplayName
};
