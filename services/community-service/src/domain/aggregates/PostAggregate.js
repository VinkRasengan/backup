/**
 * Post Aggregate - Domain Model for Event Sourcing
 * Implements Domain-Driven Design patterns with Event Sourcing
 */

const { v4: uuidv4 } = require('uuid');
const logger = require('../../utils/logger');

class PostAggregate {
  constructor(id) {
    this.id = id;
    this.version = 0;
    this.uncommittedEvents = [];
    
    // Aggregate state
    this.title = null;
    this.content = null;
    this.authorId = null;
    this.category = null;
    this.tags = [];
    this.url = null;
    this.status = 'draft';
    this.createdAt = null;
    this.updatedAt = null;
    this.voteCount = 0;
    this.upvotes = 0;
    this.downvotes = 0;
    this.commentCount = 0;
    this.isDeleted = false;
  }

  // ==================== FACTORY METHODS ====================

  /**
   * Create new post aggregate
   */
  static create(postId, authorId, title, content, options = {}) {
    const aggregate = new PostAggregate(postId);
    
    // Validate business rules
    aggregate.validateCreatePost(authorId, title, content);
    
    // Apply domain event
    const event = {
      type: 'PostCreated',
      data: {
        postId,
        authorId,
        title,
        content,
        category: options.category || 'general',
        tags: options.tags || [],
        url: options.url || null,
        createdAt: new Date().toISOString()
      },
      metadata: {
        aggregateId: postId,
        aggregateType: 'Post',
        version: 1
      }
    };
    
    aggregate.applyEvent(event);
    return aggregate;
  }

  /**
   * Rebuild aggregate from event history
   */
  static fromHistory(events) {
    if (!events || events.length === 0) {
      throw new Error('Cannot rebuild aggregate from empty event history');
    }

    const firstEvent = events[0];
    if (!firstEvent.data.postId) {
      throw new Error('Invalid event history: missing postId');
    }

    const aggregate = new PostAggregate(firstEvent.data.postId);
    
    events.forEach(event => {
      aggregate.applyEvent(event, false); // Don't add to uncommitted events
    });
    
    logger.debug('Post aggregate rebuilt from history', {
      postId: aggregate.id,
      version: aggregate.version,
      eventCount: events.length
    });
    
    return aggregate;
  }

  // ==================== COMMAND METHODS ====================

  /**
   * Update post content
   */
  updatePost(title, content, options = {}) {
    // Validate business rules
    this.validateUpdatePost(title, content);
    
    const event = {
      type: 'PostUpdated',
      data: {
        postId: this.id,
        title,
        content,
        category: options.category || this.category,
        tags: options.tags || this.tags,
        url: options.url || this.url,
        updatedAt: new Date().toISOString(),
        previousVersion: this.version
      },
      metadata: {
        aggregateId: this.id,
        aggregateType: 'Post',
        version: this.version + 1
      }
    };
    
    this.applyEvent(event);
  }

  /**
   * Vote on post
   */
  vote(userId, voteType) {
    // Validate business rules
    this.validateVote(userId, voteType);
    
    const event = {
      type: 'PostVoted',
      data: {
        postId: this.id,
        userId,
        voteType, // 'up' or 'down'
        votedAt: new Date().toISOString()
      },
      metadata: {
        aggregateId: this.id,
        aggregateType: 'Post',
        version: this.version + 1
      }
    };
    
    this.applyEvent(event);
  }

  /**
   * Add comment to post
   */
  addComment(commentId, authorId, content) {
    // Validate business rules
    this.validateAddComment(commentId, authorId, content);
    
    const event = {
      type: 'CommentAdded',
      data: {
        postId: this.id,
        commentId,
        authorId,
        content,
        createdAt: new Date().toISOString()
      },
      metadata: {
        aggregateId: this.id,
        aggregateType: 'Post',
        version: this.version + 1
      }
    };
    
    this.applyEvent(event);
  }

  /**
   * Moderate post
   */
  moderate(moderatorId, action, reason) {
    // Validate business rules
    this.validateModeration(moderatorId, action, reason);
    
    const event = {
      type: 'PostModerated',
      data: {
        postId: this.id,
        moderatorId,
        action, // 'approve', 'reject', 'flag', 'remove'
        reason,
        moderatedAt: new Date().toISOString(),
        previousStatus: this.status
      },
      metadata: {
        aggregateId: this.id,
        aggregateType: 'Post',
        version: this.version + 1
      }
    };
    
    this.applyEvent(event);
  }

  /**
   * Delete post
   */
  delete(deletedBy, reason) {
    // Validate business rules
    this.validateDelete(deletedBy);
    
    const event = {
      type: 'PostDeleted',
      data: {
        postId: this.id,
        deletedBy,
        reason,
        deletedAt: new Date().toISOString()
      },
      metadata: {
        aggregateId: this.id,
        aggregateType: 'Post',
        version: this.version + 1
      }
    };
    
    this.applyEvent(event);
  }

  // ==================== EVENT HANDLERS ====================

  /**
   * Apply event to aggregate state
   */
  applyEvent(event, addToUncommitted = true) {
    switch (event.type) {
      case 'PostCreated':
        this.onPostCreated(event.data);
        break;
      case 'PostUpdated':
        this.onPostUpdated(event.data);
        break;
      case 'PostVoted':
        this.onPostVoted(event.data);
        break;
      case 'CommentAdded':
        this.onCommentAdded(event.data);
        break;
      case 'PostModerated':
        this.onPostModerated(event.data);
        break;
      case 'PostDeleted':
        this.onPostDeleted(event.data);
        break;
      default:
        logger.warn('Unknown event type', { eventType: event.type, postId: this.id });
    }
    
    this.version++;
    
    if (addToUncommitted) {
      this.uncommittedEvents.push(event);
    }
  }

  onPostCreated(data) {
    this.title = data.title;
    this.content = data.content;
    this.authorId = data.authorId;
    this.category = data.category;
    this.tags = data.tags;
    this.url = data.url;
    this.status = 'active';
    this.createdAt = data.createdAt;
    this.updatedAt = data.createdAt;
    this.voteCount = 0;
    this.upvotes = 0;
    this.downvotes = 0;
    this.commentCount = 0;
  }

  onPostUpdated(data) {
    this.title = data.title;
    this.content = data.content;
    this.category = data.category;
    this.tags = data.tags;
    this.url = data.url;
    this.updatedAt = data.updatedAt;
  }

  onPostVoted(data) {
    if (data.voteType === 'up') {
      this.upvotes++;
    } else if (data.voteType === 'down') {
      this.downvotes++;
    }
    this.voteCount = this.upvotes - this.downvotes;
  }

  onCommentAdded(data) {
    this.commentCount++;
  }

  onPostModerated(data) {
    switch (data.action) {
      case 'approve':
        this.status = 'active';
        break;
      case 'reject':
        this.status = 'rejected';
        break;
      case 'flag':
        this.status = 'flagged';
        break;
      case 'remove':
        this.status = 'removed';
        break;
    }
  }

  onPostDeleted(data) {
    this.isDeleted = true;
    this.status = 'deleted';
  }

  // ==================== BUSINESS RULE VALIDATION ====================

  validateCreatePost(authorId, title, content) {
    if (!authorId) {
      throw new Error('Author ID is required');
    }
    if (!title || title.trim().length === 0) {
      throw new Error('Title is required');
    }
    if (title.length > 200) {
      throw new Error('Title must be 200 characters or less');
    }
    if (!content || content.trim().length === 0) {
      throw new Error('Content is required');
    }
    if (content.length > 10000) {
      throw new Error('Content must be 10000 characters or less');
    }
  }

  validateUpdatePost(title, content) {
    if (this.isDeleted) {
      throw new Error('Cannot update deleted post');
    }
    if (this.status === 'removed') {
      throw new Error('Cannot update removed post');
    }
    if (!title || title.trim().length === 0) {
      throw new Error('Title is required');
    }
    if (title.length > 200) {
      throw new Error('Title must be 200 characters or less');
    }
    if (!content || content.trim().length === 0) {
      throw new Error('Content is required');
    }
    if (content.length > 10000) {
      throw new Error('Content must be 10000 characters or less');
    }
  }

  validateVote(userId, voteType) {
    if (!userId) {
      throw new Error('User ID is required for voting');
    }
    if (!['up', 'down'].includes(voteType)) {
      throw new Error('Vote type must be "up" or "down"');
    }
    if (this.isDeleted) {
      throw new Error('Cannot vote on deleted post');
    }
    if (this.status !== 'active') {
      throw new Error('Can only vote on active posts');
    }
  }

  validateAddComment(commentId, authorId, content) {
    if (!commentId) {
      throw new Error('Comment ID is required');
    }
    if (!authorId) {
      throw new Error('Author ID is required');
    }
    if (!content || content.trim().length === 0) {
      throw new Error('Comment content is required');
    }
    if (content.length > 2000) {
      throw new Error('Comment must be 2000 characters or less');
    }
    if (this.isDeleted) {
      throw new Error('Cannot comment on deleted post');
    }
    if (this.status !== 'active') {
      throw new Error('Can only comment on active posts');
    }
  }

  validateModeration(moderatorId, action, reason) {
    if (!moderatorId) {
      throw new Error('Moderator ID is required');
    }
    if (!['approve', 'reject', 'flag', 'remove'].includes(action)) {
      throw new Error('Invalid moderation action');
    }
    if (!reason || reason.trim().length === 0) {
      throw new Error('Moderation reason is required');
    }
    if (this.isDeleted) {
      throw new Error('Cannot moderate deleted post');
    }
  }

  validateDelete(deletedBy) {
    if (!deletedBy) {
      throw new Error('Deleted by user ID is required');
    }
    if (this.isDeleted) {
      throw new Error('Post is already deleted');
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Get uncommitted events and clear them
   */
  getUncommittedEvents() {
    const events = [...this.uncommittedEvents];
    this.uncommittedEvents = [];
    return events;
  }

  /**
   * Mark events as committed
   */
  markEventsAsCommitted() {
    this.uncommittedEvents = [];
  }

  /**
   * Get aggregate snapshot
   */
  getSnapshot() {
    return {
      id: this.id,
      version: this.version,
      title: this.title,
      content: this.content,
      authorId: this.authorId,
      category: this.category,
      tags: this.tags,
      url: this.url,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      voteCount: this.voteCount,
      upvotes: this.upvotes,
      downvotes: this.downvotes,
      commentCount: this.commentCount,
      isDeleted: this.isDeleted
    };
  }

  /**
   * Check if aggregate needs snapshot
   */
  needsSnapshot(snapshotFrequency = 100) {
    return this.version > 0 && this.version % snapshotFrequency === 0;
  }
}

module.exports = PostAggregate;
