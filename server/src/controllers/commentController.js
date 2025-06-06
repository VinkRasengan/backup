const database = require('../config/database');

class CommentController {
    /**
     * Get comments for a specific link
     */
    async getComments(req, res) {
        try {
            const { linkId } = req.params;
            const { page = 1, limit = 20 } = req.query;
            const offset = (page - 1) * limit;

            const comments = await database.query(`
                SELECT 
                    c.id,
                    c.content,
                    c.created_at,
                    c.updated_at,
                    u.email as user_email,
                    u.display_name as user_name
                FROM comments c
                LEFT JOIN users u ON c.user_id = u.id
                WHERE c.link_id = $1
                ORDER BY c.created_at DESC
                LIMIT $2 OFFSET $3
            `, [linkId, limit, offset]);

            const totalCount = await database.query(`
                SELECT COUNT(*) as count
                FROM comments
                WHERE link_id = $1
            `, [linkId]);

            res.json({
                success: true,
                data: {
                    comments: comments.rows,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: parseInt(totalCount.rows[0].count),
                        totalPages: Math.ceil(totalCount.rows[0].count / limit)
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
    async createComment(req, res) {
        try {
            const { linkId } = req.params;
            const { content } = req.body;
            const userId = req.user.userId;

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

            // Check if link exists
            const linkExists = await database.query(`
                SELECT id FROM links WHERE id = $1
            `, [linkId]);

            if (linkExists.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Link not found'
                });
            }

            // Create comment
            const result = await database.query(`
                INSERT INTO comments (link_id, user_id, content, created_at, updated_at)
                VALUES ($1, $2, $3, NOW(), NOW())
                RETURNING id, content, created_at, updated_at
            `, [linkId, userId, content.trim()]);

            // Get user info for response
            const userInfo = await database.query(`
                SELECT email, display_name FROM users WHERE id = $1
            `, [userId]);

            const comment = {
                ...result.rows[0],
                user_email: userInfo.rows[0]?.email,
                user_name: userInfo.rows[0]?.display_name
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
    async updateComment(req, res) {
        try {
            const { commentId } = req.params;
            const { content } = req.body;
            const userId = req.user.userId;

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

            // Check if comment exists and belongs to user
            const existingComment = await database.query(`
                SELECT id, user_id FROM comments WHERE id = $1
            `, [commentId]);

            if (existingComment.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Comment not found'
                });
            }

            if (existingComment.rows[0].user_id !== userId) {
                return res.status(403).json({
                    success: false,
                    error: 'You can only edit your own comments'
                });
            }

            // Update comment
            const result = await database.query(`
                UPDATE comments 
                SET content = $1, updated_at = NOW()
                WHERE id = $2
                RETURNING id, content, created_at, updated_at
            `, [content.trim(), commentId]);

            res.json({
                success: true,
                data: result.rows[0],
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
    async deleteComment(req, res) {
        try {
            const { commentId } = req.params;
            const userId = req.user.userId;

            // Check if comment exists and belongs to user
            const existingComment = await database.query(`
                SELECT id, user_id FROM comments WHERE id = $1
            `, [commentId]);

            if (existingComment.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Comment not found'
                });
            }

            if (existingComment.rows[0].user_id !== userId) {
                return res.status(403).json({
                    success: false,
                    error: 'You can only delete your own comments'
                });
            }

            // Delete comment
            await database.query(`
                DELETE FROM comments WHERE id = $1
            `, [commentId]);

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
    async getCommentStats(req, res) {
        try {
            const { linkId } = req.params;

            const stats = await database.query(`
                SELECT 
                    COUNT(*) as total_comments,
                    COUNT(DISTINCT user_id) as unique_commenters
                FROM comments
                WHERE link_id = $1
            `, [linkId]);

            res.json({
                success: true,
                data: stats.rows[0]
            });
        } catch (error) {
            console.error('Get comment stats error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch comment statistics',
                message: error.message
            });
        }
    }
}

module.exports = new CommentController();
