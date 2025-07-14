/**
 * Materialized Views for CQRS Pattern
 * Provides optimized read models for queries
 */

class MaterializedViews {
  constructor(eventStore) {
    this.eventStore = eventStore;
    this.views = new Map();
    this.setupViews();
    this.isRebuilding = false;
  }

  /**
   * Setup all materialized views
   */
  setupViews() {
    // User Profile View
    this.views.users = new Map();
    
    // Post View
    this.views.posts = new Map();
    
    // Comment View
    this.views.comments = new Map();
    
    // Vote View
    this.views.votes = new Map();
    
    // Link Scan View
    this.views.linkScans = new Map();
    
    // Conversation View
    this.views.conversations = new Map();
    
    // Message View
    this.views.messages = new Map();
    
    // News View
    this.views.news = new Map();
    
    // Alert View
    this.views.alerts = new Map();
    
    // Audit Log View
    this.views.auditLog = new Map();

    console.log('✅ Materialized Views initialized');
  }

  /**
   * Rebuild all views from events
   */
  async rebuildViews() {
    if (this.isRebuilding) {
      console.log('⚠️ Views are already being rebuilt');
      return;
    }

    this.isRebuilding = true;
    console.log('🔄 Starting view rebuild...');

    try {
      // Clear all views
      this.setupViews();

      // Read all events and rebuild views
      const events = await this.eventStore.readEvents('*', 0);
      
      console.log(`📖 Processing ${events.length} events...`);
      
      for (const event of events) {
        await this.applyEvent(event);
      }

      console.log('✅ View rebuild completed');
    } catch (error) {
      console.error('❌ View rebuild failed:', error);
      throw error;
    } finally {
      this.isRebuilding = false;
    }
  }

  /**
   * Apply a single event to all views
   */
  async applyEvent(event) {
    try {
      switch (event.type) {
        case 'user:created':
          await this.applyUserCreated(event);
          break;
          
        case 'user:profile_updated':
          await this.applyUserProfileUpdated(event);
          break;
          
        case 'community:post_created':
          await this.applyPostCreated(event);
          break;
          
        case 'community:post_updated':
          await this.applyPostUpdated(event);
          break;
          
        case 'community:post_deleted':
          await this.applyPostDeleted(event);
          break;
          
        case 'community:comment_created':
          await this.applyCommentCreated(event);
          break;
          
        case 'community:comment_updated':
          await this.applyCommentUpdated(event);
          break;
          
        case 'community:comment_deleted':
          await this.applyCommentDeleted(event);
          break;
          
        case 'community:post_voted':
          await this.applyPostVoted(event);
          break;
          
        case 'link:scan_requested':
          await this.applyLinkScanRequested(event);
          break;
          
        case 'link:scan_completed':
          await this.applyLinkScanCompleted(event);
          break;
          
        case 'chat:message_sent':
          await this.applyMessageSent(event);
          break;
          
        case 'chat:ai_response_generated':
          await this.applyAIResponse(event);
          break;
          
        case 'news:article_published':
          await this.applyNewsArticlePublished(event);
          break;
          
        case 'admin:action_performed':
          await this.applyAdminAction(event);
          break;
          
        case 'system:alert_created':
          await this.applySystemAlert(event);
          break;
          
        default:
          console.log(`⚠️ Unknown event type: ${event.type}`);
      }
    } catch (error) {
      console.error(`❌ Error applying event ${event.type}:`, error);
    }
  }

  /**
   * Apply user created event
   */
  async applyUserCreated(event) {
    const user = {
      ...event.data,
      lastActivity: event.data.createdAt,
      posts: [],
      comments: [],
      votes: []
    };
    
    this.views.users.set(event.data.userId, user);
  }

  /**
   * Apply user profile updated event
   */
  async applyUserProfileUpdated(event) {
    const user = this.views.users.get(event.data.userId);
    if (user) {
      Object.assign(user, event.data.updates);
      user.lastActivity = event.data.updatedAt;
    }
  }

  /**
   * Apply post created event
   */
  async applyPostCreated(event) {
    const post = {
      ...event.data,
      comments: [],
      votes: [],
      commentCount: 0,
      voteCount: 0
    };
    
    this.views.posts.set(event.data.postId, post);
    
    // Update user's posts
    const user = this.views.users.get(event.data.userId);
    if (user) {
      user.posts.push(event.data.postId);
    }
  }

  /**
   * Apply post updated event
   */
  async applyPostUpdated(event) {
    const post = this.views.posts.get(event.data.postId);
    if (post) {
      Object.assign(post, event.data.updates);
    }
  }

  /**
   * Apply post deleted event
   */
  async applyPostDeleted(event) {
    this.views.posts.delete(event.data.postId);
    
    // Remove from user's posts
    const user = this.views.users.get(event.data.userId);
    if (user) {
      user.posts = user.posts.filter(postId => postId !== event.data.postId);
    }
  }

  /**
   * Apply comment created event
   */
  async applyCommentCreated(event) {
    const comment = {
      ...event.data,
      replies: []
    };
    
    this.views.comments.set(event.data.commentId, comment);
    
    // Update post's comments
    const post = this.views.posts.get(event.data.postId);
    if (post) {
      post.comments.push(event.data.commentId);
      post.commentCount = post.comments.length;
    }
    
    // Update user's comments
    const user = this.views.users.get(event.data.userId);
    if (user) {
      user.comments.push(event.data.commentId);
    }
  }

  /**
   * Apply comment updated event
   */
  async applyCommentUpdated(event) {
    const comment = this.views.comments.get(event.data.commentId);
    if (comment) {
      Object.assign(comment, event.data.updates);
    }
  }

  /**
   * Apply comment deleted event
   */
  async applyCommentDeleted(event) {
    this.views.comments.delete(event.data.commentId);
    
    // Remove from post's comments
    const post = this.views.posts.get(event.data.postId);
    if (post) {
      post.comments = post.comments.filter(commentId => commentId !== event.data.commentId);
      post.commentCount = post.comments.length;
    }
    
    // Remove from user's comments
    const user = this.views.users.get(event.data.userId);
    if (user) {
      user.comments = user.comments.filter(commentId => commentId !== event.data.commentId);
    }
  }

  /**
   * Apply post voted event
   */
  async applyPostVoted(event) {
    const vote = {
      ...event.data,
      id: `${event.data.postId}-${event.data.userId}`
    };
    
    this.views.votes.set(vote.id, vote);
    
    // Update post's votes
    const post = this.views.posts.get(event.data.postId);
    if (post) {
      post.votes.push(vote.id);
      post.voteCount = post.votes.length;
    }
    
    // Update user's votes
    const user = this.views.users.get(event.data.userId);
    if (user) {
      user.votes.push(vote.id);
    }
  }

  /**
   * Apply link scan requested event
   */
  async applyLinkScanRequested(event) {
    const scan = {
      ...event.data,
      status: 'requested',
      createdAt: event.data.requestedAt
    };
    
    this.views.linkScans.set(event.data.linkId, scan);
  }

  /**
   * Apply link scan completed event
   */
  async applyLinkScanCompleted(event) {
    const scan = this.views.linkScans.get(event.data.linkId);
    if (scan) {
      Object.assign(scan, {
        ...event.data,
        status: 'completed',
        completedAt: event.data.completedAt
      });
    }
  }

  /**
   * Apply message sent event
   */
  async applyMessageSent(event) {
    const message = {
      ...event.data,
      senderType: 'user'
    };
    
    this.views.messages.set(event.data.messageId, message);
    
    // Update conversation
    let conversation = this.views.conversations.get(event.data.conversationId);
    if (!conversation) {
      conversation = {
        id: event.data.conversationId,
        messages: [],
        participants: [event.data.userId],
        createdAt: event.data.timestamp
      };
      this.views.conversations.set(event.data.conversationId, conversation);
    }
    
    conversation.messages.push(event.data.messageId);
    conversation.lastMessageAt = event.data.timestamp;
  }

  /**
   * Apply AI response event
   */
  async applyAIResponse(event) {
    const message = {
      ...event.data,
      senderType: 'ai'
    };
    
    this.views.messages.set(event.data.messageId, message);
    
    // Update conversation
    const conversation = this.views.conversations.get(event.data.conversationId);
    if (conversation) {
      conversation.messages.push(event.data.messageId);
      conversation.lastMessageAt = event.data.timestamp;
    }
  }

  /**
   * Apply news article published event
   */
  async applyNewsArticlePublished(event) {
    const article = {
      ...event.data,
      views: 0,
      shares: 0
    };
    
    this.views.news.set(event.data.articleId, article);
  }

  /**
   * Apply admin action event
   */
  async applyAdminAction(event) {
    const action = {
      ...event.data,
      id: event.data.actionId
    };
    
    this.views.auditLog.set(event.data.actionId, action);
  }

  /**
   * Apply system alert event
   */
  async applySystemAlert(event) {
    const alert = {
      ...event.data,
      id: event.data.alertId,
      status: 'active'
    };
    
    this.views.alerts.set(event.data.alertId, alert);
  }

  /**
   * Get view by name
   */
  getView(viewName) {
    return this.views.get(viewName);
  }

  /**
   * Get all views
   */
  getAllViews() {
    return this.views;
  }

  /**
   * Get view statistics
   */
  getViewStats() {
    const stats = {};
    
    for (const [viewName, view] of this.views) {
      stats[viewName] = view.size;
    }
    
    return stats;
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const stats = this.getViewStats();
      return {
        status: 'healthy',
        type: 'materialized_views',
        stats,
        isRebuilding: this.isRebuilding
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        type: 'materialized_views',
        error: error.message
      };
    }
  }
}

module.exports = MaterializedViews; 