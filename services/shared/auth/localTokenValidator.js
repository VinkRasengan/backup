/**
 * Local Token Validator
 * Validates JWT tokens locally without calling Auth Service
 */

const jwt = require('jsonwebtoken');
const TokenCache = require('./tokenCache');
const circuitBreakerService = require('../../../api-gateway/src/services/circuitBreaker');

class LocalTokenValidator {
  constructor(options = {}) {
    this.jwtSecret = options.jwtSecret || process.env.JWT_SECRET;
    this.jwtPublicKey = options.jwtPublicKey || process.env.JWT_PUBLIC_KEY;
    this.authServiceUrl = options.authServiceUrl || process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
    this.tokenCache = new TokenCache(options.cache);
    this.fallbackToAuthService = options.fallbackToAuthService !== false;
    this.maxTokenAge = options.maxTokenAge || 24 * 60 * 60 * 1000; // 24 hours
    this.refreshThreshold = options.refreshThreshold || 5 * 60 * 1000; // 5 minutes
    
    this.validationStats = {
      localValidations: 0,
      cacheHits: 0,
      authServiceCalls: 0,
      failures: 0
    };
  }

  /**
   * Validate token with multiple fallback strategies
   */
  async validateToken(token, options = {}) {
    try {
      // Strategy 1: Check cache first
      const cachedData = await this.tokenCache.getCachedToken(token);
      if (cachedData && this.isCacheDataValid(cachedData)) {
        this.validationStats.cacheHits++;
        return {
          valid: true,
          user: cachedData,
          source: 'cache',
          cached: true
        };
      }

      // Strategy 2: Local JWT validation
      const localValidation = this.validateJWTLocally(token);
      if (localValidation.valid) {
        this.validationStats.localValidations++;
        
        // Cache the result
        await this.tokenCache.cacheToken(token, localValidation.user);
        
        return {
          valid: true,
          user: localValidation.user,
          source: 'local_jwt',
          cached: false
        };
      }

      // Strategy 3: Fallback to Auth Service (with circuit breaker)
      if (this.fallbackToAuthService) {
        const authServiceResult = await this.validateWithAuthService(token);
        if (authServiceResult.valid) {
          this.validationStats.authServiceCalls++;
          
          // Cache the result
          await this.tokenCache.cacheToken(token, authServiceResult.user);
          
          return {
            valid: true,
            user: authServiceResult.user,
            source: 'auth_service',
            cached: false
          };
        }
      }

      // All strategies failed
      this.validationStats.failures++;
      return {
        valid: false,
        reason: 'Token validation failed',
        source: 'all_strategies_failed'
      };

    } catch (error) {
      this.validationStats.failures++;
      console.error('Token validation error:', error);
      return {
        valid: false,
        reason: error.message,
        source: 'error'
      };
    }
  }

  /**
   * Validate JWT token locally
   */
  validateJWTLocally(token) {
    try {
      let decoded;
      
      // Try with secret first
      if (this.jwtSecret) {
        try {
          decoded = jwt.verify(token, this.jwtSecret);
        } catch (error) {
          // If secret fails, try with public key
          if (this.jwtPublicKey) {
            decoded = jwt.verify(token, this.jwtPublicKey, { algorithms: ['RS256', 'ES256'] });
          } else {
            throw error;
          }
        }
      } else if (this.jwtPublicKey) {
        decoded = jwt.verify(token, this.jwtPublicKey, { algorithms: ['RS256', 'ES256'] });
      } else {
        throw new Error('No JWT secret or public key configured');
      }

      // Validate token structure and claims
      const validation = this.validateTokenClaims(decoded);
      if (!validation.valid) {
        return validation;
      }

      // Extract user information
      const user = this.extractUserFromToken(decoded);
      
      return {
        valid: true,
        user,
        decoded,
        expiresAt: decoded.exp ? decoded.exp * 1000 : null
      };

    } catch (error) {
      return {
        valid: false,
        reason: error.message,
        code: error.name
      };
    }
  }

  /**
   * Validate token claims
   */
  validateTokenClaims(decoded) {
    const now = Math.floor(Date.now() / 1000);
    
    // Check expiration
    if (decoded.exp && decoded.exp < now) {
      return { valid: false, reason: 'Token expired' };
    }

    // Check not before
    if (decoded.nbf && decoded.nbf > now) {
      return { valid: false, reason: 'Token not yet valid' };
    }

    // Check issued at (prevent tokens that are too old)
    if (decoded.iat) {
      const tokenAge = (now - decoded.iat) * 1000; // Convert to milliseconds
      if (tokenAge > this.maxTokenAge) {
        return { valid: false, reason: 'Token too old' };
      }
    }

    // Check required claims
    const requiredClaims = ['sub', 'iat'];
    for (const claim of requiredClaims) {
      if (!decoded[claim]) {
        return { valid: false, reason: `Missing required claim: ${claim}` };
      }
    }

    return { valid: true };
  }

  /**
   * Extract user information from token
   */
  extractUserFromToken(decoded) {
    return {
      id: decoded.sub || decoded.userId || decoded.id,
      email: decoded.email,
      name: decoded.name || decoded.displayName,
      roles: decoded.roles || ['user'],
      permissions: decoded.permissions || [],
      emailVerified: decoded.email_verified || decoded.emailVerified || false,
      provider: decoded.provider || 'jwt',
      iat: decoded.iat,
      exp: decoded.exp
    };
  }

  /**
   * Validate with Auth Service using circuit breaker
   */
  async validateWithAuthService(token) {
    try {
      const response = await circuitBreakerService.execute('auth', {
        method: 'POST',
        url: `${this.authServiceUrl}/auth/verify`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        data: { token },
        timeout: 5000
      });

      if (response.data && response.data.success) {
        return {
          valid: true,
          user: response.data.user
        };
      } else {
        return {
          valid: false,
          reason: response.data?.message || 'Auth service validation failed'
        };
      }
    } catch (error) {
      console.error('Auth service validation error:', error);
      return {
        valid: false,
        reason: 'Auth service unavailable',
        error: error.message
      };
    }
  }

  /**
   * Check if cached data is still valid
   */
  isCacheDataValid(cachedData) {
    const now = Date.now();
    
    // Check cache expiration
    if (cachedData.expiresAt && now > cachedData.expiresAt) {
      return false;
    }

    // Check if token is close to expiration and needs refresh
    if (cachedData.expiresAt && (cachedData.expiresAt - now) < this.refreshThreshold) {
      // Token is close to expiration, consider it invalid to force refresh
      return false;
    }

    return true;
  }

  /**
   * Validate user permissions
   */
  validatePermissions(user, requiredPermissions = []) {
    if (requiredPermissions.length === 0) {
      return { valid: true };
    }

    const userPermissions = user.permissions || [];
    const userRoles = user.roles || [];

    // Check direct permissions
    const hasDirectPermission = requiredPermissions.every(permission =>
      userPermissions.includes(permission)
    );

    if (hasDirectPermission) {
      return { valid: true };
    }

    // Check role-based permissions
    const rolePermissions = this.getRolePermissions(userRoles);
    const hasRolePermission = requiredPermissions.every(permission =>
      rolePermissions.includes(permission)
    );

    if (hasRolePermission) {
      return { valid: true };
    }

    return {
      valid: false,
      reason: 'Insufficient permissions',
      required: requiredPermissions,
      userPermissions,
      userRoles
    };
  }

  /**
   * Get permissions for roles
   */
  getRolePermissions(roles) {
    const rolePermissionMap = {
      'admin': ['*'], // Admin has all permissions
      'moderator': ['moderate_content', 'view_reports', 'manage_users'],
      'premium': ['advanced_features', 'priority_support'],
      'user': ['basic_features']
    };

    const permissions = new Set();
    
    for (const role of roles) {
      const rolePerms = rolePermissionMap[role] || [];
      rolePerms.forEach(perm => permissions.add(perm));
    }

    return Array.from(permissions);
  }

  /**
   * Invalidate token
   */
  async invalidateToken(token) {
    await this.tokenCache.invalidateToken(token);
  }

  /**
   * Invalidate user tokens
   */
  async invalidateUser(userId) {
    await this.tokenCache.invalidateUser(userId);
  }

  /**
   * Refresh token validation (force re-validation)
   */
  async refreshTokenValidation(token) {
    // Remove from cache first
    await this.tokenCache.invalidateToken(token);
    
    // Re-validate
    return await this.validateToken(token);
  }

  /**
   * Batch validate tokens
   */
  async validateTokens(tokens) {
    const results = await Promise.allSettled(
      tokens.map(token => this.validateToken(token))
    );

    return results.map((result, index) => ({
      token: tokens[index],
      result: result.status === 'fulfilled' ? result.value : { valid: false, error: result.reason }
    }));
  }

  /**
   * Get validation statistics
   */
  getStats() {
    const total = this.validationStats.localValidations + 
                 this.validationStats.cacheHits + 
                 this.validationStats.authServiceCalls + 
                 this.validationStats.failures;

    return {
      ...this.validationStats,
      total,
      cacheHitRate: total > 0 ? (this.validationStats.cacheHits / total * 100).toFixed(2) + '%' : '0%',
      localValidationRate: total > 0 ? (this.validationStats.localValidations / total * 100).toFixed(2) + '%' : '0%',
      authServiceRate: total > 0 ? (this.validationStats.authServiceCalls / total * 100).toFixed(2) + '%' : '0%',
      failureRate: total > 0 ? (this.validationStats.failures / total * 100).toFixed(2) + '%' : '0%',
      cacheStats: this.tokenCache.getStats()
    };
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const cacheHealth = await this.tokenCache.healthCheck();
      
      return {
        status: 'healthy',
        jwtSecretConfigured: !!this.jwtSecret,
        jwtPublicKeyConfigured: !!this.jwtPublicKey,
        authServiceConfigured: !!this.authServiceUrl,
        fallbackEnabled: this.fallbackToAuthService,
        cache: cacheHealth,
        stats: this.getStats()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.validationStats = {
      localValidations: 0,
      cacheHits: 0,
      authServiceCalls: 0,
      failures: 0
    };
  }

  /**
   * Disconnect
   */
  async disconnect() {
    await this.tokenCache.disconnect();
  }
}

module.exports = LocalTokenValidator;
