const express = require('express');
const router = express.Router();
const { db, collections } = require('../config/firebase');
const Logger = require('../../shared/utils/logger');
const { getUserId, getUserEmail } = require('../middleware/auth');

const logger = new Logger('community-service');

// Helper function to update post vote count and score
async function updatePostVoteCount(linkId) {
  try {
    const votesSnapshot = await db.collection(collections.VOTES)
      .where('linkId', '==', linkId)
      .get();

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

    // Update post with vote statistics
    const postsQuery = await db.collection(collections.POSTS)
      .where('id', '==', linkId)
      .get();

    if (!postsQuery.empty) {
      await postsQuery.docs[0].ref.update({
        voteCount: stats.total,
        voteScore: stats.score,
        voteStats: {
          upvotes: stats.upvotes,
          downvotes: stats.downvotes,
          total: stats.total,
          score: stats.score
        }
      });
    }

    // Also try links collection (for backward compatibility)
    try {
      const linkRef = db.collection('links').doc(linkId);
      const linkDoc = await linkRef.get();
      if (linkDoc.exists) {
        await linkRef.update({
          voteCount: stats.total,
          voteScore: stats.score
        });
      }
    } catch (error) {
      // Ignore if links collection doesn't exist
      logger.debug('Links collection update failed (expected if not using links collection)', { linkId });
    }

    logger.info('Vote statistics updated', { linkId, stats });
    return stats;
  } catch (error) {
    logger.error('Update vote count error', { error: error.message, linkId });
    throw error;
  }
}

// Submit or update vote for a link (Reddit-style)
router.post('/:linkId', async (req, res) => {
  try {
    const { linkId } = req.params;
    const { voteType } = req.body; // 'upvote', 'downvote'

    // Get user info from auth middleware or request body
    const userId = getUserId(req);
    const userEmail = getUserEmail(req);

    logger.info('Vote submission request', { linkId, voteType, userId });

    // Validate required fields
    if (!linkId || !voteType || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: linkId, voteType, userId'
      });
    }

    // Validate vote type (Reddit-style)
    if (!['upvote', 'downvote'].includes(voteType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid vote type. Must be "upvote" or "downvote"'
      });
    }

    // Check if user already voted
    const existingVoteQuery = await db.collection(collections.VOTES)
      .where('linkId', '==', linkId)
      .where('userId', '==', userId)
      .get();

    let voteDoc;
    let action = 'created';

    if (!existingVoteQuery.empty) {
      // User already voted
      voteDoc = existingVoteQuery.docs[0];
      const existingVote = voteDoc.data();

      if (existingVote.voteType === voteType) {
        // Same vote type - remove vote (toggle off)
        await voteDoc.ref.delete();
        action = 'removed';
        logger.info('Vote removed (toggle off)', { linkId, userId, voteType });
      } else {
        // Different vote type - update vote
        await voteDoc.ref.update({
          voteType,
          updatedAt: new Date()
        });
        action = 'updated';
        logger.info('Vote updated', { linkId, userId, oldType: existingVote.voteType, newType: voteType });
      }
    } else {
      // Create new vote
      const newVote = {
        linkId,
        userId,
        userEmail: userEmail || null,
        voteType,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      voteDoc = await db.collection(collections.VOTES).add(newVote);
      logger.info('New vote created', { linkId, userId, voteType });
    }

    // Update vote count on the post (async, don't wait)
    updatePostVoteCount(linkId).catch(error => {
      logger.error('Background vote count update failed', { error: error.message, linkId });
    });

    // Prepare response based on action
    const response = {
      success: true,
      action,
      linkId,
      userId
    };

    if (action === 'removed') {
      response.message = 'Vote removed successfully';
      response.vote = null;
    } else {
      response.message = `Vote ${action} successfully`;
      response.vote = {
        id: voteDoc.id,
        linkId,
        userId,
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

      // Update vote count on the post (async, don't wait)
      updatePostVoteCount(linkId).catch(error => {
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

    // Update vote counts for all affected posts
    const uniqueLinkIds = [...new Set(votes.map(v => v.linkId))];
    await Promise.all(uniqueLinkIds.map(linkId => updatePostVoteCount(linkId)));

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

module.exports = router;
