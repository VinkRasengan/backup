const admin = require('firebase-admin');

class FirestoreCommentController {
    constructor() {
        this.db = null;
        this.useFallback = false;
        this.initializeFirestore();
    }

    async initializeFirestore() {
        try {
            // Use existing Firebase Admin app if available
            if (admin.apps.length > 0) {
                console.log('✅ Using existing Firebase Admin app for comments');
                this.db = admin.firestore();
            } else {
                console.log('🔥 Initializing Firebase Admin SDK for comments...');
                // Firebase config should already be initialized by main app
                this.db = admin.firestore();
            }

            // Test connection
            await this.db.collection('comments').limit(1).get();
            console.log('✅ Firestore comment controller initialized successfully');
        } catch (error) {
            console.error('❌ Firestore comment controller initialization failed:', error);
            this.useFallback = true;
        }
    }

    /**
     * Get comments for a specific link
     */
    getComments = async (req, res) => {
        try {
            const { linkId } = req.params;
            const { page = 1, limit = 20 } = req.query;
            const offset = (page - 1) * limit;

            console.log('🔍 getComments called with linkId:', linkId, 'db:', !!this.db);

            if (!this.db || this.useFallback) {
                console.log('⚠️ Using fallback for comments');
                return this.getCommentsFallback(req, res);
            }

            // Get comments from Firestore (without orderBy to avoid index requirement)
            const commentsRef = this.db.collection('comments')
                .where('linkId', '==', linkId);

            const snapshot = await commentsRef.get();
            const allComments = [];

            for (const doc of snapshot.docs) {
                const commentData = doc.data();

                // Get user info
                let userInfo = { email: 'Anonymous', displayName: 'Anonymous User' };
                if (commentData.userId) {
                    try {
                        const userDoc = await this.db.collection('users').doc(commentData.userId).get();
                        if (userDoc.exists) {
                            const userData = userDoc.data();
                            userInfo = {
                                email: userData.email || 'Anonymous',
                                displayName: userData.displayName || userData.firstName || 'Anonymous User'
                            };
                        }
                    } catch (userError) {
                        console.warn('Could not fetch user info:', userError);
                    }
                }

                allComments.push({
                    id: doc.id,
                    content: commentData.content,
                    created_at: commentData.createdAt?.toDate?.() || new Date(),
                    updated_at: commentData.updatedAt?.toDate?.() || new Date(),
                    user_email: userInfo.email,
                    user_name: userInfo.displayName
                });
            }

            // Sort comments by created_at descending (newest first)
            allComments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            // Apply pagination
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + parseInt(limit);
            const comments = allComments.slice(startIndex, endIndex);

            // Total count is the size of all comments
            const totalCount = allComments.length;

            res.json({
                success: true,
                data: {
                    comments,
                    pagination: {
                        currentPage: parseInt(page),
                        totalPages: Math.ceil(totalCount / limit),
                        totalComments: totalCount,
                        hasNextPage: (page * limit) < totalCount,
                        hasPrevPage: page > 1
                    }
                }
            });
        } catch (error) {
            console.error('Get comments error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch comments',
                message: error.message
            });
        }
    }

    /**
     * Create a new comment
     */
    createComment = async (req, res) => {
        try {
            const { linkId } = req.params;
            const { content } = req.body;
            const userId = req.user?.userId || req.user?.uid;

            if (!content || content.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Comment content is required'
                });
            }

            if (content.length > 1000) {
                return res.status(400).json({
                    success: false,
                    error: 'Comment content is too long (max 1000 characters)'
                });
            }

            if (!this.db || this.useFallback) {
                return this.createCommentFallback(req, res);
            }

            // Check if link exists
            const linkDoc = await this.db.collection('links').doc(linkId).get();
            if (!linkDoc.exists) {
                return res.status(404).json({
                    success: false,
                    error: 'Link not found'
                });
            }

            // Create comment
            const commentData = {
                linkId,
                userId,
                content: content.trim(),
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };

            const commentRef = await this.db.collection('comments').add(commentData);

            // Get user info for response
            let userInfo = { email: 'Anonymous', displayName: 'Anonymous User' };
            if (userId) {
                try {
                    const userDoc = await this.db.collection('users').doc(userId).get();
                    if (userDoc.exists) {
                        const userData = userDoc.data();
                        userInfo = {
                            email: userData.email || 'Anonymous',
                            displayName: userData.displayName || userData.firstName || 'Anonymous User'
                        };
                    }
                } catch (userError) {
                    console.warn('Could not fetch user info:', userError);
                }
            }

            const comment = {
                id: commentRef.id,
                content: content.trim(),
                created_at: new Date(),
                updated_at: new Date(),
                user_email: userInfo.email,
                user_name: userInfo.displayName
            };

            res.status(201).json({
                success: true,
                data: comment,
                message: 'Comment created successfully'
            });
        } catch (error) {
            console.error('Create comment error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create comment',
                message: error.message
            });
        }
    }

    /**
     * Update a comment
     */
    updateComment = async (req, res) => {
        try {
            const { commentId } = req.params;
            const { content } = req.body;
            const userId = req.user?.userId || req.user?.uid;

            if (!content || content.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Comment content is required'
                });
            }

            if (content.length > 1000) {
                return res.status(400).json({
                    success: false,
                    error: 'Comment content is too long (max 1000 characters)'
                });
            }

            if (!this.db || this.useFallback) {
                return this.updateCommentFallback(req, res);
            }

            // Check if comment exists and belongs to user
            const commentDoc = await this.db.collection('comments').doc(commentId).get();
            if (!commentDoc.exists) {
                return res.status(404).json({
                    success: false,
                    error: 'Comment not found'
                });
            }

            const commentData = commentDoc.data();
            if (commentData.userId !== userId) {
                return res.status(403).json({
                    success: false,
                    error: 'You can only edit your own comments'
                });
            }

            // Update comment
            await this.db.collection('comments').doc(commentId).update({
                content: content.trim(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            res.json({
                success: true,
                data: {
                    id: commentId,
                    content: content.trim(),
                    updated_at: new Date()
                },
                message: 'Comment updated successfully'
            });
        } catch (error) {
            console.error('Update comment error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update comment',
                message: error.message
            });
        }
    }

    /**
     * Delete a comment
     */
    deleteComment = async (req, res) => {
        try {
            const { commentId } = req.params;
            const userId = req.user?.userId || req.user?.uid;

            if (!this.db || this.useFallback) {
                return this.deleteCommentFallback(req, res);
            }

            // Check if comment exists and belongs to user
            const commentDoc = await this.db.collection('comments').doc(commentId).get();
            if (!commentDoc.exists) {
                return res.status(404).json({
                    success: false,
                    error: 'Comment not found'
                });
            }

            const commentData = commentDoc.data();
            if (commentData.userId !== userId) {
                return res.status(403).json({
                    success: false,
                    error: 'You can only delete your own comments'
                });
            }

            // Delete comment
            await this.db.collection('comments').doc(commentId).delete();

            res.json({
                success: true,
                message: 'Comment deleted successfully'
            });
        } catch (error) {
            console.error('Delete comment error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to delete comment',
                message: error.message
            });
        }
    }

    /**
     * Get comment statistics for a link
     */
    getCommentStats = async (req, res) => {
        try {
            const { linkId } = req.params;

            if (!this.db || this.useFallback) {
                return res.json({
                    success: true,
                    data: { totalComments: 0, recentComments: [] }
                });
            }

            const snapshot = await this.db.collection('comments')
                .where('linkId', '==', linkId)
                .get();

            res.json({
                success: true,
                data: {
                    totalComments: snapshot.size,
                    linkId
                }
            });
        } catch (error) {
            console.error('Get comment stats error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get comment statistics',
                message: error.message
            });
        }
    }

    // Fallback methods for when Firestore is not available
    getCommentsFallback(req, res) {
        res.json({
            success: true,
            data: {
                comments: [],
                pagination: {
                    currentPage: 1,
                    totalPages: 0,
                    totalComments: 0,
                    hasNextPage: false,
                    hasPrevPage: false
                }
            }
        });
    }

    createCommentFallback(req, res) {
        res.status(503).json({
            success: false,
            error: 'Comment service temporarily unavailable'
        });
    }

    updateCommentFallback(req, res) {
        res.status(503).json({
            success: false,
            error: 'Comment service temporarily unavailable'
        });
    }

    deleteCommentFallback(req, res) {
        res.status(503).json({
            success: false,
            error: 'Comment service temporarily unavailable'
        });
    }
}

module.exports = new FirestoreCommentController();
