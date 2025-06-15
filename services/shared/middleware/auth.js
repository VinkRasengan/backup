const jwt = require('jsonwebtoken');
const axios = require('axios');

/**
 * Shared authentication middleware for microservices
 * Validates JWT tokens and fetches user information from Auth Service
 */

class AuthMiddleware {
  constructor(authServiceUrl) {
    this.authServiceUrl = authServiceUrl || process.env.AUTH_SERVICE_URL;
    this.jwtSecret = process.env.JWT_SECRET;
  }

  /**
   * Middleware to authenticate requests
   */
  authenticate = async (req, res, next) => {
    try {
      const token = this.extractToken(req);
      
      if (!token) {
        return res.status(401).json({
          error: 'Access token required',
          code: 'MISSING_TOKEN'
        });
      }

      // Verify JWT token
      const decoded = jwt.verify(token, this.jwtSecret);
      
      // Fetch user details from Auth Service
      const userDetails = await this.fetchUserDetails(decoded.userId, token);
      
      // Attach user to request
      req.user = {
        ...decoded,
        ...userDetails
      };

      next();
    } catch (error) {
      console.error('Authentication error:', error.message);
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          error: 'Invalid token',
          code: 'INVALID_TOKEN'
        });
      }
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: 'Token expired',
          code: 'TOKEN_EXPIRED'
        });
      }

      return res.status(500).json({
        error: 'Authentication service error',
        code: 'AUTH_SERVICE_ERROR'
      });
    }
  };

  /**
   * Optional authentication - doesn't fail if no token
   */
  optionalAuth = async (req, res, next) => {
    try {
      const token = this.extractToken(req);
      
      if (token) {
        const decoded = jwt.verify(token, this.jwtSecret);
        const userDetails = await this.fetchUserDetails(decoded.userId, token);
        
        req.user = {
          ...decoded,
          ...userDetails
        };
      }

      next();
    } catch (error) {
      // Continue without authentication
      console.warn('Optional auth failed:', error.message);
      next();
    }
  };

  /**
   * Middleware to check user roles
   */
  requireRole = (roles) => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const userRoles = req.user.roles || [];
      const hasRole = roles.some(role => userRoles.includes(role));

      if (!hasRole) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
          required: roles,
          current: userRoles
        });
      }

      next();
    };
  };

  /**
   * Extract token from request headers
   */
  extractToken(req) {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    
    return null;
  }

  /**
   * Fetch user details from Auth Service
   */
  async fetchUserDetails(userId, token) {
    try {
      const response = await axios.get(`${this.authServiceUrl}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Service-Name': process.env.SERVICE_NAME || 'unknown-service'
        },
        timeout: 5000
      });

      return response.data;
    } catch (error) {
      console.error('Failed to fetch user details:', error.message);
      
      // Return minimal user info if service is unavailable
      return {
        userId,
        email: null,
        displayName: null,
        roles: []
      };
    }
  }

  /**
   * Service-to-service authentication
   */
  serviceAuth = (req, res, next) => {
    const serviceKey = req.headers['x-service-key'];
    const serviceName = req.headers['x-service-name'];
    
    if (!serviceKey || !serviceName) {
      return res.status(401).json({
        error: 'Service authentication required',
        code: 'SERVICE_AUTH_REQUIRED'
      });
    }

    // Verify service key (in production, use proper service registry)
    const expectedKey = process.env.SERVICE_KEY;
    if (serviceKey !== expectedKey) {
      return res.status(401).json({
        error: 'Invalid service key',
        code: 'INVALID_SERVICE_KEY'
      });
    }

    req.service = {
      name: serviceName,
      authenticated: true
    };

    next();
  };
}

module.exports = AuthMiddleware;
