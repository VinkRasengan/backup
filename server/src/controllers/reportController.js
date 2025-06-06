const database = require('../config/database');

class ReportController {
    /**
     * Create a new report
     */
    async createReport(req, res) {
        try {
            const { linkId, type, reason, description } = req.body;
            const userId = req.user.userId;

            // Validate required fields
            if (!linkId || !type || !reason) {
                return res.status(400).json({
                    success: false,
                    error: 'Link ID, type, and reason are required'
                });
            }

            // Validate report type
            const validTypes = ['spam', 'misinformation', 'inappropriate', 'fake', 'other'];
            if (!validTypes.includes(type)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid report type'
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

            // Check if user already reported this link
            const existingReport = await database.query(`
                SELECT id FROM reports 
                WHERE link_id = $1 AND user_id = $2
            `, [linkId, userId]);

            if (existingReport.rows.length > 0) {
                return res.status(409).json({
                    success: false,
                    error: 'You have already reported this link'
                });
            }

            // Create report
            const result = await database.query(`
                INSERT INTO reports (link_id, user_id, type, reason, description, status, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, 'pending', NOW(), NOW())
                RETURNING id, type, reason, description, status, created_at
            `, [linkId, userId, type, reason, description || null]);

            res.status(201).json({
                success: true,
                data: result.rows[0],
                message: 'Report submitted successfully'
            });
        } catch (error) {
            console.error('Create report error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create report',
                message: error.message
            });
        }
    }

    /**
     * Get reports for a specific link
     */
    async getReportsForLink(req, res) {
        try {
            const { linkId } = req.params;
            const { page = 1, limit = 20 } = req.query;
            const offset = (page - 1) * limit;

            const reports = await database.query(`
                SELECT 
                    r.id,
                    r.type,
                    r.reason,
                    r.description,
                    r.status,
                    r.created_at,
                    r.updated_at,
                    u.email as reporter_email,
                    u.display_name as reporter_name
                FROM reports r
                LEFT JOIN users u ON r.user_id = u.id
                WHERE r.link_id = $1
                ORDER BY r.created_at DESC
                LIMIT $2 OFFSET $3
            `, [linkId, limit, offset]);

            const totalCount = await database.query(`
                SELECT COUNT(*) as count
                FROM reports
                WHERE link_id = $1
            `, [linkId]);

            res.json({
                success: true,
                data: {
                    reports: reports.rows,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: parseInt(totalCount.rows[0].count),
                        totalPages: Math.ceil(totalCount.rows[0].count / limit)
                    }
                }
            });
        } catch (error) {
            console.error('Get reports for link error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch reports',
                message: error.message
            });
        }
    }

    /**
     * Get all reports (admin only)
     */
    async getAllReports(req, res) {
        try {
            const { status, type, page = 1, limit = 20 } = req.query;
            const offset = (page - 1) * limit;

            let whereClause = '';
            let queryParams = [];
            let paramCount = 0;

            if (status) {
                paramCount++;
                whereClause += `WHERE r.status = $${paramCount}`;
                queryParams.push(status);
            }

            if (type) {
                paramCount++;
                whereClause += whereClause ? ` AND r.type = $${paramCount}` : `WHERE r.type = $${paramCount}`;
                queryParams.push(type);
            }

            const reports = await database.query(`
                SELECT 
                    r.id,
                    r.link_id,
                    r.type,
                    r.reason,
                    r.description,
                    r.status,
                    r.created_at,
                    r.updated_at,
                    u.email as reporter_email,
                    u.display_name as reporter_name,
                    l.url as link_url,
                    l.title as link_title
                FROM reports r
                LEFT JOIN users u ON r.user_id = u.id
                LEFT JOIN links l ON r.link_id = l.id
                ${whereClause}
                ORDER BY r.created_at DESC
                LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
            `, [...queryParams, limit, offset]);

            const totalCount = await database.query(`
                SELECT COUNT(*) as count
                FROM reports r
                ${whereClause}
            `, queryParams);

            res.json({
                success: true,
                data: {
                    reports: reports.rows,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: parseInt(totalCount.rows[0].count),
                        totalPages: Math.ceil(totalCount.rows[0].count / limit)
                    }
                }
            });
        } catch (error) {
            console.error('Get all reports error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch reports',
                message: error.message
            });
        }
    }

    /**
     * Update report status (admin only)
     */
    async updateReportStatus(req, res) {
        try {
            const { reportId } = req.params;
            const { status, adminNotes } = req.body;

            // Validate status
            const validStatuses = ['pending', 'reviewed', 'resolved', 'dismissed'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid status'
                });
            }

            // Check if report exists
            const existingReport = await database.query(`
                SELECT id FROM reports WHERE id = $1
            `, [reportId]);

            if (existingReport.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Report not found'
                });
            }

            // Update report
            const result = await database.query(`
                UPDATE reports 
                SET status = $1, admin_notes = $2, updated_at = NOW()
                WHERE id = $3
                RETURNING id, status, admin_notes, updated_at
            `, [status, adminNotes || null, reportId]);

            res.json({
                success: true,
                data: result.rows[0],
                message: 'Report status updated successfully'
            });
        } catch (error) {
            console.error('Update report status error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update report status',
                message: error.message
            });
        }
    }

    /**
     * Get report statistics
     */
    async getReportStats(req, res) {
        try {
            const stats = await database.query(`
                SELECT 
                    COUNT(*) as total_reports,
                    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_reports,
                    COUNT(CASE WHEN status = 'reviewed' THEN 1 END) as reviewed_reports,
                    COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_reports,
                    COUNT(CASE WHEN status = 'dismissed' THEN 1 END) as dismissed_reports,
                    COUNT(CASE WHEN type = 'spam' THEN 1 END) as spam_reports,
                    COUNT(CASE WHEN type = 'misinformation' THEN 1 END) as misinformation_reports,
                    COUNT(CASE WHEN type = 'inappropriate' THEN 1 END) as inappropriate_reports,
                    COUNT(CASE WHEN type = 'fake' THEN 1 END) as fake_reports,
                    COUNT(CASE WHEN type = 'other' THEN 1 END) as other_reports
                FROM reports
            `);

            res.json({
                success: true,
                data: stats.rows[0]
            });
        } catch (error) {
            console.error('Get report stats error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch report statistics',
                message: error.message
            });
        }
    }

    /**
     * Delete a report (admin only)
     */
    async deleteReport(req, res) {
        try {
            const { reportId } = req.params;

            // Check if report exists
            const existingReport = await database.query(`
                SELECT id FROM reports WHERE id = $1
            `, [reportId]);

            if (existingReport.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Report not found'
                });
            }

            // Delete report
            await database.query(`
                DELETE FROM reports WHERE id = $1
            `, [reportId]);

            res.json({
                success: true,
                message: 'Report deleted successfully'
            });
        } catch (error) {
            console.error('Delete report error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to delete report',
                message: error.message
            });
        }
    }
}

module.exports = new ReportController();
