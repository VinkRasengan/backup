/**
 * Community Service Event Bus Client
 * Handles event-driven communication for community features
 * Based on Event-Driven Architecture patterns
 */

const axios = require('axios');
const EventSource = require('eventsource');
const WebSocket = require('ws');
const logger = require('../src/utils/logger');
const { v4: uuidv4 } = require('uuid');

class CommunityServiceEventBus {
  constructor() {
    this.serviceName = 'community-service';
    this.eventBusUrl = process.env.EVENT_BUS_SERVICE_URL || 'http://localhost:3007';
    this.subscribers = new Map();
    this.wsConnection = null;
    this.sseConnection = null;
    this.connected = false;
    this.retryCount = 0;
    this.maxRetries = 5;
    this.retryDelay = 1000;
    this.eventQueue = []; // For offline event storage
  }

  /**
   * Initialize event bus connection and subscriptions
   */
  async initialize() {
    try {
      await this.healthCheck();
      await this.setupSubscriptions();
      
      this.connected = true;
      logger.info('Community Service Event Bus initialized successfully');
      
      // Process any queued events
      await this.processQueuedEvents();
      
    } catch (error) {
      logger.error('Failed to initialize Community Service Event Bus', {
        error: error.message,
        eventBusUrl: this.eventBusUrl
      });
      
      this.scheduleRetry();
    }
  }

  /**
   * Health check for Event Bus Service
   */
  async healthCheck() {
    try {
      const response = await axios.get(`${this.eventBusUrl}/health`, {
        timeout: 5000
      });
      
      if (response.status === 200) {
        logger.info('Event Bus Service is healthy');
        return true;
      }
      
      throw new Error(`Event Bus Service unhealthy: ${response.status}`);
      
    } catch (error) {
      logger.warn('Event Bus Service health check failed', {
        error: error.message,
        url: this.eventBusUrl
      });
      throw error;
    }
  }

  /**
   * Publish event to Event Bus
   */
  async publish(eventType, data, metadata = {}) {
    try {
      const eventPayload = {
        eventType,
        data,
        metadata: {
          ...metadata,
          source: this.serviceName,
          timestamp: new Date().toISOString(),
          version: '1.0',
          correlationId: metadata.correlationId || this.generateCorrelationId()
        }
      };

      const response = await axios.post(`${this.eventBusUrl}/events`, eventPayload, {
        headers: {
          'Content-Type': 'application/json',
          'x-service-name': this.serviceName,
          'x-correlation-id': eventPayload.metadata.correlationId
        },
        timeout: 10000
      });

      logger.info('Event published successfully', {
        eventType,
        eventId: response.data.eventId,
        correlationId: eventPayload.metadata.correlationId
      });

      return response.data;

    } catch (error) {
      logger.error('Failed to publish event', {
        eventType,
        error: error.message,
        data: JSON.stringify(data)
      });

      // Queue event for retry if Event Bus is unavailable
      if (!this.connected) {
        this.eventQueue.push({ eventType, data, metadata });
        logger.info('Event queued for retry', { eventType });
      }
      
      throw error;
    }
  }

  /**
   * Subscribe to events using Server-Sent Events
   */
  subscribeSSE(eventPattern, handler) {
    try {
      const url = `${this.eventBusUrl}/events/stream?eventPattern=${encodeURIComponent(eventPattern)}`;
      
      this.sseConnection = new EventSource(url, {
        headers: {
          'x-service-name': this.serviceName
        }
      });

      this.sseConnection.onmessage = (event) => {
        try {
          const eventData = JSON.parse(event.data);
          
          if (eventData.type !== 'connection') {
            logger.debug('Received event via SSE', {
              eventType: eventData.type,
              source: eventData.source
            });
            
            handler(eventData);
          }
        } catch (error) {
          logger.error('Error processing SSE event', {
            error: error.message,
            eventData: event.data
          });
        }
      };

      this.sseConnection.onerror = (error) => {
        logger.error('SSE connection error', {
          error: error.message,
          eventPattern
        });
        
        this.scheduleRetry();
      };

      logger.info('SSE subscription established', { eventPattern });
      return this.sseConnection;

    } catch (error) {
      logger.error('Failed to establish SSE subscription', {
        error: error.message,
        eventPattern
      });
      throw error;
    }
  }

  /**
   * Setup event subscriptions for community service
   */
  async setupSubscriptions() {
    // Subscribe to events that community service should handle
    const communityEventPatterns = [
      'auth.user.registered',           // New user joined
      'auth.user.profile.updated',      // User profile changed
      'auth.user.account.suspended',    // User suspended
      'link.analysis.completed',        // Link analysis results
      'link.threat.detected',           // Threat detected in shared link
      'community.post.created',         // New post created
      'community.comment.created',      // New comment created
      'community.vote.cast',            // Vote cast on post/comment
      'community.report.submitted',     // Content reported
      'admin.content.moderated'         // Content moderation action
    ];

    for (const pattern of communityEventPatterns) {
      this.subscribeSSE(pattern, this.handleCommunityEvent.bind(this));
    }

    logger.info('Community service event subscriptions established', {
      patterns: communityEventPatterns
    });
  }

  /**
   * Handle community-related events
   */
  async handleCommunityEvent(event) {
    try {
      logger.info('Processing community event', {
        eventType: event.type,
        source: event.source,
        correlationId: event.metadata?.correlationId
      });

      switch (event.type) {
        case 'auth.user.registered':
          await this.handleUserRegistered(event);
          break;
          
        case 'auth.user.profile.updated':
          await this.handleUserProfileUpdated(event);
          break;
          
        case 'auth.user.account.suspended':
          await this.handleUserSuspended(event);
          break;
          
        case 'link.analysis.completed':
          await this.handleLinkAnalysisCompleted(event);
          break;
          
        case 'link.threat.detected':
          await this.handleThreatDetected(event);
          break;
          
        case 'community.post.created':
          await this.handlePostCreated(event);
          break;
          
        case 'community.comment.created':
          await this.handleCommentCreated(event);
          break;
          
        case 'community.vote.cast':
          await this.handleVoteCast(event);
          break;
          
        case 'community.report.submitted':
          await this.handleReportSubmitted(event);
          break;
          
        case 'admin.content.moderated':
          await this.handleContentModerated(event);
          break;
          
        default:
          logger.warn('Unknown community event type', { eventType: event.type });
      }

    } catch (error) {
      logger.error('Error handling community event', {
        eventType: event.type,
        error: error.message,
        correlationId: event.metadata?.correlationId
      });

      // Publish error event
      await this.publish('community.event.error', {
        originalEvent: event.type,
        error: error.message,
        correlationId: event.metadata?.correlationId
      });
    }
  }

  /**
   * Handle user registered event
   */
  async handleUserRegistered(event) {
    const { userId, email, name } = event.data;
    const correlationId = event.metadata?.correlationId;

    try {
      logger.info('Creating community profile for new user', {
        userId,
        email,
        correlationId
      });

      // Create community profile for new user
      const communityProfile = await this.createCommunityProfile({
        userId,
        email,
        displayName: name,
        reputation: 0,
        badges: [],
        joinedAt: new Date().toISOString(),
        isActive: true
      });

      // Publish community profile created event
      await this.publish('community.profile.created', {
        userId,
        profileId: communityProfile.id,
        displayName: name,
        reputation: 0
      }, { correlationId });

      logger.info('Community profile created for new user', {
        userId,
        profileId: communityProfile.id,
        correlationId
      });

    } catch (error) {
      logger.error('Error creating community profile', {
        userId,
        error: error.message,
        correlationId
      });
    }
  }

  /**
   * Handle user profile updated event
   */
  async handleUserProfileUpdated(event) {
    const { userId, changes } = event.data;
    const correlationId = event.metadata?.correlationId;

    try {
      logger.info('Updating community profile', {
        userId,
        changes: Object.keys(changes),
        correlationId
      });

      // Update community profile with relevant changes
      const relevantChanges = {};
      if (changes.name) relevantChanges.displayName = changes.name;
      if (changes.avatar) relevantChanges.avatar = changes.avatar;

      if (Object.keys(relevantChanges).length > 0) {
        await this.updateCommunityProfile(userId, relevantChanges);

        // Publish community profile updated event
        await this.publish('community.profile.updated', {
          userId,
          changes: relevantChanges
        }, { correlationId });
      }

      logger.info('Community profile updated', {
        userId,
        correlationId
      });

    } catch (error) {
      logger.error('Error updating community profile', {
        userId,
        error: error.message,
        correlationId
      });
    }
  }

  /**
   * Process queued events when connection is restored
   */
  async processQueuedEvents() {
    if (this.eventQueue.length === 0) return;

    logger.info('Processing queued events', { count: this.eventQueue.length });

    const events = [...this.eventQueue];
    this.eventQueue = [];

    for (const event of events) {
      try {
        await this.publish(event.eventType, event.data, event.metadata);
      } catch (error) {
        logger.error('Failed to process queued event', {
          eventType: event.eventType,
          error: error.message
        });
        // Re-queue failed events
        this.eventQueue.push(event);
      }
    }
  }

  /**
   * Schedule retry for failed connections
   */
  scheduleRetry() {
    if (this.retryCount >= this.maxRetries) {
      logger.error('Max retries exceeded for Event Bus connection');
      return;
    }

    this.retryCount++;
    const delay = this.retryDelay * Math.pow(2, this.retryCount - 1);

    logger.info('Scheduling Event Bus reconnection', {
      retryCount: this.retryCount,
      delay
    });

    setTimeout(() => {
      this.initialize();
    }, delay);
  }

  /**
   * Generate correlation ID for event tracking
   */
  generateCorrelationId() {
    return `community_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Close all connections
   */
  async close() {
    logger.info('Closing Community Service Event Bus connections');

    if (this.sseConnection) {
      this.sseConnection.close();
    }

    if (this.wsConnection) {
      this.wsConnection.close();
    }

    this.connected = false;
  }

  // Placeholder methods for community-specific operations
  // These should be implemented based on your existing community service logic

  async createCommunityProfile(profileData) {
    // Implement community profile creation
    // Return created profile with ID
    return { id: uuidv4(), ...profileData };
  }

  async updateCommunityProfile(userId, changes) {
    // Implement community profile update
    logger.info('Community profile update placeholder', { userId, changes });
  }

  async handlePostCreated(event) {
    // Handle post creation events
    logger.info('Post created event placeholder', { event: event.type });
  }

  async handleCommentCreated(event) {
    // Handle comment creation events
    logger.info('Comment created event placeholder', { event: event.type });
  }

  async handleVoteCast(event) {
    // Handle vote casting events
    logger.info('Vote cast event placeholder', { event: event.type });
  }

  async handleReportSubmitted(event) {
    // Handle content report events
    logger.info('Report submitted event placeholder', { event: event.type });
  }

  async handleContentModerated(event) {
    // Handle content moderation events
    logger.info('Content moderated event placeholder', { event: event.type });
  }

  async handleUserSuspended(event) {
    // Handle user suspension events
    logger.info('User suspended event placeholder', { event: event.type });
  }

  async handleLinkAnalysisCompleted(event) {
    // Handle link analysis completion
    logger.info('Link analysis completed event placeholder', { event: event.type });
  }

  async handleThreatDetected(event) {
    // Handle threat detection in shared links
    logger.info('Threat detected event placeholder', { event: event.type });
  }
}

module.exports = CommunityServiceEventBus;
