const axios = require('axios');

class NewsApiService {
    constructor() {
        this.apiKey = process.env.NEWSAPI_API_KEY;
        this.baseUrl = process.env.NEWSAPI_BASE_URL || 'https://newsapi.org/v2';
        
        if (!this.apiKey) {
            console.warn('NewsAPI API key not found in environment variables');
        }
    }

    /**
     * Get top headlines
     * @param {Object} options - Query options
     * @param {string} options.country - Country code (e.g., 'us', 'vn')
     * @param {string} options.category - Category (business, entertainment, general, health, science, sports, technology)
     * @param {string} options.sources - Comma-separated string of news sources
     * @param {string} options.q - Keywords or phrases to search for
     * @param {number} options.pageSize - Number of results to return (max 100)
     * @param {number} options.page - Page number to retrieve
     * @returns {Promise<Object>} News articles
     */
    async getTopHeadlines(options = {}) {
        try {
            const params = {
                apiKey: this.apiKey,
                ...options
            };

            // Remove undefined values
            Object.keys(params).forEach(key => {
                if (params[key] === undefined) {
                    delete params[key];
                }
            });

            const response = await axios.get(`${this.baseUrl}/top-headlines`, {
                params,
                timeout: 10000
            });

            return {
                success: true,
                data: response.data,
                totalResults: response.data.totalResults,
                articles: response.data.articles
            };
        } catch (error) {
            console.error('NewsAPI getTopHeadlines error:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || error.message,
                data: null
            };
        }
    }

    /**
     * Search for news articles
     * @param {Object} options - Search options
     * @param {string} options.q - Keywords or phrases to search for (required)
     * @param {string} options.sources - Comma-separated string of news sources
     * @param {string} options.domains - Comma-separated string of domains to restrict search
     * @param {string} options.excludeDomains - Comma-separated string of domains to exclude
     * @param {string} options.from - Oldest article date (ISO 8601 format)
     * @param {string} options.to - Newest article date (ISO 8601 format)
     * @param {string} options.language - Language code (e.g., 'en', 'vi')
     * @param {string} options.sortBy - Sort order (relevancy, popularity, publishedAt)
     * @param {number} options.pageSize - Number of results to return (max 100)
     * @param {number} options.page - Page number to retrieve
     * @returns {Promise<Object>} Search results
     */
    async searchNews(options = {}) {
        try {
            if (!options.q) {
                throw new Error('Search query (q) is required');
            }

            const params = {
                apiKey: this.apiKey,
                ...options
            };

            // Remove undefined values
            Object.keys(params).forEach(key => {
                if (params[key] === undefined) {
                    delete params[key];
                }
            });

            const response = await axios.get(`${this.baseUrl}/everything`, {
                params,
                timeout: 10000
            });

            return {
                success: true,
                data: response.data,
                totalResults: response.data.totalResults,
                articles: response.data.articles
            };
        } catch (error) {
            console.error('NewsAPI searchNews error:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || error.message,
                data: null
            };
        }
    }

    /**
     * Get news sources
     * @param {Object} options - Filter options
     * @param {string} options.category - Category to filter by
     * @param {string} options.language - Language to filter by
     * @param {string} options.country - Country to filter by
     * @returns {Promise<Object>} Available news sources
     */
    async getSources(options = {}) {
        try {
            const params = {
                apiKey: this.apiKey,
                ...options
            };

            // Remove undefined values
            Object.keys(params).forEach(key => {
                if (params[key] === undefined) {
                    delete params[key];
                }
            });

            const response = await axios.get(`${this.baseUrl}/sources`, {
                params,
                timeout: 10000
            });

            return {
                success: true,
                data: response.data,
                sources: response.data.sources
            };
        } catch (error) {
            console.error('NewsAPI getSources error:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || error.message,
                data: null
            };
        }
    }

    /**
     * Get Vietnam-specific news
     * @param {Object} options - Query options
     * @returns {Promise<Object>} Vietnam news articles
     */
    async getVietnamNews(options = {}) {
        const vietnamOptions = {
            q: 'Vietnam OR Việt Nam',
            language: 'vi',
            sortBy: 'publishedAt',
            pageSize: 20,
            ...options
        };

        return await this.searchNews(vietnamOptions);
    }

    /**
     * Get fact-checking related news
     * @param {Object} options - Query options
     * @returns {Promise<Object>} Fact-checking news articles
     */
    async getFactCheckNews(options = {}) {
        const factCheckOptions = {
            q: 'fact check OR misinformation OR fake news OR disinformation',
            sortBy: 'publishedAt',
            pageSize: 20,
            ...options
        };

        return await this.searchNews(factCheckOptions);
    }
}

module.exports = new NewsApiService();
