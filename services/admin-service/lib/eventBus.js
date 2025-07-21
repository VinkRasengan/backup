/**
 * Admin Service Event Bus Client
 * Handles event-driven communication for administrative functions and moderation
 * Based on Event-Driven Architecture patterns
 */

const axios = require('axios');
const EventSource = require('eventsource');
const WebSocket = require('ws');
const logger = require('../src/utils/logger');
const { v4: uuidv4 } = require('uuid');

// Load environment variables from root .env
require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });

class AdminServiceEventBus {
  constructor() {
    this.serviceName = 'admin-service';
    this.eventBusUrl = process.env.EVENT_BUS_SERVICE_URL || 'http://localhost:3007';
    this.subscribers = new Map();
    this.wsConnection = null;
    this.sseConnection = null;
    this.connected = false;
    this.retryCount = 0;
    this.maxRetries = 5;
    this.retryDelay = 1000;
    this.eventQueue = []; // For offline event storage
    this.moderationQueue = new Map(); // Track ongoing moderation actions
  }

  /**
   * Initialize event bus connection and subscriptions
   */
  async initialize() {
    try {
      await this.healthCheck();
      await this.setupSubscriptions();
      
      this.connected = true;
      logger.info('Admin Service Event Bus initialized successfully');
      
      // Process any queued events
      await this.processQueuedEvents();
      
    } catch (error) {
      logger.error('Failed to initialize Admin Service Event Bus', {
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
   * Setup event subscriptions for admin service
   */
  async setupSubscriptions() {
    // Subscribe to events that admin service should handle
    const adminEventPatterns = [
      'auth.user.registered',           // New user registrations
      'community.report.submitted',     // Content reports
      'community.post.created',         // New posts for moderation
      'community.comment.created',      // New comments for moderation
      'link.threat.detected',           // Security threats
      'link.analysis.completed',        // Link analysis results
      'auth.user.login',               // User login events for monitoring
      'system.alert.triggered',        // System alerts
      'admin.action.requested'          // Admin action requests
    ];

    for (const pattern of adminEventPatterns) {
      this.subscribeSSE(pattern, this.handleAdminEvent.bind(this));
    }

    logger.info('Admin service event subscriptions established', {
      patterns: adminEventPatterns
    });
  }

  /**
   * Handle admin-related events
   */
  async handleAdminEvent(event) {
    try {
      logger.info('Processing admin event', {
        eventType: event.type,
        source: event.source,
        correlationId: event.metadata?.correlationId
      });

      switch (event.type) {
        case 'auth.user.registered':
          await this.handleUserRegistered(event);
          break;
          
        case 'community.report.submitted':
          await this.handleContentReportSubmitted(event);
          break;
          
        case 'community.post.created':
          await this.handlePostCreated(event);
          break;
          
        case 'community.comment.created':
          await this.handleCommentCreated(event);
          break;
          
        case 'link.threat.detected':
          await this.handleThreatDetected(event);
          break;
          
        case 'link.analysis.completed':
          await this.handleLinkAnalysisCompleted(event);
          break;
          
        case 'auth.user.login':
          await this.handleUserLogin(event);
          break;
          
        case 'system.alert.triggered':
          await this.handleSystemAlert(event);
          break;
          
        case 'admin.action.requested':
          await this.handleAdminActionRequested(event);
          break;
          
        default:
          logger.warn('Unknown admin event type', { eventType: event.type });
      }

    } catch (error) {
      logger.error('Error handling admin event', {
        eventType: event.type,
        error: error.message,
        correlationId: event.metadata?.correlationId
      });

      // Publish error event
      await this.publish('admin.event.error', {
        originalEvent: event.type,
        error: error.message,
        correlationId: event.metadata?.correlationId
      });
    }
  }

  /**
   * Handle user registered event - for user management
   */
  async handleUserRegistered(event) {
    const { userId, email, name, provider } = event.data;
    const correlationId = event.metadata?.correlationId;

    try {
      logger.info('Processing new user registration for admin tracking', {
        userId,
        email,
        provider,
        correlationId
      });

      // Create admin tracking record for new user
      await this.createUserAdminRecord({
        userId,
        email,
        name,
        provider,
        registeredAt: new Date().toISOString(),
        status: 'active',
        riskLevel: 'low',
        notes: []
      });

      // Check for suspicious patterns
      const suspiciousPatterns = await this.checkSuspiciousRegistration(email, provider);
      if (suspiciousPatterns.length > 0) {
        await this.publish('admin.user.flagged', {
          userId,
          email,
          reason: 'suspicious_registration_pattern',
          patterns: suspiciousPatterns,
          severity: 'medium'
        }, { correlationId });
      }

      logger.info('User admin record created', {
        userId,
        correlationId
      });

    } catch (error) {
      logger.error('Error handling user registered event', {
        userId,
        error: error.message,
        correlationId
      });
    }
  }

  /**
   * Handle content report submitted event
   */
  async handleContentReportSubmitted(event) {
    const { reportId, entityId, entityType, reportType, reportedBy } = event.data;
    const correlationId = event.metadata?.correlationId;

    try {
      logger.info('Processing content report for moderation queue', {
        reportId,
        entityId,
        entityType,
        reportType,
        correlationId
      });

      // Add to moderation queue
      const moderationId = uuidv4();
      this.moderationQueue.set(moderationId, {
        reportId,
        entityId,
        entityType,
        reportType,
        reportedBy,
        status: 'pending',
        priority: this.calculateModerationPriority(reportType, entityType),
        createdAt: new Date().toISOString()
      });

      // Notify moderators
      await this.publish('admin.moderation.queue.updated', {
        moderationId,
        reportId,
        entityId,
        entityType,
        priority: this.calculateModerationPriority(reportType, entityType),
        action: 'added'
      }, { correlationId });

      // Auto-moderate if possible
      if (await this.canAutoModerate(reportType, entityType)) {
        await this.performAutoModeration(moderationId, event.data);
      }

      logger.info('Content report added to moderation queue', {
        reportId,
        moderationId,
        correlationId
      });

    } catch (error) {
      logger.error('Error handling content report', {
        reportId,
        error: error.message,
        correlationId
      });
    }
  }

  /**
   * Handle threat detected event
   */
  async handleThreatDetected(event) {
    const { linkId, url, threatType, severity } = event.data;
    const correlationId = event.metadata?.correlationId;

    try {
      logger.info('Processing threat detection for admin action', {
        linkId,
        url,
        threatType,
        severity,
        correlationId
      });

      // Create security incident record
      const incidentId = uuidv4();
      await this.createSecurityIncident({
        incidentId,
        linkId,
        url,
        threatType,
        severity,
        status: 'open',
        createdAt: new Date().toISOString()
      });

      // Auto-block high severity threats
      if (severity === 'critical' || severity === 'high') {
        await this.publish('admin.link.blacklist.requested', {
          linkId,
          url,
          reason: `Auto-blocked due to ${threatType} threat (${severity})`,
          requestedBy: 'system',
          automatic: true
        }, { correlationId });
      }

      // Notify security team
      await this.publish('admin.security.alert', {
        incidentId,
        alertType: 'threat_detected',
        severity,
        details: {
          linkId,
          url,
          threatType
        }
      }, { correlationId });

      logger.info('Threat detection processed', {
        incidentId,
        linkId,
        severity,
        correlationId
      });

    } catch (error) {
      logger.error('Error handling threat detection', {
        linkId,
        error: error.message,
        correlationId
      });
    }
  }

  // Placeholder methods for admin-specific operations
  // These should be implemented based on your actual admin service requirements

  async createUserAdminRecord(userData) {
    // Implement user admin record creation
    logger.info('Creating user admin record', { userId: userData.userId });
  }

  async checkSuspiciousRegistration(email, provider) {
    // Implement suspicious pattern detection
    // Return array of detected patterns
    return [];
  }

  calculateModerationPriority(reportType, entityType) {
    // Calculate priority based on report and entity type
    const priorities = {
      'misinformation': 'high',
      'harassment': 'high',
      'spam': 'medium',
      'inappropriate': 'medium',
      'other': 'low'
    };
    
    return priorities[reportType] || 'low';
  }

  async canAutoModerate(reportType, entityType) {
    // Determine if content can be auto-moderated
    return reportType === 'spam' && entityType === 'comment';
  }

  async performAutoModeration(moderationId, reportData) {
    // Perform automatic moderation
    logger.info('Performing auto-moderation', { moderationId });
  }

  async createSecurityIncident(incidentData) {
    // Create security incident record
    logger.info('Creating security incident', { incidentId: incidentData.incidentId });
  }

  async handlePostCreated(event) {
    // Handle post creation for moderation
    logger.info('Post created event for moderation', { postId: event.data.postId });
  }

  async handleCommentCreated(event) {
    // Handle comment creation for moderation
    logger.info('Comment created event for moderation', { commentId: event.data.commentId });
  }

  async handleLinkAnalysisCompleted(event) {
    // Handle link analysis completion
    logger.info('Link analysis completed event', { linkId: event.data.linkId });
  }

  async handleUserLogin(event) {
    // Handle user login for monitoring
    logger.info('User login event for monitoring', { userId: event.data.userId });
  }

  async handleSystemAlert(event) {
    // Handle system alerts
    logger.info('System alert event', { alertType: event.data.alertType });
  }

  async handleAdminActionRequested(event) {
    // Handle admin action requests
    logger.info('Admin action requested event', { action: event.data.action });
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
    return `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get moderation queue status
   */
  getModerationQueueStatus() {
    return {
      pending: this.moderationQueue.size,
      items: Array.from(this.moderationQueue.entries()).map(([moderationId, data]) => ({
        moderationId,
        ...data
      }))
    };
  }

  /**
   * Close all connections
   */
  async close() {
    logger.info('Closing Admin Service Event Bus connections');

    if (this.sseConnection) {
      this.sseConnection.close();
    }

    if (this.wsConnection) {
      this.wsConnection.close();
    }

    this.connected = false;
  }
}

module.exports = AdminServiceEventBus;
