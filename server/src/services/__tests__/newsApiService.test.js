const newsApiService = require('../newsApiService');

// Mock axios to avoid making real API calls during tests
jest.mock('axios');
const axios = require('axios');

describe('NewsApiService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Set up environment variables for testing
        process.env.NEWSAPI_API_KEY = 'test-api-key';
        process.env.NEWSAPI_BASE_URL = 'https://newsapi.org/v2';
    });

    describe('getTopHeadlines', () => {
        it('should fetch top headlines successfully', async () => {
            const mockResponse = {
                data: {
                    status: 'ok',
                    totalResults: 2,
                    articles: [
                        {
                            title: 'Test Article 1',
                            description: 'Test description 1',
                            url: 'https://example.com/1'
                        },
                        {
                            title: 'Test Article 2',
                            description: 'Test description 2',
                            url: 'https://example.com/2'
                        }
                    ]
                }
            };

            axios.get.mockResolvedValue(mockResponse);

            const result = await newsApiService.getTopHeadlines({
                country: 'us',
                pageSize: 10
            });

            expect(result.success).toBe(true);
            expect(result.totalResults).toBe(2);
            expect(result.articles).toHaveLength(2);
            expect(axios.get).toHaveBeenCalledWith(
                'https://newsapi.org/v2/top-headlines',
                {
                    params: {
                        apiKey: 'test-api-key',
                        country: 'us',
                        pageSize: 10
                    },
                    timeout: 10000
                }
            );
        });

        it('should handle API errors gracefully', async () => {
            const mockError = {
                response: {
                    data: {
                        message: 'API key invalid'
                    }
                }
            };

            axios.get.mockRejectedValue(mockError);

            const result = await newsApiService.getTopHeadlines();

            expect(result.success).toBe(false);
            expect(result.error).toBe('API key invalid');
            expect(result.data).toBe(null);
        });
    });

    describe('searchNews', () => {
        it('should search news successfully', async () => {
            const mockResponse = {
                data: {
                    status: 'ok',
                    totalResults: 1,
                    articles: [
                        {
                            title: 'Search Result',
                            description: 'Search description',
                            url: 'https://example.com/search'
                        }
                    ]
                }
            };

            axios.get.mockResolvedValue(mockResponse);

            const result = await newsApiService.searchNews({
                q: 'test query',
                sortBy: 'publishedAt'
            });

            expect(result.success).toBe(true);
            expect(result.totalResults).toBe(1);
            expect(result.articles).toHaveLength(1);
            expect(axios.get).toHaveBeenCalledWith(
                'https://newsapi.org/v2/everything',
                {
                    params: {
                        apiKey: 'test-api-key',
                        q: 'test query',
                        sortBy: 'publishedAt'
                    },
                    timeout: 10000
                }
            );
        });

        it('should require search query', async () => {
            const result = await newsApiService.searchNews({});

            expect(result.success).toBe(false);
            expect(result.error).toBe('Search query (q) is required');
        });
    });

    describe('getSources', () => {
        it('should fetch sources successfully', async () => {
            const mockResponse = {
                data: {
                    status: 'ok',
                    sources: [
                        {
                            id: 'bbc-news',
                            name: 'BBC News',
                            category: 'general'
                        }
                    ]
                }
            };

            axios.get.mockResolvedValue(mockResponse);

            const result = await newsApiService.getSources({
                category: 'general'
            });

            expect(result.success).toBe(true);
            expect(result.sources).toHaveLength(1);
            expect(result.sources[0].id).toBe('bbc-news');
        });
    });

    describe('getVietnamNews', () => {
        it('should fetch Vietnam-specific news', async () => {
            const mockResponse = {
                data: {
                    status: 'ok',
                    totalResults: 1,
                    articles: [
                        {
                            title: 'Vietnam News',
                            description: 'Vietnam description',
                            url: 'https://example.com/vietnam'
                        }
                    ]
                }
            };

            axios.get.mockResolvedValue(mockResponse);

            const result = await newsApiService.getVietnamNews();

            expect(result.success).toBe(true);
            expect(axios.get).toHaveBeenCalledWith(
                'https://newsapi.org/v2/everything',
                expect.objectContaining({
                    params: expect.objectContaining({
                        q: 'Vietnam OR Việt Nam',
                        language: 'vi',
                        sortBy: 'publishedAt',
                        pageSize: 20
                    })
                })
            );
        });
    });

    describe('getFactCheckNews', () => {
        it('should fetch fact-checking news', async () => {
            const mockResponse = {
                data: {
                    status: 'ok',
                    totalResults: 1,
                    articles: [
                        {
                            title: 'Fact Check Article',
                            description: 'Fact check description',
                            url: 'https://example.com/factcheck'
                        }
                    ]
                }
            };

            axios.get.mockResolvedValue(mockResponse);

            const result = await newsApiService.getFactCheckNews();

            expect(result.success).toBe(true);
            expect(axios.get).toHaveBeenCalledWith(
                'https://newsapi.org/v2/everything',
                expect.objectContaining({
                    params: expect.objectContaining({
                        q: 'fact check OR misinformation OR fake news OR disinformation',
                        sortBy: 'publishedAt',
                        pageSize: 20
                    })
                })
            );
        });
    });
});
