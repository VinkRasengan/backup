/**
 * Link Service Event Handler
 * Handles event-driven communication for link service
 */

const EventBus = require('../../../shared/eventBus/eventBus');
const { EventTypes, EventHelpers } = require('../../../shared/eventBus/eventTypes');

class LinkEventHandler {
  constructor() {
    this.eventBus = new EventBus({
      serviceName: 'link-service'
    });

    this.setupEventListeners();
    this.initializeSubscriptions();
  }

  /**
   * Setup event bus listeners
   */
  setupEventListeners() {
    this.eventBus.on('connected', () => {
      console.log('Link service connected to event bus');
    });

    this.eventBus.on('error', (error) => {
      console.error('Event bus error in link service', { error: error.message });
    });

    this.eventBus.on('messageReceived', (event) => {
      console.log('Event received in link service', { 
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
      // Subscribe to user events
      await this.eventBus.subscribeToUserEvents(this.handleUserEvent.bind(this));
      
      // Subscribe to auth events
      await this.eventBus.subscribeToAuthEvents(this.handleAuthEvent.bind(this));
      
      // Subscribe to system events
      await this.eventBus.subscribeToSystemEvents(this.handleSystemEvent.bind(this));

      console.log('Link service event subscriptions initialized');
    } catch (error) {
      console.error('Failed to initialize event subscriptions', { error: error.message });
    }
  }

  /**
   * Handle user events
   */
  async handleUserEvent(event) {
    try {
      switch (event.type) {
        case EventTypes.USER.CREATED:
          await this.handleUserCreated(event.data);
          break;
        
        case EventTypes.USER.UPDATED:
          await this.handleUserUpdated(event.data);
          break;
        
        default:
          console.log('Unhandled user event', { type: event.type });
      }
    } catch (error) {
      console.error('Error handling user event', { 
        eventType: event.type, 
        error: error.message 
      });
    }
  }

  /**
   * Handle auth events
   */
  async handleAuthEvent(event) {
    try {
      switch (event.type) {
        case EventTypes.AUTH.LOGIN:
          await this.handleUserLogin(event.data);
          break;
        
        case EventTypes.AUTH.LOGOUT:
          await this.handleUserLogout(event.data);
          break;
        
        default:
          console.log('Unhandled auth event', { type: event.type });
      }
    } catch (error) {
      console.error('Error handling auth event', { 
        eventType: event.type, 
        error: error.message 
      });
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
        
        default:
          console.log('Unhandled system event', { type: event.type });
      }
    } catch (error) {
      console.error('Error handling system event', { 
        eventType: event.type, 
        error: error.message 
      });
    }
  }

  /**
   * Publish link scan requested event
   */
  async publishLinkScanRequestedEvent(linkData) {
    try {
      console.log('🔥 Publishing link scan requested event', { 
        url: linkData.url,
        userId: linkData.userId,
        scanType: linkData.scanType
      });
      
      await this.eventBus.publishLinkEvent('scan_requested', {
        url: linkData.url,
        userId: linkData.userId,
        userEmail: linkData.userEmail,
        scanType: linkData.scanType || 'full',
        priority: linkData.priority || 'normal',
        requestId: linkData.requestId,
        timestamp: new Date().toISOString()
      });
      
      console.log('✅ Link scan requested event published successfully', { url: linkData.url });
    } catch (error) {
      console.error('❌ Failed to publish link scan requested event', { 
        error: error.message,
        url: linkData.url 
      });
    }
  }

  /**
   * Publish link scan completed event
   */
  async publishLinkScanCompletedEvent(scanResult) {
    try {
      console.log('🔥 Publishing link scan completed event', { 
        url: scanResult.url,
        safetyScore: scanResult.safetyScore,
        threatCount: scanResult.threats?.length || 0
      });
      
      await this.eventBus.publishLinkEvent('scan_completed', {
        url: scanResult.url,
        linkId: scanResult.linkId,
        safetyScore: scanResult.safetyScore,
        riskLevel: scanResult.riskLevel,
        threats: scanResult.threats || [],
        securityScores: scanResult.securityScores || {},
        scanDuration: scanResult.scanDuration,
        scanType: scanResult.scanType,
        timestamp: new Date().toISOString()
      });
      
      console.log('✅ Link scan completed event published successfully', { 
        url: scanResult.url,
        safetyScore: scanResult.safetyScore 
      });
    } catch (error) {
      console.error('❌ Failed to publish link scan completed event', { 
        error: error.message,
        url: scanResult.url 
      });
    }
  }

  /**
   * Publish threat detected event
   */
  async publishThreatDetectedEvent(threatData) {
    try {
      console.log('🔥 Publishing threat detected event', { 
        url: threatData.url,
        threatType: threatData.threatType,
        severity: threatData.severity
      });
      
      await this.eventBus.publishLinkEvent('threat_detected', {
        url: threatData.url,
        linkId: threatData.linkId,
        threatType: threatData.threatType,
        severity: threatData.severity,
        description: threatData.description,
        source: threatData.source,
        confidence: threatData.confidence,
        details: threatData.details || {},
        timestamp: new Date().toISOString()
      });
      
      console.log('✅ Threat detected event published successfully', { 
        url: threatData.url,
        threatType: threatData.threatType 
      });
    } catch (error) {
      console.error('❌ Failed to publish threat detected event', { 
        error: error.message,
        url: threatData.url 
      });
    }
  }

  /**
   * Publish link verified event
   */
  async publishLinkVerifiedEvent(verificationData) {
    try {
      console.log('🔥 Publishing link verified event', { 
        url: verificationData.url,
        verificationStatus: verificationData.status
      });
      
      await this.eventBus.publishLinkEvent('link_verified', {
        url: verificationData.url,
        linkId: verificationData.linkId,
        status: verificationData.status, // 'verified', 'suspicious', 'malicious'
        verifiedBy: verificationData.verifiedBy,
        verificationMethod: verificationData.method,
        confidence: verificationData.confidence,
        notes: verificationData.notes,
        timestamp: new Date().toISOString()
      });
      
      console.log('✅ Link verified event published successfully', { 
        url: verificationData.url,
        status: verificationData.status 
      });
    } catch (error) {
      console.error('❌ Failed to publish link verified event', { 
        error: error.message,
        url: verificationData.url 
      });
    }
  }

  /**
   * Publish security analysis event
   */
  async publishSecurityAnalysisEvent(analysisData) {
    try {
      console.log('🔥 Publishing security analysis event', { 
        url: analysisData.url,
        analysisType: analysisData.analysisType
      });
      
      await this.eventBus.publishLinkEvent('security_analysis', {
        url: analysisData.url,
        linkId: analysisData.linkId,
        analysisType: analysisData.analysisType, // 'virus_total', 'phish_tank', 'criminal_ip'
        results: analysisData.results,
        score: analysisData.score,
        recommendations: analysisData.recommendations || [],
        timestamp: new Date().toISOString()
      });
      
      console.log('✅ Security analysis event published successfully', { 
        url: analysisData.url,
        analysisType: analysisData.analysisType 
      });
    } catch (error) {
      console.error('❌ Failed to publish security analysis event', { 
        error: error.message,
        url: analysisData.url 
      });
    }
  }

  /**
   * Event handler implementations
   */
  async handleUserCreated(data) {
    console.log('User created in link service', data);
    // Could implement user scan history initialization
  }

  async handleUserUpdated(data) {
    console.log('User updated in link service', data);
    // Could implement user profile updates
  }

  async handleUserLogin(data) {
    console.log('User logged in - link service notified', data);
    // Could implement user activity tracking
  }

  async handleUserLogout(data) {
    console.log('User logged out - link service notified', data);
    // Could implement session cleanup
  }

  async handleServiceHealthChange(data) {
    console.log('Service health changed', data);
    // Could implement health monitoring
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

module.exports = LinkEventHandler;
