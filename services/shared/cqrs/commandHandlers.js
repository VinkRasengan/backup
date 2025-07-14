/**
 * Command Handlers for CQRS Pattern
 * Handles write operations and generates events
 */

const { v4: uuidv4 } = require('uuid');

class CommandHandlers {
  constructor(eventStore) {
    this.eventStore = eventStore;
  }

  /**
   * Handle user registration command
   */
  async handleCreateUser(command) {
    const event = {
      type: 'user:created',
      data: {
        userId: command.userId || uuidv4(),
        email: command.email,
        name: command.name,
        roles: command.roles || ['user'],
        createdAt: new Date().toISOString()
      }
    };
    
    await this.eventStore.appendEvent(event);
    return { success: true, userId: event.data.userId };
  }

  /**
   * Handle user profile update command
   */
  async handleUpdateUserProfile(command) {
    const event = {
      type: 'user:profile_updated',
      data: {
        userId: command.userId,
        updates: command.updates,
        updatedAt: new Date().toISOString()
      }
    };
    
    await this.eventStore.appendEvent(event);
    return { success: true, userId: command.userId };
  }

  /**
   * Handle user login command
   */
  async handleUserLogin(command) {
    const event = {
      type: 'auth:login',
      data: {
        userId: command.userId,
        email: command.email,
        ipAddress: command.ipAddress,
        userAgent: command.userAgent,
        timestamp: new Date().toISOString()
      }
    };
    
    await this.eventStore.appendEvent(event);
    return { success: true, userId: command.userId };
  }

  /**
   * Handle post creation command
   */
  async handleCreatePost(command) {
    const event = {
      type: 'community:post_created',
      data: {
        postId: command.postId || uuidv4(),
        userId: command.userId,
        title: command.title,
        content: command.content,
        category: command.category,
        tags: command.tags || [],
        createdAt: new Date().toISOString()
      }
    };
    
    await this.eventStore.appendEvent(event);
    return { success: true, postId: event.data.postId };
  }

  /**
   * Handle post update command
   */
  async handleUpdatePost(command) {
    const event = {
      type: 'community:post_updated',
      data: {
        postId: command.postId,
        userId: command.userId,
        updates: command.updates,
        updatedAt: new Date().toISOString()
      }
    };
    
    await this.eventStore.appendEvent(event);
    return { success: true, postId: command.postId };
  }

  /**
   * Handle post deletion command
   */
  async handleDeletePost(command) {
    const event = {
      type: 'community:post_deleted',
      data: {
        postId: command.postId,
        userId: command.userId,
        deletedAt: new Date().toISOString()
      }
    };
    
    await this.eventStore.appendEvent(event);
    return { success: true, postId: command.postId };
  }

  /**
   * Handle comment creation command
   */
  async handleCreateComment(command) {
    const event = {
      type: 'community:comment_created',
      data: {
        commentId: command.commentId || uuidv4(),
        postId: command.postId,
        userId: command.userId,
        content: command.content,
        parentCommentId: command.parentCommentId,
        createdAt: new Date().toISOString()
      }
    };
    
    await this.eventStore.appendEvent(event);
    return { success: true, commentId: event.data.commentId };
  }

  /**
   * Handle vote command
   */
  async handleVote(command) {
    const event = {
      type: 'community:post_voted',
      data: {
        postId: command.postId,
        userId: command.userId,
        voteType: command.voteType, // 'up' or 'down'
        previousVote: command.previousVote,
        timestamp: new Date().toISOString()
      }
    };
    
    await this.eventStore.appendEvent(event);
    return { success: true, postId: command.postId };
  }

  /**
   * Handle link scan command
   */
  async handleScanLink(command) {
    const event = {
      type: 'link:scan_requested',
      data: {
        linkId: command.linkId || uuidv4(),
        url: command.url,
        userId: command.userId,
        scanType: command.scanType || 'full',
        requestedAt: new Date().toISOString()
      }
    };
    
    await this.eventStore.appendEvent(event);
    return { success: true, linkId: event.data.linkId };
  }

  /**
   * Handle link scan completion command
   */
  async handleLinkScanCompleted(command) {
    const event = {
      type: 'link:scan_completed',
      data: {
        linkId: command.linkId,
        url: command.url,
        scanResults: command.scanResults,
        safetyScore: command.safetyScore,
        threats: command.threats || [],
        completedAt: new Date().toISOString()
      }
    };
    
    await this.eventStore.appendEvent(event);
    return { success: true, linkId: command.linkId };
  }

  /**
   * Handle chat message command
   */
  async handleSendChatMessage(command) {
    const event = {
      type: 'chat:message_sent',
      data: {
        messageId: command.messageId || uuidv4(),
        conversationId: command.conversationId,
        userId: command.userId,
        content: command.content,
        messageType: command.messageType || 'text',
        timestamp: new Date().toISOString()
      }
    };
    
    await this.eventStore.appendEvent(event);
    return { success: true, messageId: event.data.messageId };
  }

  /**
   * Handle AI response command
   */
  async handleAIResponse(command) {
    const event = {
      type: 'chat:ai_response_generated',
      data: {
        messageId: command.messageId || uuidv4(),
        conversationId: command.conversationId,
        content: command.content,
        model: command.model || 'gemini',
        processingTime: command.processingTime,
        timestamp: new Date().toISOString()
      }
    };
    
    await this.eventStore.appendEvent(event);
    return { success: true, messageId: event.data.messageId };
  }

  /**
   * Handle news article creation command
   */
  async handleCreateNewsArticle(command) {
    const event = {
      type: 'news:article_published',
      data: {
        articleId: command.articleId || uuidv4(),
        title: command.title,
        content: command.content,
        category: command.category,
        author: command.author,
        source: command.source,
        publishedAt: new Date().toISOString()
      }
    };
    
    await this.eventStore.appendEvent(event);
    return { success: true, articleId: event.data.articleId };
  }

  /**
   * Handle admin action command
   */
  async handleAdminAction(command) {
    const event = {
      type: 'admin:action_performed',
      data: {
        actionId: command.actionId || uuidv4(),
        adminId: command.adminId,
        actionType: command.actionType,
        targetType: command.targetType,
        targetId: command.targetId,
        details: command.details,
        timestamp: new Date().toISOString()
      }
    };
    
    await this.eventStore.appendEvent(event);
    return { success: true, actionId: event.data.actionId };
  }

  /**
   * Handle system alert command
   */
  async handleSystemAlert(command) {
    const event = {
      type: 'system:alert_created',
      data: {
        alertId: command.alertId || uuidv4(),
        alertType: command.alertType,
        severity: command.severity,
        message: command.message,
        details: command.details,
        createdAt: new Date().toISOString()
      }
    };
    
    await this.eventStore.appendEvent(event);
    return { success: true, alertId: event.data.alertId };
  }

  /**
   * Generic command handler
   */
  async handleCommand(commandType, command) {
    const handlerMap = {
      'createUser': this.handleCreateUser.bind(this),
      'updateUserProfile': this.handleUpdateUserProfile.bind(this),
      'userLogin': this.handleUserLogin.bind(this),
      'createPost': this.handleCreatePost.bind(this),
      'updatePost': this.handleUpdatePost.bind(this),
      'deletePost': this.handleDeletePost.bind(this),
      'createComment': this.handleCreateComment.bind(this),
      'vote': this.handleVote.bind(this),
      'scanLink': this.handleScanLink.bind(this),
      'linkScanCompleted': this.handleLinkScanCompleted.bind(this),
      'sendChatMessage': this.handleSendChatMessage.bind(this),
      'aiResponse': this.handleAIResponse.bind(this),
      'createNewsArticle': this.handleCreateNewsArticle.bind(this),
      'adminAction': this.handleAdminAction.bind(this),
      'systemAlert': this.handleSystemAlert.bind(this)
    };

    const handler = handlerMap[commandType];
    if (!handler) {
      throw new Error(`Unknown command type: ${commandType}`);
    }

    return await handler(command);
  }
}

module.exports = CommandHandlers; 