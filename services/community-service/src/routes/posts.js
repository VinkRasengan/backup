const express = require('express');
const router = express.Router();
const { db, collections } = require('../config/firebase');
const Logger = require('../../shared/utils/logger');

const logger = new Logger('community-service');

// Get posts from Firestore
router.get('/', async (req, res) => {
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
      // Skip Firestore for now, go directly to fallback
      throw new Error('Using fallback mock data for testing');

    } catch (firestoreError) {
      logger.warn('Firestore query failed, using fallback', {
        error: firestoreError.message
      });
      throw firestoreError; // Let it fall through to catch block
    }

    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit));
    const hasNext = parseInt(page) < totalPages;
    const hasPrev = parseInt(page) > 1;

    logger.info('Posts fetched successfully', {
      count: postsData.length,
      total,
      page: parseInt(page),
      totalPages
    });

    res.json({
      success: true,
      data: {
        posts: postsData,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
          hasNext,
          hasPrev
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching posts', { error: error.message });

    // Generate filtered mock data based on contentTypeFilter
    let mockPosts = [];

    // User posts mock data
    const userPosts = [
      {
        id: 'user-post-1',
        title: 'Cảnh báo: Trang web lừa đảo mới được phát hiện',
        content: 'Một trang web giả mạo ngân hàng đã được phát hiện. Hãy cẩn thận khi nhập thông tin cá nhân...',
        author: {
          email: 'user@example.com',
          displayName: 'Người dùng ẩn danh'
        },
        type: 'user_post',
        category: 'phishing',
        voteStats: {
          safe: 2,
          unsafe: 15,
          suspicious: 3,
          total: 20
        },
        voteScore: 10,
        commentCount: 5,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        tags: ['phishing', 'banking', 'scam'],
        url: 'https://suspicious-bank-site.com',
        verified: false
      },
      {
        id: 'user-post-2',
        title: 'Chia sẻ: Cách nhận biết email lừa đảo',
        content: 'Dựa trên kinh nghiệm cá nhân, tôi muốn chia sẻ một số dấu hiệu nhận biết email lừa đảo...',
        author: {
          email: 'expert@security.com',
          displayName: 'Chuyên gia bảo mật'
        },
        type: 'user_post',
        category: 'education',
        voteStats: {
          safe: 25,
          unsafe: 1,
          suspicious: 2,
          total: 28
        },
        voteScore: 22,
        commentCount: 12,
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        tags: ['education', 'email', 'tips'],
        verified: true
      }
    ];

    // News posts mock data
    const newsPosts = [
      {
        id: 'news-1',
        title: 'Cảnh báo từ Bộ TT&TT: Xuất hiện chiêu thức lừa đảo mới qua tin nhắn',
        content: 'Bộ Thông tin và Truyền thông vừa phát đi cảnh báo về chiêu thức lừa đảo mới thông qua tin nhắn SMS...',
        author: {
          email: 'news@vnexpress.net',
          displayName: 'VnExpress'
        },
        type: 'news',
        category: 'official_warning',
        source: 'VnExpress',
        voteStats: {
          safe: 45,
          unsafe: 2,
          suspicious: 1,
          total: 48
        },
        voteScore: 42,
        commentCount: 8,
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        tags: ['official', 'sms', 'warning'],
        url: 'https://vnexpress.net/canh-bao-lua-dao-moi',
        verified: true,
        trustScore: 95
      },
      {
        id: 'news-2',
        title: 'Ngân hàng Nhà nước cảnh báo website giả mạo các ngân hàng',
        content: 'Ngân hàng Nhà nước Việt Nam đã phát hiện nhiều website giả mạo các ngân hàng thương mại...',
        author: {
          email: 'news@tuoitre.vn',
          displayName: 'Tuổi Trẻ Online'
        },
        type: 'news',
        category: 'banking_security',
        source: 'Tuổi Trẻ',
        voteStats: {
          safe: 38,
          unsafe: 1,
          suspicious: 0,
          total: 39
        },
        voteScore: 37,
        commentCount: 15,
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        tags: ['banking', 'official', 'website'],
        url: 'https://tuoitre.vn/ngan-hang-gia-mao',
        verified: true,
        trustScore: 92
      }
    ];

    // Filter posts based on contentTypeFilter
    if (contentTypeFilter === 'user_post') {
      mockPosts = userPosts;
      logger.info('Returning user posts only');
    } else if (contentTypeFilter === 'news') {
      mockPosts = newsPosts;
      logger.info('Returning news posts only');
    } else {
      mockPosts = [...userPosts, ...newsPosts];
      logger.info('Returning all posts');
    }

    // Fallback to filtered mock data
    res.json({
      success: true,
      data: {
        posts: mockPosts,
        pagination: {
          page: 1,
          limit: 10,
          total: mockPosts.length,
          totalPages: Math.ceil(mockPosts.length / parseInt(limit)),
          hasNext: false,
          hasPrev: false
        }
      },
      fallback: true,
      error: error.message
    });
  }
});

// Create new post
router.post('/', async (req, res) => {
  try {
    const { title, content, category = 'general', url, tags = [] } = req.body;

    // Basic validation
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        error: 'Title and content are required'
      });
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

    logger.info('Post created successfully', {
      postId: docRef.id,
      userId,
      title: title.substring(0, 50)
    });

    // Return created post
    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: {
        post: {
          id: docRef.id,
          ...postData,
          createdAt: postData.createdAt.toISOString(),
          updatedAt: postData.updatedAt.toISOString()
        }
      }
    });

  } catch (error) {
    logger.error('Error creating post', { error: error.message });

    res.status(500).json({
      success: false,
      error: 'Failed to create post',
      details: error.message
    });
  }
});

router.get('/:id', (req, res) => {
  res.json({
    success: true,
    post: {
      id: req.params.id,
      title: 'Suspicious website reported',
      content: 'Found this suspicious website that looks like a phishing attempt...',
      author: 'user@example.com',
      votes: 5,
      comments: 2,
      createdAt: new Date().toISOString()
    }
  });
});

module.exports = router;
