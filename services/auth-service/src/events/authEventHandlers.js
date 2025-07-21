/**
 * Auth Service Event Handlers
 * Demonstrates Event-Driven Architecture integration
 * Based on RabbitMQ in Depth and Event-Driven patterns
 */

const AuthServiceEventBus = require('../../lib/eventBus');
const logger = require('../utils/logger');
const { admin, db } = require('../config/firebase');

class AuthEventHandlers {
  constructor() {
    this.eventBus = new AuthServiceEventBus();
    this.setupEventHandlers();
  }

  /**
   * Setup event subscriptions for auth service
   */
  async setupEventHandlers() {
    try {
      // Subscribe to user-related events that auth service should handle
      await this.eventBus.subscribe('user.login.requested', this.handleLoginRequest.bind(this));
      await this.eventBus.subscribe('user.register.requested', this.handleRegisterRequest.bind(this));
      await this.eventBus.subscribe('user.password.reset.requested', this.handlePasswordResetRequest.bind(this));
      await this.eventBus.subscribe('user.profile.update.requested', this.handleProfileUpdateRequest.bind(this));
      await this.eventBus.subscribe('user.logout.requested', this.handleLogoutRequest.bind(this));
      
      // Subscribe to admin events that affect user accounts
      await this.eventBus.subscribe('admin.user.suspend.requested', this.handleUserSuspensionRequest.bind(this));
      await this.eventBus.subscribe('admin.user.activate.requested', this.handleUserActivationRequest.bind(this));

      logger.info('Auth service event handlers initialized successfully');

    } catch (error) {
      logger.error('Failed to setup auth event handlers', {
        error: error.message,
        stack: error.stack
      });
    }
  }

  /**
   * Handle user login request event
   */
  async handleLoginRequest(event) {
    const { email, password, ipAddress, userAgent } = event.data;
    const correlationId = event.metadata?.correlationId;

    try {
      logger.info('Processing login request', {
        email,
        correlationId,
        source: event.source
      });

      // Authenticate user (integrate with your existing auth logic)
      const authResult = await this.authenticateUser(email, password);

      if (authResult.success) {
        // Create session
        const sessionData = await this.createUserSession(authResult.user, ipAddress, userAgent);

        // Publish successful login event
        await this.eventBus.publishUserLogin(authResult.user, sessionData);

        // Publish response event
        await this.eventBus.publishEvent('auth.login.success', {
          userId: authResult.user.id,
          email: authResult.user.email,
          token: sessionData.token,
          sessionId: sessionData.sessionId,
          expiresAt: sessionData.expiresAt
        }, { correlationId });

        logger.info('Login successful', {
          userId: authResult.user.id,
          email,
          correlationId
        });

      } else {
        // Publish failed login event
        await this.eventBus.publishEvent('auth.login.failed', {
          email,
          reason: authResult.error,
          ipAddress,
          userAgent
        }, { correlationId });

        logger.warn('Login failed', {
          email,
          reason: authResult.error,
          correlationId
        });
      }

    } catch (error) {
      logger.error('Error handling login request', {
        email,
        error: error.message,
        correlationId
      });

      // Publish error event
      await this.eventBus.publishEvent('auth.login.error', {
        email,
        error: error.message,
        ipAddress,
        userAgent
      }, { correlationId });
    }
  }

  /**
   * Handle user registration request event
   */
  async handleRegisterRequest(event) {
    const { email, password, name, provider = 'email' } = event.data;
    const correlationId = event.metadata?.correlationId;

    try {
      logger.info('Processing registration request', {
        email,
        name,
        provider,
        correlationId
      });

      // Check if user already exists
      const existingUser = await this.findUserByEmail(email);
      if (existingUser) {
        await this.eventBus.publishEvent('auth.register.failed', {
          email,
          reason: 'User already exists'
        }, { correlationId });
        return;
      }

      // Create new user (integrate with your existing registration logic)
      const newUser = await this.createUser({
        email,
        password,
        name,
        provider,
        emailVerified: false,
        roles: ['user']
      });

      // Publish user registered event
      await this.eventBus.publishUserRegistered(newUser);

      // Publish registration success event
      await this.eventBus.publishEvent('auth.register.success', {
        userId: newUser.id,
        email: newUser.email,
        name: newUser.name,
        emailVerificationRequired: true
      }, { correlationId });

      // Send email verification (publish event for email service)
      await this.eventBus.publishEvent('email.verification.requested', {
        userId: newUser.id,
        email: newUser.email,
        name: newUser.name,
        verificationToken: newUser.emailVerificationToken
      }, { correlationId });

      logger.info('Registration successful', {
        userId: newUser.id,
        email,
        correlationId
      });

    } catch (error) {
      logger.error('Error handling registration request', {
        email,
        error: error.message,
        correlationId
      });

      await this.eventBus.publishEvent('auth.register.error', {
        email,
        error: error.message
      }, { correlationId });
    }
  }

  /**
   * Handle password reset request event
   */
  async handlePasswordResetRequest(event) {
    const { email } = event.data;
    const correlationId = event.metadata?.correlationId;

    try {
      logger.info('Processing password reset request', {
        email,
        correlationId
      });

      // Find user by email
      const user = await this.findUserByEmail(email);
      if (!user) {
        // Don't reveal if user exists or not for security
        await this.eventBus.publishEvent('auth.password.reset.initiated', {
          email,
          message: 'If the email exists, a reset link has been sent'
        }, { correlationId });
        return;
      }

      // Generate reset token
      const resetToken = await this.generatePasswordResetToken(user.id);

      // Publish password reset event
      await this.eventBus.publishEvent('auth.password.reset.initiated', {
        userId: user.id,
        email: user.email,
        resetToken
      }, { correlationId });

      // Send reset email (publish event for email service)
      await this.eventBus.publishEvent('email.password.reset.requested', {
        userId: user.id,
        email: user.email,
        name: user.name,
        resetToken
      }, { correlationId });

      logger.info('Password reset initiated', {
        userId: user.id,
        email,
        correlationId
      });

    } catch (error) {
      logger.error('Error handling password reset request', {
        email,
        error: error.message,
        correlationId
      });

      await this.eventBus.publishEvent('auth.password.reset.error', {
        email,
        error: error.message
      }, { correlationId });
    }
  }

  /**
   * Handle profile update request event
   */
  async handleProfileUpdateRequest(event) {
    const { userId, changes } = event.data;
    const correlationId = event.metadata?.correlationId;

    try {
      logger.info('Processing profile update request', {
        userId,
        changes: Object.keys(changes),
        correlationId
      });

      // Update user profile
      const updatedUser = await this.updateUserProfile(userId, changes);

      // Publish profile updated event
      await this.eventBus.publishEvent('auth.user.profile.updated', {
        userId,
        changes,
        updatedAt: new Date().toISOString()
      }, { correlationId });

      // Publish success response
      await this.eventBus.publishEvent('auth.profile.update.success', {
        userId,
        updatedFields: Object.keys(changes)
      }, { correlationId });

      logger.info('Profile update successful', {
        userId,
        correlationId
      });

    } catch (error) {
      logger.error('Error handling profile update request', {
        userId,
        error: error.message,
        correlationId
      });

      await this.eventBus.publishEvent('auth.profile.update.error', {
        userId,
        error: error.message
      }, { correlationId });
    }
  }

  /**
   * Handle logout request event
   */
  async handleLogoutRequest(event) {
    const { userId, sessionId } = event.data;
    const correlationId = event.metadata?.correlationId;

    try {
      logger.info('Processing logout request', {
        userId,
        sessionId,
        correlationId
      });

      // Invalidate session
      await this.invalidateSession(sessionId);

      // Publish logout event
      await this.eventBus.publishUserLogout(userId, sessionId);

      // Publish logout success
      await this.eventBus.publishEvent('auth.logout.success', {
        userId,
        sessionId
      }, { correlationId });

      logger.info('Logout successful', {
        userId,
        sessionId,
        correlationId
      });

    } catch (error) {
      logger.error('Error handling logout request', {
        userId,
        sessionId,
        error: error.message,
        correlationId
      });

      await this.eventBus.publishEvent('auth.logout.error', {
        userId,
        sessionId,
        error: error.message
      }, { correlationId });
    }
  }

  /**
   * Handle user suspension request from admin
   */
  async handleUserSuspensionRequest(event) {
    const { userId, reason, suspendedBy, suspendedUntil } = event.data;
    const correlationId = event.metadata?.correlationId;

    try {
      logger.info('Processing user suspension request', {
        userId,
        reason,
        suspendedBy,
        correlationId
      });

      // Suspend user account
      await this.suspendUserAccount(userId, reason, suspendedBy, suspendedUntil);

      // Get user details
      const user = await this.findUserById(userId);

      // Publish account suspended event
      await this.eventBus.publishEvent('auth.user.account.suspended', {
        userId,
        email: user.email,
        reason,
        suspendedBy,
        suspendedUntil
      }, { correlationId });

      // Invalidate all user sessions
      await this.invalidateAllUserSessions(userId);

      logger.info('User suspension successful', {
        userId,
        suspendedBy,
        correlationId
      });

    } catch (error) {
      logger.error('Error handling user suspension request', {
        userId,
        error: error.message,
        correlationId
      });

      await this.eventBus.publishEvent('auth.user.suspension.error', {
        userId,
        error: error.message
      }, { correlationId });
    }
  }

  // Helper methods (integrate with your existing auth logic)
  async authenticateUser(email, password) {
    // Implement your authentication logic here
    // Return { success: true, user: userData } or { success: false, error: 'reason' }
  }

  async createUserSession(user, ipAddress, userAgent) {
    // Implement session creation logic
    // Return { sessionId, token, expiresAt }
  }

  async findUserByEmail(email) {
    // Implement user lookup by email
  }

  async findUserById(userId) {
    // Implement user lookup by ID
  }

  async createUser(userData) {
    // Implement user creation logic
  }

  async updateUserProfile(userId, changes) {
    // Implement profile update logic
  }

  async invalidateSession(sessionId) {
    // Implement session invalidation
  }

  async suspendUserAccount(userId, reason, suspendedBy, suspendedUntil) {
    // Implement account suspension logic
  }

  async invalidateAllUserSessions(userId) {
    // Implement logic to invalidate all sessions for a user
  }

  async generatePasswordResetToken(userId) {
    // Implement password reset token generation
  }

  /**
   * Get event bus statistics
   */
  getEventBusStats() {
    return this.eventBus.getStats();
  }

  /**
   * Health check for event handlers
   */
  async healthCheck() {
    return await this.eventBus.healthCheck();
  }

  /**
   * Cleanup event handlers
   */
  async close() {
    await this.eventBus.close();
  }
}

module.exports = AuthEventHandlers;
