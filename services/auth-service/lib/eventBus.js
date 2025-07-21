/**
 * Auth Service Local Event Bus
 * Independent implementation that communicates with Event Bus Service
 * NO SHARED DEPENDENCIES - Complete service independence
 */

const axios = require('axios');
const WebSocket = require('ws');
const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');

// Load environment variables from root .env
require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });

class AuthServiceEventBus extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.serviceName = 'auth-service';
    this.eventBusServiceUrl = process.env.EVENT_BUS_SERVICE_URL || 'http://localhost:3007';
    
    // HTTP client for publishing events
    this.httpClient = axios.create({
      baseURL: this.eventBusServiceUrl,
      timeout: parseInt(process.env.EVENT_BUS_TIMEOUT) || 5000,
      headers: {
        'Content-Type': 'application/json',
        'x-service-name': this.serviceName
      }
    });

    // WebSocket for real-time subscriptions
    this.ws = null;
    this.wsReconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;

    // Local event storage for retry mechanism
    this.pendingEvents = [];
    this.retryInterval = null;
    
    // Statistics
    this.stats = {
      published: 0,
      consumed: 0,
      failed: 0,
      retries: 0
    };

    // Connection state
    this.isConnected = false;
    this.subscriptions = new Map();

    // Initialize connections
    this.initialize();
  }

  async initialize() {
    try {
      console.log(`[${this.serviceName}] Initializing Event Bus...`);
      
      // Test HTTP connection
      await this.testConnection();
      
      // Setup WebSocket connection
      this.setupWebSocket();
      
      // Setup retry mechanism
      this.setupRetryMechanism();
      
      console.log(`[${this.serviceName}] ✅ Event Bus initialized successfully`);
    } catch (error) {
      console.error(`[${this.serviceName}] Failed to initialize Event Bus:`, error.message);
      // Continue without Event Bus - service should still work
    }
  }

  async testConnection() {
    try {
      const response = await this.httpClient.get('/health');
      this.isConnected = response.status === 200;
      console.log(`[${this.serviceName}] Event Bus Service health:`, response.data.status);
    } catch (error) {
      console.warn(`[${this.serviceName}] Event Bus Service not available:`, error.message);
      this.isConnected = false;
    }
  }

  setupWebSocket() {
    try {
      const wsUrl = this.eventBusServiceUrl.replace('http', 'ws') + '/subscribe';
      this.ws = new WebSocket(wsUrl, {
        headers: {
          'x-service-name': this.serviceName
        }
      });

      this.ws.on('open', () => {
        console.log(`[${this.serviceName}] WebSocket connected to Event Bus`);
        this.wsReconnectAttempts = 0;
        
        // Subscribe to relevant events
        this.subscriptions.forEach((handler, pattern) => {
          this.ws.send(JSON.stringify({
            type: 'subscribe',
            eventPattern: pattern
          }));
        });
      });

      this.ws.on('message', (data) => {
        try {
          const event = JSON.parse(data.toString());
          
          if (event.type === 'subscribed') {
            console.log(`[${this.serviceName}] Subscribed to pattern:`, event.eventPattern);
            return;
          }

          // Handle incoming event
          this.handleIncomingEvent(event);
          this.stats.consumed++;
        } catch (error) {
          console.error(`[${this.serviceName}] Error processing WebSocket message:`, error.message);
          this.stats.failed++;
        }
      });

      this.ws.on('close', () => {
        console.log(`[${this.serviceName}] WebSocket connection closed`);
        this.reconnectWebSocket();
      });

      this.ws.on('error', (error) => {
        console.error(`[${this.serviceName}] WebSocket error:`, error.message);
      });
    } catch (error) {
      console.error(`[${this.serviceName}] Failed to setup WebSocket:`, error.message);
    }
  }

  reconnectWebSocket() {
    if (this.wsReconnectAttempts < this.maxReconnectAttempts) {
      this.wsReconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.wsReconnectAttempts - 1);
      
      console.log(`[${this.serviceName}] Reconnecting WebSocket in ${delay}ms (attempt ${this.wsReconnectAttempts})`);
      
      setTimeout(() => {
        this.setupWebSocket();
      }, delay);
    } else {
      console.error(`[${this.serviceName}] Max WebSocket reconnection attempts reached`);
    }
  }

  setupRetryMechanism() {
    // Retry failed events every 30 seconds
    this.retryInterval = setInterval(async () => {
      if (this.pendingEvents.length > 0) {
        console.log(`[${this.serviceName}] Retrying ${this.pendingEvents.length} pending events`);
        await this.retryPendingEvents();
      }
    }, 30000);
  }

  async retryPendingEvents() {
    const eventsToRetry = [...this.pendingEvents];
    this.pendingEvents = [];

    for (const eventData of eventsToRetry) {
      try {
        await this.publishEvent(eventData.eventType, eventData.data, eventData.options);
        console.log(`[${this.serviceName}] Successfully retried event:`, eventData.eventType);
      } catch (error) {
        // If retry fails, put it back in pending (with retry limit)
        if (eventData.retryCount < 3) {
          eventData.retryCount = (eventData.retryCount || 0) + 1;
          this.pendingEvents.push(eventData);
          this.stats.retries++;
        } else {
          console.error(`[${this.serviceName}] Event retry limit exceeded:`, eventData.eventType);
        }
      }
    }
  }

  /**
   * Publish an event to the Event Bus Service
   */
  async publishEvent(eventType, data, options = {}) {
    const eventData = {
      eventType,
      data,
      metadata: {
        source: this.serviceName,
        correlationId: options.correlationId || uuidv4(),
        causationId: options.causationId,
        timestamp: new Date().toISOString(),
        ...options.metadata
      }
    };

    try {
      if (!this.isConnected) {
        await this.testConnection();
      }

      if (this.isConnected) {
        const response = await this.httpClient.post('/events', eventData);
        
        this.stats.published++;
        
        console.log(`[${this.serviceName}] Event published:`, {
          eventType,
          eventId: response.data.eventId,
          published: response.data.published
        });

        // Emit locally for any local handlers
        this.emit('event', { ...eventData, id: response.data.eventId });
        this.emit(eventType, { ...eventData, id: response.data.eventId });

        return response.data;
      } else {
        throw new Error('Event Bus Service not available');
      }
    } catch (error) {
      this.stats.failed++;
      
      console.error(`[${this.serviceName}] Failed to publish event:`, {
        eventType,
        error: error.message
      });

      // Store for retry if it's a network error
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        this.pendingEvents.push({
          eventType,
          data,
          options,
          retryCount: 0,
          timestamp: new Date().toISOString()
        });
        console.log(`[${this.serviceName}] Event stored for retry:`, eventType);
      }

      throw error;
    }
  }

  /**
   * Subscribe to events via WebSocket
   */
  async subscribe(eventPattern, handler) {
    this.subscriptions.set(eventPattern, handler);
    
    // Also subscribe locally
    this.on(eventPattern, handler);

    // If WebSocket is connected, subscribe immediately
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'subscribe',
        eventPattern
      }));
    }

    console.log(`[${this.serviceName}] Subscribed to event pattern:`, eventPattern);
  }

  handleIncomingEvent(event) {
    // Check if any subscription patterns match
    this.subscriptions.forEach((handler, pattern) => {
      if (this.matchesPattern(event.type, pattern)) {
        try {
          handler(event);
        } catch (error) {
          console.error(`[${this.serviceName}] Error in event handler:`, {
            eventType: event.type,
            pattern,
            error: error.message
          });
        }
      }
    });

    // Emit locally
    this.emit('event', event);
    this.emit(event.type, event);
  }

  matchesPattern(eventType, pattern) {
    if (pattern === '*') return true;
    if (pattern === eventType) return true;
    
    const patternRegex = new RegExp(pattern.replace(/\*/g, '.*'));
    return patternRegex.test(eventType);
  }

  /**
   * Auth-specific event publishers
   */
  async publishUserRegistered(userData) {
    return this.publishEvent('auth.user.registered', {
      userId: userData.id,
      email: userData.email,
      name: userData.name || userData.displayName,
      roles: userData.roles || ['user'],
      provider: userData.provider || 'email',
      emailVerified: userData.emailVerified || false,
      timestamp: new Date().toISOString()
    });
  }

  async publishUserLogin(userData, sessionData) {
    return this.publishEvent('auth.user.login', {
      userId: userData.id,
      email: userData.email,
      sessionId: sessionData.sessionId,
      ipAddress: sessionData.ipAddress,
      userAgent: sessionData.userAgent,
      timestamp: new Date().toISOString()
    });
  }

  async publishUserLogout(userId, sessionId) {
    return this.publishEvent('auth.user.logout', {
      userId,
      sessionId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      isConnected: this.isConnected,
      pendingEvents: this.pendingEvents.length,
      subscriptions: this.subscriptions.size,
      wsConnected: this.ws && this.ws.readyState === WebSocket.OPEN
    };
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      await this.testConnection();
      return {
        status: this.isConnected ? 'healthy' : 'degraded',
        eventBusService: this.isConnected,
        stats: this.getStats()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        stats: this.getStats()
      };
    }
  }

  /**
   * Cleanup
   */
  async close() {
    if (this.retryInterval) {
      clearInterval(this.retryInterval);
    }
    
    if (this.ws) {
      this.ws.close();
    }
    
    console.log(`[${this.serviceName}] Event Bus closed`);
  }
}

module.exports = AuthServiceEventBus;
