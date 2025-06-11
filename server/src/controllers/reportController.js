const { initializeFirebaseAdmin } = require('../config/firebase');

class ReportController {
    constructor() {
        this.db = null;
        this.initializeFirestore();
    }

    async initializeFirestore() {
        try {
            const { db } = await initializeFirebaseAdmin();
            this.db = db;
            console.log('✅ Report Controller: Firestore initialized');
        } catch (error) {
            console.error('❌ Report Controller: Failed to initialize Firestore:', error);
        }
    }
    /**
     * Create a new report
     */
    async createReport(req, res) {
        try {
            if (!this.db) {
                return res.status(500).json({
                    success: false,
                    error: 'Database not initialized'
                });
            }

            const { linkId, type, reason, description } = req.body;
            const userId = req.user?.userId || req.user?.uid;

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
            const linkDoc = await this.db.collection('links').doc(linkId).get();
            if (!linkDoc.exists) {
                return res.status(404).json({
                    success: false,
                    error: 'Link not found'
                });
            }

            // Check if user already reported this link
            const existingReports = await this.db.collection('reports')
                .where('linkId', '==', linkId)
                .where('userId', '==', userId)
                .get();

            if (!existingReports.empty) {
                return res.status(409).json({
                    success: false,
                    error: 'You have already reported this link'
                });
            }

            // Create report
            const reportData = {
                linkId,
                userId,
                type,
                reason,
                description: description || null,
                status: 'pending',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const reportRef = await this.db.collection('reports').add(reportData);
            const reportDoc = await reportRef.get();

            res.status(201).json({
                success: true,
                data: {
                    id: reportRef.id,
                    ...reportDoc.data()
                },
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
            if (!this.db) {
                return res.status(500).json({
                    success: false,
                    error: 'Database not initialized'
                });
            }

            const { linkId } = req.params;
            const { page = 1, limit = 20 } = req.query;

            // Get reports for the link
            const reportsQuery = this.db.collection('reports')
                .where('linkId', '==', linkId)
                .orderBy('createdAt', 'desc')
                .limit(parseInt(limit))
                .offset((parseInt(page) - 1) * parseInt(limit));

            const reportsSnapshot = await reportsQuery.get();

            // Get total count
            const totalSnapshot = await this.db.collection('reports')
                .where('linkId', '==', linkId)
                .get();

            const reports = [];
            for (const doc of reportsSnapshot.docs) {
                const reportData = doc.data();

                // Get user info if userId exists
                let reporterInfo = null;
                if (reportData.userId) {
                    try {
                        const userDoc = await this.db.collection('users').doc(reportData.userId).get();
                        if (userDoc.exists) {
                            const userData = userDoc.data();
                            reporterInfo = {
                                email: userData.email,
                                displayName: userData.displayName || userData.firstName + ' ' + userData.lastName
                            };
                        }
                    } catch (error) {
                        console.warn('Failed to fetch user info for report:', error);
                    }
                }

                reports.push({
                    id: doc.id,
                    ...reportData,
                    reporterEmail: reporterInfo?.email,
                    reporterName: reporterInfo?.displayName
                });
            }

            res.json({
                success: true,
                data: {
                    reports,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: totalSnapshot.size,
                        totalPages: Math.ceil(totalSnapshot.size / parseInt(limit))
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
            if (!this.db) {
                return res.status(500).json({
                    success: false,
                    error: 'Database not initialized'
                });
            }

            const { status, type, page = 1, limit = 20 } = req.query;

            // Build query with filters
            let query = this.db.collection('reports');

            if (status) {
                query = query.where('status', '==', status);
            }

            if (type) {
                query = query.where('type', '==', type);
            }

            // Get total count for pagination
            const totalSnapshot = await query.get();
            const total = totalSnapshot.size;

            // Apply pagination and ordering
            const reportsQuery = query
                .orderBy('createdAt', 'desc')
                .limit(parseInt(limit))
                .offset((parseInt(page) - 1) * parseInt(limit));

            const reportsSnapshot = await reportsQuery.get();

            const reports = [];
            for (const doc of reportsSnapshot.docs) {
                const reportData = doc.data();

                // Get user info
                let reporterInfo = null;
                if (reportData.userId) {
                    try {
                        const userDoc = await this.db.collection('users').doc(reportData.userId).get();
                        if (userDoc.exists) {
                            const userData = userDoc.data();
                            reporterInfo = {
                                email: userData.email,
                                displayName: userData.displayName || userData.firstName + ' ' + userData.lastName
                            };
                        }
                    } catch (error) {
                        console.warn('Failed to fetch user info:', error);
                    }
                }

                // Get link info
                let linkInfo = null;
                if (reportData.linkId) {
                    try {
                        const linkDoc = await this.db.collection('links').doc(reportData.linkId).get();
                        if (linkDoc.exists) {
                            const linkData = linkDoc.data();
                            linkInfo = {
                                url: linkData.url,
                                title: linkData.title
                            };
                        }
                    } catch (error) {
                        console.warn('Failed to fetch link info:', error);
                    }
                }

                reports.push({
                    id: doc.id,
                    linkId: reportData.linkId,
                    type: reportData.type,
                    reason: reportData.reason,
                    description: reportData.description,
                    status: reportData.status,
                    createdAt: reportData.createdAt,
                    updatedAt: reportData.updatedAt,
                    reporterEmail: reporterInfo?.email,
                    reporterName: reporterInfo?.displayName,
                    linkUrl: linkInfo?.url,
                    linkTitle: linkInfo?.title
                });
            }

            res.json({
                success: true,
                data: {
                    reports,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total,
                        totalPages: Math.ceil(total / parseInt(limit))
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
            if (!this.db) {
                return res.status(500).json({
                    success: false,
                    error: 'Database not initialized'
                });
            }

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
            const reportRef = this.db.collection('reports').doc(reportId);
            const reportDoc = await reportRef.get();

            if (!reportDoc.exists) {
                return res.status(404).json({
                    success: false,
                    error: 'Report not found'
                });
            }

            // Update report
            const updateData = {
                status,
                adminNotes: adminNotes || null,
                updatedAt: new Date()
            };

            await reportRef.update(updateData);

            // Get updated document
            const updatedDoc = await reportRef.get();

            res.json({
                success: true,
                data: {
                    id: reportId,
                    ...updatedDoc.data()
                },
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
            if (!this.db) {
                return res.status(500).json({
                    success: false,
                    error: 'Database not initialized'
                });
            }

            // Get all reports
            const reportsSnapshot = await this.db.collection('reports').get();

            const stats = {
                totalReports: 0,
                pendingReports: 0,
                reviewedReports: 0,
                resolvedReports: 0,
                dismissedReports: 0,
                spamReports: 0,
                misinformationReports: 0,
                inappropriateReports: 0,
                fakeReports: 0,
                otherReports: 0
            };

            reportsSnapshot.forEach(doc => {
                const data = doc.data();
                stats.totalReports++;

                // Count by status
                switch (data.status) {
                    case 'pending':
                        stats.pendingReports++;
                        break;
                    case 'reviewed':
                        stats.reviewedReports++;
                        break;
                    case 'resolved':
                        stats.resolvedReports++;
                        break;
                    case 'dismissed':
                        stats.dismissedReports++;
                        break;
                }

                // Count by type
                switch (data.type) {
                    case 'spam':
                        stats.spamReports++;
                        break;
                    case 'misinformation':
                        stats.misinformationReports++;
                        break;
                    case 'inappropriate':
                        stats.inappropriateReports++;
                        break;
                    case 'fake':
                        stats.fakeReports++;
                        break;
                    case 'other':
                        stats.otherReports++;
                        break;
                }
            });

            res.json({
                success: true,
                data: stats
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
            if (!this.db) {
                return res.status(500).json({
                    success: false,
                    error: 'Database not initialized'
                });
            }

            const { reportId } = req.params;

            // Check if report exists
            const reportRef = this.db.collection('reports').doc(reportId);
            const reportDoc = await reportRef.get();

            if (!reportDoc.exists) {
                return res.status(404).json({
                    success: false,
                    error: 'Report not found'
                });
            }

            // Delete report
            await reportRef.delete();

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
