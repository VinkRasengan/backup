const axios = require('axios');

class NewsDataService {
    constructor() {
        this.apiKey = process.env.NEWSDATA_API_KEY;
        this.baseUrl = process.env.NEWSDATA_BASE_URL || 'https://newsdata.io/api/1';
        
        if (!this.apiKey) {
            console.warn('NewsData.io API key not found in environment variables');
        }
    }

    /**
     * Get latest news
     * @param {Object} options - Query options
     * @param {string} options.q - Keywords to search for
     * @param {string} options.qInTitle - Keywords to search in title only
     * @param {string} options.qInMeta - Keywords to search in meta description
     * @param {string} options.country - Country codes (comma-separated, e.g., 'vn,us')
     * @param {string} options.category - Categories (comma-separated: business, entertainment, environment, food, health, politics, science, sports, technology, top, tourism, world)
     * @param {string} options.language - Language codes (comma-separated, e.g., 'vi,en')
     * @param {string} options.domain - Specific domains to include
     * @param {string} options.domainurl - Specific domain URLs to include
     * @param {string} options.excludedomain - Domains to exclude
     * @param {string} options.timeframe - Time frame (h1, h6, h12, h24 for hours, d1-d7 for days)
     * @param {string} options.from_date - Start date (YYYY-MM-DD)
     * @param {string} options.to_date - End date (YYYY-MM-DD)
     * @param {string} options.size - Number of results (max 50 for free plan)
     * @param {string} options.page - Page token for pagination
     * @returns {Promise<Object>} Latest news articles
     */
    async getLatestNews(options = {}) {
        try {
            const params = {
                apikey: this.apiKey,
                ...options
            };

            // Remove undefined values
            Object.keys(params).forEach(key => {
                if (params[key] === undefined) {
                    delete params[key];
                }
            });

            const response = await axios.get(`${this.baseUrl}/latest`, {
                params,
                timeout: 15000
            });

            return {
                success: true,
                data: response.data,
                totalResults: response.data.totalResults,
                articles: response.data.results,
                nextPage: response.data.nextPage
            };
        } catch (error) {
            console.error('NewsData getLatestNews error:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || error.message,
                data: null
            };
        }
    }

    /**
     * Search news archives
     * @param {Object} options - Search options
     * @param {string} options.q - Keywords to search for (required)
     * @param {string} options.qInTitle - Keywords to search in title only
     * @param {string} options.qInMeta - Keywords to search in meta description
     * @param {string} options.country - Country codes (comma-separated)
     * @param {string} options.category - Categories (comma-separated)
     * @param {string} options.language - Language codes (comma-separated)
     * @param {string} options.domain - Specific domains to include
     * @param {string} options.domainurl - Specific domain URLs to include
     * @param {string} options.excludedomain - Domains to exclude
     * @param {string} options.from_date - Start date (YYYY-MM-DD, required)
     * @param {string} options.to_date - End date (YYYY-MM-DD, required)
     * @param {string} options.size - Number of results (max 50 for free plan)
     * @param {string} options.page - Page token for pagination
     * @returns {Promise<Object>} Archive search results
     */
    async searchArchive(options = {}) {
        try {
            if (!options.q) {
                throw new Error('Search query (q) is required');
            }
            if (!options.from_date || !options.to_date) {
                throw new Error('Both from_date and to_date are required for archive search');
            }

            const params = {
                apikey: this.apiKey,
                ...options
            };

            // Remove undefined values
            Object.keys(params).forEach(key => {
                if (params[key] === undefined) {
                    delete params[key];
                }
            });

            const response = await axios.get(`${this.baseUrl}/archive`, {
                params,
                timeout: 15000
            });

            return {
                success: true,
                data: response.data,
                totalResults: response.data.totalResults,
                articles: response.data.results,
                nextPage: response.data.nextPage
            };
        } catch (error) {
            console.error('NewsData searchArchive error:', error.response?.data || error.message);
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
     * @param {string} options.country - Country codes to filter by
     * @param {string} options.category - Categories to filter by
     * @param {string} options.language - Language codes to filter by
     * @returns {Promise<Object>} Available news sources
     */
    async getSources(options = {}) {
        try {
            const params = {
                apikey: this.apiKey,
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
                sources: response.data.results
            };
        } catch (error) {
            console.error('NewsData getSources error:', error.response?.data || error.message);
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
            ...options
        };

        return await this.getLatestNews(vietnamOptions);
    }

    /**
     * Get fact-checking related news
     * @param {Object} options - Query options
     * @returns {Promise<Object>} Fact-checking news articles
     */
    async getFactCheckNews(options = {}) {
        const factCheckOptions = {
            q: 'fact check OR misinformation OR fake news OR disinformation',
            language: 'en,vi',
            ...options
        };

        return await this.getLatestNews(factCheckOptions);
    }

    /**
     * Get technology news
     * @param {Object} options - Query options
     * @returns {Promise<Object>} Technology news articles
     */
    async getTechnologyNews(options = {}) {
        const techOptions = {
            category: 'technology',
            language: 'en,vi',
            ...options
        };

        return await this.getLatestNews(techOptions);
    }

    /**
     * Get business news
     * @param {Object} options - Query options
     * @returns {Promise<Object>} Business news articles
     */
    async getBusinessNews(options = {}) {
        const businessOptions = {
            category: 'business',
            language: 'en,vi',
            ...options
        };

        return await this.getLatestNews(businessOptions);
    }
}

module.exports = new NewsDataService();
