// Use production config based on environment
const firebaseConfig = process.env.NODE_ENV === 'production'
  ? require('../config/firebase-production')
  : require('../config/firebase-emulator');

const { db, collections, admin } = firebaseConfig;

class ReportController {
  // Submit a report for a link
  async submitReport(req, res, next) {
    try {
      const { linkId } = req.params;
      const { category, description } = req.body;
      const userId = req.user.userId;

      // Validate category
      const validCategories = ['fake_news', 'scam', 'malicious_content', 'spam', 'other'];
      if (!validCategories.includes(category)) {
        return res.status(400).json({
          error: 'Invalid report category',
          validCategories,
          code: 'INVALID_CATEGORY'
        });
      }

      // Validate description
      if (!description || description.trim().length === 0) {
        return res.status(400).json({
          error: 'Report description is required',
          code: 'DESCRIPTION_REQUIRED'
        });
      }

      if (description.trim().length > 500) {
        return res.status(400).json({
          error: 'Report description must be less than 500 characters',
          code: 'DESCRIPTION_TOO_LONG'
        });
      }

      // Check if link exists
      const linkDoc = await db.collection(collections.LINKS).doc(linkId).get();
      if (!linkDoc.exists) {
        return res.status(404).json({
          error: 'Link not found',
          code: 'LINK_NOT_FOUND'
        });
      }

      // Check if user already reported this link
      const existingReportQuery = await db.collection(collections.REPORTS)
        .where('linkId', '==', linkId)
        .where('userId', '==', userId)
        .limit(1)
        .get();

      if (!existingReportQuery.empty) {
        return res.status(409).json({
          error: 'You have already reported this link',
          code: 'ALREADY_REPORTED'
        });
      }

      // Get user data for report
      const userDoc = await db.collection(collections.USERS).doc(userId).get();
      const userData = userDoc.data();

      // Get link data for report
      const linkData = linkDoc.data();

      // Create report
      const reportData = {
        linkId,
        userId,
        category,
        description: description.trim(),
        status: 'pending', // pending, reviewed, resolved, dismissed
        reporter: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email
        },
        linkInfo: {
          url: linkData.url,
          title: linkData.title || linkData.url,
          credibilityScore: linkData.credibilityScore
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        reviewedAt: null,
        reviewedBy: null,
        adminNotes: null
      };

      const reportRef = await db.collection(collections.REPORTS).add(reportData);

      // Create admin notification
      const notificationData = {
        type: 'new_report',
        reportId: reportRef.id,
        linkId,
        category,
        reporterName: `${userData.firstName} ${userData.lastName}`,
        linkUrl: linkData.url,
        message: `New ${category.replace('_', ' ')} report submitted`,
        isRead: false,
        createdAt: new Date().toISOString()
      };

      await db.collection(collections.ADMIN_NOTIFICATIONS).add(notificationData);

      // Update link report count
      await db.collection(collections.LINKS).doc(linkId).update({
        'communityStats.totalReports': admin.firestore.FieldValue.increment(1),
        'communityStats.lastReportAt': new Date().toISOString()
      });

      res.status(201).json({
        message: 'Report submitted successfully',
        reportId: reportRef.id,
        status: 'pending'
      });

    } catch (error) {
      next(error);
    }
  }

  // Get all reports (admin only)
  async getAllReports(req, res, next) {
    try {
      const userId = req.user.userId;

      // Check if user is admin
      const userDoc = await db.collection(collections.USERS).doc(userId).get();
      const userData = userDoc.data();

      if (userData.role !== 'admin') {
        return res.status(403).json({
          error: 'Admin access required',
          code: 'ADMIN_REQUIRED'
        });
      }

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const status = req.query.status; // pending, reviewed, resolved, dismissed
      const category = req.query.category;

      // Build query
      let query = db.collection(collections.REPORTS);

      // Apply filters
      if (status) {
        query = query.where('status', '==', status);
      }
      if (category) {
        query = query.where('category', '==', category);
      }

      // Order by creation date (newest first)
      query = query.orderBy('createdAt', 'desc');

      // Get total count
      const totalSnapshot = await query.get();
      const totalReports = totalSnapshot.size;

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.offset(offset).limit(limit);

      const reportsSnapshot = await query.get();
      const reports = reportsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const totalPages = Math.ceil(totalReports / limit);

      res.json({
        reports,
        pagination: {
          currentPage: page,
          totalPages,
          totalReports,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        },
        filters: {
          status,
          category
        }
      });

    } catch (error) {
      next(error);
    }
  }

  // Update report status (admin only)
  async updateReportStatus(req, res, next) {
    try {
      const { reportId } = req.params;
      const { status, adminNotes } = req.body;
      const userId = req.user.userId;

      // Check if user is admin
      const userDoc = await db.collection(collections.USERS).doc(userId).get();
      const userData = userDoc.data();

      if (userData.role !== 'admin') {
        return res.status(403).json({
          error: 'Admin access required',
          code: 'ADMIN_REQUIRED'
        });
      }

      // Validate status
      const validStatuses = ['pending', 'reviewed', 'resolved', 'dismissed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          error: 'Invalid status',
          validStatuses,
          code: 'INVALID_STATUS'
        });
      }

      // Get report
      const reportDoc = await db.collection(collections.REPORTS).doc(reportId).get();
      if (!reportDoc.exists) {
        return res.status(404).json({
          error: 'Report not found',
          code: 'REPORT_NOT_FOUND'
        });
      }

      // Update report
      const updateData = {
        status,
        updatedAt: new Date().toISOString(),
        reviewedAt: new Date().toISOString(),
        reviewedBy: {
          userId,
          name: `${userData.firstName} ${userData.lastName}`,
          email: userData.email
        }
      };

      if (adminNotes) {
        updateData.adminNotes = adminNotes.trim();
      }

      await db.collection(collections.REPORTS).doc(reportId).update(updateData);

      res.json({
        message: 'Report status updated successfully',
        reportId,
        status
      });

    } catch (error) {
      next(error);
    }
  }

  // Get report statistics (admin only)
  async getReportStatistics(req, res, next) {
    try {
      const userId = req.user.userId;

      // Check if user is admin
      const userDoc = await db.collection(collections.USERS).doc(userId).get();
      const userData = userDoc.data();

      if (userData.role !== 'admin') {
        return res.status(403).json({
          error: 'Admin access required',
          code: 'ADMIN_REQUIRED'
        });
      }

      // Get all reports
      const allReportsSnapshot = await db.collection(collections.REPORTS).get();
      const allReports = allReportsSnapshot.docs.map(doc => doc.data());

      // Calculate statistics
      const stats = {
        total: allReports.length,
        byStatus: {
          pending: 0,
          reviewed: 0,
          resolved: 0,
          dismissed: 0
        },
        byCategory: {
          fake_news: 0,
          scam: 0,
          malicious_content: 0,
          spam: 0,
          other: 0
        },
        recentReports: 0 // Last 7 days
      };

      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      allReports.forEach(report => {
        // Count by status
        stats.byStatus[report.status]++;

        // Count by category
        stats.byCategory[report.category]++;

        // Count recent reports
        const reportDate = new Date(report.createdAt);
        if (reportDate > oneWeekAgo) {
          stats.recentReports++;
        }
      });

      res.json({
        statistics: stats,
        generatedAt: new Date().toISOString()
      });

    } catch (error) {
      next(error);
    }
  }

  // Get user's reports
  async getUserReports(req, res, next) {
    try {
      const userId = req.user.userId;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      // Build query
      let query = db.collection(collections.REPORTS)
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc');

      // Get total count
      const totalSnapshot = await query.get();
      const totalReports = totalSnapshot.size;

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.offset(offset).limit(limit);

      const reportsSnapshot = await query.get();
      const reports = reportsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const totalPages = Math.ceil(totalReports / limit);

      res.json({
        reports,
        pagination: {
          currentPage: page,
          totalPages,
          totalReports,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ReportController();
