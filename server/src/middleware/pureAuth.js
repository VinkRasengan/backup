// Pure Backend Authentication Middleware (JWT Only, No Firebase)
const jwt = require('jsonwebtoken');

class PureAuthMiddleware {
  // Authenticate JWT token
  authenticateToken(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          error: 'Access token required',
          code: 'TOKEN_MISSING'
        });
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-change-in-production');
        
        req.user = {
          userId: decoded.userId,
          email: decoded.email,
          authType: 'jwt'
        };
        
        next();
      } catch (jwtError) {
        console.error('JWT verification failed:', jwtError.message);
        
        if (jwtError.name === 'TokenExpiredError') {
          return res.status(401).json({
            error: 'Token has expired',
            code: 'TOKEN_EXPIRED'
          });
        }
        
        if (jwtError.name === 'JsonWebTokenError') {
          return res.status(401).json({
            error: 'Invalid token',
            code: 'INVALID_TOKEN'
          });
        }
        
        return res.status(401).json({
          error: 'Token verification failed',
          code: 'TOKEN_VERIFICATION_FAILED'
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
  optionalAuth(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // No token provided, continue without user context
        req.user = null;
        return next();
      }

      const token = authHeader.substring(7);

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-change-in-production');
        req.user = {
          userId: decoded.userId,
          email: decoded.email,
          authType: 'jwt'
        };
      } catch (jwtError) {
        // Invalid token, but continue without user context
        req.user = null;
      }

      next();

    } catch (error) {
      // On error, continue without user context
      req.user = null;
      next();
    }
  }

  // Admin authentication
  authenticateAdmin(req, res, next) {
    this.authenticateToken(req, res, (err) => {
      if (err) return next(err);

      // Check if user is admin
      const isAdmin = this.isAdminUser(req.user);

      if (!isAdmin) {
        return res.status(403).json({
          error: 'Admin access required',
          code: 'ADMIN_REQUIRED'
        });
      }

      next();
    });
  }

  // Check if user is admin
  isAdminUser(user) {
    if (!user || !user.email) return false;
    
    // Admin check logic - customize as needed
    const adminEmails = [
      'admin@factcheck.com',
      'admin@example.com',
      process.env.ADMIN_EMAIL
    ].filter(Boolean);
    
    return adminEmails.includes(user.email) || 
           user.email.endsWith('@factcheck.com');
  }

  // Rate limiting by user
  rateLimitByUser(req, res, next) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return next(); // Skip rate limiting for unauthenticated users
      }

      // Simple in-memory rate limiting
      global.userRateLimit = global.userRateLimit || new Map();
      const now = Date.now();
      const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000; // 15 minutes
      const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100;

      const userRequests = global.userRateLimit.get(userId) || [];
      const recentRequests = userRequests.filter(time => now - time < windowMs);

      if (recentRequests.length >= maxRequests) {
        return res.status(429).json({
          error: 'Too many requests',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil(windowMs / 1000),
          limit: maxRequests,
          windowMs
        });
      }

      recentRequests.push(now);
      global.userRateLimit.set(userId, recentRequests);

      next();
    } catch (error) {
      console.error('Rate limiting error:', error);
      next(); // Continue on error
    }
  }

  // Validate API key (for external integrations)
  validateApiKey(req, res, next) {
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    
    if (!apiKey) {
      return res.status(401).json({
        error: 'API key required',
        code: 'API_KEY_MISSING'
      });
    }

    // Simple API key validation - in production, store in database
    const validApiKeys = [
      process.env.API_KEY,
      process.env.EXTERNAL_API_KEY
    ].filter(Boolean);

    if (!validApiKeys.includes(apiKey)) {
      return res.status(401).json({
        error: 'Invalid API key',
        code: 'INVALID_API_KEY'
      });
    }

    req.apiKey = apiKey;
    next();
  }

  // CORS preflight handler
  handleCors(req, res, next) {
    const allowedOrigins = [
      'http://localhost:3000',
      'https://factcheck-frontend.onrender.com',
      process.env.FRONTEND_URL
    ].filter(Boolean);

    const origin = req.headers.origin;
    
    if (allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    next();
  }

  // Security headers
  securityHeaders(req, res, next) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    next();
  }

  // Request logging
  logRequest(req, res, next) {
    const start = Date.now();
    const { method, url, ip } = req;
    const userAgent = req.headers['user-agent'];
    const userId = req.user?.userId || 'anonymous';

    res.on('finish', () => {
      const duration = Date.now() - start;
      const { statusCode } = res;
      
      console.log(`${method} ${url} - ${statusCode} - ${duration}ms - ${ip} - ${userId} - ${userAgent}`);
      
      // Log slow requests
      if (duration > 2000) {
        console.warn(`⚠️ Slow request: ${method} ${url} took ${duration}ms`);
      }
    });

    next();
  }
}

module.exports = new PureAuthMiddleware();
