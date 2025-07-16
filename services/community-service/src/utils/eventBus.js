/**
 * Simple Event Bus for community-service
 * Lightweight event handling without shared dependencies
 */

const EventEmitter = require('events');
const logger = require('./logger');

class SimpleEventBus extends EventEmitter {
  constructor(serviceName = 'community-service') {
    super();
    this.serviceName = serviceName;
    this.events = [];
    this.isConnected = true; // Always connected in simple mode
  }

  // Publish an event
  async publish(eventType, data, options = {}) {
    try {
      const event = {
        type: eventType,
        data,
        timestamp: new Date().toISOString(),
        source: this.serviceName,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };

      // Store event locally
      this.events.push(event);

      // Emit event locally
      this.emit('event', event);
      this.emit(eventType, event);

      logger.info('Event published', { type: eventType, source: this.serviceName });
      return event;
    } catch (error) {
      logger.error('Failed to publish event', { error: error.message, type: eventType });
      throw error;
    }
  }

  // Subscribe to events
  async subscribe(eventPattern, handler) {
    try {
      this.on(eventPattern, handler);
      logger.info('Subscribed to events', { pattern: eventPattern });
    } catch (error) {
      logger.error('Failed to subscribe to events', { error: error.message, pattern: eventPattern });
    }
  }

  // Service-specific event publishers
  async publishAuthEvent(action, data) {
    return this.publish(`auth:${action}`, data);
  }

  async publishUserEvent(action, data) {
    return this.publish(`user:${action}`, data);
  }

  async publishCommunityEvent(action, data) {
    return this.publish(`community:${action}`, data);
  }

  async publishLinkEvent(action, data) {
    return this.publish(`link:${action}`, data);
  }

  async publishSystemEvent(action, data) {
    return this.publish(`system:${action}`, data);
  }

  // Service-specific event subscribers
  async subscribeToAuthEvents(handler) {
    return this.subscribe('auth:*', handler);
  }

  async subscribeToUserEvents(handler) {
    return this.subscribe('user:*', handler);
  }

  async subscribeToCommunityEvents(handler) {
    return this.subscribe('community:*', handler);
  }

  async subscribeToLinkEvents(handler) {
    return this.subscribe('link:*', handler);
  }

  async subscribeToSystemEvents(handler) {
    return this.subscribe('system:*', handler);
  }

  // Get stored events (for testing/monitoring)
  getEvents() {
    return this.events;
  }

  getMockEvents() {
    return this.events;
  }

  // Clear stored events
  clearEvents() {
    this.events = [];
  }

  // Connection status
  isEventBusConnected() {
    return this.isConnected;
  }
}

module.exports = SimpleEventBus;