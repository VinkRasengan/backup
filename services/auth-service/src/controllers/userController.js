const { db, collections } = require('../config/firebase');
const { Logger } = require('@factcheck/shared');

const logger = new Logger('auth-service');

class UserController {
  /**
   * Get user profile
   */
  async getProfile(req, res, next) {
    try {
      const userId = req.user.userId;

      const userDoc = await db.collection(collections.USERS).doc(userId).get();
      
      if (!userDoc.exists) {
        return res.status(404).json({
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      const userData = userDoc.data();
      
      // Remove sensitive data
      const { password, ...userProfile } = userData;

      logger.withCorrelationId(req.correlationId).info('User profile retrieved', {
        userId
      });

      res.json({
        user: {
          id: userId,
          ...userProfile
        }
      });

    } catch (error) {
      logger.logError(error, req);
      next(error);
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(req, res, next) {
    try {
      const userId = req.user.userId;
      const { firstName, lastName, bio, avatar, preferences } = req.body;

      const updateData = {
        updatedAt: new Date().toISOString()
      };

      // Update fields if provided
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (bio !== undefined) updateData['profile.bio'] = bio;
      if (avatar !== undefined) updateData['profile.avatar'] = avatar;
      if (preferences !== undefined) {
        if (preferences.notifications !== undefined) {
          updateData['profile.preferences.notifications'] = preferences.notifications;
        }
        if (preferences.theme !== undefined) {
          updateData['profile.preferences.theme'] = preferences.theme;
        }
      }

      // Update display name if first or last name changed
      if (firstName !== undefined || lastName !== undefined) {
        const userDoc = await db.collection(collections.USERS).doc(userId).get();
        const currentData = userDoc.data();
        const newFirstName = firstName !== undefined ? firstName : currentData.firstName;
        const newLastName = lastName !== undefined ? lastName : currentData.lastName;
        updateData.displayName = `${newFirstName} ${newLastName}`.trim();
      }

      // Update user document
      await db.collection(collections.USERS).doc(userId).update(updateData);

      // Get updated user data
      const updatedUserDoc = await db.collection(collections.USERS).doc(userId).get();
      const updatedUserData = updatedUserDoc.data();
      
      // Remove sensitive data
      const { password, ...userProfile } = updatedUserData;

      logger.withCorrelationId(req.correlationId).info('User profile updated', {
        userId,
        updatedFields: Object.keys(updateData)
      });

      res.json({
        message: 'Profile updated successfully',
        user: {
          id: userId,
          ...userProfile
        }
      });

    } catch (error) {
      logger.logError(error, req);
      next(error);
    }
  }

  /**
   * Get user statistics
   */
  async getStats(req, res, next) {
    try {
      const userId = req.user.userId;

      const userDoc = await db.collection(collections.USERS).doc(userId).get();

      if (!userDoc.exists) {
        return res.status(404).json({
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      const userData = userDoc.data();

      const stats = {
        userId,
        joinedAt: userData.createdAt,
        lastLoginAt: userData.lastLoginAt,
        linksChecked: userData.stats?.linksChecked || 0,
        isVerified: userData.isVerified,
        roles: userData.roles || ['user']
      };

      res.json({
        stats
      });

    } catch (error) {
      logger.logError(error, req);
      next(error);
    }
  }

  /**
   * Get user dashboard data
   */
  async getDashboard(req, res, next) {
    try {
      const userId = req.user.userId;

      // For testing, return mock data directly without Firebase
      const mockUserData = {
        email: req.user.email || 'test@example.com',
        displayName: 'Test User',
        firstName: 'Test',
        lastName: 'User',
        isVerified: true,
        roles: req.user.roles || ['user'],
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        profile: {
          avatar: null,
          bio: 'Test user for dashboard testing',
          preferences: {
            notifications: true,
            theme: 'light'
          }
        },
        stats: {
          linksChecked: 42,
          postsCreated: 5,
          commentsPosted: 12,
          reputationScore: 150
        }
      };

      const userData = mockUserData;

      // Dashboard data - match frontend expected structure
      const dashboardData = {
        user: {
          id: userId,
          firstName: userData.firstName || userData.displayName?.split(' ')[0] || 'User',
          lastName: userData.lastName || userData.displayName?.split(' ').slice(1).join(' ') || '',
          displayName: userData.displayName || `${userData.firstName || 'User'} ${userData.lastName || ''}`.trim(),
          email: userData.email,
          avatar: userData.profile?.avatar,
          isVerified: userData.isVerified,
          roles: userData.roles || ['user']
        },
        stats: {
          totalLinksChecked: userData.stats?.linksChecked || 42,
          linksThisWeek: Math.floor((userData.stats?.linksChecked || 42) * 0.2), // 20% this week
          averageCredibilityScore: 94,
          communitySubmissions: userData.stats?.postsCreated || 5
        },
        recentLinks: [
          {
            id: 'link_1',
            url: 'https://example.com/news-article-1',
            metadata: {
              title: 'Tin tức mẫu về công nghệ',
              domain: 'example.com'
            },
            credibilityScore: 89,
            checkedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2 hours ago
          },
          {
            id: 'link_2', 
            url: 'https://sample.com/health-news',
            metadata: {
              title: 'Thông tin sức khỏe đáng tin cậy',
              domain: 'sample.com'
            },
            credibilityScore: 95,
            checkedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() // 1 day ago
          },
          {
            id: 'link_3',
            url: 'https://test.com/breaking-news',
            metadata: {
              title: 'Tin nóng cần kiểm chứng',
              domain: 'test.com'
            },
            credibilityScore: 67,
            checkedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString() // 2 days ago
          }
        ],
        activity: {
          lastLoginAt: userData.lastLoginAt,
          joinedAt: userData.createdAt,
          lastActiveAt: userData.lastActiveAt || userData.lastLoginAt
        },
        preferences: userData.profile?.preferences || {
          notifications: true,
          theme: 'light'
        }
      };

      logger.withCorrelationId(req.correlationId).info('User dashboard retrieved', {
        userId
      });

      res.json({
        data: dashboardData
      });

    } catch (error) {
      logger.logError(error, req);
      next(error);
    }
  }

  /**
   * Get user notifications
   */
  async getNotifications(req, res, next) {
    try {
      const userId = req.user.userId;

      logger.withCorrelationId(req.correlationId).info('User notifications requested', {
        userId
      });

      // Mock notifications data for now
      // In a real implementation, you would fetch from a notifications collection
      const notifications = {
        unreadCount: 3,
        notifications: [
          {
            id: 'notif_1',
            type: 'comment',
            title: 'Bình luận mới',
            message: 'Ai đó đã bình luận về bài viết của bạn',
            createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
            read: false,
            data: {
              linkId: 'link_123',
              commentId: 'comment_456'
            }
          },
          {
            id: 'notif_2',
            type: 'vote',
            title: 'Bỏ phiếu mới',
            message: 'Bài viết của bạn nhận được một phiếu bầu',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
            read: false,
            data: {
              linkId: 'link_124',
              voteType: 'credible'
            }
          },
          {
            id: 'notif_3',
            type: 'system',
            title: 'Chào mừng!',
            message: 'Chào mừng bạn đến với FactCheck community',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
            read: false,
            data: {}
          }
        ]
      };

      res.json(notifications);

    } catch (error) {
      logger.logError(error, req);
      next(error);
    }
  }

  /**
   * Update user roles (admin only)
   */
  async updateRoles(req, res, next) {
    try {
      const { userId } = req.params;
      const { roles } = req.body;

      // Check if current user is admin
      if (!req.user.roles?.includes('admin')) {
        return res.status(403).json({
          error: 'Admin access required',
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }

      if (!Array.isArray(roles)) {
        return res.status(400).json({
          error: 'Roles must be an array',
          code: 'INVALID_ROLES'
        });
      }

      // Validate roles
      const validRoles = ['user', 'admin', 'moderator'];
      const invalidRoles = roles.filter(role => !validRoles.includes(role));
      
      if (invalidRoles.length > 0) {
        return res.status(400).json({
          error: `Invalid roles: ${invalidRoles.join(', ')}`,
          code: 'INVALID_ROLES'
        });
      }

      // Update user roles
      await db.collection(collections.USERS).doc(userId).update({
        roles,
        updatedAt: new Date().toISOString()
      });

      logger.withCorrelationId(req.correlationId).info('User roles updated', {
        targetUserId: userId,
        adminUserId: req.user.userId,
        newRoles: roles
      });

      res.json({
        message: 'User roles updated successfully',
        userId,
        roles
      });

    } catch (error) {
      logger.logError(error, req);
      next(error);
    }
  }

  /**
   * Delete user account
   */
  async deleteAccount(req, res, next) {
    try {
      const userId = req.user.userId;

      // Delete user document
      await db.collection(collections.USERS).doc(userId).delete();

      logger.withCorrelationId(req.correlationId).info('User account deleted', {
        userId
      });

      res.json({
        message: 'Account deleted successfully'
      });

    } catch (error) {
      logger.logError(error, req);
      next(error);
    }
  }

  /**
   * List users (admin only)
   */
  async listUsers(req, res, next) {
    try {
      // Check if current user is admin
      if (!req.user.roles?.includes('admin')) {
        return res.status(403).json({
          error: 'Admin access required',
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }

      const { page = 1, limit = 20, search } = req.query;
      const offset = (page - 1) * limit;

      let query = db.collection(collections.USERS);

      // Add search filter if provided
      if (search) {
        // Note: Firestore doesn't support full-text search
        // This is a simple email prefix search
        query = query
          .where('email', '>=', search)
          .where('email', '<=', search + '\uf8ff');
      }

      // Get users with pagination
      const snapshot = await query
        .orderBy('createdAt', 'desc')
        .offset(offset)
        .limit(parseInt(limit))
        .get();

      const users = snapshot.docs.map(doc => {
        const userData = doc.data();
        const { password, ...userProfile } = userData;
        return {
          id: doc.id,
          ...userProfile
        };
      });

      // Get total count (approximate)
      const totalSnapshot = await db.collection(collections.USERS).get();
      const total = totalSnapshot.size;

      res.json({
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });

    } catch (error) {
      logger.logError(error, req);
      next(error);
    }
  }
}

module.exports = new UserController();
