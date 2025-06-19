/**
 * Service Authentication Middleware
 * Middleware for validating service-to-service authentication
 */

const ServiceAuthManager = require('./serviceAuthManager');

class ServiceAuthMiddleware {
  constructor(options = {}) {
    this.authManager = new ServiceAuthManager(options);
    this.requiredPermissions = new Map();
    this.exemptPaths = new Set(['/health', '/metrics', '/info']);
    this.rateLimits = new Map();
    this.requestCounts = new Map();
  }

  /**
   * Main authentication middleware
   */
  authenticate = (requiredPermissions = []) => {
    return async (req, res, next) => {
      try {
        // Skip authentication for exempt paths
        if (this.exemptPaths.has(req.path)) {
          return next();
        }

        // Extract service authentication headers
        const serviceKey = req.headers['x-service-key'];
        const serviceName = req.headers['x-service-name'];
        const keyId = req.headers['x-service-key-id'];
        const serviceToken = req.headers['x-service-token'];

        // Check if using JWT token
        if (serviceToken) {
          const tokenResult = await this.authManager.verifyServiceToken(serviceToken);
          if (!tokenResult.valid) {
            return this.sendAuthError(res, 'Invalid service token', tokenResult.reason);
          }

          req.serviceAuth = {
            service: tokenResult.service,
            permissions: tokenResult.permissions,
            authenticated: true,
            method: 'jwt'
          };

          return this.checkPermissions(req, res, next, requiredPermissions);
        }

        // Check if using API key
        if (!serviceKey || !serviceName) {
          return this.sendAuthError(res, 'Missing service authentication headers');
        }

        // Validate service authentication
        const authResult = await this.authManager.validateServiceAuth(serviceName, serviceKey, keyId);
        if (!authResult.valid) {
          return this.sendAuthError(res, 'Service authentication failed', authResult.reason);
        }

        // Check rate limits
        const rateLimitResult = this.checkRateLimit(serviceName);
        if (!rateLimitResult.allowed) {
          return this.sendRateLimitError(res, rateLimitResult);
        }

        // Set service authentication info
        req.serviceAuth = {
          service: authResult.service,
          permissions: authResult.permissions,
          keyId: authResult.keyId,
          authenticated: true,
          isGracePeriod: authResult.isGracePeriod,
          method: 'api-key'
        };

        // Log authentication
        this.logAuthentication(req, authResult);

        return this.checkPermissions(req, res, next, requiredPermissions);

      } catch (error) {
        console.error('Service authentication error:', error);
        return this.sendAuthError(res, 'Authentication service error');
      }
    };
  };

  /**
   * Check if service has required permissions
   */
  checkPermissions(req, res, next, requiredPermissions) {
    if (requiredPermissions.length === 0) {
      return next();
    }

    const servicePermissions = req.serviceAuth.permissions || [];
    const hasPermission = requiredPermissions.every(permission => 
      servicePermissions.includes(permission)
    );

    if (!hasPermission) {
      return this.sendPermissionError(res, requiredPermissions, servicePermissions);
    }

    next();
  }

  /**
   * Rate limiting for services
   */
  checkRateLimit(serviceName) {
    const now = Date.now();
    const windowMs = 60000; // 1 minute
    const maxRequests = this.getServiceRateLimit(serviceName);

    if (!this.requestCounts.has(serviceName)) {
      this.requestCounts.set(serviceName, []);
    }

    const requests = this.requestCounts.get(serviceName);
    
    // Remove old requests outside the window
    const validRequests = requests.filter(timestamp => now - timestamp < windowMs);
    
    if (validRequests.length >= maxRequests) {
      return {
        allowed: false,
        limit: maxRequests,
        current: validRequests.length,
        resetTime: Math.min(...validRequests) + windowMs
      };
    }

    // Add current request
    validRequests.push(now);
    this.requestCounts.set(serviceName, validRequests);

    return {
      allowed: true,
      limit: maxRequests,
      current: validRequests.length,
      remaining: maxRequests - validRequests.length
    };
  }

  /**
   * Get rate limit for service
   */
  getServiceRateLimit(serviceName) {
    const rateLimits = {
      'api-gateway': 1000,
      'auth-service': 500,
      'link-service': 200,
      'community-service': 300,
      'chat-service': 150,
      'news-service': 100,
      'admin-service': 200
    };

    return rateLimits[serviceName] || 100;
  }

  /**
   * Middleware for specific permissions
   */
  requirePermission = (permission) => {
    return this.authenticate([permission]);
  };

  /**
   * Middleware for multiple permissions (all required)
   */
  requirePermissions = (permissions) => {
    return this.authenticate(permissions);
  };

  /**
   * Middleware for any of the permissions (OR logic)
   */
  requireAnyPermission = (permissions) => {
    return async (req, res, next) => {
      const authMiddleware = this.authenticate();
      
      authMiddleware(req, res, (err) => {
        if (err) return next(err);

        if (!req.serviceAuth || !req.serviceAuth.authenticated) {
          return this.sendAuthError(res, 'Service authentication required');
        }

        const servicePermissions = req.serviceAuth.permissions || [];
        const hasAnyPermission = permissions.some(permission => 
          servicePermissions.includes(permission)
        );

        if (!hasAnyPermission) {
          return this.sendPermissionError(res, permissions, servicePermissions, 'any');
        }

        next();
      });
    };
  };

  /**
   * Optional authentication (doesn't fail if not authenticated)
   */
  optionalAuth = () => {
    return async (req, res, next) => {
      try {
        const authMiddleware = this.authenticate();
        authMiddleware(req, res, (err) => {
          // Continue regardless of authentication result
          next();
        });
      } catch (error) {
        // Continue on error
        next();
      }
    };
  };

  /**
   * Admin-only middleware
   */
  adminOnly = () => {
    return this.authenticate(['admin-operations']);
  };

  /**
   * High-priority services only
   */
  highPriorityOnly = () => {
    return async (req, res, next) => {
      const authMiddleware = this.authenticate();
      
      authMiddleware(req, res, (err) => {
        if (err) return next(err);

        const highPriorityServices = ['api-gateway', 'auth-service', 'admin-service'];
        if (!highPriorityServices.includes(req.serviceAuth.service)) {
          return this.sendAuthError(res, 'High priority service required');
        }

        next();
      });
    };
  };

  /**
   * Log authentication attempts
   */
  logAuthentication(req, authResult) {
    console.log('Service authenticated:', {
      service: authResult.service,
      keyId: authResult.keyId,
      path: req.path,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      isGracePeriod: authResult.isGracePeriod,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send authentication error
   */
  sendAuthError(res, message, reason = null) {
    const error = {
      error: 'Service Authentication Failed',
      message,
      code: 'SERVICE_AUTH_FAILED',
      timestamp: new Date().toISOString()
    };

    if (reason) {
      error.reason = reason;
    }

    return res.status(401).json(error);
  }

  /**
   * Send permission error
   */
  sendPermissionError(res, required, current, logic = 'all') {
    return res.status(403).json({
      error: 'Insufficient Service Permissions',
      message: `Service lacks required permissions`,
      code: 'INSUFFICIENT_SERVICE_PERMISSIONS',
      required: required,
      current: current,
      logic: logic,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send rate limit error
   */
  sendRateLimitError(res, rateLimitInfo) {
    res.set({
      'X-RateLimit-Limit': rateLimitInfo.limit,
      'X-RateLimit-Remaining': 0,
      'X-RateLimit-Reset': new Date(rateLimitInfo.resetTime).toISOString()
    });

    return res.status(429).json({
      error: 'Service Rate Limit Exceeded',
      message: 'Too many requests from service',
      code: 'SERVICE_RATE_LIMIT_EXCEEDED',
      limit: rateLimitInfo.limit,
      current: rateLimitInfo.current,
      resetTime: rateLimitInfo.resetTime,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get authentication status
   */
  getStatus() {
    return {
      authManager: this.authManager.getAuthStatus(),
      exemptPaths: Array.from(this.exemptPaths),
      activeServices: this.requestCounts.size,
      rateLimits: Object.fromEntries(this.rateLimits)
    };
  }

  /**
   * Add exempt path
   */
  addExemptPath(path) {
    this.exemptPaths.add(path);
  }

  /**
   * Remove exempt path
   */
  removeExemptPath(path) {
    this.exemptPaths.delete(path);
  }

  /**
   * Set custom rate limit for service
   */
  setServiceRateLimit(serviceName, limit) {
    this.rateLimits.set(serviceName, limit);
  }

  /**
   * Get service credentials (for service initialization)
   */
  async getServiceCredentials(serviceName) {
    return await this.authManager.getServiceCredentials(serviceName);
  }

  /**
   * Force key rotation
   */
  async forceKeyRotation() {
    return await this.authManager.forceKeyRotation();
  }

  /**
   * Cleanup
   */
  async cleanup() {
    await this.authManager.cleanupExpiredKeys();
  }

  /**
   * Disconnect
   */
  async disconnect() {
    await this.authManager.disconnect();
  }
}

module.exports = ServiceAuthMiddleware;
