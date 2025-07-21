const express = require('express');
const router = express.Router();
const { db, collections } = require('../config/firebase-wrapper');
const logger = require('../utils/logger');
const { getUserId, getUserEmail, getUserDisplayName, requireAuth } = require('../middleware/auth');
const { validateReport, validateQueryParams } = require('../middleware/validation');

// Helper function to check if user is admin
const isAdmin = (req) => {
  // Check by roles/permissions (Firebase custom claims)
  const hasAdminRole = req.user?.roles?.includes('admin') || req.user?.permissions?.includes('admin-operations');
  
  // Check by email (fallback for admin accounts)
  const adminEmails = ['admin@factcheck.com', 'admin@example.com'];
  const hasAdminEmail = adminEmails.includes(req.user?.email);
  
  return hasAdminRole || hasAdminEmail;
};

// Helper function to check if user is moderator
const isModerator = (req) => {
  // Check by roles/permissions (Firebase custom claims)
  const hasModeratorRole = req.user?.roles?.includes('moderator') || req.user?.permissions?.includes('moderate_content');
  
  // Check by email (fallback for admin accounts - admins are also moderators)
  const adminEmails = ['admin@factcheck.com', 'admin@example.com'];
  const hasAdminEmail = adminEmails.includes(req.user?.email);
  
  return hasModeratorRole || hasAdminEmail;
};

// Helper function to require admin or moderator access
const requireAdminOrModerator = (req, res, next) => {
  if (!isAdmin(req) && !isModerator(req)) {
    return res.status(403).json({
      success: false,
      error: 'Admin or moderator access required',
      code: 'INSUFFICIENT_PERMISSIONS'
    });
  }
  next();
};

// Submit a report for a link
// POST /reports/:linkId
router.post('/:linkId', requireAuth, validateReport, async (req, res) => {
  try {
    const { linkId } = req.params;
    const { reason, description } = req.body;
    
    const userId = getUserId(req);
    const userEmail = getUserEmail(req);
    const displayName = getUserDisplayName(req);

    logger.info('Submit report request', { 
      linkId, 
      reason, 
      userId, 
      userEmail 
    });

    // Validate linkId
    if (!linkId) {
      return res.status(400).json({
        success: false,
        error: 'Link ID is required',
        code: 'MISSING_LINK_ID'
      });
    }

    // Check if link exists, create it if needed
    let linkDoc = await db.collection(collections.POSTS).doc(linkId).get();
    if (!linkDoc.exists) {
      // Create a placeholder link entry for reporting
      const reportedUrl = req.body.url;
      
      // If no URL provided in request, try to extract from linkId or use a placeholder
      let placeholderUrl;
      if (reportedUrl) {
        placeholderUrl = reportedUrl;
      } else if (linkId.startsWith('http')) {
        // Sometimes linkId might be the URL itself
        placeholderUrl = linkId;
      } else {
        // Last resort fallback
        placeholderUrl = `https://reported-link-${Date.now()}`;
      }
      
      const placeholderLinkData = {
        title: `Reported Link ${linkId}`,
        content: 'This link was reported without being posted first.',
        url: placeholderUrl,
        author: {
          uid: 'system',
          email: 'system@factcheck.com',
          displayName: 'System Generated'
        },
        type: 'reported_link',
        category: 'general',
        tags: ['reported'],
        voteStats: { upvotes: 0, downvotes: 0, total: 0, score: 0 },
        voteScore: 0,
        commentCount: 0,
        viewCount: 0,
        verified: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await db.collection(collections.POSTS).doc(linkId).set(placeholderLinkData);
      logger.info('Created placeholder link for reporting', { linkId, url: placeholderUrl });
    }

    // Check if user already reported this link
    const existingReportQuery = await db.collection(collections.REPORTS)
      .where('linkId', '==', linkId)
      .where('reporter.uid', '==', userId)
      .get();

    if (!existingReportQuery.empty) {
      return res.status(409).json({
        success: false,
        error: 'You have already reported this link',
        code: 'DUPLICATE_REPORT'
      });
    }

    // Create report object
    const reportData = {
      linkId,
      reason,
      description: description?.trim() || '',
      reporter: {
        uid: userId,
        email: userEmail,
        displayName: displayName
      },
      status: 'pending',
      adminNotes: null,
      reviewedBy: null,
      reviewedAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add report to database
    const reportRef = await db.collection(collections.REPORTS).add(reportData);

    // Update link report count
    await db.collection(collections.POSTS).doc(linkId).update({
      reportCount: admin.firestore.FieldValue.increment(1),
      updatedAt: new Date()
    });

    // Update user stats
    await db.collection(collections.USERS).doc(userId).update({
      'stats.reportsSubmitted': admin.firestore.FieldValue.increment(1),
      updatedAt: new Date()
    });

    logger.info('Report submitted successfully', { 
      reportId: reportRef.id, 
      linkId, 
      userId 
    });

    // Return created report
    const createdReport = {
      id: reportRef.id,
      ...reportData,
      createdAt: reportData.createdAt.toISOString(),
      updatedAt: reportData.updatedAt.toISOString()
    };

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully',
      data: createdReport
    });

  } catch (error) {
    logger.error('Submit report error', { 
      error: error.message, 
      linkId: req.params.linkId,
      userId: getUserId(req)
    });
    res.status(500).json({
      success: false,
      error: 'Failed to submit report'
    });
  }
});

// Get user's reports
// GET /reports/user/my-reports
router.get('/user/my-reports', requireAuth, validateQueryParams, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const userId = getUserId(req);

    logger.info('Get user reports request', { 
      userId, 
      page, 
      limit 
    });

    // Calculate pagination
    const offset = (page - 1) * limit;

    // Get user's reports
    const reportsQuery = await db.collection(collections.REPORTS)
      .where('reporter.uid', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .offset(offset)
      .get();

    // Get total count
    const totalQuery = await db.collection(collections.REPORTS)
      .where('reporter.uid', '==', userId)
      .get();

    const reports = reportsQuery.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        linkId: data.linkId,
        reason: data.reason,
        description: data.description,
        status: data.status,
        adminNotes: data.adminNotes,
        reporter: data.reporter,
        reviewedBy: data.reviewedBy,
        reviewedAt: data.reviewedAt?.toDate?.()?.toISOString() || data.reviewedAt,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
      };
    });

    const total = totalQuery.size;
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        reports,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          total,
          limit: parseInt(limit),
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    logger.error('Get user reports error', { 
      error: error.message, 
      userId: getUserId(req)
    });
    res.status(500).json({
      success: false,
      error: 'Failed to get user reports'
    });
  }
});

// Get all reports (admin/moderator only)
// GET /admin/reports
router.get('/admin/reports', requireAuth, requireAdminOrModerator, validateQueryParams, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status = null, 
      reason = null,
      sort = 'newest'
    } = req.query;

    logger.info('Get all reports request (admin)', { 
      page, 
      limit, 
      status, 
      reason,
      sort,
      adminId: getUserId(req)
    });

    // Build query
    let query = db.collection(collections.REPORTS);

    // Apply filters
    if (status && status !== 'all') {
      query = query.where('status', '==', status);
    }

    if (reason && reason !== 'all') {
      query = query.where('reason', '==', reason);
    }

    // Get all documents first (workaround for missing composite index)
    const snapshot = await query.get();
    let reports = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        linkId: data.linkId,
        reason: data.reason,
        description: data.description,
        status: data.status,
        adminNotes: data.adminNotes,
        reporter: data.reporter,
        reviewedBy: data.reviewedBy,
        reviewedAt: data.reviewedAt?.toDate?.()?.toISOString() || data.reviewedAt,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
      };
    });

    // Apply sorting
    switch (sort) {
    case 'newest':
      reports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      break;
    case 'oldest':
      reports.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      break;
    case 'status':
      reports.sort((a, b) => {
        const statusOrder = { 'pending': 0, 'reviewed': 1, 'resolved': 2, 'dismissed': 3 };
        return (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0);
      });
      break;
    case 'reason':
      reports.sort((a, b) => a.reason.localeCompare(b.reason));
      break;
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    const paginatedReports = reports.slice(offset, offset + limit);

    // Get link information for each report
    const linkIds = [...new Set(paginatedReports.map(r => r.linkId))];
    const linksSnapshot = await db.collection(collections.POSTS)
      .where(db.FieldPath.documentId(), 'in', linkIds)
      .get();

    const linksMap = {};
    linksSnapshot.docs.forEach(doc => {
      const data = doc.data();
      linksMap[doc.id] = {
        id: doc.id,
        title: data.title || '',
        url: data.url || '',
        author: data.author || {}
      };
    });

    // Add link info to reports
    const reportsWithLinks = paginatedReports.map(report => ({
      ...report,
      linkInfo: linksMap[report.linkId] || null
    }));

    const total = reports.length;
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        reports: reportsWithLinks,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          total,
          limit: parseInt(limit),
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    logger.error('Get all reports error (admin)', { 
      error: error.message,
      adminId: getUserId(req)
    });
    res.status(500).json({
      success: false,
      error: 'Failed to get reports'
    });
  }
});

// Update report status (admin/moderator only)
// PUT /admin/reports/:reportId/status
router.put('/admin/reports/:reportId/status', requireAuth, requireAdminOrModerator, async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status, adminNotes } = req.body;
    
    const adminId = getUserId(req);
    const adminEmail = getUserEmail(req);
    const adminDisplayName = getUserDisplayName(req);

    logger.info('Update report status request', { 
      reportId, 
      status, 
      adminId 
    });

    // Validate status
    const validStatuses = ['pending', 'reviewed', 'resolved', 'dismissed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status',
        code: 'INVALID_STATUS',
        validStatuses
      });
    }

    // Get report
    const reportDoc = await db.collection(collections.REPORTS).doc(reportId).get();
    if (!reportDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Report not found',
        code: 'REPORT_NOT_FOUND'
      });
    }

    const reportData = reportDoc.data();

    // Update report
    const updateData = {
      status,
      updatedAt: new Date()
    };

    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes?.trim() || null;
    }

    if (status !== 'pending') {
      updateData.reviewedBy = {
        uid: adminId,
        email: adminEmail,
        displayName: adminDisplayName
      };
      updateData.reviewedAt = new Date();
    }

    await db.collection(collections.REPORTS).doc(reportId).update(updateData);

    logger.info('Report status updated', { 
      reportId, 
      status, 
      adminId 
    });

    // Get updated report
    const updatedDoc = await db.collection(collections.REPORTS).doc(reportId).get();
    const updatedReport = {
      id: updatedDoc.id,
      ...updatedDoc.data(),
      createdAt: updatedDoc.data().createdAt?.toDate?.()?.toISOString() || updatedDoc.data().createdAt,
      updatedAt: updatedDoc.data().updatedAt?.toDate?.()?.toISOString() || updatedDoc.data().updatedAt,
      reviewedAt: updatedDoc.data().reviewedAt?.toDate?.()?.toISOString() || updatedDoc.data().reviewedAt
    };

    res.json({
      success: true,
      message: 'Report status updated successfully',
      data: updatedReport
    });

  } catch (error) {
    logger.error('Update report status error', { 
      error: error.message, 
      reportId: req.params.reportId,
      adminId: getUserId(req)
    });
    res.status(500).json({
      success: false,
      error: 'Failed to update report status'
    });
  }
});

// Get report statistics (admin/moderator only)
// GET /admin/reports/statistics
router.get('/admin/reports/statistics', requireAuth, requireAdminOrModerator, async (req, res) => {
  try {
    const adminId = getUserId(req);

    logger.info('Get report statistics request', { adminId });

    // Get all reports
    const reportsSnapshot = await db.collection(collections.REPORTS).get();
    const reports = reportsSnapshot.docs.map(doc => doc.data());

    // Calculate statistics
    const stats = {
      total: reports.length,
      byStatus: {
        pending: 0,
        reviewed: 0,
        resolved: 0,
        dismissed: 0
      },
      byReason: {
        fake_news: 0,
        scam: 0,
        malicious_content: 0,
        spam: 0,
        inappropriate: 0,
        other: 0
      },
      byMonth: {},
      recentActivity: {
        last24h: 0,
        last7days: 0,
        last30days: 0
      }
    };

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    reports.forEach(report => {
      const createdAt = report.createdAt?.toDate?.() || new Date(report.createdAt);
      
      // Status counts
      stats.byStatus[report.status] = (stats.byStatus[report.status] || 0) + 1;
      
      // Reason counts
      stats.byReason[report.reason] = (stats.byReason[report.reason] || 0) + 1;
      
      // Monthly counts
      const monthKey = createdAt.toISOString().substring(0, 7); // YYYY-MM
      stats.byMonth[monthKey] = (stats.byMonth[monthKey] || 0) + 1;
      
      // Recent activity
      if (createdAt >= oneDayAgo) {
        stats.recentActivity.last24h++;
      }
      if (createdAt >= sevenDaysAgo) {
        stats.recentActivity.last7days++;
      }
      if (createdAt >= thirtyDaysAgo) {
        stats.recentActivity.last30days++;
      }
    });

    // Convert monthly stats to sorted array
    const monthlyStats = Object.entries(stats.byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({ month, count }));

    res.json({
      success: true,
      data: {
        ...stats,
        byMonth: monthlyStats
      }
    });

  } catch (error) {
    logger.error('Get report statistics error', { 
      error: error.message,
      adminId: getUserId(req)
    });
    res.status(500).json({
      success: false,
      error: 'Failed to get report statistics'
    });
  }
});

// Get a specific report (admin/moderator only)
// GET /admin/reports/:reportId
router.get('/admin/reports/:reportId', requireAuth, requireAdminOrModerator, async (req, res) => {
  try {
    const { reportId } = req.params;
    const adminId = getUserId(req);

    logger.info('Get specific report request', { reportId, adminId });

    const reportDoc = await db.collection(collections.REPORTS).doc(reportId).get();
    
    if (!reportDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Report not found',
        code: 'REPORT_NOT_FOUND'
      });
    }

    const reportData = reportDoc.data();
    const report = {
      id: reportDoc.id,
      ...reportData,
      createdAt: reportData.createdAt?.toDate?.()?.toISOString() || reportData.createdAt,
      updatedAt: reportData.updatedAt?.toDate?.()?.toISOString() || reportData.updatedAt,
      reviewedAt: reportData.reviewedAt?.toDate?.()?.toISOString() || reportData.reviewedAt
    };

    // Get link information
    const linkDoc = await db.collection(collections.POSTS).doc(reportData.linkId).get();
    if (linkDoc.exists) {
      const linkData = linkDoc.data();
      report.linkInfo = {
        id: linkDoc.id,
        title: linkData.title || '',
        url: linkData.url || '',
        author: linkData.author || {},
        content: linkData.content || ''
      };
    }

    res.json({
      success: true,
      data: report
    });

  } catch (error) {
    logger.error('Get specific report error', { 
      error: error.message, 
      reportId: req.params.reportId,
      adminId: getUserId(req)
    });
    res.status(500).json({
      success: false,
      error: 'Failed to get report'
    });
  }
});

module.exports = router;
