const newsController = require('./newsController');

class CommunityController {
    constructor() {
        console.log('⚠️ CommunityController: This is a legacy fallback controller.');
        console.log('🔥 Use FirestoreCommunityController for production.');
        this.posts = []; // Legacy fallback - use Firestore instead
    }

    // Legacy method - replaced by Firestore
    initializeMockPosts() {
        this.posts = [
            {
                id: '1',
                type: 'news',
                title: 'Cảnh báo: Tin giả về vaccine COVID-19 lan truyền trên mạng xã hội',
                content: 'Các chuyên gia y tế cảnh báo về việc lan truyền thông tin sai lệch về vaccine COVID-19...',
                url: 'https://example.com/covid-vaccine-misinformation',
                imageUrl: 'https://images.unsplash.com/photo-1584118624012-df056829fbd0?w=400',
                author: {
                    id: 'user1',
                    name: 'Dr. Nguyễn Văn A',
                    avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=100'
                },
                source: 'Bộ Y tế',
                category: 'health',
                tags: ['covid-19', 'vaccine', 'tin-gia', 'suc-khoe'],
                votes: { safe: 45, unsafe: 3, suspicious: 2 },
                userVote: null,
                commentsCount: 12,
                createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                isVerified: true,
                trustScore: 92
            },
            {
                id: '2',
                type: 'user_post',
                title: 'Phát hiện website giả mạo ngân hàng lừa đảo',
                content: 'Tôi vừa phát hiện một website giả mạo Vietcombank với domain tương tự. Mọi người cẩn thận!',
                url: 'https://suspicious-bank-site.com',
                imageUrl: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400',
                author: {
                    id: 'user2',
                    name: 'Trần Thị B',
                    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100'
                },
                source: 'Cộng đồng',
                category: 'security',
                tags: ['ngan-hang', 'lua-dao', 'website-gia', 'bao-mat'],
                votes: { safe: 2, unsafe: 38, suspicious: 15 },
                userVote: null,
                commentsCount: 8,
                createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
                isVerified: false,
                trustScore: 25
            },
            {
                id: '3',
                type: 'news',
                title: 'Cách nhận biết email phishing mới nhất năm 2024',
                content: 'Các hacker ngày càng tinh vi trong việc tạo ra email phishing. Dưới đây là những dấu hiệu cần chú ý...',
                url: 'https://cybersecurity.gov.vn/phishing-2024',
                imageUrl: 'https://images.unsplash.com/photo-1563206767-5b18f218e8de?w=400',
                author: {
                    id: 'user3',
                    name: 'Cục An toàn thông tin',
                    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100'
                },
                source: 'Cục An toàn thông tin',
                category: 'security',
                tags: ['phishing', 'email', 'bao-mat', 'huong-dan'],
                votes: { safe: 67, unsafe: 1, suspicious: 0 },
                userVote: null,
                commentsCount: 23,
                createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
                isVerified: true,
                trustScore: 98
            },
            {
                id: '4',
                type: 'user_post',
                title: 'Tin đồn về việc tăng giá xăng 50% là hoàn toàn sai sự thật',
                content: 'Trên mạng xã hội đang lan truyền thông tin xăng sẽ tăng 50% vào tuần tới. Đây là tin giả!',
                url: null,
                imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
                author: {
                    id: 'user4',
                    name: 'Lê Văn C',
                    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'
                },
                source: 'Cộng đồng',
                category: 'economy',
                tags: ['xang-dau', 'tin-gia', 'kinh-te'],
                votes: { safe: 28, unsafe: 5, suspicious: 12 },
                userVote: null,
                commentsCount: 15,
                createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
                isVerified: false,
                trustScore: 72
            },
            {
                id: '5',
                type: 'news',
                title: 'Cảnh báo ứng dụng giả mạo ví điện tử trên CH Play',
                content: 'Google đã gỡ bỏ hàng chục ứng dụng giả mạo các ví điện tử phổ biến tại Việt Nam...',
                url: 'https://vnexpress.net/fake-wallet-apps-warning',
                imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400',
                author: {
                    id: 'user5',
                    name: 'VnExpress',
                    avatar: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=100'
                },
                source: 'VnExpress',
                category: 'technology',
                tags: ['vi-dien-tu', 'ung-dung-gia', 'ch-play', 'bao-mat'],
                votes: { safe: 89, unsafe: 2, suspicious: 1 },
                userVote: null,
                commentsCount: 34,
                createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
                isVerified: true,
                trustScore: 95
            }
        ];
    }

    // Get community posts with optional filtering
    async getCommunityPosts(req, res) {
        try {
            const {
                sort = 'newest',
                category,
                search,
                page = 1,
                limit = 10,
                includeNews = 'true',
                newsOnly = 'false',
                userPostsOnly = 'false'
            } = req.query;

            let posts = [];

            // Handle different content types
            if (newsOnly === 'true') {
                // Only news content
                try {
                    const newsResponse = await this.getLatestNewsForCommunity();
                    if (newsResponse?.articles) {
                        posts = newsResponse.articles.slice(0, parseInt(limit) * 2).map(article => ({
                            id: `news_${Date.now()}_${Math.random()}`,
                            type: 'news',
                            title: article.title,
                            content: article.description || article.content,
                            url: article.url,
                            imageUrl: article.urlToImage,
                            author: {
                                id: 'news_source',
                                name: article.source?.name || 'News Source',
                                avatar: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=100'
                            },
                            source: article.source?.name || 'News',
                            category: 'news',
                            tags: ['tin-tuc', 'thoi-su'],
                            votes: { safe: 0, unsafe: 0, suspicious: 0 },
                            userVote: null,
                            commentsCount: 0,
                            createdAt: article.publishedAt || new Date().toISOString(),
                            isVerified: true,
                            trustScore: 85
                        }));
                    }
                } catch (newsError) {
                    console.warn('Failed to fetch news for community:', newsError.message);
                    posts = [];
                }
            } else if (userPostsOnly === 'true') {
                // Only user posts
                posts = [...this.posts];
            } else {
                // Mixed content (default behavior)
                posts = [...this.posts];

                // Include real news if requested
                if (includeNews === 'true') {
                    try {
                        const newsResponse = await this.getLatestNewsForCommunity();
                        if (newsResponse?.articles) {
                            const newsArticles = newsResponse.articles.slice(0, 5).map(article => ({
                                id: `news_${Date.now()}_${Math.random()}`,
                                type: 'news',
                                title: article.title,
                                content: article.description || article.content,
                                url: article.url,
                                imageUrl: article.urlToImage,
                                author: {
                                    id: 'news_source',
                                    name: article.source?.name || 'News Source',
                                    avatar: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=100'
                                },
                                source: article.source?.name || 'News',
                                category: 'news',
                                tags: ['tin-tuc', 'thoi-su'],
                                votes: { safe: 0, unsafe: 0, suspicious: 0 },
                                userVote: null,
                                commentsCount: 0,
                                createdAt: article.publishedAt || new Date().toISOString(),
                                isVerified: true,
                                trustScore: 85
                            }));
                            posts = [...newsArticles, ...posts];
                        }
                    } catch (newsError) {
                        console.warn('Failed to fetch news for community:', newsError.message);
                    }
                }
            }

            // Filter by category
            if (category && category !== 'all') {
                posts = posts.filter(post => post.category === category);
            }

            // Search filter
            if (search) {
                const searchLower = search.toLowerCase();
                posts = posts.filter(post => 
                    post.title.toLowerCase().includes(searchLower) ||
                    post.content.toLowerCase().includes(searchLower) ||
                    post.tags.some(tag => tag.includes(searchLower))
                );
            }

            // Sort posts
            switch (sort) {
                case 'trending':
                    posts.sort((a, b) => {
                        const aScore = (a.votes.safe + a.votes.unsafe + a.votes.suspicious) * a.trustScore;
                        const bScore = (b.votes.safe + b.votes.unsafe + b.votes.suspicious) * b.trustScore;
                        return bScore - aScore;
                    });
                    break;
                case 'most_voted':
                    posts.sort((a, b) => {
                        const aVotes = a.votes.safe + a.votes.unsafe + a.votes.suspicious;
                        const bVotes = b.votes.safe + b.votes.unsafe + b.votes.suspicious;
                        return bVotes - aVotes;
                    });
                    break;
                case 'newest':
                default:
                    posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                    break;
            }

            // Pagination
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + parseInt(limit);
            const paginatedPosts = posts.slice(startIndex, endIndex);

            res.json({
                success: true,
                data: {
                    posts: paginatedPosts,
                    pagination: {
                        currentPage: parseInt(page),
                        totalPages: Math.ceil(posts.length / limit),
                        totalPosts: posts.length,
                        hasNext: endIndex < posts.length,
                        hasPrev: page > 1
                    }
                },
                filters: {
                    sort,
                    category: category || 'all',
                    search: search || null
                },
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Get community posts error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch community posts',
                message: error.message
            });
        }
    }

    // Helper method to get news for community
    async getLatestNewsForCommunity() {
        try {
            // Create a mock request object for news controller
            const mockReq = {
                query: {
                    source: 'newsapi',
                    country: 'us',
                    pageSize: 10,
                    category: 'technology'
                }
            };

            // Create a mock response object to capture the result
            let newsResult = null;
            const mockRes = {
                json: (data) => {
                    newsResult = data;
                }
            };

            await newsController.getLatestNews(mockReq, mockRes);
            
            return newsResult?.data?.newsapi?.articles ? 
                { articles: newsResult.data.newsapi.articles } : 
                null;
        } catch (error) {
            console.error('Error fetching news for community:', error);
            return null;
        }
    }

    // Get single post by ID
    async getPostById(req, res) {
        try {
            const { id } = req.params;
            const post = this.posts.find(p => p.id === id);

            if (!post) {
                return res.status(404).json({
                    success: false,
                    error: 'Post not found'
                });
            }

            res.json({
                success: true,
                data: post,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Get post by ID error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch post',
                message: error.message
            });
        }
    }

    // Create new community post
    async createPost(req, res) {
        try {
            const { title, content, url, category, tags } = req.body;
            const userId = req.user?.userId || 'anonymous';

            if (!title || !content) {
                return res.status(400).json({
                    success: false,
                    error: 'Title and content are required'
                });
            }

            const newPost = {
                id: `post_${Date.now()}_${Math.random()}`,
                type: 'user_post',
                title,
                content,
                url: url || null,
                imageUrl: null, // Could be added later with file upload
                author: {
                    id: userId,
                    name: req.user?.name || 'Anonymous User',
                    avatar: req.user?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100'
                },
                source: 'Cộng đồng',
                category: category || 'general',
                tags: tags || [],
                votes: { safe: 0, unsafe: 0, suspicious: 0 },
                userVote: null,
                commentsCount: 0,
                createdAt: new Date().toISOString(),
                isVerified: false,
                trustScore: 50 // Default score for new posts
            };

            this.posts.unshift(newPost);

            res.status(201).json({
                success: true,
                data: newPost,
                message: 'Post created successfully',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Create post error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create post',
                message: error.message
            });
        }
    }

    // Get community statistics
    async getCommunityStats(req, res) {
        try {
            const totalPosts = this.posts.length;
            const verifiedPosts = this.posts.filter(p => p.isVerified).length;
            const totalVotes = this.posts.reduce((sum, post) =>
                sum + post.votes.safe + post.votes.unsafe + post.votes.suspicious, 0
            );
            const avgTrustScore = totalPosts > 0 ?
                this.posts.reduce((sum, post) => sum + post.trustScore, 0) / totalPosts : 0;

            const categoryStats = this.posts.reduce((stats, post) => {
                stats[post.category] = (stats[post.category] || 0) + 1;
                return stats;
            }, {});

            res.json({
                success: true,
                data: {
                    totalPosts,
                    verifiedPosts,
                    totalVotes,
                    avgTrustScore: Math.round(avgTrustScore),
                    categoryStats,
                    recentActivity: {
                        postsToday: this.posts.filter(p =>
                            new Date(p.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)
                        ).length,
                        postsThisWeek: this.posts.filter(p =>
                            new Date(p.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                        ).length
                    }
                },
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Get community stats error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch community statistics',
                message: error.message
            });
        }
    }
}

module.exports = new CommunityController();
