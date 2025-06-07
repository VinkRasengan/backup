const express = require('express');
const router = express.Router();
const { selectCommunityController, injectCommunityController } = require('../middleware/databaseSelector');

// Try to load auth middleware, fallback if not available
let authenticateToken;
try {
    const authMiddleware = require('../middleware/auth');
    authenticateToken = authMiddleware.authenticateToken;
} catch (error) {
    console.warn('⚠️ Auth middleware not available for community routes, using fallback');
    authenticateToken = (req, res, next) => {
        req.user = { 
            userId: 'demo-user', 
            email: 'demo@example.com',
            name: 'Demo User',
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100'
        };
        next();
    };
}

// Public routes (no authentication required)

/**
 * @route GET /api/community/posts
 * @desc Get community posts with filtering and pagination
 * @access Public
 * @param {string} [sort] - Sort order: 'newest', 'trending', 'most_voted'
 * @param {string} [category] - Filter by category
 * @param {string} [search] - Search in title, content, tags
 * @param {number} [page] - Page number (default: 1)
 * @param {number} [limit] - Posts per page (default: 10)
 * @param {string} [includeNews] - Include real news articles (default: 'true')
 */
router.get('/posts', injectCommunityController, (req, res) => {
    req.communityController.getCommunityPosts(req, res);
});

/**
 * @route GET /api/community/posts/:id
 * @desc Get single post by ID
 * @access Public
 * @param {string} id - Post ID
 */
router.get('/posts/:id', injectCommunityController, (req, res) => {
    req.communityController.getPostById(req, res);
});

/**
 * @route GET /api/community/stats
 * @desc Get community statistics
 * @access Public
 */
router.get('/stats', injectCommunityController, (req, res) => {
    req.communityController.getCommunityStats(req, res);
});

// Protected routes (authentication required)

/**
 * @route POST /api/community/posts
 * @desc Create new community post
 * @access Private
 * @body {string} title - Post title (required)
 * @body {string} content - Post content (required)
 * @body {string} [url] - Related URL
 * @body {string} [category] - Post category
 * @body {string[]} [tags] - Post tags
 */
router.post('/posts', authenticateToken, communityController.createPost.bind(communityController));

/**
 * @route GET /api/community/trending
 * @desc Get trending posts (enhanced for authenticated users)
 * @access Private
 */
router.get('/trending', authenticateToken, async (req, res) => {
    try {
        // Enhanced trending algorithm for authenticated users
        req.query.sort = 'trending';
        req.query.limit = req.query.limit || 20; // More results for authenticated users
        await communityController.getCommunityPosts(req, res);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch trending posts',
            message: error.message
        });
    }
});

/**
 * @route GET /api/community/my-posts
 * @desc Get current user's posts
 * @access Private
 */
router.get('/my-posts', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        
        // This would normally query the database for user's posts
        // For now, we'll filter the mock posts
        const userPosts = (communityController.posts || []).filter(post =>
            post.author.id === userId
        );

        res.json({
            success: true,
            data: {
                posts: userPosts,
                totalPosts: userPosts.length
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user posts',
            message: error.message
        });
    }
});

/**
 * @route GET /api/community/categories
 * @desc Get available post categories
 * @access Public
 */
router.get('/categories', (req, res) => {
    try {
        const categories = [
            { id: 'all', name: 'Tất cả', icon: '📋', count: 0 },
            { id: 'health', name: 'Sức khỏe', icon: '🏥', count: 0 },
            { id: 'security', name: 'Bảo mật', icon: '🔒', count: 0 },
            { id: 'technology', name: 'Công nghệ', icon: '💻', count: 0 },
            { id: 'economy', name: 'Kinh tế', icon: '💰', count: 0 },
            { id: 'politics', name: 'Chính trị', icon: '🏛️', count: 0 },
            { id: 'social', name: 'Xã hội', icon: '👥', count: 0 },
            { id: 'education', name: 'Giáo dục', icon: '📚', count: 0 },
            { id: 'environment', name: 'Môi trường', icon: '🌱', count: 0 },
            { id: 'general', name: 'Tổng hợp', icon: '📰', count: 0 }
        ];

        // Count posts in each category
        const posts = (communityController.posts || []);
        const categoryCounts = posts.reduce((counts, post) => {
            counts[post.category] = (counts[post.category] || 0) + 1;
            counts.all = (counts.all || 0) + 1;
            return counts;
        }, {});

        // Update counts
        categories.forEach(category => {
            category.count = categoryCounts[category.id] || 0;
        });

        res.json({
            success: true,
            data: categories,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch categories',
            message: error.message
        });
    }
});

/**
 * @route GET /api/community/tags
 * @desc Get popular tags
 * @access Public
 */
router.get('/tags', (req, res) => {
    try {
        const posts = (communityController.posts || []);
        const tagCounts = {};

        // Count tag occurrences
        posts.forEach(post => {
            post.tags.forEach(tag => {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
        });

        // Sort tags by popularity
        const popularTags = Object.entries(tagCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 20)
            .map(([tag, count]) => ({ tag, count }));

        res.json({
            success: true,
            data: popularTags,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch tags',
            message: error.message
        });
    }
});

/**
 * @route GET /api/community/feed
 * @desc Get personalized feed for authenticated users
 * @access Private
 */
router.get('/feed', authenticateToken, async (req, res) => {
    try {
        // This would normally be personalized based on user preferences
        // For now, return a mix of trending and recent posts
        req.query.sort = 'trending';
        req.query.limit = req.query.limit || 15;
        req.query.includeNews = 'true';
        
        await communityController.getCommunityPosts(req, res);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch personalized feed',
            message: error.message
        });
    }
});

module.exports = router;
