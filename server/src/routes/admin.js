const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const reportController = require('../controllers/reportController');
const { validateRequest, schemas } = require('../middleware/validation');

// Apply admin access check to all routes
router.use(adminController.checkAdminAccess);

// Notification routes
// @route   GET /api/admin/notifications
// @desc    Get admin notifications
// @access  Admin
router.get('/notifications', adminController.getNotifications);

// @route   PUT /api/admin/notifications/:notificationId/read
// @desc    Mark notification as read
// @access  Admin
router.put('/notifications/:notificationId/read', adminController.markNotificationRead);

// @route   PUT /api/admin/notifications/read-all
// @desc    Mark all notifications as read
// @access  Admin
router.put('/notifications/read-all', adminController.markAllNotificationsRead);

// @route   DELETE /api/admin/notifications/:notificationId
// @desc    Delete notification
// @access  Admin
router.delete('/notifications/:notificationId', adminController.deleteNotification);

// Report management routes
// @route   GET /api/admin/reports
// @desc    Get all reports with filtering and pagination
// @access  Admin
router.get('/reports', reportController.getAllReports);

// @route   PUT /api/admin/reports/:reportId/status
// @desc    Update report status
// @access  Admin
router.put('/reports/:reportId/status', 
  validateRequest(schemas.updateReportStatus),
  reportController.updateReportStatus
);

// @route   GET /api/admin/reports/statistics
// @desc    Get report statistics
// @access  Admin
router.get('/reports/statistics', reportController.getReportStatistics);

// Dashboard routes
// @route   GET /api/admin/dashboard/stats
// @desc    Get admin dashboard statistics
// @access  Admin
router.get('/dashboard/stats', adminController.getDashboardStats);

// @route   GET /api/admin/dashboard/activity
// @desc    Get recent activity for admin dashboard
// @access  Admin
router.get('/dashboard/activity', adminController.getRecentActivity);

// User management routes
// @route   PUT /api/admin/users/:userId/role
// @desc    Update user role (promote to admin or demote)
// @access  Admin
router.put('/users/:userId/role', 
  validateRequest(schemas.updateUserRole),
  adminController.updateUserRole
);

module.exports = router;
