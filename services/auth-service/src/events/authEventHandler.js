/**
 * Auth Service Event Handler
 * Handles event-driven communication for authentication service
 */

const EventBus = require('../../../shared/eventBus/eventBus');
const { EventTypes, EventHelpers } = require('../../../shared/eventBus/eventTypes');
const logger = require('../utils/logger');

class AuthEventHandler {
  constructor() {
    this.eventBus = new EventBus({
      serviceName: 'auth-service'
    });

    this.setupEventListeners();
    this.initializeSubscriptions();
  }

  /**
   * Setup event bus listeners
   */
  setupEventListeners() {
    this.eventBus.on('connected', () => {
      logger.info('Auth service connected to event bus');
    });

    this.eventBus.on('error', (error) => {
      logger.error('Event bus error in auth service', { error: error.message });
    });

    this.eventBus.on('messageReceived', (event) => {
      logger.debug('Event received in auth service', { 
        type: event.type, 
        source: event.source 
      });
    });
  }

  /**
   * Initialize event subscriptions
   */
  async initializeSubscriptions() {
    try {
      // Subscribe to system events
      await this.eventBus.subscribeToSystemEvents(this.handleSystemEvent.bind(this));
      
      // Subscribe to user events from other services
      await this.eventBus.subscribeToUserEvents(this.handleUserEvent.bind(this));
      
      // Subscribe to admin events
      await this.eventBus.subscribe('admin:*', this.handleAdminEvent.bind(this));

      logger.info('Auth service event subscriptions initialized');
    } catch (error) {
      logger.error('Failed to initialize event subscriptions', { error: error.message });
    }
  }

  /**
   * Handle system events
   */
  async handleSystemEvent(event) {
    try {
      switch (event.type) {
        case EventTypes.SYSTEM.SERVICE_HEALTH_CHANGED:
          await this.handleServiceHealthChange(event.data);
          break;
        
        case EventTypes.SYSTEM.CIRCUIT_BREAKER_OPENED:
          await this.handleCircuitBreakerOpened(event.data);
          break;
        
        case EventTypes.SYSTEM.RATE_LIMIT_EXCEEDED:
          await this.handleRateLimitExceeded(event.data);
          break;
        
        default:
          logger.debug('Unhandled system event', { type: event.type });
      }
    } catch (error) {
      logger.error('Error handling system event', { 
        eventType: event.type, 
        error: error.message 
      });
    }
  }

  /**
   * Handle user events
   */
  async handleUserEvent(event) {
    try {
      switch (event.type) {
        case EventTypes.USER.PROFILE_UPDATED:
          // Update cached user data
          await this.updateUserCache(event.data);
          break;
        
        case EventTypes.USER.STATUS_CHANGED:
          // Handle user status changes
          await this.handleUserStatusChange(event.data);
          break;
        
        default:
          logger.debug('Unhandled user event', { type: event.type });
      }
    } catch (error) {
      logger.error('Error handling user event', { 
        eventType: event.type, 
        error: error.message 
      });
    }
  }

  /**
   * Handle admin events
   */
  async handleAdminEvent(event) {
    try {
      switch (event.type) {
        case EventTypes.ADMIN.USER_MODERATED:
          await this.handleUserModeration(event.data);
          break;
        
        case EventTypes.ADMIN.CONFIGURATION_CHANGED:
          await this.handleConfigurationChange(event.data);
          break;
        
        default:
          logger.debug('Unhandled admin event', { type: event.type });
      }
    } catch (error) {
      logger.error('Error handling admin event', { 
        eventType: event.type, 
        error: error.message 
      });
    }
  }

  /**
   * Publish authentication events
   */
  async publishLoginEvent(userData, metadata = {}) {
    try {
      logger.info('🔥 Publishing login event', { 
        userId: userData.id,
        email: userData.email,
        eventBusConnected: this.eventBus.isConnected 
      });
      
      await this.eventBus.publishAuthEvent('login', {
        userId: userData.id,
        email: userData.email,
        timestamp: new Date().toISOString(),
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        location: metadata.location
      });
      
      logger.info('✅ Login event published successfully', { userId: userData.id });
    } catch (error) {
      logger.error('❌ Failed to publish login event', { 
        error: error.message,
        stack: error.stack,
        userId: userData.id 
      });
    }
  }

  async publishLogoutEvent(userData, metadata = {}) {
    try {
      logger.info('🔥 Publishing logout event', { 
        userId: userData.id,
        email: userData.email,
        eventBusConnected: this.eventBus.isConnected 
      });
      
      await this.eventBus.publishAuthEvent('logout', {
        userId: userData.id,
        email: userData.email,
        timestamp: new Date().toISOString(),
        sessionDuration: metadata.sessionDuration
      });
      
      logger.info('✅ Logout event published successfully', { userId: userData.id });
    } catch (error) {
      logger.error('❌ Failed to publish logout event', { 
        error: error.message,
        stack: error.stack,
        userId: userData.id 
      });
    }
  }

  async publishPasswordChangeEvent(userData) {
    try {
      await this.eventBus.publishAuthEvent('password_changed', {
        userId: userData.id,
        email: userData.email,
        timestamp: new Date().toISOString()
      });
      
      logger.info('Password change event published', { userId: userData.id });
    } catch (error) {
      logger.error('Failed to publish password change event', { error: error.message });
    }
  }

  async publishFailedLoginEvent(email, metadata = {}) {
    try {
      await this.eventBus.publishAuthEvent('failed_login_attempt', {
        email,
        timestamp: new Date().toISOString(),
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        reason: metadata.reason
      });
      
      logger.warn('Failed login event published', { email });
    } catch (error) {
      logger.error('Failed to publish failed login event', { error: error.message });
    }
  }

  async publishAccountLockedEvent(userData, reason) {
    try {
      await this.eventBus.publishAuthEvent('account_locked', {
        userId: userData.id,
        email: userData.email,
        reason,
        timestamp: new Date().toISOString()
      });
      
      logger.warn('Account locked event published', { userId: userData.id, reason });
    } catch (error) {
      logger.error('Failed to publish account locked event', { error: error.message });
    }
  }

  /**
   * Event handler implementations
   */
  async handleServiceHealthChange(data) {
    logger.info('Service health changed', data);
    // Could implement auth service specific logic here
  }

  async handleCircuitBreakerOpened(data) {
    logger.warn('Circuit breaker opened', data);
    // Could implement fallback authentication strategies
  }

  async handleRateLimitExceeded(data) {
    logger.warn('Rate limit exceeded', data);
    // Could implement additional security measures
  }

  async updateUserCache(userData) {
    logger.info('Updating user cache', { userId: userData.userId });
    // Implement user cache update logic
  }

  async handleUserStatusChange(data) {
    logger.info('User status changed', data);
    // Handle user status changes (active, inactive, suspended)
  }

  async handleUserModeration(data) {
    logger.info('User moderation action', data);
    // Handle user moderation actions
  }

  async handleConfigurationChange(data) {
    logger.info('Configuration changed', data);
    // Handle configuration changes
  }

  /**
   * Publish user creation event
   */
  async publishUserCreatedEvent(userData) {
    try {
      await this.eventBus.publishUserEvent('created', {
        userId: userData.id,
        email: userData.email,
        name: userData.name || userData.displayName,
        roles: userData.roles || ['user'],
        timestamp: new Date().toISOString(),
        metadata: {
          provider: userData.provider || 'email',
          emailVerified: userData.emailVerified || false
        }
      });
      
      logger.info('User created event published', { userId: userData.id });
    } catch (error) {
      logger.error('Failed to publish user created event', { error: error.message });
    }
  }

  /**
   * Publish user updated event
   */
  async publishUserUpdatedEvent(userData, changes) {
    try {
      await this.eventBus.publishUserEvent('updated', {
        userId: userData.id,
        email: userData.email,
        changes,
        timestamp: new Date().toISOString()
      });
      
      logger.info('User updated event published', { userId: userData.id });
    } catch (error) {
      logger.error('Failed to publish user updated event', { error: error.message });
    }
  }

  /**
   * Get event bus status
   */
  getStatus() {
    return this.eventBus.getStatus();
  }

  /**
   * Health check
   */
  async healthCheck() {
    return await this.eventBus.healthCheck();
  }

  /**
   * Disconnect from event bus
   */
  async disconnect() {
    await this.eventBus.disconnect();
  }
}

module.exports = AuthEventHandler;
