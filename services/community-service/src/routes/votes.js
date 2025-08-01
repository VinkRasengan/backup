const express = require('express');
const router = express.Router();
const { db, collections } = require('../config/firebase-wrapper');
const logger = require('../utils/logger');
const { getUserId, getUserEmail } = require('../middleware/auth');
const { cacheManager, SimpleCache } = require('../utils/cache');
const CommunityEventHandler = require('../events/communityEventHandler');

// Initialize event handler
const eventHandler = new CommunityEventHandler();

// Use unified cache for vote statistics with shorter TTL
const voteStatsCache = new SimpleCache(30000); // 30 seconds TTL

// Helper function to update link vote count and score using atomic transaction
async function updateLinkVoteCount(linkId) {
  const maxRetries = 3;
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    try {
      // Use Firestore transaction for atomic updates with timeout
      return await Promise.race([
        db.runTransaction(async (transaction) => {
          // Get all votes for this link
          const votesSnapshot = await transaction.get(
            db.collection(collections.VOTES).where('linkId', '==', linkId)
          );

          // Calculate vote statistics
          const stats = {
            total: 0,
            upvotes: 0,
            downvotes: 0,
            score: 0
          };

          votesSnapshot.forEach((doc) => {
            const voteType = doc.data().voteType;
            stats.total++;

            if (voteType === 'upvote') {
              stats.upvotes++;
            } else if (voteType === 'downvote') {
              stats.downvotes++;
            }
          });

          // Calculate Reddit-style score
          stats.score = stats.upvotes - stats.downvotes;

          // Update link with vote statistics atomically
          const linkRef = db.collection(collections.POSTS).doc(linkId);
          const linkDoc = await transaction.get(linkRef);

          if (linkDoc.exists) {
            transaction.update(linkRef, {
              voteCount: stats.total,
              voteScore: stats.score,
              voteStats: {
                upvotes: stats.upvotes,
                downvotes: stats.downvotes,
                total: stats.total,
                score: stats.score
              },
              updatedAt: new Date()
            });
          }

          // Also try links collection (for backward compatibility)
          try {
            const linksRef = db.collection('links').doc(linkId);
            const linksDoc = await transaction.get(linksRef);
            if (linksDoc.exists) {
              transaction.update(linksRef, {
                voteCount: stats.total,
                voteScore: stats.score,
                updatedAt: new Date()
              });
            }
          } catch (error) {
            // Ignore if links collection doesn't exist
            logger.debug('Links collection update failed (expected if not using links collection)', { linkId });
          }

          // Clear all related cache after successful update
          voteStatsCache.delete(linkId);
          await cacheManager.del('votes', `stats:${linkId}`);
          
          // Also clear user vote cache for all users voting on this link
          await cacheManager.delPattern('votes', `user:*:${linkId}`);

          logger.info('Vote statistics updated atomically', { linkId, stats });
          return stats;
        }),
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Transaction timeout')), 10000); // 10 second timeout
        })
      ]);
    } catch (error) {
      retryCount++;
      logger.error('Atomic vote count update error', { 
        error: error.message, 
        linkId, 
        attempt: retryCount,
        maxRetries 
      });
      
      if (retryCount >= maxRetries) {
        throw error;
      }
      
      // Wait before retry with exponential backoff
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount - 1)));
    }
  }
}

// Submit or update vote for a link (Reddit-style)
router.post('/:linkId', async (req, res) => {
  try {
    const { linkId } = req.params;
    const { voteType, userId } = req.body; // 'upvote', 'downvote'

    // Get user info from auth middleware or request body
    const finalUserId = getUserId(req) || userId || 'anonymous';
    const userEmail = getUserEmail(req);

    console.log('🗳️ [POST /votes/:linkId] Debug info:', {
      linkId,
      voteType,
      requestUserId: userId,
      finalUserId,
      requestHeaders: {
        authorization: req.headers.authorization ? 'Bearer ***' : 'none',
        'x-user-id': req.headers['x-user-id']
      },
      requestUser: req.user,
      authUserId: req.user?.uid,
      userEmail
    });

    logger.info('Vote submission request', { 
      linkId, 
      voteType, 
      userId: finalUserId,
      requestUserId: userId,
      hasAuthUser: !!req.user,
      authUserId: req.user?.uid,
      userEmail
    });

    // Enhanced validation
    if (!linkId || !voteType) {
      logger.warn('Vote submission missing required fields', { linkId, voteType });
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: linkId, voteType'
      });
    }

    // Validate vote type (Reddit-style)
    if (!['upvote', 'downvote'].includes(voteType)) {
      logger.warn('Invalid vote type', { voteType, validTypes: ['upvote', 'downvote'] });
      return res.status(400).json({
        success: false,
        error: 'Invalid vote type. Must be "upvote" or "downvote"'
      });
    }

    // Warn if no user ID (but allow anonymous voting for now)
    if (!finalUserId || finalUserId === 'anonymous') {
      logger.warn('Anonymous vote detected', { linkId, voteType });
    }

    // Use atomic transaction for vote submission and count update
    const result = await db.runTransaction(async (transaction) => {
      logger.debug('Starting vote transaction', { linkId, userId: finalUserId, voteType });
      
      // Check if user already voted
      const existingVoteQuery = await transaction.get(
        db.collection(collections.VOTES)
          .where('linkId', '==', linkId)
          .where('userId', '==', finalUserId)
      );

      let voteDoc;
      let action = 'created';

      if (!existingVoteQuery.empty) {
        // User already voted
        voteDoc = existingVoteQuery.docs[0];
        const existingVote = voteDoc.data();

        logger.debug('Existing vote found', { 
          existingVoteType: existingVote.voteType, 
          newVoteType: voteType 
        });

        if (existingVote.voteType === voteType) {
          // Same vote type - remove vote (toggle off)
          transaction.delete(voteDoc.ref);
          action = 'removed';
          logger.info('Vote removed (toggle off)', { linkId, userId: finalUserId, voteType });
        } else {
          // Different vote type - update vote
          transaction.update(voteDoc.ref, {
            voteType,
            updatedAt: new Date()
          });
          action = 'updated';
          logger.info('Vote updated', { 
            linkId, 
            userId: finalUserId, 
            oldType: existingVote.voteType, 
            newType: voteType 
          });
        }
      } else {
        // Create new vote
        const newVoteRef = db.collection(collections.VOTES).doc();
        const newVote = {
          linkId,
          userId: finalUserId,
          userEmail: userEmail || null,
          voteType,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        transaction.set(newVoteRef, newVote);
        voteDoc = { id: newVoteRef.id, ref: newVoteRef };
        logger.info('New vote created', { linkId, userId: finalUserId, voteType });
      }

      logger.debug('Vote transaction completed', { action, linkId, userId: finalUserId });
      return { voteDoc, action };
    });

    // Update vote count on the link with retry mechanism
    setImmediate(async () => {
      let retries = 3;
      while (retries > 0) {
        try {
          const stats = await updateLinkVoteCount(linkId);
          logger.info('Vote count updated successfully', { linkId, stats, retries: 3 - retries + 1 });
          break;
        } catch (error) {
          retries--;
          logger.error('Vote count update failed', { 
            error: error.message, 
            linkId, 
            retriesLeft: retries 
          });
          
          if (retries === 0) {
            logger.error('Vote count update failed after all retries', { linkId, error: error.message });
          } else {
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 1000 * (4 - retries)));
          }
        }
      }
    });

    const { voteDoc, action } = result;

    // Publish vote event
    const voteEventData = {
      linkId,
      userId: finalUserId,
      voteType: action === 'removed' ? null : voteType,
      action,
      previousVote: action === 'updated' ? (voteType === 'upvote' ? 'downvote' : 'upvote') : null
    };
    await eventHandler.publishVoteEvent(voteEventData);

    // Prepare response based on action
    const response = {
      success: true,
      action,
      linkId,
      userId: finalUserId
    };

    if (action === 'removed') {
      response.message = 'Vote removed successfully';
      response.vote = null;
    } else {
      response.message = `Vote ${action} successfully`;
      response.vote = {
        id: voteDoc.id,
        linkId,
        userId: finalUserId,
        voteType,
        createdAt: new Date().toISOString()
      };
    }

    res.json(response);
  } catch (error) {
    logger.error('Vote submission error', { error: error.message, linkId: req.params.linkId });
    res.status(500).json({
      success: false,
      error: 'Failed to submit vote',
      message: error.message
    });
  }
});

// Get vote statistics for a link with caching
router.get('/:linkId/stats', async (req, res) => {
  try {
    const { linkId } = req.params;

    // Try cache first (30 seconds TTL)
    const cached = await cacheManager.get('votes', `stats:${linkId}`);
    if (cached) {
      logger.debug('Vote stats cache hit', { linkId });
      return res.json({
        success: true,
        data: {
          linkId,
          statistics: cached
        }
      });
    }

    const votesSnapshot = await db.collection(collections.VOTES)
      .where('linkId', '==', linkId)
      .get();

    const stats = {
      total: 0,
      upvotes: 0,
      downvotes: 0,
      score: 0 // upvotes - downvotes (Reddit-style score)
    };

    votesSnapshot.forEach((doc) => {
      const voteType = doc.data().voteType;
      stats.total++;

      if (voteType === 'upvote') {
        stats.upvotes++;
      } else if (voteType === 'downvote') {
        stats.downvotes++;
      }
    });

    // Calculate Reddit-style score
    stats.score = stats.upvotes - stats.downvotes;

    // Cache the stats for 30 seconds
    await cacheManager.set('votes', `stats:${linkId}`, stats, 30);

    res.json({
      success: true,
      data: {
        linkId,
        statistics: stats  // Use 'statistics' to match frontend expectation
      }
    });
  } catch (error) {
    logger.error('Vote stats error', { error: error.message, linkId: req.params.linkId });
    res.status(500).json({
      success: false,
      error: 'Failed to get vote stats'
    });
  }
});

// Get user's vote for a specific link with caching
router.get('/:linkId/user', async (req, res) => {
  try {
    const { linkId } = req.params;
    const userId = getUserId(req);

    console.log('🔍 [GET /votes/:linkId/user] Debug info:', {
      linkId,
      userId,
      requestHeaders: {
        authorization: req.headers.authorization ? 'Bearer ***' : 'none',
        'x-user-id': req.headers['x-user-id']
      },
      requestUser: req.user,
      requestBody: req.body,
      requestQuery: req.query
    });

    if (!userId) {
      console.log('❌ [GET /votes/:linkId/user] No user ID found - auth middleware should have caught this');
      // This should not happen if auth middleware is working correctly
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // Try cache first for user vote (60 seconds TTL)
    const cacheKey = `user:${userId}:${linkId}`;
    const cached = await cacheManager.get('votes', cacheKey);
    if (cached) {
      logger.debug('User vote cache hit', { linkId, userId });
      return res.json({
        success: true,
        data: cached
      });
    }

    console.log('🔍 [GET /votes/:linkId/user] Querying votes with:', { linkId, userId });

    const userVoteQuery = await db.collection(collections.VOTES)
      .where('linkId', '==', linkId)
      .where('userId', '==', userId)
      .get();

    console.log('📊 [GET /votes/:linkId/user] Query result:', {
      isEmpty: userVoteQuery.empty,
      size: userVoteQuery.size
    });

    let userVoteData = null;

    if (!userVoteQuery.empty) {
      const voteDoc = userVoteQuery.docs[0];
      const voteData = voteDoc.data();

      console.log('✅ [GET /votes/:linkId/user] Found user vote:', {
        docId: voteDoc.id,
        voteData: voteData
      });

      userVoteData = {
        id: voteDoc.id,
        linkId,
        userId: voteData.userId,
        voteType: voteData.voteType,
        createdAt: voteData.createdAt?.toDate?.()?.toISOString() || voteData.createdAt
      };
    } else {
      console.log('🔍 [GET /votes/:linkId/user] No vote found for user');
    }

    // Cache the result for 60 seconds
    await cacheManager.set('votes', cacheKey, userVoteData, 60);

    res.json({
      success: true,
      data: userVoteData
    });
  } catch (error) {
    console.error('❌ [GET /votes/:linkId/user] Error:', error);
    logger.error('Get user vote error', { error: error.message, linkId: req.params.linkId });
    res.status(500).json({
      success: false,
      error: 'Failed to get user vote'
    });
  }
});

// Get combined vote data (stats + user vote) with enhanced caching - IMPROVED VERSION
router.get('/:linkId/combined', async (req, res) => {
  try {
    const { linkId } = req.params;
    const userId = getUserId(req);

    // Try to get both stats and user vote from cache
    const statsCacheKey = `stats:${linkId}`;
    const userCacheKey = userId ? `user:${userId}:${linkId}` : null;

    // Get cached stats
    let stats = await cacheManager.get('votes', statsCacheKey);
    let userVote = null;

    // Get cached user vote if userId provided
    if (userId && userCacheKey) {
      userVote = await cacheManager.get('votes', userCacheKey);
    }

    // If stats not cached, fetch from database with optimized single query
    if (!stats) {
      const votesSnapshot = await db.collection(collections.VOTES)
        .where('linkId', '==', linkId)
        .get();

      const freshStats = {
        total: 0,
        upvotes: 0,
        downvotes: 0,
        score: 0
      };

      // Process all votes in one loop and find user vote simultaneously
      let foundUserVote = null;
      votesSnapshot.forEach((doc) => {
        const voteData = doc.data();
        const voteType = voteData.voteType;
        
        freshStats.total++;
        if (voteType === 'upvote') {
          freshStats.upvotes++;
        } else if (voteType === 'downvote') {
          freshStats.downvotes++;
        }

        // Find user vote in the same iteration (optimization from votes-optimized.js)
        if (userId && !foundUserVote && voteData.userId === userId) {
          foundUserVote = {
            id: doc.id,
            linkId,
            userId: voteData.userId,
            voteType: voteData.voteType,
            createdAt: voteData.createdAt?.toDate?.()?.toISOString() || voteData.createdAt
          };
        }
      });
      
      // Set userVote after the loop to avoid race condition
      if (foundUserVote) {
        userVote = foundUserVote;
      }

      // Calculate Reddit-style score
      freshStats.score = freshStats.upvotes - freshStats.downvotes;

      // Cache stats for 30 seconds
      await cacheManager.set('votes', statsCacheKey, freshStats, 30);
      
      // Cache user vote if found and userId provided
      if (userId && userVote && userCacheKey) {
        await cacheManager.set('votes', userCacheKey, userVote, 60);
      }
      
      stats = freshStats;
    }

    // If user vote not cached and userId provided, fetch from database
    if (userId && userVote === null) {
      const userVoteQuery = await db.collection(collections.VOTES)
        .where('linkId', '==', linkId)
        .where('userId', '==', userId)
        .limit(1)
        .get();

      if (!userVoteQuery.empty) {
        const voteDoc = userVoteQuery.docs[0];
        const voteData = voteDoc.data();

        userVote = {
          id: voteDoc.id,
          linkId,
          userId: voteData.userId,
          voteType: voteData.voteType,
          createdAt: voteData.createdAt?.toDate?.()?.toISOString() || voteData.createdAt
        };

        // Cache user vote for 60 seconds
        if (userCacheKey) {
          await cacheManager.set('votes', userCacheKey, userVote, 60);
        }
      }
    }

    res.json({
      success: true,
      data: {
        linkId,
        statistics: stats,
        userVote
      }
    });
  } catch (error) {
    logger.error('Combined vote data error', { error: error.message, linkId: req.params.linkId });
    res.status(500).json({
      success: false,
      error: 'Failed to get combined vote data'
    });
  }
});

// Legacy optimized endpoint - redirects to combined for backwards compatibility
router.get('/:linkId/optimized', async (req, res) => {
  // Redirect to combined endpoint internally
  req.url = req.url.replace('/optimized', '/combined');
  return router.handle(req, res);
});

// Delete user's vote
router.delete('/:linkId', async (req, res) => {
  try {
    const { linkId } = req.params;
    const userId = getUserId(req);

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID required'
      });
    }

    const userVoteQuery = await db.collection(collections.VOTES)
      .where('linkId', '==', linkId)
      .where('userId', '==', userId)
      .get();

    if (!userVoteQuery.empty) {
      await userVoteQuery.docs[0].ref.delete();

      // Clear related cache
      await Promise.all([
        cacheManager.del('votes', `stats:${linkId}`),
        cacheManager.del('votes', `user:${userId}:${linkId}`)
      ]);

      // Update vote count on the link (async, don't wait)
      updateLinkVoteCount(linkId).catch(error => {
        logger.error('Background vote count update failed', { error: error.message, linkId });
      });

      logger.info('Vote deleted', { linkId, userId });
    }

    res.json({
      success: true,
      message: 'Vote removed successfully',
      linkId
    });
  } catch (error) {
    logger.error('Delete vote error', { error: error.message, linkId: req.params.linkId });
    res.status(500).json({
      success: false,
      error: 'Failed to delete vote'
    });
  }
});

// Batch vote operations for multiple posts
router.post('/batch', async (req, res) => {
  try {
    const { votes } = req.body; // Array of { linkId, voteType, userId }

    // Debug log
    logger.info('Batch vote request received', { 
      body: req.body, 
      votes, 
      votesLength: votes ? votes.length : 'undefined',
      isArray: Array.isArray(votes)
    });

    if (!Array.isArray(votes) || votes.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Votes array is required'
      });
    }

    const results = [];
    const batch = db.batch();

    for (const vote of votes) {
      const { linkId, voteType, userId } = vote;

      // Debug log for each vote
      logger.info('Processing vote', { vote, linkId, voteType, userId });

      if (!linkId || !voteType || !userId) {
        logger.warn('Missing required fields', { vote });
        results.push({
          linkId,
          success: false,
          error: 'Missing required fields'
        });
        continue;
      }

      try {
        // Check existing vote
        const existingVoteQuery = await db.collection(collections.VOTES)
          .where('linkId', '==', linkId)
          .where('userId', '==', userId)
          .get();

        if (!existingVoteQuery.empty) {
          const voteDoc = existingVoteQuery.docs[0];
          const existingVote = voteDoc.data();

          if (existingVote.voteType === voteType) {
            // Remove vote
            batch.delete(voteDoc.ref);
            results.push({ linkId, success: true, action: 'removed' });
          } else {
            // Update vote
            batch.update(voteDoc.ref, {
              voteType,
              updatedAt: new Date()
            });
            results.push({ linkId, success: true, action: 'updated' });
          }
        } else {
          // Create new vote
          const newVoteRef = db.collection(collections.VOTES).doc();
          batch.set(newVoteRef, {
            linkId,
            userId,
            voteType,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          results.push({ linkId, success: true, action: 'created' });
        }
      } catch (error) {
        results.push({
          linkId,
          success: false,
          error: error.message
        });
      }
    }

    // Commit batch
    await batch.commit();

    // Update vote counts for all affected links and clear cache
    const uniqueLinkIds = [...new Set(votes.map(v => v.linkId))];
    await Promise.all(uniqueLinkIds.map(async (linkId) => {
      // Clear cache before updating
      await Promise.all([
        cacheManager.del('votes', `stats:${linkId}`),
        cacheManager.delPattern('votes', `user:*:${linkId}`)
      ]);
      return updateLinkVoteCount(linkId);
    }));

    res.json({
      success: true,
      message: 'Batch vote operation completed',
      results
    });
  } catch (error) {
    logger.error('Batch vote error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to process batch votes'
    });
  }
});

// Batch get combined vote data (stats + user votes) for multiple links - NEW OPTIMIZED ENDPOINT
router.post('/batch/combined', async (req, res) => {
  try {
    const { linkIds } = req.body;
    const userId = getUserId(req);
    
    if (!Array.isArray(linkIds) || linkIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'linkIds array is required'
      });
    }

    // Limit batch size to prevent timeout
    if (linkIds.length > 20) {
      return res.status(400).json({
        success: false,
        error: 'Too many linkIds (max 20)'
      });
    }

    logger.info('Batch combined vote data request', { 
      linkCount: linkIds.length, 
      userId: userId || 'anonymous'
    });

    const results = {};

    // Initialize results and check cache for stats
    const uncachedIds = [];
    for (const linkId of linkIds) {
      const cachedStats = await cacheManager.get('votes', `stats:${linkId}`);
      if (cachedStats) {
        results[linkId] = {
          statistics: cachedStats,
          userVote: null // Will be populated below
        };
      } else {
        uncachedIds.push(linkId);
        results[linkId] = {
          statistics: { total: 0, upvotes: 0, downvotes: 0, score: 0 },
          userVote: null
        };
      }
    }

    // Get votes for uncached links using chunked queries (Firebase limit: 10 items per 'in' query)
    if (uncachedIds.length > 0) {
      const chunkSize = 10;
      for (let i = 0; i < uncachedIds.length; i += chunkSize) {
        const chunk = uncachedIds.slice(i, i + chunkSize);
        
        const votesSnapshot = await db.collection(collections.VOTES)
          .where('linkId', 'in', chunk)
          .get();

        votesSnapshot.forEach((doc) => {
          const voteData = doc.data();
          const linkId = voteData.linkId;
          const voteType = voteData.voteType;
          
          if (results[linkId]) {
            results[linkId].statistics.total++;
            if (voteType === 'upvote') {
              results[linkId].statistics.upvotes++;
            } else if (voteType === 'downvote') {
              results[linkId].statistics.downvotes++;
            }
          }
        });
      }

      // Calculate scores and cache stats
      uncachedIds.forEach(async (linkId) => {
        const stats = results[linkId].statistics;
        stats.score = stats.upvotes - stats.downvotes;
        // Cache stats for 30 seconds
        await cacheManager.set('votes', `stats:${linkId}`, stats, 30);
      });
    }

    // Get user votes for all links in chunked queries if userId provided
    if (userId) {
      const chunkSize = 10;
      for (let i = 0; i < linkIds.length; i += chunkSize) {
        const chunk = linkIds.slice(i, i + chunkSize);
        
        const userVotesSnapshot = await db.collection(collections.VOTES)
          .where('linkId', 'in', chunk)
          .where('userId', '==', userId)
          .get();

        userVotesSnapshot.forEach((doc) => {
          const voteData = doc.data();
          const linkId = voteData.linkId;
          
          if (results[linkId]) {
            results[linkId].userVote = {
              id: doc.id,
              linkId,
              userId: voteData.userId,
              voteType: voteData.voteType,
              createdAt: voteData.createdAt?.toDate?.()?.toISOString() || voteData.createdAt
            };
          }
        });
      }
    }

    res.json({
      success: true,
      data: results
    });

  } catch (error) {
    logger.error('Batch combined vote data error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get batch combined vote data'
    });
  }
});

// Batch get vote statistics for multiple posts
router.post('/batch/stats', async (req, res) => {
  try {
    const { postIds, linkIds } = req.body;

    // Support both postIds and linkIds for backward compatibility
    const ids = postIds || linkIds;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'postIds or linkIds array is required'
      });
    }

    // Limit batch size to prevent timeout
    if (ids.length > 20) {
      return res.status(400).json({
        success: false,
        error: 'Too many IDs. Maximum 20 allowed per batch to prevent timeouts.'
      });
    }

    logger.info('Batch vote stats request', { postCount: ids.length });

    // Set response headers to prevent connection issues
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Keep-Alive', 'timeout=60, max=1000');

    const results = {};

    // Process in smaller chunks to prevent Firebase timeout
    const chunkSize = 5;
    for (let i = 0; i < ids.length; i += chunkSize) {
      const chunk = ids.slice(i, i + chunkSize);

      const chunkPromises = chunk.map(async (postId) => {
        try {
          // Try cache first
          const cachedStats = await cacheManager.get('votes', `stats:${postId}`);
          if (cachedStats) {
            logger.debug('Batch stats cache hit', { postId });
            return { postId, stats: cachedStats };
          }

          // Add timeout to Firebase query with shorter timeout
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Query timeout')), 3000); // 3 second timeout
          });

          const queryPromise = db.collection(collections.VOTES)
            .where('linkId', '==', postId)
            .limit(100) // Limit results to prevent large data transfer
            .get();

          const votesSnapshot = await Promise.race([queryPromise, timeoutPromise]);

          const stats = {
            total: 0,
            upvotes: 0,
            downvotes: 0,
            score: 0
          };

          votesSnapshot.forEach((doc) => {
            const voteType = doc.data().voteType;
            stats.total++;

            if (voteType === 'upvote') {
              stats.upvotes++;
            } else if (voteType === 'downvote') {
              stats.downvotes++;
            }
          });

          stats.score = stats.upvotes - stats.downvotes;

          // Cache the stats for 30 seconds
          await cacheManager.set('votes', `stats:${postId}`, stats, 30);

          return { postId, stats };

        } catch (error) {
          logger.error('Error fetching votes for post', { postId, error: error.message });
          return { postId, stats: { total: 0, upvotes: 0, downvotes: 0, score: 0 } };
        }
      });

      // Process chunk and add to results
      const chunkResults = await Promise.all(chunkPromises);
      chunkResults.forEach(({ postId, stats }) => {
        results[postId] = stats;
      });
    }

    res.json({
      success: true,
      data: results
    });

  } catch (error) {
    logger.error('Batch vote stats error', { error: error.message, stack: error.stack });

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Failed to get batch vote stats'
      });
    }
  }
});

// Batch get user votes for multiple posts
router.post('/batch/user', async (req, res) => {
  try {
    const { postIds, userId: bodyUserId } = req.body;
    const userId = getUserId(req) || bodyUserId;

    if (!Array.isArray(postIds) || postIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'postIds array is required'
      });
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID required'
      });
    }

    logger.info('Batch user votes request', { postCount: postIds.length, userId });

    const results = {};

    // Process each post ID
    for (const postId of postIds) {
      try {
        const userVoteQuery = await db.collection(collections.VOTES)
          .where('linkId', '==', postId)
          .where('userId', '==', userId)
          .get();

        if (!userVoteQuery.empty) {
          const voteDoc = userVoteQuery.docs[0];
          const voteData = voteDoc.data();

          results[postId] = {
            id: voteDoc.id,
            linkId: postId,
            userId: voteData.userId,
            voteType: voteData.voteType,
            createdAt: voteData.createdAt?.toDate?.()?.toISOString() || voteData.createdAt
          };
        } else {
          results[postId] = null;
        }

      } catch (error) {
        logger.error('Error fetching user vote for post', { postId, userId, error: error.message });
        results[postId] = null;
      }
    }

    res.json({
      success: true,
      data: results
    });

  } catch (error) {
    logger.error('Batch user votes error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get batch user votes'
    });
  }
});

// Debug endpoint - sync vote stats for a specific link
router.post('/:linkId/sync', async (req, res) => {
  try {
    const { linkId } = req.params;
    
    logger.info('Manual vote sync requested', { linkId });
    
    const stats = await updateLinkVoteCount(linkId);
    
    res.json({
      success: true,
      message: 'Vote stats synced successfully',
      data: {
        linkId,
        stats
      }
    });
  } catch (error) {
    logger.error('Manual vote sync error', { error: error.message, linkId: req.params.linkId });
    res.status(500).json({
      success: false,
      error: 'Failed to sync vote stats'
    });
  }
});

// Debug endpoint - get detailed vote info for a link
router.get('/:linkId/debug', async (req, res) => {
  try {
    const { linkId } = req.params;
    
    // Get all votes
    const votesSnapshot = await db.collection(collections.VOTES)
      .where('linkId', '==', linkId)
      .get();
    
    const votes = [];
    const stats = { total: 0, upvotes: 0, downvotes: 0, score: 0 };
    
    votesSnapshot.forEach((doc) => {
      const voteData = doc.data();
      votes.push({
        id: doc.id,
        ...voteData,
        createdAt: voteData.createdAt?.toDate?.()?.toISOString() || voteData.createdAt
      });
      
      stats.total++;
      if (voteData.voteType === 'upvote') {
        stats.upvotes++;
      } else if (voteData.voteType === 'downvote') {
        stats.downvotes++;
      }
    });
    
    stats.score = stats.upvotes - stats.downvotes;
    
    // Get link/post data
    const linkDoc = await db.collection(collections.POSTS).doc(linkId).get();
    const linkData = linkDoc.exists ? linkDoc.data() : null;
    
    res.json({
      success: true,
      data: {
        linkId,
        votesCount: votes.length,
        calculatedStats: stats,
        linkVoteStats: linkData?.voteStats || null,
        linkVoteScore: linkData?.voteScore || null,
        votes: votes.slice(0, 10) // Limit to first 10 votes for debugging
      }
    });
  } catch (error) {
    logger.error('Vote debug error', { error: error.message, linkId: req.params.linkId });
    res.status(500).json({
      success: false,
      error: 'Failed to get vote debug info'
    });
  }
});

// Get user's voted posts with filtering and pagination
router.get('/user/voted-posts', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { page = 1, limit = 10, voteType } = req.query;
    
    logger.info('User voted posts request', { userId, page, limit, voteType });

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID required'
      });
    }

    // Build query for user votes - Remove orderBy to avoid index issues
    let votesQuery = db.collection(collections.VOTES)
      .where('userId', '==', userId);
    
    // Filter by vote type if specified (convert UI filter to backend voteType)
    if (voteType && voteType !== 'all') {
      // Map UI filter values to backend vote types
      const voteTypeMapping = {
        'safe': 'upvote',
        'unsafe': 'downvote', 
        'suspicious': 'suspicious'
      };
      const backendVoteType = voteTypeMapping[voteType] || voteType;
      votesQuery = votesQuery.where('voteType', '==', backendVoteType);
    }

    const votesSnapshot = await votesQuery.get();
    
    if (votesSnapshot.empty) {
      return res.json({
        success: true,
        data: {
          posts: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            totalPages: 0
          }
        }
      });
    }

    // Get all voted link IDs
    const votes = [];
    const linkIds = [];
    
    votesSnapshot.forEach((doc) => {
      const voteData = doc.data();
      votes.push({
        id: doc.id,
        linkId: voteData.linkId,
        voteType: voteData.voteType,
        votedAt: voteData.createdAt?.toDate?.()?.toISOString() || voteData.createdAt
      });
      linkIds.push(voteData.linkId);
    });

    // Sort votes by date in memory (newest first)
    votes.sort((a, b) => new Date(b.votedAt) - new Date(a.votedAt));

    // Remove duplicate linkIds (user might have voted multiple times, keep latest)
    const uniqueVotes = [];
    const seenLinkIds = new Set();
    
    for (const vote of votes) {
      if (!seenLinkIds.has(vote.linkId)) {
        uniqueVotes.push(vote);
        seenLinkIds.add(vote.linkId);
      }
    }

    if (uniqueVotes.length === 0) {
      return res.json({
        success: true,
        data: {
          posts: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            totalPages: 0
          }
        }
      });
    }

    // Get post details for voted links
    const posts = [];
    const uniqueLinkIds = uniqueVotes.map(v => v.linkId);
    
    // Process in batches to avoid Firestore 'in' query limit (10 items)
    const batchSize = 10;
    for (let i = 0; i < uniqueLinkIds.length; i += batchSize) {
      const batch = uniqueLinkIds.slice(i, i + batchSize);
      
      const linksQuery = await db.collection(collections.POSTS)
        .where('__name__', 'in', batch)
        .get();
      
      linksQuery.forEach((doc) => {
        const linkData = doc.data();
        const userVoteForLink = uniqueVotes.find(v => v.linkId === doc.id);
        
        if (userVoteForLink) {
          posts.push({
            id: doc.id,
            title: linkData.title || 'Untitled',
            url: linkData.url,
            description: linkData.description,
            createdAt: linkData.createdAt?.toDate?.()?.toISOString() || linkData.createdAt,
            author: linkData.author,
            voteStats: linkData.voteStats || { safe: 0, unsafe: 0, suspicious: 0 },
            userVote: {
              voteType: userVoteForLink.voteType === 'upvote' ? 'safe' : 
                userVoteForLink.voteType === 'downvote' ? 'unsafe' : 
                  userVoteForLink.voteType,
              votedAt: userVoteForLink.votedAt
            }
          });
        }
      });
    }

    // Sort posts by vote date again (newest first)
    posts.sort((a, b) => new Date(b.userVote.votedAt) - new Date(a.userVote.votedAt));

    // Apply pagination
    const totalPosts = posts.length;
    const totalPages = Math.ceil(totalPosts / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedPosts = posts.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        posts: paginatedPosts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalPosts,
          totalPages
        }
      }
    });

  } catch (error) {
    logger.error('User voted posts error', { error: error.message, stack: error.stack, userId: getUserId(req) });
    res.status(500).json({
      success: false,
      error: 'Failed to get user voted posts'
    });
  }
});

// Debug endpoint - test user authentication
router.get('/user/debug', async (req, res) => {
  try {
    const userId = getUserId(req);
    const userEmail = getUserEmail(req);
    
    res.json({
      success: true,
      debug: {
        userId,
        userEmail,
        hasAuthHeader: !!req.headers.authorization,
        userFromToken: req.user,
        headers: {
          'x-user-id': req.headers['x-user-id'],
          'x-user-email': req.headers['x-user-email']
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
