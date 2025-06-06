const newsDataService = require('../newsDataService');

// Mock axios to avoid making real API calls during tests
jest.mock('axios');
const axios = require('axios');

describe('NewsDataService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Set up environment variables for testing
        process.env.NEWSDATA_API_KEY = 'test-api-key';
        process.env.NEWSDATA_BASE_URL = 'https://newsdata.io/api/1';
    });

    describe('getLatestNews', () => {
        it('should fetch latest news successfully', async () => {
            const mockResponse = {
                data: {
                    status: 'success',
                    totalResults: 2,
                    results: [
                        {
                            title: 'Test Article 1',
                            description: 'Test description 1',
                            link: 'https://example.com/1'
                        },
                        {
                            title: 'Test Article 2',
                            description: 'Test description 2',
                            link: 'https://example.com/2'
                        }
                    ],
                    nextPage: 'next-page-token'
                }
            };

            axios.get.mockResolvedValue(mockResponse);

            const result = await newsDataService.getLatestNews({
                country: 'vn',
                size: '10'
            });

            expect(result.success).toBe(true);
            expect(result.totalResults).toBe(2);
            expect(result.articles).toHaveLength(2);
            expect(result.nextPage).toBe('next-page-token');
            expect(axios.get).toHaveBeenCalledWith(
                'https://newsdata.io/api/1/latest',
                {
                    params: {
                        apikey: 'test-api-key',
                        country: 'vn',
                        size: '10'
                    },
                    timeout: 15000
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

            const result = await newsDataService.getLatestNews();

            expect(result.success).toBe(false);
            expect(result.error).toBe('API key invalid');
            expect(result.data).toBe(null);
        });
    });

    describe('searchArchive', () => {
        it('should search archive successfully', async () => {
            const mockResponse = {
                data: {
                    status: 'success',
                    totalResults: 1,
                    results: [
                        {
                            title: 'Archive Article',
                            description: 'Archive description',
                            link: 'https://example.com/archive'
                        }
                    ],
                    nextPage: null
                }
            };

            axios.get.mockResolvedValue(mockResponse);

            const result = await newsDataService.searchArchive({
                q: 'test query',
                from_date: '2024-01-01',
                to_date: '2024-01-31'
            });

            expect(result.success).toBe(true);
            expect(result.totalResults).toBe(1);
            expect(result.articles).toHaveLength(1);
            expect(axios.get).toHaveBeenCalledWith(
                'https://newsdata.io/api/1/archive',
                {
                    params: {
                        apikey: 'test-api-key',
                        q: 'test query',
                        from_date: '2024-01-01',
                        to_date: '2024-01-31'
                    },
                    timeout: 15000
                }
            );
        });

        it('should require search query', async () => {
            const result = await newsDataService.searchArchive({
                from_date: '2024-01-01',
                to_date: '2024-01-31'
            });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Search query (q) is required');
        });

        it('should require date range', async () => {
            const result = await newsDataService.searchArchive({
                q: 'test query'
            });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Both from_date and to_date are required for archive search');
        });
    });

    describe('getSources', () => {
        it('should fetch sources successfully', async () => {
            const mockResponse = {
                data: {
                    status: 'success',
                    results: [
                        {
                            id: 'vnexpress',
                            name: 'VnExpress',
                            category: 'general'
                        }
                    ]
                }
            };

            axios.get.mockResolvedValue(mockResponse);

            const result = await newsDataService.getSources({
                country: 'vn'
            });

            expect(result.success).toBe(true);
            expect(result.sources).toHaveLength(1);
            expect(result.sources[0].id).toBe('vnexpress');
        });
    });

    describe('getVietnamNews', () => {
        it('should fetch Vietnam-specific news', async () => {
            const mockResponse = {
                data: {
                    status: 'success',
                    totalResults: 1,
                    results: [
                        {
                            title: 'Vietnam News',
                            description: 'Vietnam description',
                            link: 'https://example.com/vietnam'
                        }
                    ]
                }
            };

            axios.get.mockResolvedValue(mockResponse);

            const result = await newsDataService.getVietnamNews();

            expect(result.success).toBe(true);
            expect(axios.get).toHaveBeenCalledWith(
                'https://newsdata.io/api/1/latest',
                expect.objectContaining({
                    params: expect.objectContaining({
                        country: 'vn',
                        language: 'vi',
                        size: '20'
                    })
                })
            );
        });
    });

    describe('getFactCheckNews', () => {
        it('should fetch fact-checking news', async () => {
            const mockResponse = {
                data: {
                    status: 'success',
                    totalResults: 1,
                    results: [
                        {
                            title: 'Fact Check Article',
                            description: 'Fact check description',
                            link: 'https://example.com/factcheck'
                        }
                    ]
                }
            };

            axios.get.mockResolvedValue(mockResponse);

            const result = await newsDataService.getFactCheckNews();

            expect(result.success).toBe(true);
            expect(axios.get).toHaveBeenCalledWith(
                'https://newsdata.io/api/1/latest',
                expect.objectContaining({
                    params: expect.objectContaining({
                        q: 'fact check OR misinformation OR fake news OR disinformation',
                        language: 'en,vi',
                        size: '20'
                    })
                })
            );
        });
    });

    describe('getTechnologyNews', () => {
        it('should fetch technology news', async () => {
            const mockResponse = {
                data: {
                    status: 'success',
                    totalResults: 1,
                    results: [
                        {
                            title: 'Tech Article',
                            description: 'Tech description',
                            link: 'https://example.com/tech'
                        }
                    ]
                }
            };

            axios.get.mockResolvedValue(mockResponse);

            const result = await newsDataService.getTechnologyNews();

            expect(result.success).toBe(true);
            expect(axios.get).toHaveBeenCalledWith(
                'https://newsdata.io/api/1/latest',
                expect.objectContaining({
                    params: expect.objectContaining({
                        category: 'technology',
                        language: 'en,vi',
                        size: '20'
                    })
                })
            );
        });
    });

    describe('getBusinessNews', () => {
        it('should fetch business news', async () => {
            const mockResponse = {
                data: {
                    status: 'success',
                    totalResults: 1,
                    results: [
                        {
                            title: 'Business Article',
                            description: 'Business description',
                            link: 'https://example.com/business'
                        }
                    ]
                }
            };

            axios.get.mockResolvedValue(mockResponse);

            const result = await newsDataService.getBusinessNews();

            expect(result.success).toBe(true);
            expect(axios.get).toHaveBeenCalledWith(
                'https://newsdata.io/api/1/latest',
                expect.objectContaining({
                    params: expect.objectContaining({
                        category: 'business',
                        language: 'en,vi',
                        size: '20'
                    })
                })
            );
        });
    });
});
