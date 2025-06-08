// Use production config based on environment
const firebaseConfig = process.env.NODE_ENV === 'production'
  ? require('../config/firebase-production')
  : require('../config/firebase-emulator');

const { db, collections } = firebaseConfig;

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
      console.log('🎯 Dashboard request for user:', userId);

      // Get user data
      const userDoc = await db.collection(collections.USERS).doc(userId).get();
      const userData = userDoc.data();
      console.log('👤 User data:', userData?.firstName, userData?.stats);

      // Get ALL links checked by user (not just 10)
      const allLinksQuery = await db.collection(collections.LINKS)
        .where('userId', '==', userId)
        .get();

      const allLinks = allLinksQuery.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Get community submissions by user
      const communitySubmissionsQuery = await db.collection('community_submissions')
        .where('userId', '==', userId)
        .get();

      const communitySubmissions = communitySubmissionsQuery.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Get recent links for display (sorted by date)
      const recentLinks = allLinks
        .sort((a, b) => new Date(b.checkedAt) - new Date(a.checkedAt))
        .slice(0, 5);

      // Calculate stats from ALL links
      const totalLinksChecked = allLinks.length;
      const averageCredibility = allLinks.length > 0
        ? allLinks.reduce((sum, link) => sum + (link.credibilityScore || 0), 0) / allLinks.length
        : 0;

      console.log('📊 Calculated stats:', {
        totalLinksChecked,
        averageCredibility,
        allLinksCount: allLinks.length
      });

      // Get links checked this week
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const linksThisWeek = allLinks.filter(link =>
        new Date(link.checkedAt) >= oneWeekAgo
      ).length;

      // Update user stats in database to keep them in sync
      if (userData.stats?.linksChecked !== totalLinksChecked) {
        await db.collection(collections.USERS).doc(userId).update({
          'stats.linksChecked': totalLinksChecked,
          'updatedAt': new Date().toISOString()
        });
      }

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
          linksThisWeek: linksThisWeek,
          averageCredibilityScore: Math.round(averageCredibility * 10) / 10,
          communitySubmissions: communitySubmissions.length,
          communitySubmissionsThisWeek: communitySubmissions.filter(submission => {
            const submissionDate = new Date(submission.createdAt);
            return submissionDate >= oneWeekAgo;
          }).length
        },
        recentLinks: recentLinks,
        activity: {
          lastLoginAt: userData.lastLoginAt,
          accountCreated: userData.createdAt
        }
      };

      res.json({
        success: true,
        data: dashboardData
      });

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
