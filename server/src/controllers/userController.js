const { db, collections } = require('../config/firebase-emulator');

class UserController {
  // Get user profile
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

      res.json({
        user: {
          id: userId,
          ...userProfile
        }
      });

    } catch (error) {
      next(error);
    }
  }

  // Update user profile
  async updateProfile(req, res, next) {
    try {
      const userId = req.user.userId;
      const { firstName, lastName, bio, avatar } = req.body;

      // Prepare update data
      const updateData = {
        updatedAt: new Date().toISOString()
      };

      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (bio !== undefined) updateData['profile.bio'] = bio;
      if (avatar !== undefined) updateData['profile.avatar'] = avatar;

      // Update user document
      await db.collection(collections.USERS).doc(userId).update(updateData);

      // Get updated user data
      const updatedUserDoc = await db.collection(collections.USERS).doc(userId).get();
      const updatedUserData = updatedUserDoc.data();
      
      // Remove sensitive data
      const { password, ...userProfile } = updatedUserData;

      res.json({
        message: 'Profile updated successfully',
        user: {
          id: userId,
          ...userProfile
        }
      });

    } catch (error) {
      next(error);
    }
  }

  // Get user dashboard data
  async getDashboard(req, res, next) {
    try {
      const userId = req.user.userId;

      // Get user data
      const userDoc = await db.collection(collections.USERS).doc(userId).get();
      const userData = userDoc.data();

      // Get recent links checked by user
      const recentLinksQuery = await db.collection(collections.LINKS)
        .where('userId', '==', userId)
        .orderBy('checkedAt', 'desc')
        .limit(10)
        .get();

      const recentLinks = recentLinksQuery.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Calculate stats
      const totalLinksChecked = recentLinksQuery.size;
      const averageCredibility = recentLinks.length > 0 
        ? recentLinks.reduce((sum, link) => sum + link.credibilityScore, 0) / recentLinks.length
        : 0;

      // Get links checked this week
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const weeklyLinksQuery = await db.collection(collections.LINKS)
        .where('userId', '==', userId)
        .where('checkedAt', '>=', oneWeekAgo.toISOString())
        .get();

      const dashboardData = {
        user: {
          id: userId,
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          joinedAt: userData.createdAt,
          profile: userData.profile
        },
        stats: {
          totalLinksChecked: totalLinksChecked,
          linksThisWeek: weeklyLinksQuery.size,
          averageCredibilityScore: Math.round(averageCredibility * 10) / 10
        },
        recentLinks: recentLinks.slice(0, 5), // Show only 5 most recent
        activity: {
          lastLoginAt: userData.lastLoginAt,
          accountCreated: userData.createdAt
        }
      };

      res.json(dashboardData);

    } catch (error) {
      next(error);
    }
  }

  // Delete user account
  async deleteAccount(req, res, next) {
    try {
      const userId = req.user.userId;

      // Delete user's links
      const userLinksQuery = await db.collection(collections.LINKS)
        .where('userId', '==', userId)
        .get();

      const batch = db.batch();
      userLinksQuery.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Delete user document
      batch.delete(db.collection(collections.USERS).doc(userId));

      await batch.commit();

      res.json({
        message: 'Account deleted successfully'
      });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();
