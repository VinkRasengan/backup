const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');

// Try to load auth middleware, fallback if not available
let authenticateToken;
try {
    const authMiddleware = require('../middleware/auth');
    authenticateToken = authMiddleware.authenticateToken;
} catch (error) {
    console.warn('⚠️ Auth middleware not available for news routes, using fallback');
    authenticateToken = (req, res, next) => {
        req.user = { userId: 'demo-user', email: 'demo@example.com' };
        next();
    };
}

// Public routes (no authentication required)

/**
 * @route GET /api/news/latest
 * @desc Get latest news from both APIs
 * @access Public
 * @param {string} [source] - API source ('newsapi', 'newsdata', or 'both')
 * @param {string} [country] - Country code for NewsAPI
 * @param {string} [category] - News category
 * @param {string} [language] - Language code
 * @param {number} [pageSize] - Number of results (NewsAPI)
 * @param {string} [size] - Number of results (NewsData)
 */
router.get('/latest', newsController.getLatestNews);

/**
 * @route GET /api/news/search
 * @desc Search news from both APIs
 * @access Public
 * @param {string} q - Search query (required)
 * @param {string} [source] - API source ('newsapi', 'newsdata', or 'both')
 * @param {string} [language] - Language code
 * @param {string} [sortBy] - Sort order (NewsAPI)
 * @param {number} [pageSize] - Number of results (NewsAPI)
 * @param {string} [size] - Number of results (NewsData)
 */
router.get('/search', newsController.searchNews);

/**
 * @route GET /api/news/vietnam
 * @desc Get Vietnam-specific news
 * @access Public
 * @param {string} [source] - API source ('newsapi', 'newsdata', or 'both')
 */
router.get('/vietnam', newsController.getVietnamNews);

/**
 * @route GET /api/news/fact-check
 * @desc Get fact-checking related news
 * @access Public
 * @param {string} [source] - API source ('newsapi', 'newsdata', or 'both')
 */
router.get('/fact-check', newsController.getFactCheckNews);

/**
 * @route GET /api/news/category/:category
 * @desc Get news by category
 * @access Public
 * @param {string} category - News category (business, technology, health, etc.)
 * @param {string} [source] - API source ('newsapi', 'newsdata', or 'both')
 */
router.get('/category/:category', newsController.getNewsByCategory);

/**
 * @route GET /api/news/sources
 * @desc Get available news sources
 * @access Public
 * @param {string} [source] - API source ('newsapi', 'newsdata', or 'both')
 * @param {string} [country] - Country code filter
 * @param {string} [category] - Category filter
 * @param {string} [language] - Language filter
 */
router.get('/sources', newsController.getSources);

/**
 * @route GET /api/news/archive
 * @desc Search news archive (NewsData.io only)
 * @access Public
 * @param {string} q - Search query (required)
 * @param {string} from_date - Start date (YYYY-MM-DD, required)
 * @param {string} to_date - End date (YYYY-MM-DD, required)
 * @param {string} [language] - Language code
 * @param {string} [country] - Country code
 * @param {string} [size] - Number of results
 */
router.get('/archive', newsController.searchArchive);

// Protected routes (authentication required)

/**
 * @route GET /api/news/premium/latest
 * @desc Get latest news with premium features (for authenticated users)
 * @access Private
 */
router.get('/premium/latest', authenticateToken, async (req, res) => {
    try {
        // Add premium features like more results, advanced filtering, etc.
        const options = {
            ...req.query,
            pageSize: 50, // More results for premium users
            size: 50
        };

        const results = await newsController.getLatestNews({ query: options }, res);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch premium news',
            message: error.message
        });
    }
});

/**
 * @route GET /api/news/premium/search
 * @desc Advanced news search for authenticated users
 * @access Private
 */
router.get('/premium/search', authenticateToken, async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q) {
            return res.status(400).json({
                success: false,
                error: 'Search query (q) is required'
            });
        }

        // Add premium search features
        const options = {
            ...req.query,
            pageSize: 50, // More results for premium users
            size: 50
        };

        const results = await newsController.searchNews({ query: options }, res);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to perform premium search',
            message: error.message
        });
    }
});

module.exports = router;
