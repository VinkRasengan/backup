const { db, collections } = require('../config/firebase');
const Logger = require('/app/shared/utils/logger');

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
