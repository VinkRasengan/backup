/**
 * CQRS Query Handlers for Community Service
 * Handles read operations from materialized views
 */

const logger = require('../utils/logger');

class CommunityQueryHandlers {
  constructor(eventBus, firebaseDb, cacheManager) {
    this.eventBus = eventBus;
    this.db = firebaseDb;
    this.cache = cacheManager;
  }

  /**
   * Handle Get Posts Query
   */
  async handleGetPosts(query) {
    try {
      const {
        page = 1,
        limit = 20,
        category = null,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        userId = null,
        status = 'active'
      } = query.params;

      const cacheKey = `posts:${page}:${limit}:${category}:${sortBy}:${sortOrder}:${userId}:${status}`;
      
      // Try cache first
      const cachedResult = await this.cache.get('queries', cacheKey);
      if (cachedResult) {
        logger.debug('Posts query served from cache', { cacheKey });
        return {
          success: true,
          data: cachedResult,
          source: 'cache',
          queryId: query.queryId
        };
      }

      // Build Firestore query
      let firestoreQuery = this.db.collection('links');

      // Apply filters
      if (category) {
        firestoreQuery = firestoreQuery.where('category', '==', category);
      }

      if (userId) {
        firestoreQuery = firestoreQuery.where('author.uid', '==', userId);
      }

      if (status) {
        firestoreQuery = firestoreQuery.where('status', '==', status);
      }

      // Apply sorting
      firestoreQuery = firestoreQuery.orderBy(sortBy, sortOrder);

      // Apply pagination
      const offset = (page - 1) * limit;
      firestoreQuery = firestoreQuery.offset(offset).limit(limit);

      // Execute query
      const snapshot = await firestoreQuery.get();
      const posts = [];

      snapshot.forEach(doc => {
        posts.push({
          id: doc.id,
          ...doc.data(),
          // Add computed fields
          voteScore: (doc.data().upvotes || 0) - (doc.data().downvotes || 0),
          commentCount: doc.data().commentCount || 0
        });
      });

      // Get total count for pagination
      let totalQuery = this.db.collection('links');
      if (category) totalQuery = totalQuery.where('category', '==', category);
      if (userId) totalQuery = totalQuery.where('author.uid', '==', userId);
      if (status) totalQuery = totalQuery.where('status', '==', status);

      const totalSnapshot = await totalQuery.count().get();
      const totalCount = totalSnapshot.data().count;

      const result = {
        posts,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNext: page < Math.ceil(totalCount / limit),
          hasPrev: page > 1
        },
        filters: {
          category,
          sortBy,
          sortOrder,
          userId,
          status
        }
      };

      // Cache result
      await this.cache.set('queries', cacheKey, result, 300); // 5 minutes

      logger.info('Posts query executed successfully', {
        resultCount: posts.length,
        totalCount,
        page,
        category,
        userId
      });

      return {
        success: true,
        data: result,
        source: 'database',
        queryId: query.queryId
      };

    } catch (error) {
      logger.error('Failed to handle GetPosts query', {
        error: error.message,
        query: query.type,
        params: query.params
      });
      throw error;
    }
  }

  /**
   * Handle Get Post By ID Query
   */
  async handleGetPostById(query) {
    try {
      const { postId, includeComments = false } = query.params;

      if (!postId) {
        throw new Error('Missing required parameter: postId');
      }

      const cacheKey = `post:${postId}:${includeComments}`;
      
      // Try cache first
      const cachedResult = await this.cache.get('queries', cacheKey);
      if (cachedResult) {
        logger.debug('Post query served from cache', { postId, cacheKey });
        return {
          success: true,
          data: cachedResult,
          source: 'cache',
          queryId: query.queryId
        };
      }

      // Get post from database
      const postDoc = await this.db.collection('links').doc(postId).get();
      
      if (!postDoc.exists) {
        return {
          success: false,
          error: 'Post not found',
          queryId: query.queryId
        };
      }

      const post = {
        id: postDoc.id,
        ...postDoc.data(),
        voteScore: (postDoc.data().upvotes || 0) - (postDoc.data().downvotes || 0)
      };

      // Include comments if requested
      if (includeComments) {
        const commentsSnapshot = await this.db.collection('comments')
          .where('linkId', '==', postId)
          .where('status', '==', 'active')
          .orderBy('createdAt', 'asc')
          .get();

        const comments = [];
        commentsSnapshot.forEach(doc => {
          comments.push({
            id: doc.id,
            ...doc.data()
          });
        });

        post.comments = this.buildCommentTree(comments);
        post.commentCount = comments.length;
      }

      // Cache result
      await this.cache.set('queries', cacheKey, post, 600); // 10 minutes

      logger.info('Post query executed successfully', {
        postId,
        includeComments,
        commentCount: post.comments?.length || 0
      });

      return {
        success: true,
        data: post,
        source: 'database',
        queryId: query.queryId
      };

    } catch (error) {
      logger.error('Failed to handle GetPostById query', {
        error: error.message,
        query: query.type,
        params: query.params
      });
      throw error;
    }
  }

  /**
   * Handle Get User Posts Query
   */
  async handleGetUserPosts(query) {
    try {
      const {
        userId,
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = query.params;

      if (!userId) {
        throw new Error('Missing required parameter: userId');
      }

      const cacheKey = `user-posts:${userId}:${page}:${limit}:${sortBy}:${sortOrder}`;
      
      // Try cache first
      const cachedResult = await this.cache.get('queries', cacheKey);
      if (cachedResult) {
        logger.debug('User posts query served from cache', { userId, cacheKey });
        return {
          success: true,
          data: cachedResult,
          source: 'cache',
          queryId: query.queryId
        };
      }

      // Build query
      const offset = (page - 1) * limit;
      const snapshot = await this.db.collection('links')
        .where('author.uid', '==', userId)
        .where('status', '==', 'active')
        .orderBy(sortBy, sortOrder)
        .offset(offset)
        .limit(limit)
        .get();

      const posts = [];
      snapshot.forEach(doc => {
        posts.push({
          id: doc.id,
          ...doc.data(),
          voteScore: (doc.data().upvotes || 0) - (doc.data().downvotes || 0)
        });
      });

      // Get total count
      const totalSnapshot = await this.db.collection('links')
        .where('author.uid', '==', userId)
        .where('status', '==', 'active')
        .count()
        .get();
      
      const totalCount = totalSnapshot.data().count;

      const result = {
        posts,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNext: page < Math.ceil(totalCount / limit),
          hasPrev: page > 1
        },
        userId
      };

      // Cache result
      await this.cache.set('queries', cacheKey, result, 300); // 5 minutes

      logger.info('User posts query executed successfully', {
        userId,
        resultCount: posts.length,
        totalCount,
        page
      });

      return {
        success: true,
        data: result,
        source: 'database',
        queryId: query.queryId
      };

    } catch (error) {
      logger.error('Failed to handle GetUserPosts query', {
        error: error.message,
        query: query.type,
        params: query.params
      });
      throw error;
    }
  }

  /**
   * Handle Get Post Comments Query
   */
  async handleGetPostComments(query) {
    try {
      const { postId, page = 1, limit = 50 } = query.params;

      if (!postId) {
        throw new Error('Missing required parameter: postId');
      }

      const cacheKey = `post-comments:${postId}:${page}:${limit}`;
      
      // Try cache first
      const cachedResult = await this.cache.get('queries', cacheKey);
      if (cachedResult) {
        logger.debug('Post comments query served from cache', { postId, cacheKey });
        return {
          success: true,
          data: cachedResult,
          source: 'cache',
          queryId: query.queryId
        };
      }

      // Get comments from database
      const offset = (page - 1) * limit;
      const snapshot = await this.db.collection('comments')
        .where('linkId', '==', postId)
        .where('status', '==', 'active')
        .orderBy('createdAt', 'asc')
        .offset(offset)
        .limit(limit)
        .get();

      const comments = [];
      snapshot.forEach(doc => {
        comments.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Build comment tree
      const commentTree = this.buildCommentTree(comments);

      // Get total count
      const totalSnapshot = await this.db.collection('comments')
        .where('linkId', '==', postId)
        .where('status', '==', 'active')
        .count()
        .get();
      
      const totalCount = totalSnapshot.data().count;

      const result = {
        comments: commentTree,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNext: page < Math.ceil(totalCount / limit),
          hasPrev: page > 1
        },
        postId
      };

      // Cache result
      await this.cache.set('queries', cacheKey, result, 300); // 5 minutes

      logger.info('Post comments query executed successfully', {
        postId,
        resultCount: comments.length,
        totalCount,
        page
      });

      return {
        success: true,
        data: result,
        source: 'database',
        queryId: query.queryId
      };

    } catch (error) {
      logger.error('Failed to handle GetPostComments query', {
        error: error.message,
        query: query.type,
        params: query.params
      });
      throw error;
    }
  }

  /**
   * Build comment tree from flat comment list
   */
  buildCommentTree(comments) {
    const commentMap = new Map();
    const rootComments = [];

    // First pass: create comment map
    comments.forEach(comment => {
      comment.replies = [];
      commentMap.set(comment.id, comment);
    });

    // Second pass: build tree
    comments.forEach(comment => {
      if (comment.parentId && commentMap.has(comment.parentId)) {
        commentMap.get(comment.parentId).replies.push(comment);
      } else {
        rootComments.push(comment);
      }
    });

    return rootComments;
  }
}

module.exports = CommunityQueryHandlers;
