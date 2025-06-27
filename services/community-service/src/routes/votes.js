const express = require('express');
const router = express.Router();
const { db, collections } = require('../config/firebase');
const Logger = require('../../../../shared/utils/logger');
const { getUserId, getUserEmail } = require('../middleware/auth');

const logger = new Logger('community-service');

// Helper function to update link vote count and score using atomic transaction
async function updateLinkVoteCount(linkId) {
  try {
    // Use Firestore transaction for atomic updates
    return await db.runTransaction(async (transaction) => {
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
        const linkRef = db.collection('links').doc(linkId);
        const linkDoc = await transaction.get(linkRef);
        if (linkDoc.exists) {
          transaction.update(linkRef, {
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
    });
  } catch (error) {
    logger.error('Atomic vote count update error', { error: error.message, linkId });
    throw error;
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

    logger.info('Vote submission request', { linkId, voteType, userId: finalUserId });

    // Validate required fields
    if (!linkId || !voteType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: linkId, voteType'
      });
    }

    // Validate vote type (Reddit-style)
    if (!['upvote', 'downvote'].includes(voteType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid vote type. Must be "upvote" or "downvote"'
      });
    }

    // Use atomic transaction for vote submission and count update
    const result = await db.runTransaction(async (transaction) => {
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

        if (existingVote.voteType === voteType) {
          // Same vote type - remove vote (toggle off)
          transaction.delete(voteDoc.ref);
          action = 'removed';
          logger.info('Vote removed (toggle off)', { linkId, userId, voteType });
        } else {
          // Different vote type - update vote
          transaction.update(voteDoc.ref, {
            voteType,
            updatedAt: new Date()
          });
          action = 'updated';
          logger.info('Vote updated', { linkId, userId, oldType: existingVote.voteType, newType: voteType });
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
        logger.info('New vote created', { linkId, userId, voteType });
      }

      return { voteDoc, action };
    });

    // Update vote count on the link (async, don't wait for better performance)
    updateLinkVoteCount(linkId).catch(error => {
      logger.error('Background vote count update failed', { error: error.message, linkId });
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
        ...stats
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
      const voteDoc = userVoteQuery.docs[0];
      const voteData = voteDoc.data();

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
      res.json({
        success: true,
        data: null
      });
    }
  } catch (error) {
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

      if (!linkId || !voteType || !userId) {
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

module.exports = router;
