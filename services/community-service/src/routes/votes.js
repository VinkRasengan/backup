const express = require('express');
const router = express.Router();
const { db, collections } = require('../config/firebase');
const Logger = require('../../../../shared/utils/logger');
const { getUserId, getUserEmail } = require('../middleware/auth');

const logger = new Logger('community-service');

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

// Get vote statistics for a link
router.get('/:linkId/stats', async (req, res) => {
  try {
    const { linkId } = req.params;

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

// Get user's vote for a specific link
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
      console.log('❌ [GET /votes/:linkId/user] No user ID found');
      return res.status(400).json({
        success: false,
        error: 'User ID required'
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

    if (!userVoteQuery.empty) {
      const voteDoc = userVoteQuery.docs[0];
      const voteData = voteDoc.data();

      console.log('✅ [GET /votes/:linkId/user] Found user vote:', {
        docId: voteDoc.id,
        voteData: voteData
      });

      res.json({
        success: true,
        data: {
          id: voteDoc.id,
          linkId,
          userId: voteData.userId,
          voteType: voteData.voteType,
          createdAt: voteData.createdAt?.toDate?.()?.toISOString() || voteData.createdAt
        }
      });
    } else {
      console.log('🔍 [GET /votes/:linkId/user] No vote found for user');
      res.json({
        success: true,
        data: null
      });
    }
  } catch (error) {
    console.error('❌ [GET /votes/:linkId/user] Error:', error);
    logger.error('Get user vote error', { error: error.message, linkId: req.params.linkId });
    res.status(500).json({
      success: false,
      error: 'Failed to get user vote'
    });
  }
});

// Get optimized vote data (stats + user vote)
router.get('/:linkId/optimized', async (req, res) => {
  try {
    const { linkId } = req.params;
    const userId = getUserId(req);

    // Get vote statistics
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

    // Get user's vote if userId provided
    let userVote = null;
    if (userId) {
      const userVoteQuery = await db.collection(collections.VOTES)
        .where('linkId', '==', linkId)
        .where('userId', '==', userId)
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
      }
    }

    res.json({
      success: true,
      data: {
        linkId,
        statistics: stats, // Changed from 'stats' to 'statistics' to match frontend
        userVote
      }
    });
  } catch (error) {
    logger.error('Optimized vote data error', { error: error.message, linkId: req.params.linkId });
    res.status(500).json({
      success: false,
      error: 'Failed to get vote data'
    });
  }
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

    // Update vote counts for all affected links
    const uniqueLinkIds = [...new Set(votes.map(v => v.linkId))];
    await Promise.all(uniqueLinkIds.map(linkId => updateLinkVoteCount(linkId)));

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

module.exports = router;
