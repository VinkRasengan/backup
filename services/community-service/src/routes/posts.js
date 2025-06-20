const express = require('express');
const router = express.Router();
const { db, collections } = require('../config/firebase');
const Logger = require('../../shared/utils/logger');
const { createSampleData, clearSampleData } = require('../utils/sampleData');
const {
  validateCreatePost,
  validateQueryParams,
  validateContent,
  validateRateLimit
} = require('../middleware/validation');
const { cacheManager, cacheMiddleware } = require('../utils/cache');
const QueryOptimizer = require('../../shared/utils/queryOptimizer');

const logger = new Logger('community-service');
const queryOptimizer = new QueryOptimizer('community-service');

// Input sanitization functions
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  return input
    .trim()
    .replace(/[^\w\s-]/gi, '') // Remove special characters except spaces and hyphens
    .substring(0, 100); // Limit length
};

const validateSearchInput = (search) => {
  const sanitized = sanitizeInput(search);
  if (sanitized.length < 2) {
    throw new Error('Search term must be at least 2 characters long');
  }
  if (sanitized.length > 100) {
    throw new Error('Search term too long');
  }
  return sanitized;
};

// Helper function to calculate time ago
function getTimeAgo(date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'vừa xong';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;

  return date.toLocaleDateString('vi-VN');
}

// Cache key generator for posts
const generatePostsCacheKey = (req) => {
  const { page, limit, sort, category, search, includeNews, userPostsOnly } = req.query;
  return `posts:${page}:${limit}:${sort}:${category}:${search || 'none'}:${includeNews}:${userPostsOnly}`;
};

// Get posts from Firestore
router.get('/',
  validateQueryParams,
  validateRateLimit,
  cacheMiddleware('posts', generatePostsCacheKey, 180), // Cache for 3 minutes
  async (req, res) => {
  // Extract query parameters outside try block for access in catch
  const {
    page = 1,
    limit = 10,
    sort = 'trending',
    category = 'all',
    search = '',
    newsOnly = 'false',
    userPostsOnly = 'false',
    includeNews = 'true'
  } = req.query;

  logger.info('Fetching posts', {
    page: parseInt(page),
    limit: parseInt(limit),
    sort,
    category,
    search,
    newsOnly,
    userPostsOnly,
    includeNews
  });

  // Determine content type filter based on parameters
  let contentTypeFilter = null;
  if (newsOnly === 'true') {
    contentTypeFilter = 'news';
    logger.info('Filter: News only');
  } else if (userPostsOnly === 'true') {
    contentTypeFilter = 'user_post';
    logger.info('Filter: User posts only');
  } else if (includeNews === 'false') {
    contentTypeFilter = 'user_post';
    logger.info('Filter: User posts only (includeNews=false)');
  } else {
    logger.info('Filter: All content types');
  }

  try {

    // Simplified Firestore query with timeout
    const queryTimeout = 5000; // 5 seconds timeout

    let postsData = [];
    let total = 0;

    try {
      // Build Firestore query
      let query = db.collection(collections.POSTS);

      // Apply content type filter
      if (contentTypeFilter) {
        // For links collection, check if documents have 'type' field
        // If not, we'll filter in memory after fetching
        query = query.where('type', '==', contentTypeFilter);
      }

      // Apply category filter
      if (category !== 'all') {
        query = query.where('category', '==', category);
      }

      // Apply search filter with sanitization
      if (search.trim()) {
        try {
          const sanitizedSearch = validateSearchInput(search);
          // Simple text search (Firestore doesn't support full-text search natively)
          // This is a basic implementation - for production, consider using Algolia or similar
          query = query.where('title', '>=', sanitizedSearch)
                      .where('title', '<=', sanitizedSearch + '\uf8ff');
        } catch (searchError) {
          logger.warn('Invalid search input', { search, error: searchError.message });
          // Skip search filter if input is invalid
        }
      }

      // Apply sorting - use fields that exist in links collection
      if (sort === 'newest') {
        query = query.orderBy('createdAt', 'desc');
      } else if (sort === 'trending') {
        // Use voteCount or similar field that exists in links collection
        query = query.orderBy('voteCount', 'desc').orderBy('createdAt', 'desc');
      } else {
        query = query.orderBy('createdAt', 'desc'); // Default sort
      }

      // Apply pagination - use limit only (cursor-based pagination is more efficient)
      // For now, we'll use a reasonable limit to prevent memory issues
      const maxLimit = Math.min(parseInt(limit), 50); // Cap at 50 items per page
      query = query.limit(maxLimit);

      // Execute query with timeout
      const queryPromise = query.get();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Query timeout')), queryTimeout);
      });

      const snapshot = await Promise.race([queryPromise, timeoutPromise]);

      // Process results
      postsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
        };
      });

      // For total count, we'll use the returned data length for now
      // In production, consider maintaining separate counters or using aggregation queries
      total = postsData.length;

      logger.info('Firestore query successful', {
        count: postsData.length,
        contentTypeFilter,
        category,
        search: search.trim()
      });

    } catch (firestoreError) {
      logger.warn('Firestore query failed, trying simplified query', {
        error: firestoreError.message
      });

      // Try a simplified query without filters
      try {
        let simpleQuery = db.collection(collections.POSTS)
          .orderBy('createdAt', 'desc')
          .limit(parseInt(limit));

        const simpleSnapshot = await simpleQuery.get();
        postsData = simpleSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
            updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
          };
        });

        total = postsData.length;
        logger.info('Simplified query successful', { count: postsData.length });
      } catch (simpleError) {
        logger.error('Even simplified query failed', { error: simpleError.message });
        throw simpleError;
      }
    }

    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit));
    const hasNext = postsData.length === Math.min(parseInt(limit), 50); // Has more if we got full page
    const hasPrev = parseInt(page) > 1;

    logger.info('Posts fetched successfully', {
      count: postsData.length,
      total,
      page: parseInt(page),
      totalPages
    });

    const response = res.formatter.paginated({ posts: postsData }, {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages,
      hasNext,
      hasPrev
    }, 'Posts retrieved successfully');

    return res.status(200).json(response);

  } catch (error) {
    logger.error('Error fetching posts from Firestore', {
      error: error.message,
      stack: error.stack,
      query: { page, limit, sort, category, search }
    });

    // Return error response instead of mock data
    return res.formatter.error(res, 'Failed to fetch posts from database', 500, 'DATABASE_ERROR', error.message);
  }
});

// Create new post
router.post('/', validateCreatePost, validateContent, validateRateLimit, async (req, res) => {
  try {
    const { title, content, category = 'general', url, tags = [] } = req.body;

    // Basic validation (this should be handled by validation middleware, but keeping as fallback)
    if (!title || !content) {
      return res.formatter.validationError([
        { field: 'title', message: 'Title is required' },
        { field: 'content', message: 'Content is required' }
      ]);
    }

    // Get user info from auth middleware (if implemented)
    const userId = req.user?.uid || 'anonymous';
    const userEmail = req.user?.email || 'anonymous@example.com';
    const userDisplayName = req.user?.displayName || 'Người dùng ẩn danh';

    // Create post document
    const postData = {
      title: title.trim(),
      content: content.trim(),
      author: {
        uid: userId,
        email: userEmail,
        displayName: userDisplayName
      },
      type: 'user_post',
      category,
      url: url || null,
      tags: Array.isArray(tags) ? tags : [],
      voteStats: {
        safe: 0,
        unsafe: 0,
        suspicious: 0,
        total: 0
      },
      voteScore: 0,
      commentCount: 0,
      verified: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Save to Firestore
    const docRef = await db.collection(collections.POSTS).add(postData);

    // Invalidate posts cache
    cacheManager.invalidatePostsCache().catch(error => {
      logger.error('Failed to invalidate posts cache', { error: error.message });
    });

    logger.info('Post created successfully', {
      postId: docRef.id,
      userId,
      title: title.substring(0, 50)
    });

    // Return created post
    return res.formatter.created({
      post: {
        id: docRef.id,
        ...postData,
        createdAt: postData.createdAt.toISOString(),
        updatedAt: postData.updatedAt.toISOString()
      }
    }, 'Post created successfully');

  } catch (error) {
    logger.error('Error creating post', { error: error.message });

    res.status(500).json({
      success: false,
      error: 'Failed to create post',
      details: error.message
    });
  }
});

// Get single post by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const postDoc = await db.collection(collections.POSTS).doc(id).get();

    if (!postDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    const postData = postDoc.data();
    const post = {
      id: postDoc.id,
      ...postData,
      createdAt: postData.createdAt?.toDate?.()?.toISOString() || postData.createdAt,
      updatedAt: postData.updatedAt?.toDate?.()?.toISOString() || postData.updatedAt
    };

    res.json({
      success: true,
      data: { post }
    });

  } catch (error) {
    logger.error('Error fetching post', { error: error.message, postId: req.params.id });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch post'
    });
  }
});

// Development routes for sample data (always available for testing)
if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV !== 'production') {
  // Create sample data
  router.post('/dev/sample-data', async (req, res) => {
    try {
      const result = await createSampleData();
      res.json({
        success: true,
        message: 'Sample data created successfully',
        data: result
      });
    } catch (error) {
      logger.error('Error creating sample data', { error: error.message });
      res.status(500).json({
        success: false,
        error: 'Failed to create sample data',
        details: error.message
      });
    }
  });

  // Clear sample data
  router.delete('/dev/sample-data', async (req, res) => {
    try {
      const result = await clearSampleData();
      res.json({
        success: true,
        message: 'Sample data cleared successfully',
        data: result
      });
    } catch (error) {
      logger.error('Error clearing sample data', { error: error.message });
      res.status(500).json({
        success: false,
        error: 'Failed to clear sample data',
        details: error.message
      });
    }
  });
}

module.exports = router;
