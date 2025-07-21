const express = require('express');
const router = express.Router();
const { db, collections } = require('../config/firebase');
const logger = require('../utils/logger');
const { getUserId, getUserEmail, getUserDisplayName } = require('../middleware/auth');
const { createSampleData, clearSampleData } = require('../utils/sampleData');
const CommunityEventHandler = require('../events/communityEventHandler');

// Load environment variables from root .env
require('dotenv').config({ path: require('path').join(__dirname, '../../../../.env') });

// Initialize event handler
const eventHandler = new CommunityEventHandler();

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
      includeNews = true,
      // New enhanced filter parameters
      voteFilter = 'all', // all, safe, unsafe, suspicious
      timeFilter = 'all', // all, today, week, month
      sourceFilter = 'all' // all, verified, user_posts, news_only
    } = req.query;

    const offset = (page - 1) * limit;

    logger.info('Get links request', {
      page,
      limit,
      sort,
      category,
      search,
      newsOnly,
      includeNews,
      voteFilter,
      timeFilter,
      sourceFilter
    });

    // Build query
    let query = db.collection(collections.POSTS);

    // Filter by category if provided
    if (category && category !== 'all') {
      query = query.where('category', '==', category);
    }

    // Filter by type based on sourceFilter and existing logic
    if (sourceFilter === 'news_only' || newsOnly === 'true' || newsOnly === true) {
      query = query.where('type', '==', 'news');
    } else if (sourceFilter === 'user_posts' || includeNews === 'false' || includeNews === false) {
      query = query.where('type', '==', 'user_post');
    }

    // Filter by verified status if sourceFilter is 'verified'
    if (sourceFilter === 'verified') {
      query = query.where('verified', '==', true);
    }

    // Get all documents first (workaround for missing composite index)
    const snapshot = await query.get();
    let links = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Ensure all required fields exist for frontend compatibility
        title: data.title || '',
        content: data.content || '',
        url: data.url || null,
        author: data.author || { uid: 'unknown', email: 'unknown@example.com', displayName: 'Unknown User' },
        type: data.type || 'user_post',
        category: data.category || 'general',
        tags: data.tags || [],
        // Image fields - ensure all variants are available
        imageUrl: data.imageUrl || null,
        screenshot: data.screenshot || null,
        images: data.images || [],
        urlToImage: data.urlToImage || null,
        thumbnailUrl: data.thumbnailUrl || null,
        // Vote and engagement fields
        voteStats: data.voteStats || { upvotes: 0, downvotes: 0, total: 0, score: 0, safe: 0, unsafe: 0, suspicious: 0 },
        voteScore: data.voteScore || 0,
        commentCount: data.commentCount || 0,
        viewCount: data.viewCount || 0,
        // Trust and verification fields
        verified: data.verified || false,
        trustScore: data.trustScore || null,
        // Search and metadata
        searchTerms: data.searchTerms || [],
        // Timestamps
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

    // Apply vote filter
    if (voteFilter && voteFilter !== 'all') {
      links = links.filter(link => {
        const voteStats = link.voteStats || {};
        switch (voteFilter) {
        case 'safe':
          return (voteStats.safe || 0) > (voteStats.unsafe || 0) && (voteStats.safe || 0) > (voteStats.suspicious || 0);
        case 'unsafe':
          return (voteStats.unsafe || 0) > (voteStats.safe || 0) && (voteStats.unsafe || 0) > (voteStats.suspicious || 0);
        case 'suspicious':
          return (voteStats.suspicious || 0) > (voteStats.safe || 0) && (voteStats.suspicious || 0) > (voteStats.unsafe || 0);
        default:
          return true;
        }
      });
    }

    // Apply time filter
    if (timeFilter && timeFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (timeFilter) {
      case 'today':
        filterDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        filterDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        filterDate.setMonth(now.getMonth() - 1);
        break;
      default:
        filterDate.setFullYear(1970); // Include all
      }

      links = links.filter(link => {
        const createdAt = new Date(link.createdAt);
        return createdAt >= filterDate;
      });
    }

    // Enhanced sorting options
    switch (sort) {
    case 'newest':
      links.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      break;
    case 'oldest':
      links.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      break;
    case 'trending':
    case 'popular':
      // Trending: combination of recent activity, votes, and engagement
      links.sort((a, b) => {
        const aScore = (a.voteStats?.score || 0) + (a.commentCount || 0) * 2 + (a.viewCount || 0) * 0.1;
        const bScore = (b.voteStats?.score || 0) + (b.commentCount || 0) * 2 + (b.viewCount || 0) * 0.1;
        
        // Factor in recency (newer posts get slight boost)
        const aRecency = (Date.now() - new Date(a.createdAt).getTime()) / (1000 * 60 * 60 * 24); // days old
        const bRecency = (Date.now() - new Date(b.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        
        const aFinalScore = aScore * Math.exp(-aRecency * 0.1); // Exponential decay
        const bFinalScore = bScore * Math.exp(-bRecency * 0.1);
        
        return bFinalScore - aFinalScore;
      });
      break;
    case 'most_voted':
      links.sort((a, b) => {
        const aTotal = (a.voteStats?.safe || 0) + (a.voteStats?.unsafe || 0) + (a.voteStats?.suspicious || 0);
        const bTotal = (b.voteStats?.safe || 0) + (b.voteStats?.unsafe || 0) + (b.voteStats?.suspicious || 0);
        return bTotal - aTotal;
      });
      break;
    case 'most_commented':
    case 'comments':
      links.sort((a, b) => (b.commentCount || 0) - (a.commentCount || 0));
      break;
    case 'controversial':
      // Posts with high engagement but mixed votes
      links.sort((a, b) => {
        const aControversy = Math.min(
          (a.voteStats?.safe || 0) + (a.voteStats?.unsafe || 0),
          (a.voteStats?.safe || 0) + (a.voteStats?.suspicious || 0),
          (a.voteStats?.unsafe || 0) + (a.voteStats?.suspicious || 0)
        );
        const bControversy = Math.min(
          (b.voteStats?.safe || 0) + (b.voteStats?.unsafe || 0),
          (b.voteStats?.safe || 0) + (b.voteStats?.suspicious || 0),
          (b.voteStats?.unsafe || 0) + (b.voteStats?.suspicious || 0)
        );
        return bControversy - aControversy;
      });
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
      limit,
      appliedFilters: {
        voteFilter,
        timeFilter,
        sourceFilter,
        sort
      }
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
          includeNews,
          voteFilter,
          timeFilter,
          sourceFilter
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
      // Image fields - support all variants for maximum frontend compatibility
      imageUrl: imageUrl || null,
      screenshot: screenshot || null,
      images: Array.isArray(images) ? images : [],
      urlToImage: urlToImage || null,
      thumbnailUrl: thumbnailUrl || null,
      // Vote and engagement stats
      voteStats: {
        upvotes: 0,
        downvotes: 0,
        total: 0,
        score: 0
      },
      voteScore: 0,
      commentCount: 0,
      viewCount: 0,
      // Trust and verification
      verified: false,
      trustScore: null,
      // Search optimization
      searchTerms,
      // Timestamps
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await db.collection(collections.POSTS).add(linkData);

    logger.info('Link created successfully', {
      id: docRef.id,
      title,
      userId
    });

    // Publish post created event
    const postData = {
      id: docRef.id,
      ...linkData
    };
    await eventHandler.publishPostCreatedEvent(postData);

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
      // Ensure all required fields exist for frontend compatibility
      title: data.title || '',
      content: data.content || '',
      url: data.url || null,
      author: data.author || { uid: 'unknown', email: 'unknown@example.com', displayName: 'Unknown User' },
      type: data.type || 'user_post',
      category: data.category || 'general',
      tags: data.tags || [],
      // Image fields - ensure all variants are available
      imageUrl: data.imageUrl || null,
      screenshot: data.screenshot || null,
      images: data.images || [],
      urlToImage: data.urlToImage || null,
      thumbnailUrl: data.thumbnailUrl || null,
      // Vote and engagement fields
      voteStats: data.voteStats || { upvotes: 0, downvotes: 0, total: 0, score: 0 },
      voteScore: data.voteScore || 0,
      commentCount: data.commentCount || 0,
      viewCount: data.viewCount || 0,
      // Trust and verification fields
      verified: data.verified || false,
      trustScore: data.trustScore || null,
      // Search and metadata
      searchTerms: data.searchTerms || [],
      // Timestamps
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

// Delete a link by ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);

    logger.info('Delete link request', { id, userId });

    // Get the link first to check ownership
    const doc = await db.collection(collections.POSTS).doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Link not found',
        code: 'LINK_NOT_FOUND'
      });
    }

    const linkData = doc.data();

    // Check if user owns this link
    if (linkData.author?.uid !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only delete your own links',
        code: 'UNAUTHORIZED_DELETE'
      });
    }

    // Delete the link
    await db.collection(collections.POSTS).doc(id).delete();

    // TODO: Also delete associated comments and votes
    // This should be done in a transaction for data consistency

    logger.info('Link deleted successfully', { id, userId });

    res.json({
      success: true,
      message: 'Link deleted successfully'
    });

  } catch (error) {
    logger.error('Delete link error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to delete link',
      code: 'DELETE_LINK_ERROR'
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