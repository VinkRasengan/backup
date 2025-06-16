const axios = require('axios');

class AuthMiddleware {
  constructor(authServiceUrl) {
    this.authServiceUrl = authServiceUrl;
    this.timeout = 5000;
  }

  authenticate = async (req, res, next) => {
    try {
      const token = this.extractToken(req);
      
      if (!token) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'NO_TOKEN'
        });
      }

      const user = await this.verifyToken(token);
      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
    }
  };

  optionalAuth = async (req, res, next) => {
    try {
      const token = this.extractToken(req);
      
      if (token) {
        const user = await this.verifyToken(token);
        req.user = user;
      }
      
      next();
    } catch (error) {
      // Continue without authentication for optional auth
      next();
    }
  };

  requireRole = (roles) => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'NO_AUTH'
        });
      }

      const userRoles = req.user.roles || ['user'];
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

  extractToken(req) {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    
    return null;
  }

  async verifyToken(token) {
    try {
      const response = await axios.post(
        `${this.authServiceUrl}/auth/verify`,
        { token },
        {
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        return response.data.user;
      } else {
        throw new Error('Token verification failed');
      }
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Invalid token');
      } else if (error.code === 'ECONNREFUSED') {
        throw new Error('Auth service unavailable');
      } else {
        throw new Error('Token verification failed');
      }
    }
  }

  // Mock verification for development when auth service is not available
  mockVerifyToken(token) {
    // Simple mock - in real implementation, this would decode JWT
    if (token === 'mock-token') {
      return {
        userId: 'mock-user-id',
        email: 'user@example.com',
        displayName: 'Mock User',
        roles: ['user']
      };
    }
    
    throw new Error('Invalid mock token');
  }
}

module.exports = AuthMiddleware;
