const newsApiService = require('../services/newsApiService');
const newsDataService = require('../services/newsDataService');

class NewsController {
    /**
     * Get latest news from both APIs
     */
    async getLatestNews(req, res) {
        try {
            const { source = 'both', ...options } = req.query;

            let results = {};

            if (source === 'newsapi' || source === 'both') {
                const newsApiResult = await newsApiService.getTopHeadlines({
                    country: 'us',
                    pageSize: 20,
                    ...options
                });
                results.newsapi = newsApiResult;
            }

            if (source === 'newsdata' || source === 'both') {
                const newsDataResult = await newsDataService.getLatestNews({
                    language: 'en',
                    ...options
                });
                results.newsdata = newsDataResult;
            }

            res.json({
                success: true,
                data: results,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Get latest news error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch latest news',
                message: error.message
            });
        }
    }

    /**
     * Search news from both APIs
     */
    async searchNews(req, res) {
        try {
            const { q, source = 'both', ...options } = req.query;

            if (!q) {
                return res.status(400).json({
                    success: false,
                    error: 'Search query (q) is required'
                });
            }

            let results = {};

            if (source === 'newsapi' || source === 'both') {
                const newsApiResult = await newsApiService.searchNews({
                    q,
                    sortBy: 'publishedAt',
                    pageSize: 20,
                    ...options
                });
                results.newsapi = newsApiResult;
            }

            if (source === 'newsdata' || source === 'both') {
                const newsDataResult = await newsDataService.getLatestNews({
                    q,
                    ...options
                });
                results.newsdata = newsDataResult;
            }

            res.json({
                success: true,
                data: results,
                query: q,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Search news error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to search news',
                message: error.message
            });
        }
    }

    /**
     * Get Vietnam-specific news
     */
    async getVietnamNews(req, res) {
        try {
            const { source = 'both', ...options } = req.query;

            let results = {};

            if (source === 'newsapi' || source === 'both') {
                const newsApiResult = await newsApiService.getVietnamNews(options);
                results.newsapi = newsApiResult;
            }

            if (source === 'newsdata' || source === 'both') {
                const newsDataResult = await newsDataService.getVietnamNews(options);
                results.newsdata = newsDataResult;
            }

            res.json({
                success: true,
                data: results,
                country: 'Vietnam',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Get Vietnam news error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch Vietnam news',
                message: error.message
            });
        }
    }

    /**
     * Get fact-checking related news
     */
    async getFactCheckNews(req, res) {
        try {
            const { source = 'both', ...options } = req.query;

            let results = {};

            if (source === 'newsapi' || source === 'both') {
                const newsApiResult = await newsApiService.getFactCheckNews(options);
                results.newsapi = newsApiResult;
            }

            if (source === 'newsdata' || source === 'both') {
                const newsDataResult = await newsDataService.getFactCheckNews(options);
                results.newsdata = newsDataResult;
            }

            res.json({
                success: true,
                data: results,
                category: 'fact-checking',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Get fact-check news error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch fact-checking news',
                message: error.message
            });
        }
    }

    /**
     * Get news by category
     */
    async getNewsByCategory(req, res) {
        try {
            const { category } = req.params;
            const { source = 'both', ...options } = req.query;

            if (!category) {
                return res.status(400).json({
                    success: false,
                    error: 'Category is required'
                });
            }

            let results = {};

            if (source === 'newsapi' || source === 'both') {
                const newsApiResult = await newsApiService.getTopHeadlines({
                    category,
                    pageSize: 20,
                    ...options
                });
                results.newsapi = newsApiResult;
            }

            if (source === 'newsdata' || source === 'both') {
                const newsDataResult = await newsDataService.getLatestNews({
                    category,
                    ...options
                });
                results.newsdata = newsDataResult;
            }

            res.json({
                success: true,
                data: results,
                category,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Get news by category error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch news by category',
                message: error.message
            });
        }
    }

    /**
     * Get news sources
     */
    async getSources(req, res) {
        try {
            const { source = 'both', ...options } = req.query;

            let results = {};

            if (source === 'newsapi' || source === 'both') {
                const newsApiResult = await newsApiService.getSources(options);
                results.newsapi = newsApiResult;
            }

            if (source === 'newsdata' || source === 'both') {
                const newsDataResult = await newsDataService.getSources(options);
                results.newsdata = newsDataResult;
            }

            res.json({
                success: true,
                data: results,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Get sources error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch news sources',
                message: error.message
            });
        }
    }

    /**
     * Search news archive (NewsData.io only)
     */
    async searchArchive(req, res) {
        try {
            const { q, from_date, to_date, ...options } = req.query;

            if (!q) {
                return res.status(400).json({
                    success: false,
                    error: 'Search query (q) is required'
                });
            }

            if (!from_date || !to_date) {
                return res.status(400).json({
                    success: false,
                    error: 'Both from_date and to_date are required for archive search'
                });
            }

            const result = await newsDataService.searchArchive({
                q,
                from_date,
                to_date,
                ...options
            });

            res.json({
                success: true,
                data: result,
                query: q,
                dateRange: { from: from_date, to: to_date },
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Search archive error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to search news archive',
                message: error.message
            });
        }
    }
}

module.exports = new NewsController();
