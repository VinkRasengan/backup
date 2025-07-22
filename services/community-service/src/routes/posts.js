/**
 * Community Posts API Routes
 * Event-driven implementation for post management with Redis caching
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const { communityCache } = require('../utils/communityCache');
const {
  postsListCache,
  postCache,
  invalidatePostCache,
  invalidateCommentCache,
  invalidateVoteCache
} = require('../middleware/cacheMiddleware');

const router = express.Router();

// Mock data store (replace with your actual database)
const posts = new Map();
const comments = new Map();

/**
 * Get all posts with Redis caching
 */
router.get('/', postsListCache, async (req, res) => {
  try {
    const { page = 1, limit = 20, category, sortBy = 'createdAt' } = req.query;
    
    logger.info('Fetching posts', {
      page: parseInt(page),
      limit: parseInt(limit),
      category,
      sortBy
    });

    // Mock implementation - replace with actual database query
    let allPosts = Array.from(posts.values());
    
    // Filter by category if specified
    if (category) {
      allPosts = allPosts.filter(post => post.category === category);
    }

    // Sort posts
    allPosts.sort((a, b) => {
      if (sortBy === 'createdAt') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else if (sortBy === 'votes') {
        return (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes);
      }
      return 0;
    });

    // Pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedPosts = allPosts.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        posts: paginatedPosts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: allPosts.length,
          pages: Math.ceil(allPosts.length / parseInt(limit))
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching posts', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      error: 'Failed to fetch posts'
    });
  }
});

/**
 * Get single post by ID with Redis caching
 */
router.get('/:postId', postCache, async (req, res) => {
  try {
    const { postId } = req.params;
    
    logger.info('Fetching post', { postId });

    const post = posts.get(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    // Get comments for this post
    const postComments = Array.from(comments.values())
      .filter(comment => comment.postId === postId)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    res.json({
      success: true,
      data: {
        post: {
          ...post,
          comments: postComments
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching post', {
      postId: req.params.postId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: 'Failed to fetch post'
    });
  }
});

/**
 * Create new post with cache invalidation
 */
router.post('/', invalidatePostCache, async (req, res) => {
  try {
    const { title, content, category, tags = [], authorId } = req.body;

    // Validation
    if (!title || !content || !authorId) {
      return res.status(400).json({
        success: false,
        error: 'Title, content, and authorId are required'
      });
    }

    if (title.length > 200) {
      return res.status(400).json({
        success: false,
        error: 'Title must be 200 characters or less'
      });
    }

    if (content.length > 10000) {
      return res.status(400).json({
        success: false,
        error: 'Content must be 10000 characters or less'
      });
    }

    const postId = uuidv4();
    const now = new Date().toISOString();

    // Extract links from content
    const linkRegex = /https?:\/\/[^\s]+/g;
    const links = content.match(linkRegex) || [];

    const postData = {
      id: postId,
      title,
      content,
      category: category || 'general',
      tags: Array.isArray(tags) ? tags : [],
      links,
      authorId,
      createdAt: now,
      updatedAt: now,
      upvotes: 0,
      downvotes: 0,
      commentCount: 0,
      status: 'active'
    };

    // Store post (replace with actual database save)
    posts.set(postId, postData);

    logger.info('Post created', {
      postId,
      authorId,
      title: title.substring(0, 50) + '...',
      linksCount: links.length
    });

    // Get event handlers from app context (passed via middleware)
    const eventHandlers = req.app.get('eventHandlers');
    if (eventHandlers) {
      // Mock author data (replace with actual user lookup)
      const authorData = {
        id: authorId,
        displayName: `User_${authorId.substring(0, 8)}`,
        reputation: 100
      };

      // Publish post created event
      await eventHandlers.publishPostCreated(postData, authorData);
    }

    res.status(201).json({
      success: true,
      data: {
        post: postData
      }
    });

  } catch (error) {
    logger.error('Error creating post', {
      error: error.message,
      stack: error.stack,
      body: req.body
    });

    res.status(500).json({
      success: false,
      error: 'Failed to create post'
    });
  }
});

/**
 * Update post with cache invalidation
 */
router.put('/:postId', invalidatePostCache, async (req, res) => {
  try {
    const { postId } = req.params;
    const { title, content, category, tags, updatedBy } = req.body;

    const post = posts.get(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    // Check if user can update this post (basic authorization)
    if (post.authorId !== updatedBy) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this post'
      });
    }

    const changes = {};
    if (title !== undefined) {
      changes.title = title;
      post.title = title;
    }
    if (content !== undefined) {
      changes.content = content;
      post.content = content;
      // Re-extract links
      const linkRegex = /https?:\/\/[^\s]+/g;
      post.links = content.match(linkRegex) || [];
    }
    if (category !== undefined) {
      changes.category = category;
      post.category = category;
    }
    if (tags !== undefined) {
      changes.tags = tags;
      post.tags = Array.isArray(tags) ? tags : [];
    }

    post.updatedAt = new Date().toISOString();

    logger.info('Post updated', {
      postId,
      updatedBy,
      changes: Object.keys(changes)
    });

    // Publish post updated event
    const eventHandlers = req.app.get('eventHandlers');
    if (eventHandlers) {
      await eventHandlers.publishPostUpdated(postId, changes, updatedBy);
    }

    res.json({
      success: true,
      data: {
        post
      }
    });

  } catch (error) {
    logger.error('Error updating post', {
      postId: req.params.postId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: 'Failed to update post'
    });
  }
});

/**
 * Delete post with cache invalidation
 */
router.delete('/:postId', invalidatePostCache, async (req, res) => {
  try {
    const { postId } = req.params;
    const { deletedBy, reason = 'User requested deletion' } = req.body;

    const post = posts.get(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    // Check authorization (basic check)
    if (post.authorId !== deletedBy) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this post'
      });
    }

    // Soft delete - mark as deleted
    post.status = 'deleted';
    post.deletedAt = new Date().toISOString();
    post.deletedBy = deletedBy;

    logger.info('Post deleted', {
      postId,
      deletedBy,
      reason
    });

    // Publish post deleted event
    const eventHandlers = req.app.get('eventHandlers');
    if (eventHandlers) {
      await eventHandlers.publishPostDeleted(postId, deletedBy, reason);
    }

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting post', {
      postId: req.params.postId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: 'Failed to delete post'
    });
  }
});

/**
 * Vote on post with cache invalidation
 */
router.post('/:postId/vote', invalidateVoteCache, async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId, voteType } = req.body; // 'upvote' or 'downvote'

    if (!userId || !voteType) {
      return res.status(400).json({
        success: false,
        error: 'userId and voteType are required'
      });
    }

    if (!['upvote', 'downvote'].includes(voteType)) {
      return res.status(400).json({
        success: false,
        error: 'voteType must be "upvote" or "downvote"'
      });
    }

    const post = posts.get(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    // Mock vote tracking (replace with actual database)
    const voteId = uuidv4();
    const voteData = {
      id: voteId,
      userId,
      entityId: postId,
      entityType: 'post',
      voteType,
      createdAt: new Date().toISOString()
    };

    // Update post vote counts (simplified logic)
    if (voteType === 'upvote') {
      post.upvotes += 1;
    } else {
      post.downvotes += 1;
    }

    logger.info('Vote cast on post', {
      voteId,
      postId,
      userId,
      voteType
    });

    // Publish vote cast event
    const eventHandlers = req.app.get('eventHandlers');
    if (eventHandlers) {
      await eventHandlers.publishVoteCast(voteData);
    }

    res.json({
      success: true,
      data: {
        vote: voteData,
        post: {
          id: post.id,
          upvotes: post.upvotes,
          downvotes: post.downvotes,
          score: post.upvotes - post.downvotes
        }
      }
    });

  } catch (error) {
    logger.error('Error casting vote', {
      postId: req.params.postId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: 'Failed to cast vote'
    });
  }
});

/**
 * Add comment to post with cache invalidation
 */
router.post('/:postId/comments', invalidateCommentCache, async (req, res) => {
  try {
    const { postId } = req.params;
    const { content, authorId, parentCommentId = null } = req.body;

    if (!content || !authorId) {
      return res.status(400).json({
        success: false,
        error: 'Content and authorId are required'
      });
    }

    if (content.length > 2000) {
      return res.status(400).json({
        success: false,
        error: 'Comment must be 2000 characters or less'
      });
    }

    const post = posts.get(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    const commentId = uuidv4();
    const commentData = {
      id: commentId,
      postId,
      authorId,
      content,
      parentCommentId,
      createdAt: new Date().toISOString(),
      upvotes: 0,
      downvotes: 0,
      status: 'active'
    };

    // Store comment
    comments.set(commentId, commentData);

    // Update post comment count
    post.commentCount += 1;

    logger.info('Comment created', {
      commentId,
      postId,
      authorId,
      isReply: !!parentCommentId
    });

    // Publish comment created event
    const eventHandlers = req.app.get('eventHandlers');
    if (eventHandlers) {
      const authorData = {
        id: authorId,
        displayName: `User_${authorId.substring(0, 8)}`,
        reputation: 50
      };

      const postData = {
        id: post.id,
        title: post.title,
        authorId: post.authorId
      };

      await eventHandlers.publishCommentCreated(commentData, authorData, postData);
    }

    res.status(201).json({
      success: true,
      data: {
        comment: commentData
      }
    });

  } catch (error) {
    logger.error('Error creating comment', {
      postId: req.params.postId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: 'Failed to create comment'
    });
  }
});

/**
 * Get comments for a post
 */
router.get('/:postId/comments', async (req, res) => {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const post = posts.get(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    // Get comments for this post
    let postComments = Array.from(comments.values())
      .filter(comment => comment.postId === postId && comment.status === 'active')
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    // Pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedComments = postComments.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        comments: paginatedComments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: postComments.length,
          pages: Math.ceil(postComments.length / parseInt(limit))
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching comments', {
      postId: req.params.postId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: 'Failed to fetch comments'
    });
  }
});

module.exports = router;
