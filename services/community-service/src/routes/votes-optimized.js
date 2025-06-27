const express = require('express');
const router = express.Router();
const { db, collections } = require('../config/firebase');
const Logger = require('../../../../shared/utils/logger');
const { getUserId, getUserEmail } = require('../middleware/auth');

const logger = new Logger('community-service-optimized');

// In-memory cache for vote statistics
const voteCache = new Map();
const CACHE_TTL = 30000; // 30 seconds

// Cache helpers
function getCachedVoteStats(linkId) {
  const cached = voteCache.get(linkId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCachedVoteStats(linkId, stats) {
  voteCache.set(linkId, {
    data: stats,
    timestamp: Date.now()
  });
}

function clearCachedVoteStats(linkId) {
  voteCache.delete(linkId);
}

// Optimized vote submission - simplified logic
router.post('/:linkId', async (req, res) => {
  try {
    const { linkId } = req.params;
    const { voteType } = req.body;
    const userId = getUserId(req);

    // Simple validation
    if (!linkId || !voteType || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    if (!['upvote', 'downvote'].includes(voteType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid vote type'
      });
    }

    // Single transaction for vote logic
    const result = await db.runTransaction(async (transaction) => {
      const voteQuery = db.collection(collections.VOTES)
        .where('linkId', '==', linkId)
        .where('userId', '==', userId);
      
      const existingVotes = await transaction.get(voteQuery);
      
      let action = 'created';
      
      if (!existingVotes.empty) {
        const existingVote = existingVotes.docs[0];
        const currentVoteType = existingVote.data().voteType;
        
        if (currentVoteType === voteType) {
          // Remove vote (toggle)
          transaction.delete(existingVote.ref);
          action = 'removed';
        } else {
          // Update vote
          transaction.update(existingVote.ref, {
            voteType,
            updatedAt: new Date()
          });
          action = 'updated';
        }
      } else {
        // Create new vote
        const newVoteRef = db.collection(collections.VOTES).doc();
        transaction.set(newVoteRef, {
          linkId,
          userId,
          voteType,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      
      return action;
    });

    // Clear cache asynchronously
    setImmediate(() => {
      clearCachedVoteStats(linkId);
    });

    res.json({
      success: true,
      action: result,
      linkId,
      userId
    });

  } catch (error) {
    logger.error('Vote submission error', { error: error.message, linkId: req.params.linkId });
    res.status(500).json({
      success: false,
      error: 'Failed to submit vote'
    });
  }
});

// Combined endpoint: stats + user vote in one call
router.get('/:linkId/combined', async (req, res) => {
  try {
    const { linkId } = req.params;
    const userId = getUserId(req);

    // Try cache first for stats
    let stats = getCachedVoteStats(linkId);
    let userVote = null;

    if (!stats) {
      // Single query to get all votes for this link
      const votesSnapshot = await db.collection(collections.VOTES)
        .where('linkId', '==', linkId)
        .get();

      stats = {
        total: 0,
        upvotes: 0,
        downvotes: 0,
        score: 0
      };

      // Process all votes in one loop
      votesSnapshot.forEach((doc) => {
        const voteData = doc.data();
        const voteType = voteData.voteType;
        
        stats.total++;
        if (voteType === 'upvote') {
          stats.upvotes++;
        } else if (voteType === 'downvote') {
          stats.downvotes++;
        }

        // Find user vote in the same iteration
        if (userId && voteData.userId === userId) {
          userVote = {
            id: doc.id,
            voteType: voteData.voteType,
            createdAt: voteData.createdAt?.toDate?.()?.toISOString() || voteData.createdAt
          };
        }
      });

      stats.score = stats.upvotes - stats.downvotes;
      setCachedVoteStats(linkId, stats);
    } else {
      // Stats from cache, get user vote separately
      if (userId) {
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
            voteType: voteData.voteType,
            createdAt: voteData.createdAt?.toDate?.()?.toISOString() || voteData.createdAt
          };
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
      error: 'Failed to get vote data'
    });
  }
});

// Batch endpoint for multiple links
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

    // Limit batch size
    if (linkIds.length > 50) {
      return res.status(400).json({
        success: false,
        error: 'Too many linkIds (max 50)'
      });
    }

    const results = {};

    // Initialize results and check cache
    const uncachedIds = [];
    linkIds.forEach(linkId => {
      const cached = getCachedVoteStats(linkId);
      if (cached) {
        results[linkId] = {
          statistics: cached,
          userVote: null // Will be populated below
        };
      } else {
        uncachedIds.push(linkId);
        results[linkId] = {
          statistics: { total: 0, upvotes: 0, downvotes: 0, score: 0 },
          userVote: null
        };
      }
    });

    // Get votes for uncached links
    if (uncachedIds.length > 0) {
      const votesSnapshot = await db.collection(collections.VOTES)
        .where('linkId', 'in', uncachedIds)
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

      // Calculate scores and cache
      uncachedIds.forEach(linkId => {
        const stats = results[linkId].statistics;
        stats.score = stats.upvotes - stats.downvotes;
        setCachedVoteStats(linkId, stats);
      });
    }

    // Get user votes for all links in one query
    if (userId) {
      const userVotesSnapshot = await db.collection(collections.VOTES)
        .where('linkId', 'in', linkIds)
        .where('userId', '==', userId)
        .get();

      userVotesSnapshot.forEach((doc) => {
        const voteData = doc.data();
        const linkId = voteData.linkId;
        
        if (results[linkId]) {
          results[linkId].userVote = {
            id: doc.id,
            voteType: voteData.voteType,
            createdAt: voteData.createdAt?.toDate?.()?.toISOString() || voteData.createdAt
          };
        }
      });
    }

    res.json({
      success: true,
      data: results
    });

  } catch (error) {
    logger.error('Batch combined vote data error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get batch vote data'
    });
  }
});

// Backwards compatibility endpoints (delegate to combined)
router.get('/:linkId/stats', async (req, res) => {
  try {
    const combinedResponse = await new Promise((resolve, reject) => {
      req.url = `/${req.params.linkId}/combined`;
      router.handle(req, {
        json: resolve,
        status: () => ({ json: reject })
      });
    });

    res.json({
      success: true,
      data: {
        linkId: req.params.linkId,
        statistics: combinedResponse.data.statistics
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get vote stats'
    });
  }
});

router.get('/:linkId/user', async (req, res) => {
  try {
    const combinedResponse = await new Promise((resolve, reject) => {
      req.url = `/${req.params.linkId}/combined`;
      router.handle(req, {
        json: resolve,
        status: () => ({ json: reject })
      });
    });

    res.json({
      success: true,
      data: combinedResponse.data.userVote
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get user vote'
    });
  }
});

module.exports = router; 