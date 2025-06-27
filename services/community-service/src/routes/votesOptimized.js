const express = require('express');
const router = express.Router();
const { db, collections } = require('../config/firebase');
const Logger = require('../../../../shared/utils/logger');
const { getUserId, getUserEmail } = require('../middleware/auth');

const logger = new Logger('community-service');

// Cache for vote statistics (in-memory cache with TTL)
const voteCache = new Map();
const CACHE_TTL = 30000; // 30 seconds

// Helper function to get cached vote stats
function getCachedVoteStats(linkId) {
  const cached = voteCache.get(linkId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

// Helper function to set cached vote stats
function setCachedVoteStats(linkId, stats) {
  voteCache.set(linkId, {
    data: stats,
    timestamp: Date.now()
  });
}

// Helper function to clear cache for a link
function clearCachedVoteStats(linkId) {
  voteCache.delete(linkId);
}

// Optimized atomic vote count update
async function updateLinkVoteCountOptimized(linkId) {
  try {
    // Clear cache first
    clearCachedVoteStats(linkId);
    
    return await db.runTransaction(async (transaction) => {
      // Get all votes for this link
      const votesSnapshot = await transaction.get(
        db.collection(collections.VOTES).where('linkId', '==', linkId)
      );

      // Calculate statistics
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

      // Update link document
      const linkRef = db.collection(collections.POSTS).doc(linkId);
      const linkDoc = await transaction.get(linkRef);

      if (linkDoc.exists) {
        transaction.update(linkRef, {
          voteCount: stats.total,
          voteScore: stats.score,
          voteStats: stats,
          updatedAt: new Date()
        });
      }

      // Cache the results
      setCachedVoteStats(linkId, stats);
      
      logger.info('Vote statistics updated', { linkId, stats });
      return stats;
    });
  } catch (error) {
    logger.error('Vote count update error', { error: error.message, linkId });
    throw error;
  }
}

// Optimized vote submission with minimal logic
router.post('/:linkId', async (req, res) => {
  try {
    const { linkId } = req.params;
    const { voteType } = req.body;
    const userId = getUserId(req);
    const userEmail = getUserEmail(req);

    // Validation
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

    // Atomic vote submission
    const result = await db.runTransaction(async (transaction) => {
      // Check existing vote
      const existingVoteQuery = await transaction.get(
        db.collection(collections.VOTES)
          .where('linkId', '==', linkId)
          .where('userId', '==', userId)
      );

      let action = 'created';
      let voteDoc;

      if (!existingVoteQuery.empty) {
        voteDoc = existingVoteQuery.docs[0];
        const existingVote = voteDoc.data();

        if (existingVote.voteType === voteType) {
          // Remove vote (toggle)
          transaction.delete(voteDoc.ref);
          action = 'removed';
        } else {
          // Update vote
          transaction.update(voteDoc.ref, {
            voteType,
            updatedAt: new Date()
          });
          action = 'updated';
        }
      } else {
        // Create new vote
        const newVoteRef = db.collection(collections.VOTES).doc();
        const newVote = {
          linkId,
          userId,
          userEmail: userEmail || null,
          voteType,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        transaction.set(newVoteRef, newVote);
        voteDoc = { id: newVoteRef.id, ref: newVoteRef };
      }

      return { voteDoc, action };
    });

    // Update vote statistics asynchronously
    setImmediate(() => {
      updateLinkVoteCountOptimized(linkId).catch(error => {
        logger.error('Async vote count update failed', { linkId, error: error.message });
      });
    });

    // Response
    const response = {
      success: true,
      action: result.action,
      linkId,
      userId
    };

    if (result.action !== 'removed') {
      response.vote = {
        id: result.voteDoc.id,
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
      error: 'Failed to submit vote'
    });
  }
});

// Optimized vote statistics with caching
router.get('/:linkId/stats', async (req, res) => {
  try {
    const { linkId } = req.params;

    // Try cache first
    let stats = getCachedVoteStats(linkId);
    
    if (!stats) {
      // Calculate from database
      const votesSnapshot = await db.collection(collections.VOTES)
        .where('linkId', '==', linkId)
        .get();

      stats = {
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
      
      // Cache the result
      setCachedVoteStats(linkId, stats);
    }

    res.json({
      success: true,
      data: {
        linkId,
        statistics: stats
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

// User vote endpoint (no changes needed - already efficient)
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

// Combined endpoint for stats + user vote (reduces API calls)
router.get('/:linkId/combined', async (req, res) => {
  try {
    const { linkId } = req.params;
    const userId = getUserId(req);

    // Get vote statistics (with caching)
    let stats = getCachedVoteStats(linkId);
    
    if (!stats) {
      const votesSnapshot = await db.collection(collections.VOTES)
        .where('linkId', '==', linkId)
        .get();

      stats = {
        total: 0,
        upvotes: 0,
        downvotes: 0,
        score: 0
      };

      let userVoteDoc = null;

      votesSnapshot.forEach((doc) => {
        const voteData = doc.data();
        const voteType = voteData.voteType;
        
        stats.total++;
        if (voteType === 'upvote') {
          stats.upvotes++;
        } else if (voteType === 'downvote') {
          stats.downvotes++;
        }

        // Find user vote in the same query
        if (userId && voteData.userId === userId) {
          userVoteDoc = { id: doc.id, data: voteData };
        }
      });

      stats.score = stats.upvotes - stats.downvotes;
      setCachedVoteStats(linkId, stats);

      const response = {
        success: true,
        data: {
          linkId,
          statistics: stats,
          userVote: userVoteDoc ? {
            id: userVoteDoc.id,
            linkId,
            userId: userVoteDoc.data.userId,
            voteType: userVoteDoc.data.voteType,
            createdAt: userVoteDoc.data.createdAt?.toDate?.()?.toISOString() || userVoteDoc.data.createdAt
          } : null
        }
      };

      res.json(response);
    } else {
      // Stats from cache, still need to get user vote
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
          statistics: stats,
          userVote
        }
      });
    }
  } catch (error) {
    logger.error('Combined vote data error', { error: error.message, linkId: req.params.linkId });
    res.status(500).json({
      success: false,
      error: 'Failed to get combined vote data'
    });
  }
});

// Batch vote statistics endpoint
router.post('/batch/stats', async (req, res) => {
  try {
    const { linkIds } = req.body;
    
    if (!Array.isArray(linkIds) || linkIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'linkIds array is required'
      });
    }

    const results = {};

    // Check cache first
    const uncachedIds = [];
    linkIds.forEach(linkId => {
      const cached = getCachedVoteStats(linkId);
      if (cached) {
        results[linkId] = cached;
      } else {
        uncachedIds.push(linkId);
      }
    });

    // Fetch uncached data
    if (uncachedIds.length > 0) {
      const votesSnapshot = await db.collection(collections.VOTES)
        .where('linkId', 'in', uncachedIds)
        .get();

      // Initialize stats for all uncached IDs
      uncachedIds.forEach(linkId => {
        results[linkId] = {
          total: 0,
          upvotes: 0,
          downvotes: 0,
          score: 0
        };
      });

      // Process votes
      votesSnapshot.forEach((doc) => {
        const voteData = doc.data();
        const linkId = voteData.linkId;
        const voteType = voteData.voteType;
        
        if (results[linkId]) {
          results[linkId].total++;
          if (voteType === 'upvote') {
            results[linkId].upvotes++;
          } else if (voteType === 'downvote') {
            results[linkId].downvotes++;
          }
        }
      });

      // Calculate scores and cache
      uncachedIds.forEach(linkId => {
        const stats = results[linkId];
        stats.score = stats.upvotes - stats.downvotes;
        setCachedVoteStats(linkId, stats);
      });
    }

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    logger.error('Batch vote stats error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get batch vote stats'
    });
  }
});

module.exports = router; 