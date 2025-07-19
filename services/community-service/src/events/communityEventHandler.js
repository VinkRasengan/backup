/**
 * Community Service Event Handler
 * Handles event-driven communication for community service
 */

const EnhancedEventBus = require('../utils/eventBus');
// Event types are now handled locally with Event Sourcing

class CommunityEventHandler {
  constructor() {
    this.eventBus = new EnhancedEventBus('community-service');

    this.setupEventListeners();
    this.initializeSubscriptions();
  }

  /**
   * Setup event bus listeners
   */
  setupEventListeners() {
    this.eventBus.on('connected', () => {
      console.log('Community service connected to event bus');
    });

    this.eventBus.on('error', (error) => {
      console.error('Event bus error in community service', { error: error.message });
    });

    this.eventBus.on('messageReceived', (event) => {
      console.log('Event received in community service', { 
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

      console.log('Community service event subscriptions initialized');
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
        case 'USER.CREATED':
          await this.handleUserCreated(event.data);
          break;
        
        case 'USER.UPDATED':
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
        case 'AUTH.LOGIN':
          await this.handleUserLogin(event.data);
          break;
        
        case 'AUTH.LOGOUT':
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
        case 'SYSTEM.SERVICE_HEALTH_CHANGED':
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
   * Publish post creation event
   */
  async publishPostCreatedEvent(postData) {
    try {
      console.log('🔥 Publishing post created event', { 
        postId: postData.id,
        userId: postData.author?.uid,
        title: postData.title
      });
      
      await this.eventBus.publishCommunityEvent('post_created', {
        postId: postData.id,
        userId: postData.author?.uid,
        userEmail: postData.author?.email,
        title: postData.title,
        content: postData.content,
        category: postData.category,
        tags: postData.tags || [],
        timestamp: new Date().toISOString()
      });
      
      console.log('✅ Post created event published successfully', { postId: postData.id });
    } catch (error) {
      console.error('❌ Failed to publish post created event', { 
        error: error.message,
        postId: postData.id 
      });
    }
  }

  /**
   * Publish post updated event
   */
  async publishPostUpdatedEvent(postId, updates, userId) {
    try {
      console.log('🔥 Publishing post updated event', { 
        postId,
        userId,
        updates: Object.keys(updates)
      });
      
      await this.eventBus.publishCommunityEvent('post_updated', {
        postId,
        userId,
        updates,
        timestamp: new Date().toISOString()
      });
      
      console.log('✅ Post updated event published successfully', { postId });
    } catch (error) {
      console.error('❌ Failed to publish post updated event', { 
        error: error.message,
        postId 
      });
    }
  }

  /**
   * Publish post deleted event
   */
  async publishPostDeletedEvent(postId, userId) {
    try {
      console.log('🔥 Publishing post deleted event', { 
        postId,
        userId
      });
      
      await this.eventBus.publishCommunityEvent('post_deleted', {
        postId,
        userId,
        timestamp: new Date().toISOString()
      });
      
      console.log('✅ Post deleted event published successfully', { postId });
    } catch (error) {
      console.error('❌ Failed to publish post deleted event', { 
        error: error.message,
        postId 
      });
    }
  }

  /**
   * Publish comment creation event
   */
  async publishCommentCreatedEvent(commentData) {
    try {
      console.log('🔥 Publishing comment created event', { 
        commentId: commentData.id,
        linkId: commentData.linkId,
        userId: commentData.author?.uid
      });
      
      await this.eventBus.publishCommunityEvent('comment_created', {
        commentId: commentData.id,
        linkId: commentData.linkId,
        userId: commentData.author?.uid,
        userEmail: commentData.author?.email,
        content: commentData.content,
        parentId: commentData.parentId,
        timestamp: new Date().toISOString()
      });
      
      console.log('✅ Comment created event published successfully', { commentId: commentData.id });
    } catch (error) {
      console.error('❌ Failed to publish comment created event', { 
        error: error.message,
        commentId: commentData.id 
      });
    }
  }

  /**
   * Publish vote event
   */
  async publishVoteEvent(voteData) {
    try {
      console.log('🔥 Publishing vote event', { 
        linkId: voteData.linkId,
        userId: voteData.userId,
        voteType: voteData.voteType,
        action: voteData.action
      });
      
      await this.eventBus.publishCommunityEvent('post_voted', {
        linkId: voteData.linkId,
        userId: voteData.userId,
        voteType: voteData.voteType,
        action: voteData.action, // 'created', 'updated', 'removed'
        previousVote: voteData.previousVote,
        timestamp: new Date().toISOString()
      });
      
      console.log('✅ Vote event published successfully', { 
        linkId: voteData.linkId,
        action: voteData.action 
      });
    } catch (error) {
      console.error('❌ Failed to publish vote event', { 
        error: error.message,
        linkId: voteData.linkId 
      });
    }
  }

  /**
   * Event handler implementations
   */
  async handleUserCreated(data) {
    console.log('User created in community service', data);
    // Could implement user profile initialization
  }

  async handleUserUpdated(data) {
    console.log('User updated in community service', data);
    // Could implement user profile updates
  }

  async handleUserLogin(data) {
    console.log('User logged in - community service notified', data);
    // Could implement user activity tracking
  }

  async handleUserLogout(data) {
    console.log('User logged out - community service notified', data);
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

module.exports = CommunityEventHandler;
