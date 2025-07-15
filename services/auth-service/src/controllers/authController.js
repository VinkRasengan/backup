const jwt = require('jsonwebtoken');
const { auth, db, collections } = require('../config/firebase');
const { Logger } = require('@factcheck/shared');
const AuthEventHandler = require('../events/authEventHandler');

const logger = new Logger('auth-service');

class AuthController {
  constructor() {
    // Enable EventBus with Redis Cloud
    this.authEventHandler = new AuthEventHandler();
  }

  /**
   * Register user - sync user data to Firestore after Firebase Auth registration
   */
  async register(req, res, next) {
    try {
      const { idToken, firstName, lastName } = req.body;

      if (!idToken) {
        return res.status(400).json({
          error: 'Firebase ID token required',
          code: 'TOKEN_MISSING'
        });
      }

      // Verify Firebase ID token
      const decodedToken = await auth.verifyIdToken(idToken);
      
      logger.withCorrelationId(req.correlationId).info('User registration attempt', {
        userId: decodedToken.uid,
        email: decodedToken.email
      });

      // Check if user already exists in Firestore
      const userDoc = await db.collection(collections.USERS).doc(decodedToken.uid).get();

      if (userDoc.exists) {
        return res.status(400).json({
          error: 'User already registered',
          code: 'USER_EXISTS'
        });
      }

      // Create user data in Firestore
      const userData = {
        email: decodedToken.email,
        firstName: firstName || decodedToken.name?.split(' ')[0] || '',
        lastName: lastName || decodedToken.name?.split(' ')[1] || '',
        displayName: decodedToken.name || `${firstName || ''} ${lastName || ''}`.trim(),
        isVerified: decodedToken.email_verified,
        authProvider: 'firebase',
        roles: ['user'], // Default role
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        profile: {
          bio: '',
          avatar: null,
          preferences: {
            notifications: true,
            theme: 'light'
          }
        },
        stats: {
          linksChecked: 0,
          joinedAt: new Date().toISOString()
        }
      };

      // Save user to Firestore with Firebase UID as document ID
      await db.collection(collections.USERS).doc(decodedToken.uid).set(userData);

      // Generate JWT token for service-to-service communication
      const jwtToken = jwt.sign(
        {
          userId: decodedToken.uid,
          email: decodedToken.email,
          roles: userData.roles
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Log successful registration
      logger.withCorrelationId(req.correlationId).info('User registered successfully', {
        userId: decodedToken.uid,
        email: decodedToken.email
      });

      res.status(201).json({
        message: 'User registered successfully',
        userId: decodedToken.uid,
        token: jwtToken,
        user: {
          id: decodedToken.uid,
          ...userData
        }
      });

    } catch (error) {
      logger.logError(error, req);
      
      if (error.code && error.code.startsWith('auth/')) {
        return res.status(401).json({
          error: 'Invalid Firebase token',
          code: 'INVALID_TOKEN'
        });
      }
      next(error);
    }
  }

  /**
   * Login user - sync user data after Firebase Auth login
   */
  async login(req, res, next) {
    try {
      const { idToken } = req.body;

      if (!idToken) {
        return res.status(400).json({
          error: 'Firebase ID token required',
          code: 'TOKEN_MISSING'
        });
      }

      // Verify Firebase ID token
      const decodedToken = await auth.verifyIdToken(idToken);
      
      logger.withCorrelationId(req.correlationId).info('User login attempt', {
        userId: decodedToken.uid,
        email: decodedToken.email
      });

      // Get or create user data in Firestore
      let userDoc = await db.collection(collections.USERS).doc(decodedToken.uid).get();
      let userData;

      if (!userDoc.exists) {
        // Create user if doesn't exist (auto-registration)
        userData = {
          email: decodedToken.email,
          firstName: decodedToken.name?.split(' ')[0] || '',
          lastName: decodedToken.name?.split(' ')[1] || '',
          displayName: decodedToken.name || '',
          isVerified: decodedToken.email_verified,
          authProvider: 'firebase',
          roles: ['user'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          profile: {
            bio: '',
            avatar: null,
            preferences: {
              notifications: true,
              theme: 'light'
            }
          },
          stats: {
            linksChecked: 0,
            joinedAt: new Date().toISOString()
          }
        };

        await db.collection(collections.USERS).doc(decodedToken.uid).set(userData);
      } else {
        userData = userDoc.data();
        
        // Update last login time
        await db.collection(collections.USERS).doc(decodedToken.uid).update({
          lastLoginAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }

      // Generate JWT token
      const jwtToken = jwt.sign(
        {
          userId: decodedToken.uid,
          email: decodedToken.email,
          roles: userData.roles || ['user']
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Log successful login
      logger.withCorrelationId(req.correlationId).info('User logged in successfully', {
        userId: decodedToken.uid,
        email: decodedToken.email,
        hasEventHandler: !!this.authEventHandler
      });

      // Publish login event to Event Sourcing system
      if (this.authEventHandler) {
        logger.withCorrelationId(req.correlationId).info('Publishing login event', {
          userId: decodedToken.uid,
          email: decodedToken.email
        });
        
        await this.authEventHandler.publishLoginEvent({
          id: decodedToken.uid,
          email: decodedToken.email,
          ...userData
        }, {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          location: req.get('CF-IPCountry') || 'Unknown'
        });
      } else {
        logger.withCorrelationId(req.correlationId).warn('Cannot publish login event - EventHandler not available', {
          userId: decodedToken.uid,
          email: decodedToken.email
        });
      }

      res.json({
        message: 'Login successful',
        token: jwtToken,
        user: {
          id: decodedToken.uid,
          ...userData
        }
      });

    } catch (error) {
      logger.logError(error, req);
      
      if (error.code?.startsWith('auth/')) {
        return res.status(401).json({
          error: 'Invalid Firebase token',
          code: 'INVALID_TOKEN'
        });
      }
      next(error);
    }
  }

  /**
   * Logout user
   */
  async logout(req, res, next) {
    try {
      const userId = req.user?.userId;
      const user = req.user;
      
      logger.withCorrelationId(req.correlationId).info('User logout attempt', {
        userId,
        hasUser: !!user,
        hasEventHandler: !!this.authEventHandler
      });
      
      if (userId && user && this.authEventHandler) {
        logger.withCorrelationId(req.correlationId).info('Publishing logout event', {
          userId
        });

        // Publish logout event to Event Sourcing system
        await this.authEventHandler.publishLogoutEvent(user, {
          sessionDuration: req.sessionDuration || 0
        });
      } else {
        logger.withCorrelationId(req.correlationId).warn('Cannot publish logout event', {
          userId,
          hasUser: !!user,
          hasEventHandler: !!this.authEventHandler
        });
      }

      res.json({
        message: 'Logout successful'
      });

    } catch (error) {
      logger.logError(error, req);
      next(error);
    }
  }

  /**
   * Refresh JWT token
   */
  async refreshToken(req, res, next) {
    try {
      const { idToken } = req.body;

      if (!idToken) {
        return res.status(400).json({
          error: 'Firebase ID token required',
          code: 'TOKEN_MISSING'
        });
      }

      // Verify Firebase ID token
      const decodedToken = await auth.verifyIdToken(idToken);
      
      // Get user data
      const userDoc = await db.collection(collections.USERS).doc(decodedToken.uid).get();
      
      if (!userDoc.exists) {
        return res.status(404).json({
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      const userData = userDoc.data();

      // Generate new JWT token
      const jwtToken = jwt.sign(
        {
          userId: decodedToken.uid,
          email: decodedToken.email,
          roles: userData.roles || ['user']
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        message: 'Token refreshed successfully',
        token: jwtToken
      });

    } catch (error) {
      logger.logError(error, req);
      
      if (error.code?.startsWith('auth/')) {
        return res.status(401).json({
          error: 'Invalid Firebase token',
          code: 'INVALID_TOKEN'
        });
      }
      next(error);
    }
  }

  /**
   * Verify JWT token (for other services)
   */
  async verifyToken(req, res, next) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          error: 'JWT token required',
          code: 'TOKEN_MISSING'
        });
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user data
      const userDoc = await db.collection(collections.USERS).doc(decoded.userId).get();
      
      if (!userDoc.exists) {
        return res.status(404).json({
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      const userData = userDoc.data();

      res.json({
        valid: true,
        user: {
          id: decoded.userId,
          email: decoded.email,
          roles: userData.roles || ['user'],
          ...userData
        }
      });

    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          valid: false,
          error: 'Invalid token',
          code: 'INVALID_TOKEN'
        });
      }
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          valid: false,
          error: 'Token expired',
          code: 'TOKEN_EXPIRED'
        });
      }

      logger.logError(error, req);
      next(error);
    }
  }

  /**
   * Email verification info
   */
  async verifyEmail(req, res, next) {
    try {
      res.json({
        message: 'Email verification is handled by Firebase Auth. Please check your email and click the verification link.'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;
