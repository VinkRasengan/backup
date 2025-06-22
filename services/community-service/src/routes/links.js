const express = require('express');
const router = express.Router();
const { db, collections } = require('../config/firebase');
const Logger = require('../../shared/utils/logger');
const { getUserId, getUserEmail, getUserDisplayName } = require('../middleware/auth');
const { createSampleData, clearSampleData } = require('../utils/sampleData');

const logger = new Logger('community-service');

// Get links with filters (Facebook-style with pagination)
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = 'newest',
      category,
      search,
      newsOnly = false,
      includeNews = true
    } = req.query;

    const offset = (page - 1) * limit;

    logger.info('Get links request', {
      page,
      limit,
      sort,
      category,
      search,
      newsOnly,
      includeNews
    });

    // Build query
    let query = db.collection(collections.POSTS);

    // Filter by category if provided
    if (category && category !== 'all') {
      query = query.where('category', '==', category);
    }

    // Filter by type if newsOnly is true
    if (newsOnly === 'true' || newsOnly === true) {
      query = query.where('type', '==', 'news');
    } else if (includeNews === 'false' || includeNews === false) {
      query = query.where('type', '==', 'user_post');
    }

    // Get all documents first (workaround for missing composite index)
    const snapshot = await query.get();
    let links = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Ensure image fields exist for frontend compatibility
        imageUrl: data.imageUrl || null,
        screenshot: data.screenshot || null,
        images: data.images || [],
        urlToImage: data.urlToImage || null,
        thumbnailUrl: data.thumbnailUrl || null,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
      };
    });

    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase();
      links = links.filter(link =>
        link.title?.toLowerCase().includes(searchLower) ||
        link.content?.toLowerCase().includes(searchLower) ||
        link.tags?.some(tag => tag.toLowerCase().includes(searchLower)) ||
        link.searchTerms?.some(term => term.toLowerCase().includes(searchLower))
      );
    }

    // Sort links
    switch (sort) {
      case 'newest':
        links.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'oldest':
        links.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'popular':
        links.sort((a, b) => (b.voteStats?.score || 0) - (a.voteStats?.score || 0));
        break;
      case 'comments':
        links.sort((a, b) => (b.commentCount || 0) - (a.commentCount || 0));
        break;
      default:
        links.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    // Apply pagination
    const total = links.length;
    const paginatedLinks = links.slice(offset, offset + parseInt(limit));

    logger.info('Links retrieved successfully', {
      total,
      returned: paginatedLinks.length,
      page,
      limit
    });

    res.json({
      success: true,
      data: {
        posts: paginatedLinks, // Use "posts" for frontend compatibility
        links: paginatedLinks, // Keep "links" for API consistency
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: offset + parseInt(limit) < total,
          hasPrev: page > 1
        },
        filters: {
          sort,
          category,
          search,
          newsOnly,
          includeNews
        }
      }
    });

  } catch (error) {
    logger.error('Get links error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve links',
      code: 'GET_LINKS_ERROR'
    });
  }
});

// Create a new link (Facebook-style post creation)
router.post('/', async (req, res) => {
  try {
    const { title, content, url, category, tags, type = 'user_post', imageUrl, screenshot, images, urlToImage, thumbnailUrl } = req.body;

    // Get user info from auth middleware or request body
    const userId = getUserId(req);
    const userEmail = getUserEmail(req);
    const displayName = getUserDisplayName(req);

    logger.info('Create link request', { title, userId, type, category });

    // Validate required fields
    if (!title || !content || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: title, content, userId'
      });
    }

    // Create search terms for optimization
    const searchTerms = [
      title.toLowerCase(),
      content.toLowerCase(),
      ...(tags || []).map(tag => tag.toLowerCase()),
      category?.toLowerCase() || ''
    ].filter(term => term.length > 0);

    const linkData = {
      title,
      content,
      url: url || null,
      author: {
        uid: userId,
        email: userEmail || 'unknown@example.com',
        displayName: displayName || 'Anonymous User'
      },
      type,
      category: category || 'general',
      tags: tags || [],
      // Image fields for frontend compatibility
      imageUrl: imageUrl || null,
      screenshot: screenshot || null,
      images: images || [],
      urlToImage: urlToImage || null,
      thumbnailUrl: thumbnailUrl || null,
      voteStats: {
        upvotes: 0,
        downvotes: 0,
        total: 0,
        score: 0
      },
      voteScore: 0,
      commentCount: 0,
      verified: false,
      trustScore: null,
      searchTerms,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await db.collection(collections.POSTS).add(linkData);

    logger.info('Link created successfully', {
      id: docRef.id,
      title,
      userId
    });

    res.status(201).json({
      success: true,
      data: {
        id: docRef.id,
        ...linkData,
        createdAt: linkData.createdAt.toISOString(),
        updatedAt: linkData.updatedAt.toISOString()
      }
    });

  } catch (error) {
    logger.error('Create link error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to create link',
      code: 'CREATE_LINK_ERROR'
    });
  }
});

// Get single link by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    logger.info('Get single link request', { id });

    const doc = await db.collection(collections.POSTS).doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Link not found',
        code: 'LINK_NOT_FOUND'
      });
    }

    const data = doc.data();
    const linkData = {
      id: doc.id,
      ...data,
      // Ensure image fields exist for frontend compatibility
      imageUrl: data.imageUrl || null,
      screenshot: data.screenshot || null,
      images: data.images || [],
      urlToImage: data.urlToImage || null,
      thumbnailUrl: data.thumbnailUrl || null,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
    };

    logger.info('Link retrieved successfully', { id });

    res.json({
      success: true,
      data: linkData
    });

  } catch (error) {
    logger.error('Get single link error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve link',
      code: 'GET_LINK_ERROR'
    });
  }
});

// Development endpoints for sample data
router.post('/dev/sample-data', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        error: 'Sample data endpoints are not available in production',
        code: 'PRODUCTION_FORBIDDEN'
      });
    }

    logger.info('Creating sample data...');

    const result = await createSampleData();

    logger.info('Sample data created successfully', {
      linksCreated: result.linksCreated,
      commentsCreated: result.commentsCreated
    });

    res.json({
      success: true,
      message: 'Sample data created successfully',
      data: result
    });

  } catch (error) {
    logger.error('Create sample data error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to create sample data',
      code: 'CREATE_SAMPLE_DATA_ERROR'
    });
  }
});

router.delete('/dev/sample-data', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        error: 'Sample data endpoints are not available in production',
        code: 'PRODUCTION_FORBIDDEN'
      });
    }

    logger.info('Clearing sample data...');

    const result = await clearSampleData();

    logger.info('Sample data cleared successfully', result);

    res.json({
      success: true,
      message: 'Sample data cleared successfully',
      data: result
    });

  } catch (error) {
    logger.error('Clear sample data error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to clear sample data',
      code: 'CLEAR_SAMPLE_DATA_ERROR'
    });
  }
});

module.exports = router;