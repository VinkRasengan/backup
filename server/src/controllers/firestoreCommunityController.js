const admin = require('firebase-admin');

class FirestoreCommunityController {
    constructor() {
        this.db = null;
        this.initializeFirestore();
    }

    initializeFirestore() {
        try {
            // Initialize Firebase Admin if not already done
            if (!admin.apps.length) {
                const serviceAccount = {
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
                };

                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                    projectId: process.env.FIREBASE_PROJECT_ID
                });
            }

            this.db = admin.firestore();
            console.log('✅ Firestore Community Controller initialized');
        } catch (error) {
            console.error('❌ Firestore Community Controller initialization failed:', error);
        }
    }

    // Get community posts from Firestore
    async getCommunityPosts(req, res) {
        try {
            const { 
                sort = 'newest', 
                category, 
                search, 
                page = 1, 
                limit = 10 
            } = req.query;

            if (!this.db) {
                throw new Error('Firestore not initialized');
            }

            // Base query
            let query = this.db.collection('links');

            // Filter by category if specified
            if (category && category !== 'all') {
                query = query.where('category', '==', category);
            }

            // Get all documents first (Firestore has limited query capabilities)
            const snapshot = await query.get();
            let posts = [];

            for (const doc of snapshot.docs) {
                const linkData = doc.data();
                
                // Get votes for this link
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
                    imageUrl: null, // Could be added later
                    author,
                    source: 'Community',
                    category: this.mapStatusToCategory(linkData.status),
                    tags: this.generateTags(linkData),
                    votes,
                    userVote: null, // TODO: Get user's vote if authenticated
                    commentsCount: commentsSnapshot.size,
                    createdAt: linkData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
                    isVerified: linkData.status === 'safe',
                    trustScore,
                    status: linkData.status,
                    scanResults: linkData.scanResults || {}
                };

                posts.push(post);
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

    // Get community statistics from Firestore
    async getCommunityStats(req, res) {
        try {
            if (!this.db) {
                throw new Error('Firestore not initialized');
            }

            // Get total posts
            const linksSnapshot = await this.db.collection('links').get();
            const totalPosts = linksSnapshot.size;

            // Count by status
            const statusCounts = { safe: 0, unsafe: 0, suspicious: 0 };
            linksSnapshot.forEach(doc => {
                const data = doc.data();
                if (statusCounts.hasOwnProperty(data.status)) {
                    statusCounts[data.status]++;
                }
            });

            // Get total votes
            const votesSnapshot = await this.db.collection('votes').get();
            const totalVotes = votesSnapshot.size;

            // Get total users
            const usersSnapshot = await this.db.collection('users').get();
            const totalUsers = usersSnapshot.size;

            // Get total comments
            const commentsSnapshot = await this.db.collection('comments').get();
            const totalComments = commentsSnapshot.size;

            res.json({
                success: true,
                data: {
                    totalPosts,
                    totalUsers,
                    totalVotes,
                    totalComments,
                    statusBreakdown: statusCounts,
                    verifiedPosts: statusCounts.safe,
                    avgTrustScore: statusCounts.safe > 0 ? Math.round((statusCounts.safe / totalPosts) * 100) : 50,
                    recentActivity: {
                        postsToday: 0, // TODO: Implement date filtering
                        postsThisWeek: 0
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
}

module.exports = new FirestoreCommunityController();
