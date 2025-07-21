const express = require('express');
const { db, collections } = require('../config/firebase-wrapper');
const logger = require('../utils/logger');
const ResponseFormatter = require('../utils/response');

const router = express.Router();

// Get community-wide statistics
router.get('/community', async (req, res) => {
  try {
    const userId = req.user?.uid;
    
    // Get total posts
    const postsSnapshot = await db.collection(collections.POSTS).get();
    const totalPosts = postsSnapshot.size;

    // Get total comments
    const commentsSnapshot = await db.collection(collections.COMMENTS).get();
    const totalComments = commentsSnapshot.size;

    // Get total votes
    const votesSnapshot = await db.collection(collections.VOTES).get();
    const totalVotes = votesSnapshot.size;

    let userPosts = 0;
    let userComments = 0;
    let userVotes = 0;
    let recentActivity = [];

    // Get user-specific stats if logged in
    if (userId) {
      try {
        // User posts
        const userPostsSnapshot = await db.collection(collections.POSTS)
          .where('userId', '==', userId)
          .get();
        userPosts = userPostsSnapshot.size;

        // User comments
        const userCommentsSnapshot = await db.collection(collections.COMMENTS)
          .where('userId', '==', userId)
          .get();
        userComments = userCommentsSnapshot.size;

        // User votes
        const userVotesSnapshot = await db.collection(collections.VOTES)
          .where('userId', '==', userId)
          .get();
        userVotes = userVotesSnapshot.size;

        // Get recent activity (last 5 posts by user)
        const recentSnapshot = await db.collection(collections.POSTS)
          .where('userId', '==', userId)
          .orderBy('createdAt', 'desc')
          .limit(5)
          .get();
        
        recentActivity = [];
        recentSnapshot.forEach((doc) => {
          const data = doc.data();
          recentActivity.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.() || new Date()
          });
        });
      } catch (userStatsError) {
        logger.warn('Failed to fetch user-specific stats', { 
          userId, 
          error: userStatsError.message 
        });
        // Continue with community stats even if user stats fail
      }
    }

    const stats = {
      totalPosts,
      totalComments,
      totalVotes,
      userPosts,
      userComments,
      userVotes,
      recentActivity
    };

    logger.info('Community stats fetched successfully', { 
      userId: userId || 'anonymous',
      totalPosts,
      totalComments,
      totalVotes
    });

    return ResponseFormatter.success(res, stats, 'Community statistics retrieved successfully');

  } catch (error) {
    logger.error('Error fetching community stats', { 
      error: error.message,
      userId: req.user?.uid || 'anonymous'
    });
    
    return ResponseFormatter.error(res, 'Failed to fetch community statistics', 500, {
      code: 'STATS_FETCH_ERROR',
      details: error.message
    });
  }
});

// Get community overview statistics (public endpoint)
router.get('/community-overview', async (req, res) => {
  try {
    // Get total posts
    const postsSnapshot = await db.collection(collections.POSTS).get();
    const totalPosts = postsSnapshot.size;

    // Get total comments
    const commentsSnapshot = await db.collection(collections.COMMENTS).get();
    const totalComments = commentsSnapshot.size;

    // Estimate unique users from posts and comments
    const userIds = new Set();
    
    postsSnapshot.forEach((doc) => {
      const userId = doc.data().userId;
      if (userId) userIds.add(userId);
    });
    
    commentsSnapshot.forEach((doc) => {
      const userId = doc.data().userId;
      if (userId) userIds.add(userId);
    });

    const totalMembers = userIds.size;
    const onlineMembers = Math.floor(totalMembers * 0.1); // Simulate 10% online

    const stats = {
      totalMembers,
      onlineMembers,
      totalPosts,
      totalComments
    };

    logger.info('Community overview stats fetched successfully', stats);

    return ResponseFormatter.success(res, stats, 'Community overview statistics retrieved successfully');

  } catch (error) {
    logger.error('Error fetching community overview stats', { error: error.message });
    
    return ResponseFormatter.error(res, 'Failed to fetch community overview statistics', 500, {
      code: 'OVERVIEW_STATS_FETCH_ERROR',
      details: error.message
    });
  }
});

module.exports = router; 