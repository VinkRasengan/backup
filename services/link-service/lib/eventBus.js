/**
 * Link Service Event Bus Client
 * Handles event-driven communication for link analysis and security scanning
 * Based on Event-Driven Architecture patterns
 */

const axios = require('axios');
const EventSource = require('eventsource');
const WebSocket = require('ws');
const logger = require('../src/utils/logger');
const { v4: uuidv4 } = require('uuid');

// Load environment variables from root .env
require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });

class LinkServiceEventBus {
  constructor() {
    this.serviceName = 'link-service';
    this.eventBusUrl = process.env.EVENT_BUS_SERVICE_URL || 'http://localhost:3007';
    this.subscribers = new Map();
    this.wsConnection = null;
    this.sseConnection = null;
    this.connected = false;
    this.retryCount = 0;
    this.maxRetries = 5;
    this.retryDelay = 1000;
    this.eventQueue = []; // For offline event storage
    this.analysisQueue = new Map(); // Track ongoing analyses
  }

  /**
   * Initialize event bus connection and subscriptions
   */
  async initialize() {
    try {
      await this.healthCheck();
      await this.setupSubscriptions();
      
      this.connected = true;
      logger.info('Link Service Event Bus initialized successfully');
      
      // Process any queued events
      await this.processQueuedEvents();
      
    } catch (error) {
      logger.error('Failed to initialize Link Service Event Bus', {
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
   * Setup event subscriptions for link service
   */
  async setupSubscriptions() {
    // Subscribe to events that link service should handle
    const linkEventPatterns = [
      'link.analysis.requested',        // Link analysis requests
      'community.post.created',         // New posts with potential links
      'community.comment.created',      // New comments with potential links
      'link.report.submitted',          // User reports about links
      'admin.link.whitelist.requested', // Admin whitelist requests
      'admin.link.blacklist.requested'  // Admin blacklist requests
    ];

    for (const pattern of linkEventPatterns) {
      this.subscribeSSE(pattern, this.handleLinkEvent.bind(this));
    }

    logger.info('Link service event subscriptions established', {
      patterns: linkEventPatterns
    });
  }

  /**
   * Handle link-related events
   */
  async handleLinkEvent(event) {
    try {
      logger.info('Processing link event', {
        eventType: event.type,
        source: event.source,
        correlationId: event.metadata?.correlationId
      });

      switch (event.type) {
        case 'link.analysis.requested':
          await this.handleLinkAnalysisRequested(event);
          break;
          
        case 'community.post.created':
          await this.handlePostCreated(event);
          break;
          
        case 'community.comment.created':
          await this.handleCommentCreated(event);
          break;
          
        case 'link.report.submitted':
          await this.handleLinkReportSubmitted(event);
          break;
          
        case 'admin.link.whitelist.requested':
          await this.handleWhitelistRequest(event);
          break;
          
        case 'admin.link.blacklist.requested':
          await this.handleBlacklistRequest(event);
          break;
          
        default:
          logger.warn('Unknown link event type', { eventType: event.type });
      }

    } catch (error) {
      logger.error('Error handling link event', {
        eventType: event.type,
        error: error.message,
        correlationId: event.metadata?.correlationId
      });

      // Publish error event
      await this.publish('link.event.error', {
        originalEvent: event.type,
        error: error.message,
        correlationId: event.metadata?.correlationId
      });
    }
  }

  /**
   * Handle link analysis request event
   */
  async handleLinkAnalysisRequested(event) {
    const { linkId, url, requestedBy, priority = 'normal', analysisType = [] } = event.data;
    const correlationId = event.metadata?.correlationId;

    try {
      logger.info('Processing link analysis request', {
        linkId,
        url,
        requestedBy,
        priority,
        correlationId
      });

      // Check if analysis is already in progress
      if (this.analysisQueue.has(linkId)) {
        logger.warn('Analysis already in progress', { linkId });
        return;
      }

      // Mark analysis as started
      this.analysisQueue.set(linkId, {
        url,
        requestedBy,
        startedAt: new Date().toISOString(),
        status: 'in_progress'
      });

      // Publish analysis started event
      await this.publish('link.analysis.started', {
        linkId,
        url,
        analysisId: uuidv4(),
        estimatedDuration: this.estimateAnalysisDuration(analysisType),
        timestamp: new Date().toISOString()
      }, { correlationId });

      // Perform actual analysis (placeholder - implement your analysis logic)
      const analysisResult = await this.performLinkAnalysis(url, analysisType);

      // Publish analysis completed event
      await this.publish('link.analysis.completed', {
        linkId,
        url,
        analysisId: analysisResult.analysisId,
        result: analysisResult.result,
        analysisDetails: analysisResult.details,
        timestamp: new Date().toISOString()
      }, { correlationId });

      // Check for threats and publish if found
      if (!analysisResult.result.safe && analysisResult.result.riskScore > 70) {
        await this.publish('link.threat.detected', {
          linkId,
          url,
          threatType: this.determineThreatType(analysisResult.result),
          severity: this.determineSeverity(analysisResult.result.riskScore),
          confidence: analysisResult.result.confidence || 95,
          sources: analysisResult.details.sources || [],
          details: {
            description: `High-risk link detected with score ${analysisResult.result.riskScore}`,
            indicators: analysisResult.result.threats || []
          },
          timestamp: new Date().toISOString()
        }, { correlationId });
      }

      // Remove from analysis queue
      this.analysisQueue.delete(linkId);

      logger.info('Link analysis completed', {
        linkId,
        safe: analysisResult.result.safe,
        riskScore: analysisResult.result.riskScore,
        correlationId
      });

    } catch (error) {
      logger.error('Error processing link analysis request', {
        linkId,
        url,
        error: error.message,
        correlationId
      });

      // Remove from analysis queue on error
      this.analysisQueue.delete(linkId);

      // Publish analysis error event
      await this.publish('link.analysis.error', {
        linkId,
        url,
        error: error.message,
        timestamp: new Date().toISOString()
      }, { correlationId });
    }
  }

  /**
   * Handle post created event - extract and analyze links
   */
  async handlePostCreated(event) {
    const { postId, links = [], authorId } = event.data;
    const correlationId = event.metadata?.correlationId;

    try {
      if (links.length === 0) return;

      logger.info('Analyzing links from new post', {
        postId,
        linksCount: links.length,
        correlationId
      });

      // Request analysis for each link
      for (const url of links) {
        const linkId = uuidv4();
        
        await this.publish('link.analysis.requested', {
          linkId,
          url,
          requestedBy: authorId,
          context: {
            type: 'community_post',
            entityId: postId
          },
          priority: 'normal',
          analysisType: ['security', 'phishing', 'reputation']
        }, { correlationId });
      }

    } catch (error) {
      logger.error('Error handling post created event', {
        postId,
        error: error.message,
        correlationId
      });
    }
  }

  /**
   * Handle comment created event - extract and analyze links
   */
  async handleCommentCreated(event) {
    const { commentId, content, authorId } = event.data;
    const correlationId = event.metadata?.correlationId;

    try {
      // Extract links from comment content
      const linkRegex = /https?:\/\/[^\s]+/g;
      const links = content.match(linkRegex) || [];

      if (links.length === 0) return;

      logger.info('Analyzing links from new comment', {
        commentId,
        linksCount: links.length,
        correlationId
      });

      // Request analysis for each link
      for (const url of links) {
        const linkId = uuidv4();
        
        await this.publish('link.analysis.requested', {
          linkId,
          url,
          requestedBy: authorId,
          context: {
            type: 'community_comment',
            entityId: commentId
          },
          priority: 'high', // Comments might be more urgent
          analysisType: ['security', 'phishing', 'reputation']
        }, { correlationId });
      }

    } catch (error) {
      logger.error('Error handling comment created event', {
        commentId,
        error: error.message,
        correlationId
      });
    }
  }

  // Placeholder methods for link analysis logic
  // These should be implemented based on your actual link analysis requirements

  async performLinkAnalysis(url, analysisType) {
    // Mock implementation - replace with actual analysis logic
    const analysisId = uuidv4();
    
    // Simulate analysis delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock analysis result
    const isSuspicious = url.includes('fake') || url.includes('phishing') || url.includes('malware');
    
    return {
      analysisId,
      result: {
        safe: !isSuspicious,
        riskScore: isSuspicious ? 85 : 15,
        threats: isSuspicious ? ['phishing', 'credential_theft'] : [],
        categories: ['unknown'],
        reputation: {
          score: isSuspicious ? 20 : 80,
          sources: ['VirusTotal', 'PhishTank']
        },
        confidence: 95
      },
      details: {
        duration: 2,
        sources: ['VirusTotal', 'PhishTank', 'ScamAdviser'],
        screenshot: null
      }
    };
  }

  estimateAnalysisDuration(analysisType) {
    // Estimate based on analysis types
    const baseTime = 5; // seconds
    const typeMultipliers = {
      security: 1,
      phishing: 1.5,
      malware: 2,
      reputation: 0.5,
      screenshot: 3
    };
    
    let totalTime = baseTime;
    analysisType.forEach(type => {
      totalTime += (typeMultipliers[type] || 1) * 2;
    });
    
    return Math.min(totalTime, 30); // Cap at 30 seconds
  }

  determineThreatType(result) {
    if (result.threats.includes('phishing')) return 'phishing';
    if (result.threats.includes('malware')) return 'malware';
    if (result.threats.includes('scam')) return 'scam';
    return 'suspicious';
  }

  determineSeverity(riskScore) {
    if (riskScore >= 90) return 'critical';
    if (riskScore >= 70) return 'high';
    if (riskScore >= 40) return 'medium';
    return 'low';
  }

  async handleLinkReportSubmitted(event) {
    logger.info('Link report submitted event placeholder', { event: event.type });
  }

  async handleWhitelistRequest(event) {
    logger.info('Whitelist request event placeholder', { event: event.type });
  }

  async handleBlacklistRequest(event) {
    logger.info('Blacklist request event placeholder', { event: event.type });
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
    return `link_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get analysis queue status
   */
  getAnalysisQueueStatus() {
    return {
      inProgress: this.analysisQueue.size,
      analyses: Array.from(this.analysisQueue.entries()).map(([linkId, data]) => ({
        linkId,
        url: data.url,
        startedAt: data.startedAt,
        status: data.status
      }))
    };
  }

  /**
   * Close all connections
   */
  async close() {
    logger.info('Closing Link Service Event Bus connections');

    if (this.sseConnection) {
      this.sseConnection.close();
    }

    if (this.wsConnection) {
      this.wsConnection.close();
    }

    this.connected = false;
  }
}

module.exports = LinkServiceEventBus;
