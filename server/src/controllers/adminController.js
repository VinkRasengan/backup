// Use production config based on environment
const firebaseConfig = process.env.NODE_ENV === 'production'
  ? require('../config/firebase-production')
  : require('../config/firebase-emulator');

const { db, collections, admin } = firebaseConfig;

class AdminController {
  // Middleware to check admin access
  async checkAdminAccess(req, res, next) {
    try {
      const userId = req.user.userId;

      const userDoc = await db.collection(collections.USERS).doc(userId).get();
      const userData = userDoc.data();

      if (userData.role !== 'admin') {
        return res.status(403).json({
          error: 'Admin access required',
          code: 'ADMIN_REQUIRED'
        });
      }

      req.admin = userData;
      next();
    } catch (error) {
      next(error);
    }
  }

  // Get admin notifications
  async getNotifications(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const unreadOnly = req.query.unreadOnly === 'true';

      // Build query
      let query = db.collection(collections.ADMIN_NOTIFICATIONS);

      if (unreadOnly) {
        query = query.where('isRead', '==', false);
      }

      query = query.orderBy('createdAt', 'desc');

      // Get total count
      const totalSnapshot = await query.get();
      const totalNotifications = totalSnapshot.size;

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.offset(offset).limit(limit);

      const notificationsSnapshot = await query.get();
      const notifications = notificationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Get unread count
      const unreadSnapshot = await db.collection(collections.ADMIN_NOTIFICATIONS)
        .where('isRead', '==', false)
        .get();
      const unreadCount = unreadSnapshot.size;

      const totalPages = Math.ceil(totalNotifications / limit);

      res.json({
        notifications,
        unreadCount,
        pagination: {
          currentPage: page,
          totalPages,
          totalNotifications,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      });

    } catch (error) {
      next(error);
    }
  }

  // Mark notification as read
  async markNotificationRead(req, res, next) {
    try {
      const { notificationId } = req.params;

      const notificationDoc = await db.collection(collections.ADMIN_NOTIFICATIONS).doc(notificationId).get();
      if (!notificationDoc.exists) {
        return res.status(404).json({
          error: 'Notification not found',
          code: 'NOTIFICATION_NOT_FOUND'
        });
      }

      await db.collection(collections.ADMIN_NOTIFICATIONS).doc(notificationId).update({
        isRead: true,
        readAt: new Date().toISOString()
      });

      res.json({
        message: 'Notification marked as read'
      });

    } catch (error) {
      next(error);
    }
  }

  // Mark all notifications as read
  async markAllNotificationsRead(req, res, next) {
    try {
      const unreadNotificationsSnapshot = await db.collection(collections.ADMIN_NOTIFICATIONS)
        .where('isRead', '==', false)
        .get();

      const batch = db.batch();
      const readAt = new Date().toISOString();

      unreadNotificationsSnapshot.docs.forEach(doc => {
        batch.update(doc.ref, {
          isRead: true,
          readAt
        });
      });

      await batch.commit();

      res.json({
        message: `${unreadNotificationsSnapshot.size} notifications marked as read`
      });

    } catch (error) {
      next(error);
    }
  }

  // Delete notification
  async deleteNotification(req, res, next) {
    try {
      const { notificationId } = req.params;

      const notificationDoc = await db.collection(collections.ADMIN_NOTIFICATIONS).doc(notificationId).get();
      if (!notificationDoc.exists) {
        return res.status(404).json({
          error: 'Notification not found',
          code: 'NOTIFICATION_NOT_FOUND'
        });
      }

      await db.collection(collections.ADMIN_NOTIFICATIONS).doc(notificationId).delete();

      res.json({
        message: 'Notification deleted successfully'
      });

    } catch (error) {
      next(error);
    }
  }

  // Get admin dashboard statistics
  async getDashboardStats(req, res, next) {
    try {
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Get user statistics
      const allUsersSnapshot = await db.collection(collections.USERS).get();
      const totalUsers = allUsersSnapshot.size;

      const recentUsersSnapshot = await db.collection(collections.USERS)
        .where('createdAt', '>=', oneWeekAgo.toISOString())
        .get();
      const newUsersThisWeek = recentUsersSnapshot.size;

      // Get link statistics
      const allLinksSnapshot = await db.collection(collections.LINKS).get();
      const totalLinksChecked = allLinksSnapshot.size;

      const recentLinksSnapshot = await db.collection(collections.LINKS)
        .where('checkedAt', '>=', oneWeekAgo.toISOString())
        .get();
      const linksCheckedThisWeek = recentLinksSnapshot.size;

      // Get report statistics
      const allReportsSnapshot = await db.collection(collections.REPORTS).get();
      const totalReports = allReportsSnapshot.size;

      const pendingReportsSnapshot = await db.collection(collections.REPORTS)
        .where('status', '==', 'pending')
        .get();
      const pendingReports = pendingReportsSnapshot.size;

      const recentReportsSnapshot = await db.collection(collections.REPORTS)
        .where('createdAt', '>=', oneWeekAgo.toISOString())
        .get();
      const newReportsThisWeek = recentReportsSnapshot.size;

      // Get comment statistics
      const allCommentsSnapshot = await db.collection(collections.COMMENTS).get();
      const totalComments = allCommentsSnapshot.size;

      const recentCommentsSnapshot = await db.collection(collections.COMMENTS)
        .where('createdAt', '>=', oneWeekAgo.toISOString())
        .get();
      const newCommentsThisWeek = recentCommentsSnapshot.size;

      // Get vote statistics
      const allVotesSnapshot = await db.collection(collections.VOTES).get();
      const totalVotes = allVotesSnapshot.size;

      const recentVotesSnapshot = await db.collection(collections.VOTES)
        .where('createdAt', '>=', oneWeekAgo.toISOString())
        .get();
      const newVotesThisWeek = recentVotesSnapshot.size;

      // Get unread notifications count
      const unreadNotificationsSnapshot = await db.collection(collections.ADMIN_NOTIFICATIONS)
        .where('isRead', '==', false)
        .get();
      const unreadNotifications = unreadNotificationsSnapshot.size;

      const stats = {
        users: {
          total: totalUsers,
          newThisWeek: newUsersThisWeek
        },
        links: {
          total: totalLinksChecked,
          checkedThisWeek: linksCheckedThisWeek
        },
        reports: {
          total: totalReports,
          pending: pendingReports,
          newThisWeek: newReportsThisWeek
        },
        community: {
          totalComments,
          newCommentsThisWeek,
          totalVotes,
          newVotesThisWeek
        },
        notifications: {
          unread: unreadNotifications
        },
        generatedAt: new Date().toISOString()
      };

      res.json({
        statistics: stats
      });

    } catch (error) {
      next(error);
    }
  }

  // Get recent activity for admin dashboard
  async getRecentActivity(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 20;

      // Get recent reports
      const recentReportsSnapshot = await db.collection(collections.REPORTS)
        .orderBy('createdAt', 'desc')
        .limit(5)
        .get();

      const recentReports = recentReportsSnapshot.docs.map(doc => ({
        id: doc.id,
        type: 'report',
        ...doc.data()
      }));

      // Get recent comments
      const recentCommentsSnapshot = await db.collection(collections.COMMENTS)
        .orderBy('createdAt', 'desc')
        .limit(5)
        .get();

      const recentComments = recentCommentsSnapshot.docs.map(doc => ({
        id: doc.id,
        type: 'comment',
        ...doc.data()
      }));

      // Get recent users
      const recentUsersSnapshot = await db.collection(collections.USERS)
        .orderBy('createdAt', 'desc')
        .limit(5)
        .get();

      const recentUsers = recentUsersSnapshot.docs.map(doc => ({
        id: doc.id,
        type: 'user',
        ...doc.data()
      }));

      // Combine and sort all activities
      const allActivities = [...recentReports, ...recentComments, ...recentUsers];
      allActivities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const recentActivity = allActivities.slice(0, limit);

      res.json({
        recentActivity,
        generatedAt: new Date().toISOString()
      });

    } catch (error) {
      next(error);
    }
  }

  // Update user role (promote to admin or demote)
  async updateUserRole(req, res, next) {
    try {
      const { userId } = req.params;
      const { role } = req.body;

      // Validate role
      const validRoles = ['user', 'admin'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          error: 'Invalid role. Must be: user or admin',
          code: 'INVALID_ROLE'
        });
      }

      // Check if target user exists
      const targetUserDoc = await db.collection(collections.USERS).doc(userId).get();
      if (!targetUserDoc.exists) {
        return res.status(404).json({
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Update user role
      await db.collection(collections.USERS).doc(userId).update({
        role,
        updatedAt: new Date().toISOString()
      });

      const targetUserData = targetUserDoc.data();

      res.json({
        message: `User role updated to ${role}`,
        user: {
          id: userId,
          name: `${targetUserData.firstName} ${targetUserData.lastName}`,
          email: targetUserData.email,
          role
        }
      });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AdminController();
