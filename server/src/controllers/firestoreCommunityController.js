const firebaseConfig = require('../config/firebase-config');
const logger = require('../utils/logger');
const geminiService = require('../services/geminiService');
const firestoreOptimization = require('../services/firestoreOptimizationService');

class FirestoreCommunityController {
    constructor() {
        this.db = null;
        this.isInitialized = false;
        this.initializeFirestore();
    }

    async initializeFirestore() {
        try {
            logger.info('🔥 Initializing Firestore Community Controller via enhanced config...');

            // Use enhanced Firebase config
            this.db = await firebaseConfig.initialize();

            // Initialize optimization service
            firestoreOptimization.initialize(this.db);

            this.isInitialized = true;
            logger.success('Firestore Community Controller initialized successfully via enhanced config');

        } catch (error) {
            logger.error('Firestore Community Controller initialization failed', error);
            this.isInitialized = false;

            // In production, don't throw error - use fallback
            if (process.env.NODE_ENV === 'production') {
                logger.warn('Production mode: Using fallback data for community controller');
                this.useFallback = true;
                return;
            }
            throw error; // Re-throw in development
        }
    }

    // Get community posts from Firestore with optimization
    async getCommunityPosts(req, res) {
        try {
            const {
                sort = 'newest',
                category = 'all',
                search = '',
                page = 1,
                limit = 10
            } = req.query;

            // Use fallback data if Firestore not available
            if (!this.db || this.useFallback) {
                return this.getCommunityPostsFallback(req, res);
            }

            console.log('🚀 Using direct Firestore query (bypass optimization for vote accuracy)');

            // Use direct Firestore query to get accurate vote data
            return await this.getCommunityPostsLegacy(req, res);

        } catch (error) {
            console.error('Get community posts error:', error);

            // Fallback to old method if optimization fails
            console.log('⚠️ Falling back to legacy method...');
            return this.getCommunityPostsLegacy(req, res);
        }
    }

    // Optimized method with aggregated data
    async getCommunityPostsLegacy(req, res) {
        try {
            const {
                sort = 'newest',
                category,
                search,
                page = 1,
                limit = 10
            } = req.query;

            console.log('🚀 Using optimized query with aggregated vote data');

            // Base query with ordering
            let query = this.db.collection('links');

            // Filter by category if specified
            if (category && category !== 'all') {
                query = query.where('category', '==', category);
            }

            // Add ordering based on sort type
            if (sort === 'newest') {
                query = query.orderBy('createdAt', 'desc');
            }

            // Apply pagination
            query = query.limit(parseInt(limit));
            if (page > 1) {
                const offset = (page - 1) * parseInt(limit);
                // For simplicity, we'll get all and slice (in production, use cursor-based pagination)
                query = query.limit(offset + parseInt(limit));
            }

            const snapshot = await query.get();
            let posts = [];

            // Process documents in batches for better performance
            const batchSize = 10;
            const docs = snapshot.docs;

            for (let i = 0; i < docs.length; i += batchSize) {
                const batch = docs.slice(i, i + batchSize);
                const batchPromises = batch.map(async (doc) => {
                    const linkData = doc.data();

                    // Use aggregated vote data if available, otherwise calculate
                    let votes = linkData.voteStats || { safe: 0, unsafe: 0, suspicious: 0 };
                    let commentsCount = linkData.commentsCount || 0;

                    // If no aggregated data, calculate (fallback)
                    if (!linkData.voteStats) {
                        const [votesSnapshot, commentsSnapshot] = await Promise.all([
                            this.db.collection('votes').where('linkId', '==', doc.id).get(),
                            this.db.collection('comments').where('linkId', '==', doc.id).get()
                        ]);

                        votes = { safe: 0, unsafe: 0, suspicious: 0 };
                        votesSnapshot.forEach(voteDoc => {
                            const vote = voteDoc.data();
                            votes[vote.voteType]++;
                        });

                        commentsCount = commentsSnapshot.size;

                        // Update document with aggregated data for future queries
                        this.updateAggregatedData(doc.id, votes, commentsCount);
                    }

                    // Get user info
                    let author = { id: 'unknown', name: 'Unknown User', avatar: '' };
                    if (linkData.submittedBy) {
                        try {
                            const userDoc = await this.db.collection('users').doc(linkData.submittedBy).get();
                            if (userDoc.exists) {
                                const userData = userDoc.data();
                                author = {
                                    id: linkData.submittedBy,
                                    name: userData.displayName || `${userData.firstName} ${userData.lastName}`,
                                    avatar: userData.avatarUrl || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(userData.displayName || 'User')
                                };
                            }
                        } catch (userError) {
                            console.warn('Failed to fetch user data:', userError);
                        }
                    }

                    // Calculate trust score based on votes and status
                    const totalVotes = votes.safe + votes.unsafe + votes.suspicious;
                    let trustScore = 50; // Default
                    if (totalVotes > 0) {
                        trustScore = Math.round((votes.safe / totalVotes) * 100);
                    }
                    if (linkData.status === 'safe') trustScore = Math.max(trustScore, 70);
                    if (linkData.status === 'unsafe') trustScore = Math.min(trustScore, 30);

                    const post = {
                        id: doc.id,
                        type: 'community_post',
                        title: linkData.title || 'Untitled Link',
                        content: linkData.description || 'No description available',
                        url: linkData.url,
                        imageUrl: linkData.screenshot || linkData.imageUrl || null,
                        author,
                        source: 'Community',
                        category: this.mapStatusToCategory(linkData.status),
                        tags: this.generateTags(linkData),
                        voteStats: {
                            safe: votes.safe,
                            unsafe: votes.unsafe,
                            suspicious: votes.suspicious,
                            total: totalVotes
                        },
                        userVote: null, // TODO: Get user's vote if authenticated
                        commentsCount: commentsCount,
                        createdAt: linkData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
                        isVerified: linkData.status === 'safe',
                        trustScore,
                        status: linkData.status,
                        scanResults: linkData.scanResults || {},
                        metadata: linkData.metadata || {},
                        screenshot: linkData.screenshot || null
                    };

                    return post;
                });

                const batchResults = await Promise.all(batchPromises);
                posts.push(...batchResults);
            }

            // Apply search filter
            if (search) {
                const searchLower = search.toLowerCase();
                posts = posts.filter(post => 
                    post.title.toLowerCase().includes(searchLower) ||
                    post.content.toLowerCase().includes(searchLower) ||
                    post.url.toLowerCase().includes(searchLower)
                );
            }

            // Sort posts
            switch (sort) {
                case 'trending':
                    posts.sort((a, b) => {
                        const aScore = a.voteStats.total * a.trustScore;
                        const bScore = b.voteStats.total * b.trustScore;
                        return bScore - aScore;
                    });
                    break;
                case 'most_voted':
                    posts.sort((a, b) => {
                        return b.voteStats.total - a.voteStats.total;
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

    // Get community statistics from Firestore with optimization
    async getCommunityStats(req, res) {
        try {
            if (!this.db) {
                throw new Error('Firestore not initialized');
            }

            console.log('🚀 Using optimized community stats query');

            // Use optimization service for better performance
            const stats = await firestoreOptimization.getCommunityStats();

            res.json({
                success: true,
                data: stats,
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

    // Get trending posts with optimization
    async getTrendingPosts(req, res) {
        try {
            const { limit = 5, offset = 0 } = req.query;

            if (!this.db) {
                throw new Error('Firestore not initialized');
            }

            console.log('🚀 Using optimized trending posts query');

            // Use optimization service for better performance
            const result = await firestoreOptimization.getTrendingPosts(
                parseInt(limit),
                parseInt(offset)
            );

            res.json({
                success: true,
                data: result,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Get trending posts error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch trending posts',
                message: error.message
            });
        }
    }

    // Get cache statistics for monitoring
    async getCacheStats(req, res) {
        try {
            const stats = firestoreOptimization.getCacheStats();

            res.json({
                success: true,
                data: {
                    cache: stats,
                    optimization: {
                        enabled: true,
                        service: 'FirestoreOptimizationService'
                    }
                },
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Get cache stats error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch cache statistics',
                message: error.message
            });
        }
    }

    // Helper methods
    mapStatusToCategory(status) {
        const mapping = {
            'safe': 'security',
            'unsafe': 'security',
            'suspicious': 'security',
            'pending': 'general'
        };
        return mapping[status] || 'general';
    }

    // Update aggregated data for better performance
    async updateAggregatedData(linkId, votes, commentsCount) {
        try {
            if (this.db) {
                await this.db.collection('links').doc(linkId).update({
                    voteStats: votes,
                    commentsCount: commentsCount,
                    lastUpdated: new Date()
                });
            }
        } catch (error) {
            console.warn('Failed to update aggregated data:', error);
        }
    }

    // Fallback method when Firestore is not available
    async getCommunityPostsFallback(req, res) {
        try {
            console.log('🔄 Using fallback data for community posts');

            // Return mock data when Firestore is not available
            const mockPosts = [
                {
                    id: 'mock-1',
                    type: 'community_post',
                    title: 'Sample Community Post',
                    content: 'This is a sample post when database is not available',
                    url: 'https://example.com',
                    imageUrl: null,
                    author: { id: 'demo', name: 'Demo User', avatar: '' },
                    source: 'Community',
                    category: 'general',
                    tags: ['demo', 'fallback'],
                    voteStats: { safe: 5, unsafe: 1, suspicious: 0, total: 6 },
                    userVote: null,
                    commentsCount: 2,
                    createdAt: new Date().toISOString(),
                    isVerified: false,
                    trustScore: 83,
                    status: 'pending'
                }
            ];

            res.json({
                success: true,
                data: {
                    posts: mockPosts,
                    pagination: {
                        currentPage: 1,
                        totalPages: 1,
                        totalPosts: mockPosts.length,
                        hasNext: false,
                        hasPrev: false
                    }
                },
                filters: {
                    sort: 'newest',
                    category: 'all',
                    search: null
                },
                timestamp: new Date().toISOString(),
                note: 'Using fallback data - Firestore not available'
            });

        } catch (error) {
            console.error('Fallback method error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch community posts',
                message: error.message
            });
        }
    }

    generateTags(linkData) {
        const tags = [];
        
        if (linkData.status) {
            tags.push(linkData.status);
        }
        
        if (linkData.url) {
            try {
                const domain = new URL(linkData.url).hostname;
                tags.push(domain);
            } catch (e) {
                // Invalid URL
            }
        }
        
        tags.push('community', 'fact-check');
        
        return tags;
    }

    // Get single post by ID
    async getPostById(req, res) {
        try {
            const { id } = req.params;
            
            if (!this.db) {
                throw new Error('Firestore not initialized');
            }

            const doc = await this.db.collection('links').doc(id).get();
            
            if (!doc.exists) {
                return res.status(404).json({
                    success: false,
                    error: 'Post not found'
                });
            }

            // Get additional data (votes, comments, user info) similar to getCommunityPosts
            // ... (implementation similar to above)

            res.json({
                success: true,
                data: doc.data(),
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

    // Get current user's submissions
    async getMySubmissions(req, res) {
        try {
            const userId = req.user.userId;
            console.log('🔍 getMySubmissions - userId:', userId);

            if (!this.db) {
                throw new Error('Firestore not initialized');
            }

            // Query links collection for user's submissions (using existing collection)
            // Use simple where query without orderBy to avoid index requirement
            const submissionsSnapshot = await this.db.collection('links')
                .where('userId', '==', userId)
                .get();

            console.log('🔍 getMySubmissions - found documents:', submissionsSnapshot.size);

            const submissions = [];
            for (const doc of submissionsSnapshot.docs) {
                const submissionData = doc.data();

                // Get votes for this submission
                const votesSnapshot = await this.db.collection('votes')
                    .where('linkId', '==', doc.id)
                    .get();

                const votes = { safe: 0, unsafe: 0, suspicious: 0 };
                votesSnapshot.forEach(voteDoc => {
                    const vote = voteDoc.data();
                    votes[vote.voteType]++;
                });

                // Get comments count
                const commentsSnapshot = await this.db.collection('comments')
                    .where('linkId', '==', doc.id)
                    .get();

                submissions.push({
                    id: doc.id,
                    ...submissionData,
                    voteStats: {
                        safe: votes.safe,
                        unsafe: votes.unsafe,
                        suspicious: votes.suspicious,
                        total: votes.safe + votes.unsafe + votes.suspicious
                    },
                    commentsCount: commentsSnapshot.size
                });
            }

            // Sort by createdAt in descending order (newest first)
            submissions.sort((a, b) => {
                const aDate = a.createdAt?.toDate?.() || new Date(a.createdAt) || new Date(0);
                const bDate = b.createdAt?.toDate?.() || new Date(b.createdAt) || new Date(0);
                return bDate - aDate;
            });

            console.log('🔍 getMySubmissions - returning submissions count:', submissions.length);
            console.log('🔍 getMySubmissions - first submission:', submissions[0] ? {
                id: submissions[0].id,
                title: submissions[0].title,
                url: submissions[0].url,
                createdAt: submissions[0].createdAt
            } : 'No submissions');

            res.json({
                success: true,
                data: {
                    submissions,
                    totalSubmissions: submissions.length
                },
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Get my submissions error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch user submissions',
                message: error.message
            });
        }
    }

    // Delete a submission (only by author)
    async deleteSubmission(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.userId;

            if (!this.db) {
                throw new Error('Firestore not initialized');
            }

            // Check if submission exists and belongs to user
            const submissionDoc = await this.db.collection('links').doc(id).get();

            if (!submissionDoc.exists) {
                return res.status(404).json({
                    success: false,
                    error: 'Submission not found'
                });
            }

            const submissionData = submissionDoc.data();
            if (submissionData.userId !== userId) {
                return res.status(403).json({
                    success: false,
                    error: 'You can only delete your own submissions'
                });
            }

            // Delete the submission
            await this.db.collection('links').doc(id).delete();

            // Also delete related votes and comments
            const votesSnapshot = await this.db.collection('votes')
                .where('linkId', '==', id)
                .get();

            const commentsSnapshot = await this.db.collection('comments')
                .where('linkId', '==', id)
                .get();

            // Delete votes
            const batch = this.db.batch();
            votesSnapshot.forEach(doc => {
                batch.delete(doc.ref);
            });

            // Delete comments
            commentsSnapshot.forEach(doc => {
                batch.delete(doc.ref);
            });

            await batch.commit();

            res.json({
                success: true,
                message: 'Submission deleted successfully',
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Delete submission error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to delete submission',
                message: error.message
            });
        }
    }

    // Get AI recommendations based on community content
    async getAIRecommendations(req, res) {
        try {
            if (!this.db) {
                throw new Error('Firestore not initialized');
            }

            // Get recent posts (last 10)
            const postsSnapshot = await this.db.collection('links')
                .limit(10)
                .get();

            const posts = [];
            postsSnapshot.forEach(doc => {
                const data = doc.data();
                posts.push({
                    title: data.title || 'Untitled',
                    content: data.description || 'No description',
                    url: data.url,
                    status: data.status
                });
            });

            // Get recent comments (last 10)
            const commentsSnapshot = await this.db.collection('comments')
                .limit(10)
                .get();

            const comments = [];
            commentsSnapshot.forEach(doc => {
                const data = doc.data();
                comments.push({
                    content: data.content || 'No content'
                });
            });

            // Generate AI recommendations
            console.log('🤖 Generating AI recommendations for community...');
            const aiResult = await geminiService.generateCommunityRecommendations(posts, comments);

            if (!aiResult.success) {
                return res.status(500).json({
                    success: false,
                    error: 'Failed to generate AI recommendations',
                    message: aiResult.error
                });
            }

            res.json({
                success: true,
                data: {
                    recommendations: aiResult.recommendations,
                    generatedAt: aiResult.generatedAt,
                    model: aiResult.model,
                    basedOn: {
                        postsAnalyzed: posts.length,
                        commentsAnalyzed: comments.length
                    }
                },
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Get AI recommendations error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to generate AI recommendations',
                message: error.message
            });
        }
    }

    // Get votes for multiple posts in batch (optimization)
    async getBatchVotes(req, res) {
        try {
            const { postIds } = req.body;

            if (!postIds || !Array.isArray(postIds)) {
                return res.status(400).json({
                    success: false,
                    error: 'postIds array is required'
                });
            }

            if (!this.db) {
                throw new Error('Firestore not initialized');
            }

            console.log('🚀 Batch fetching votes for', postIds.length, 'posts');

            // Get all votes for these posts in one query
            const votesSnapshot = await this.db.collection('votes')
                .where('linkId', 'in', postIds.slice(0, 10)) // Firestore 'in' limit is 10
                .get();

            // Aggregate votes by post ID
            const votesByPost = {};
            postIds.forEach(postId => {
                votesByPost[postId] = { safe: 0, unsafe: 0, suspicious: 0, total: 0 };
            });

            votesSnapshot.forEach(doc => {
                const vote = doc.data();
                if (votesByPost[vote.linkId]) {
                    votesByPost[vote.linkId][vote.voteType]++;
                    votesByPost[vote.linkId].total++;
                }
            });

            res.json({
                success: true,
                data: votesByPost,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Batch votes error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch batch votes',
                message: error.message
            });
        }
    }

    // Get user votes for multiple posts in batch
    async getBatchUserVotes(req, res) {
        try {
            const { postIds } = req.body;
            const userId = req.user?.userId;

            if (!postIds || !Array.isArray(postIds)) {
                return res.status(400).json({
                    success: false,
                    error: 'postIds array is required'
                });
            }

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    error: 'Authentication required'
                });
            }

            if (!this.db) {
                throw new Error('Firestore not initialized');
            }

            console.log('🚀 Batch fetching user votes for', postIds.length, 'posts');

            // Get user's votes for these posts
            const userVotesSnapshot = await this.db.collection('votes')
                .where('linkId', 'in', postIds.slice(0, 10))
                .where('userId', '==', userId)
                .get();

            const userVotesByPost = {};
            userVotesSnapshot.forEach(doc => {
                const vote = doc.data();
                userVotesByPost[vote.linkId] = vote.voteType;
            });

            res.json({
                success: true,
                data: userVotesByPost,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Batch user votes error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch batch user votes',
                message: error.message
            });
        }
    }

    // Analyze a specific post with AI
    async analyzePost(req, res) {
        try {
            const { id } = req.params;

            if (!this.db) {
                throw new Error('Firestore not initialized');
            }

            const doc = await this.db.collection('links').doc(id).get();

            if (!doc.exists) {
                return res.status(404).json({
                    success: false,
                    error: 'Post not found'
                });
            }

            const postData = doc.data();

            // Analyze with Gemini AI
            console.log('🤖 Analyzing post with AI:', postData.title);
            const aiResult = await geminiService.analyzeCommunityPost(
                postData.title || 'Untitled',
                postData.description || 'No description',
                postData.url
            );

            if (!aiResult.success) {
                return res.status(500).json({
                    success: false,
                    error: 'Failed to analyze post with AI',
                    message: aiResult.error
                });
            }

            // Optionally save AI analysis to the post
            try {
                await this.db.collection('links').doc(id).update({
                    aiAnalysis: {
                        analysis: aiResult.analysis,
                        trustScore: aiResult.trustScore,
                        alertLevel: aiResult.alertLevel,
                        analyzedAt: aiResult.analyzedAt,
                        model: aiResult.model
                    },
                    updatedAt: new Date().toISOString()
                });
            } catch (updateError) {
                console.warn('Failed to save AI analysis to post:', updateError);
            }

            res.json({
                success: true,
                data: {
                    postId: id,
                    analysis: aiResult.analysis,
                    trustScore: aiResult.trustScore,
                    alertLevel: aiResult.alertLevel,
                    analyzedAt: aiResult.analyzedAt,
                    model: aiResult.model
                },
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Analyze post error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to analyze post',
                message: error.message
            });
        }
    }


}

module.exports = new FirestoreCommunityController();
