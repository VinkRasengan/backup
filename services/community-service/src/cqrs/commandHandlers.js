/**
 * CQRS Command Handlers for Community Service
 * Handles write operations and generates events
 */

const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

class CommunityCommandHandlers {
  constructor(eventBus, firebaseDb) {
    this.eventBus = eventBus;
    this.db = firebaseDb;
    this.streamPrefix = 'community';
  }

  /**
   * Handle Create Post Command
   */
  async handleCreatePost(command) {
    try {
      const { userId, title, content, category, tags, url } = command.data;
      const postId = command.aggregateId || uuidv4();
      const timestamp = new Date().toISOString();

      // Validate command
      if (!userId || !title || !content) {
        throw new Error('Missing required fields: userId, title, content');
      }

      // Business logic validation
      if (title.length < 5 || title.length > 200) {
        throw new Error('Title must be between 5 and 200 characters');
      }

      if (content.length < 10 || content.length > 5000) {
        throw new Error('Content must be between 10 and 5000 characters');
      }

      // Generate events
      const events = [
        {
          type: 'PostCreated',
          data: {
            postId,
            userId,
            title,
            content,
            category: category || 'general',
            tags: tags || [],
            url: url || null,
            status: 'active',
            createdAt: timestamp,
            updatedAt: timestamp,
            voteCount: 0,
            commentCount: 0
          },
          metadata: {
            correlationId: command.correlationId,
            causationId: command.commandId,
            userId
          }
        }
      ];

      // Store events in EventStore
      const streamName = `${this.streamPrefix}-post-${postId}`;
      for (const event of events) {
        await this.eventBus.publish(event.type, event.data, {
          streamName,
          correlationId: event.metadata.correlationId,
          causationId: event.metadata.causationId
        });
      }

      logger.info('CreatePost command handled successfully', {
        postId,
        userId,
        title: title.substring(0, 50)
      });

      return {
        success: true,
        aggregateId: postId,
        events: events.length,
        streamName
      };

    } catch (error) {
      logger.error('Failed to handle CreatePost command', {
        error: error.message,
        command: command.type,
        aggregateId: command.aggregateId
      });
      throw error;
    }
  }

  /**
   * Handle Update Post Command
   */
  async handleUpdatePost(command) {
    try {
      const { postId, updates } = command.data;
      const timestamp = new Date().toISOString();

      // Validate command
      if (!postId || !updates || Object.keys(updates).length === 0) {
        throw new Error('Missing required fields: postId, updates');
      }

      // Get current post state (from read model or rebuild from events)
      const currentPost = await this.getPostCurrentState(postId);
      if (!currentPost) {
        throw new Error(`Post not found: ${postId}`);
      }

      // Business logic validation
      if (updates.title && (updates.title.length < 5 || updates.title.length > 200)) {
        throw new Error('Title must be between 5 and 200 characters');
      }

      if (updates.content && (updates.content.length < 10 || updates.content.length > 5000)) {
        throw new Error('Content must be between 10 and 5000 characters');
      }

      // Generate events
      const events = [
        {
          type: 'PostUpdated',
          data: {
            postId,
            updates: {
              ...updates,
              updatedAt: timestamp
            },
            previousValues: {
              title: currentPost.title,
              content: currentPost.content,
              category: currentPost.category,
              tags: currentPost.tags
            }
          },
          metadata: {
            correlationId: command.correlationId,
            causationId: command.commandId,
            userId: command.userId
          }
        }
      ];

      // Store events
      const streamName = `${this.streamPrefix}-post-${postId}`;
      for (const event of events) {
        await this.eventBus.publish(event.type, event.data, {
          streamName,
          correlationId: event.metadata.correlationId,
          causationId: event.metadata.causationId
        });
      }

      logger.info('UpdatePost command handled successfully', {
        postId,
        updates: Object.keys(updates)
      });

      return {
        success: true,
        aggregateId: postId,
        events: events.length,
        streamName
      };

    } catch (error) {
      logger.error('Failed to handle UpdatePost command', {
        error: error.message,
        command: command.type,
        aggregateId: command.aggregateId
      });
      throw error;
    }
  }

  /**
   * Handle Vote Post Command
   */
  async handleVotePost(command) {
    try {
      const { postId, userId, voteType, action } = command.data;
      const timestamp = new Date().toISOString();

      // Validate command
      if (!postId || !userId || !voteType || !action) {
        throw new Error('Missing required fields: postId, userId, voteType, action');
      }

      if (!['upvote', 'downvote'].includes(voteType)) {
        throw new Error('Invalid vote type. Must be upvote or downvote');
      }

      if (!['created', 'updated', 'removed'].includes(action)) {
        throw new Error('Invalid action. Must be created, updated, or removed');
      }

      // Get current vote state
      const currentVote = await this.getUserVoteForPost(postId, userId);

      // Generate events based on action
      const events = [];
      
      if (action === 'created' && !currentVote) {
        events.push({
          type: 'PostVoteCreated',
          data: {
            postId,
            userId,
            voteType,
            createdAt: timestamp
          }
        });
      } else if (action === 'updated' && currentVote) {
        events.push({
          type: 'PostVoteUpdated',
          data: {
            postId,
            userId,
            voteType,
            previousVoteType: currentVote.voteType,
            updatedAt: timestamp
          }
        });
      } else if (action === 'removed' && currentVote) {
        events.push({
          type: 'PostVoteRemoved',
          data: {
            postId,
            userId,
            previousVoteType: currentVote.voteType,
            removedAt: timestamp
          }
        });
      } else {
        throw new Error(`Invalid vote action: ${action} for current state`);
      }

      // Store events
      const streamName = `${this.streamPrefix}-post-${postId}`;
      for (const event of events) {
        event.metadata = {
          correlationId: command.correlationId,
          causationId: command.commandId,
          userId
        };

        await this.eventBus.publish(event.type, event.data, {
          streamName,
          correlationId: event.metadata.correlationId,
          causationId: event.metadata.causationId
        });
      }

      logger.info('VotePost command handled successfully', {
        postId,
        userId,
        voteType,
        action
      });

      return {
        success: true,
        aggregateId: postId,
        events: events.length,
        streamName
      };

    } catch (error) {
      logger.error('Failed to handle VotePost command', {
        error: error.message,
        command: command.type,
        aggregateId: command.aggregateId
      });
      throw error;
    }
  }

  /**
   * Handle Create Comment Command
   */
  async handleCreateComment(command) {
    try {
      const { postId, userId, content, parentId } = command.data;
      const commentId = command.aggregateId || uuidv4();
      const timestamp = new Date().toISOString();

      // Validate command
      if (!postId || !userId || !content) {
        throw new Error('Missing required fields: postId, userId, content');
      }

      if (content.length < 1 || content.length > 1000) {
        throw new Error('Comment content must be between 1 and 1000 characters');
      }

      // Verify post exists
      const post = await this.getPostCurrentState(postId);
      if (!post) {
        throw new Error(`Post not found: ${postId}`);
      }

      // Generate events
      const events = [
        {
          type: 'CommentCreated',
          data: {
            commentId,
            postId,
            userId,
            content,
            parentId: parentId || null,
            status: 'active',
            createdAt: timestamp,
            updatedAt: timestamp,
            voteCount: 0,
            replyCount: 0
          },
          metadata: {
            correlationId: command.correlationId,
            causationId: command.commandId,
            userId
          }
        }
      ];

      // Store events
      const streamName = `${this.streamPrefix}-comment-${commentId}`;
      for (const event of events) {
        await this.eventBus.publish(event.type, event.data, {
          streamName,
          correlationId: event.metadata.correlationId,
          causationId: event.metadata.causationId
        });
      }

      logger.info('CreateComment command handled successfully', {
        commentId,
        postId,
        userId,
        parentId
      });

      return {
        success: true,
        aggregateId: commentId,
        events: events.length,
        streamName
      };

    } catch (error) {
      logger.error('Failed to handle CreateComment command', {
        error: error.message,
        command: command.type,
        aggregateId: command.aggregateId
      });
      throw error;
    }
  }

  /**
   * Get current post state (helper method)
   * In a full implementation, this would rebuild from events or use a read model
   */
  async getPostCurrentState(postId) {
    try {
      // For now, get from Firebase (in full Event Sourcing, rebuild from events)
      const postDoc = await this.db.collection('links').doc(postId).get();
      return postDoc.exists ? { id: postDoc.id, ...postDoc.data() } : null;
    } catch (error) {
      logger.error('Failed to get post current state', { postId, error: error.message });
      return null;
    }
  }

  /**
   * Get user vote for post (helper method)
   */
  async getUserVoteForPost(postId, userId) {
    try {
      const voteDoc = await this.db.collection('votes')
        .where('linkId', '==', postId)
        .where('userId', '==', userId)
        .limit(1)
        .get();

      return voteDoc.empty ? null : { id: voteDoc.docs[0].id, ...voteDoc.docs[0].data() };
    } catch (error) {
      logger.error('Failed to get user vote', { postId, userId, error: error.message });
      return null;
    }
  }
}

module.exports = CommunityCommandHandlers;
