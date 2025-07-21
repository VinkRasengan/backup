/**
 * Community Service Event Handlers
 * Implements comprehensive event-driven patterns for community features
 * Based on Event-Driven Architecture and Domain-Driven Design
 */

const CommunityServiceEventBus = require('../../lib/eventBus');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

class CommunityEventHandlers {
  constructor() {
    this.eventBus = new CommunityServiceEventBus();
    this.setupEventHandlers();
  }

  /**
   * Initialize event handlers
   */
  async initialize() {
    try {
      await this.eventBus.initialize();
      logger.info('Community event handlers initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize community event handlers', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Setup event subscriptions
   */
  async setupEventHandlers() {
    // This is handled by the eventBus.setupSubscriptions() method
    // Additional custom subscriptions can be added here
  }

  // ==================== POST EVENTS ====================

  /**
   * Publish post created event
   */
  async publishPostCreated(postData, authorData) {
    try {
      await this.eventBus.publish('community.post.created', {
        postId: postData.id,
        authorId: postData.authorId,
        title: postData.title,
        content: postData.content,
        category: postData.category,
        tags: postData.tags || [],
        links: postData.links || [],
        createdAt: postData.createdAt,
        author: {
          id: authorData.id,
          displayName: authorData.displayName,
          reputation: authorData.reputation || 0
        }
      });

      logger.info('Post created event published', {
        postId: postData.id,
        authorId: postData.authorId
      });

      // If post contains links, request analysis
      if (postData.links && postData.links.length > 0) {
        for (const link of postData.links) {
          await this.requestLinkAnalysis(link, postData.id, postData.authorId);
        }
      }

    } catch (error) {
      logger.error('Failed to publish post created event', {
        postId: postData.id,
        error: error.message
      });
    }
  }

  /**
   * Publish post updated event
   */
  async publishPostUpdated(postId, changes, updatedBy) {
    try {
      await this.eventBus.publish('community.post.updated', {
        postId,
        changes,
        updatedBy,
        updatedAt: new Date().toISOString()
      });

      logger.info('Post updated event published', { postId });

    } catch (error) {
      logger.error('Failed to publish post updated event', {
        postId,
        error: error.message
      });
    }
  }

  /**
   * Publish post deleted event
   */
  async publishPostDeleted(postId, deletedBy, reason) {
    try {
      await this.eventBus.publish('community.post.deleted', {
        postId,
        deletedBy,
        reason,
        deletedAt: new Date().toISOString()
      });

      logger.info('Post deleted event published', { postId });

    } catch (error) {
      logger.error('Failed to publish post deleted event', {
        postId,
        error: error.message
      });
    }
  }

  // ==================== COMMENT EVENTS ====================

  /**
   * Publish comment created event
   */
  async publishCommentCreated(commentData, authorData, postData) {
    try {
      await this.eventBus.publish('community.comment.created', {
        commentId: commentData.id,
        postId: commentData.postId,
        authorId: commentData.authorId,
        content: commentData.content,
        parentCommentId: commentData.parentCommentId || null,
        createdAt: commentData.createdAt,
        author: {
          id: authorData.id,
          displayName: authorData.displayName,
          reputation: authorData.reputation || 0
        },
        post: {
          id: postData.id,
          title: postData.title,
          authorId: postData.authorId
        }
      });

      logger.info('Comment created event published', {
        commentId: commentData.id,
        postId: commentData.postId
      });

      // Notify post author about new comment (if not self-comment)
      if (commentData.authorId !== postData.authorId) {
        await this.publishNotification({
          type: 'comment_on_post',
          recipientId: postData.authorId,
          actorId: commentData.authorId,
          entityId: commentData.id,
          entityType: 'comment',
          message: `${authorData.displayName} commented on your post "${postData.title}"`
        });
      }

    } catch (error) {
      logger.error('Failed to publish comment created event', {
        commentId: commentData.id,
        error: error.message
      });
    }
  }

  /**
   * Publish comment updated event
   */
  async publishCommentUpdated(commentId, changes, updatedBy) {
    try {
      await this.eventBus.publish('community.comment.updated', {
        commentId,
        changes,
        updatedBy,
        updatedAt: new Date().toISOString()
      });

      logger.info('Comment updated event published', { commentId });

    } catch (error) {
      logger.error('Failed to publish comment updated event', {
        commentId,
        error: error.message
      });
    }
  }

  // ==================== VOTE EVENTS ====================

  /**
   * Publish vote cast event
   */
  async publishVoteCast(voteData) {
    try {
      await this.eventBus.publish('community.vote.cast', {
        voteId: voteData.id,
        userId: voteData.userId,
        entityId: voteData.entityId,
        entityType: voteData.entityType, // 'post' or 'comment'
        voteType: voteData.voteType, // 'upvote' or 'downvote'
        previousVote: voteData.previousVote || null,
        createdAt: voteData.createdAt
      });

      logger.info('Vote cast event published', {
        voteId: voteData.id,
        entityType: voteData.entityType,
        voteType: voteData.voteType
      });

      // Update reputation based on vote
      await this.updateReputationFromVote(voteData);

    } catch (error) {
      logger.error('Failed to publish vote cast event', {
        voteId: voteData.id,
        error: error.message
      });
    }
  }

  // ==================== REPORT EVENTS ====================

  /**
   * Publish content report event
   */
  async publishContentReported(reportData) {
    try {
      await this.eventBus.publish('community.report.submitted', {
        reportId: reportData.id,
        reportedBy: reportData.reportedBy,
        entityId: reportData.entityId,
        entityType: reportData.entityType, // 'post' or 'comment'
        reportType: reportData.reportType, // 'spam', 'inappropriate', 'misinformation', etc.
        reason: reportData.reason,
        description: reportData.description,
        evidence: reportData.evidence || [],
        createdAt: reportData.createdAt
      });

      logger.info('Content report event published', {
        reportId: reportData.id,
        entityType: reportData.entityType,
        reportType: reportData.reportType
      });

      // Notify moderators about new report
      await this.publishNotification({
        type: 'content_reported',
        recipientRole: 'moderator',
        actorId: reportData.reportedBy,
        entityId: reportData.id,
        entityType: 'report',
        message: `New ${reportData.reportType} report submitted for ${reportData.entityType}`
      });

    } catch (error) {
      logger.error('Failed to publish content report event', {
        reportId: reportData.id,
        error: error.message
      });
    }
  }

  // ==================== MODERATION EVENTS ====================

  /**
   * Publish content moderated event
   */
  async publishContentModerated(moderationData) {
    try {
      await this.eventBus.publish('community.content.moderated', {
        moderationId: moderationData.id,
        moderatorId: moderationData.moderatorId,
        entityId: moderationData.entityId,
        entityType: moderationData.entityType,
        action: moderationData.action, // 'approved', 'removed', 'flagged', 'warning'
        reason: moderationData.reason,
        notes: moderationData.notes,
        createdAt: moderationData.createdAt
      });

      logger.info('Content moderated event published', {
        moderationId: moderationData.id,
        action: moderationData.action
      });

      // Notify content author about moderation action
      if (moderationData.authorId) {
        await this.publishNotification({
          type: 'content_moderated',
          recipientId: moderationData.authorId,
          actorId: moderationData.moderatorId,
          entityId: moderationData.entityId,
          entityType: moderationData.entityType,
          message: `Your ${moderationData.entityType} has been ${moderationData.action}: ${moderationData.reason}`
        });
      }

    } catch (error) {
      logger.error('Failed to publish content moderated event', {
        moderationId: moderationData.id,
        error: error.message
      });
    }
  }

  // ==================== REPUTATION EVENTS ====================

  /**
   * Publish reputation changed event
   */
  async publishReputationChanged(userId, change, reason, entityId = null) {
    try {
      await this.eventBus.publish('community.reputation.changed', {
        userId,
        change, // positive or negative number
        reason, // 'post_upvoted', 'comment_downvoted', 'badge_earned', etc.
        entityId,
        timestamp: new Date().toISOString()
      });

      logger.info('Reputation changed event published', {
        userId,
        change,
        reason
      });

    } catch (error) {
      logger.error('Failed to publish reputation changed event', {
        userId,
        error: error.message
      });
    }
  }

  // ==================== NOTIFICATION EVENTS ====================

  /**
   * Publish notification event
   */
  async publishNotification(notificationData) {
    try {
      await this.eventBus.publish('community.notification.created', {
        notificationId: uuidv4(),
        type: notificationData.type,
        recipientId: notificationData.recipientId,
        recipientRole: notificationData.recipientRole, // for role-based notifications
        actorId: notificationData.actorId,
        entityId: notificationData.entityId,
        entityType: notificationData.entityType,
        message: notificationData.message,
        data: notificationData.data || {},
        createdAt: new Date().toISOString(),
        read: false
      });

      logger.info('Notification event published', {
        type: notificationData.type,
        recipientId: notificationData.recipientId
      });

    } catch (error) {
      logger.error('Failed to publish notification event', {
        type: notificationData.type,
        error: error.message
      });
    }
  }

  // ==================== HELPER METHODS ====================

  /**
   * Request link analysis for links in posts
   */
  async requestLinkAnalysis(url, postId, userId) {
    try {
      const linkId = uuidv4();
      
      await this.eventBus.publish('link.analysis.requested', {
        linkId,
        url,
        requestedBy: userId,
        context: {
          type: 'community_post',
          entityId: postId
        },
        priority: 'normal',
        analysisType: ['security', 'phishing', 'reputation']
      });

      logger.info('Link analysis requested', {
        linkId,
        url,
        postId
      });

    } catch (error) {
      logger.error('Failed to request link analysis', {
        url,
        postId,
        error: error.message
      });
    }
  }

  /**
   * Update user reputation based on vote
   */
  async updateReputationFromVote(voteData) {
    try {
      // Determine reputation change based on vote type and entity
      let reputationChange = 0;
      let reason = '';

      if (voteData.voteType === 'upvote') {
        reputationChange = voteData.entityType === 'post' ? 5 : 2;
        reason = `${voteData.entityType}_upvoted`;
      } else if (voteData.voteType === 'downvote') {
        reputationChange = voteData.entityType === 'post' ? -2 : -1;
        reason = `${voteData.entityType}_downvoted`;
      }

      if (reputationChange !== 0) {
        // Get the author of the voted content
        const contentAuthorId = await this.getContentAuthorId(voteData.entityId, voteData.entityType);
        
        if (contentAuthorId && contentAuthorId !== voteData.userId) {
          await this.publishReputationChanged(
            contentAuthorId,
            reputationChange,
            reason,
            voteData.entityId
          );
        }
      }

    } catch (error) {
      logger.error('Failed to update reputation from vote', {
        voteId: voteData.id,
        error: error.message
      });
    }
  }

  /**
   * Get content author ID (placeholder - implement based on your data layer)
   */
  async getContentAuthorId(entityId, entityType) {
    // This should query your database to get the author ID
    // Placeholder implementation
    logger.info('Getting content author ID', { entityId, entityType });
    return null; // Replace with actual implementation
  }

  /**
   * Get event bus statistics
   */
  getEventBusStats() {
    return this.eventBus.getStats ? this.eventBus.getStats() : {};
  }

  /**
   * Health check for event handlers
   */
  async healthCheck() {
    return await this.eventBus.healthCheck();
  }

  /**
   * Cleanup event handlers
   */
  async close() {
    await this.eventBus.close();
  }
}

module.exports = CommunityEventHandlers;
