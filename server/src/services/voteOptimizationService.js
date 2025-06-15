const admin = require('firebase-admin');

/**
 * Vote Optimization Service
 * Implements caching and batch operations for better performance
 */
class VoteOptimizationService {
  constructor() {
    this.db = admin.firestore();
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache
    this.batchSize = 500; // Firestore batch limit
    this.pendingUpdates = new Map();
    this.updateInterval = null;
    
    // Start batch update processor
    this.startBatchProcessor();
  }

  /**
   * Get vote statistics with caching
   */
  async getVoteStats(linkId, options = {}) {
    const cacheKey = `vote_stats_${linkId}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log('📦 Vote stats cache hit:', linkId);
        return cached.data;
      }
      this.cache.delete(cacheKey);
    }

    try {
      // Try to get from link document first (pre-computed stats)
      const linkDoc = await this.db.collection('links').doc(linkId).get();
      
      if (linkDoc.exists && linkDoc.data().voteStats) {
        const stats = linkDoc.data().voteStats;
        const result = {
          statistics: {
            safe: stats.safe || 0,
            unsafe: stats.unsafe || 0,
            suspicious: stats.suspicious || 0,
            total: (stats.safe || 0) + (stats.unsafe || 0) + (stats.suspicious || 0),
            trustScore: this.calculateTrustScore(stats)
          },
          userVote: null
        };

        // Get user vote if requested
        if (options.userId) {
          result.userVote = await this.getUserVote(linkId, options.userId);
        }

        // Cache the result
        this.cache.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });

        return result;
      }

      // Fallback: compute from votes collection (slower)
      return await this.computeVoteStatsFromVotes(linkId, options);

    } catch (error) {
      console.error('Error getting vote stats:', error);
      throw error;
    }
  }

  /**
   * Compute vote stats from votes collection (fallback)
   */
  async computeVoteStatsFromVotes(linkId, options = {}) {
    const votesSnapshot = await this.db.collection('votes')
      .where('linkId', '==', linkId)
      .get();

    const stats = {
      safe: 0,
      unsafe: 0,
      suspicious: 0
    };

    let userVote = null;

    votesSnapshot.forEach(doc => {
      const vote = doc.data();
      if (stats.hasOwnProperty(vote.voteType)) {
        stats[vote.voteType]++;
      }
      
      if (options.userId && vote.userId === options.userId) {
        userVote = vote.voteType;
      }
    });

    const result = {
      statistics: {
        ...stats,
        total: stats.safe + stats.unsafe + stats.suspicious,
        trustScore: this.calculateTrustScore(stats)
      },
      userVote
    };

    // Update link document with computed stats
    await this.updateLinkVoteStats(linkId, stats);

    return result;
  }

  /**
   * Get user's vote for a link
   */
  async getUserVote(linkId, userId) {
    if (!userId) return null;

    try {
      const userVoteSnapshot = await this.db.collection('votes')
        .where('linkId', '==', linkId)
        .where('userId', '==', userId)
        .limit(1)
        .get();

      if (!userVoteSnapshot.empty) {
        return userVoteSnapshot.docs[0].data().voteType;
      }
      return null;
    } catch (error) {
      console.error('Error getting user vote:', error);
      return null;
    }
  }

  /**
   * Submit vote with optimistic updates
   */
  async submitVote(linkId, userId, voteType) {
    const validVoteTypes = ['safe', 'unsafe', 'suspicious'];
    if (!validVoteTypes.includes(voteType)) {
      throw new Error('Invalid vote type');
    }

    try {
      // Check for existing vote
      const existingVoteQuery = await this.db.collection('votes')
        .where('linkId', '==', linkId)
        .where('userId', '==', userId)
        .limit(1)
        .get();

      const batch = this.db.batch();
      let oldVoteType = null;

      if (!existingVoteQuery.empty) {
        // Update existing vote
        const voteDoc = existingVoteQuery.docs[0];
        oldVoteType = voteDoc.data().voteType;
        
        batch.update(voteDoc.ref, {
          voteType,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } else {
        // Create new vote
        const voteRef = this.db.collection('votes').doc();
        batch.set(voteRef, {
          linkId,
          userId,
          voteType,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      // Queue link stats update
      this.queueLinkStatsUpdate(linkId, voteType, oldVoteType);

      await batch.commit();

      // Invalidate cache
      this.cache.delete(`vote_stats_${linkId}`);

      return { success: true, voteType, oldVoteType };
    } catch (error) {
      console.error('Error submitting vote:', error);
      throw error;
    }
  }

  /**
   * Queue link stats update for batch processing
   */
  queueLinkStatsUpdate(linkId, newVoteType, oldVoteType) {
    if (!this.pendingUpdates.has(linkId)) {
      this.pendingUpdates.set(linkId, {
        safe: 0,
        unsafe: 0,
        suspicious: 0
      });
    }

    const update = this.pendingUpdates.get(linkId);

    // Add new vote
    if (newVoteType) {
      update[newVoteType]++;
    }

    // Remove old vote
    if (oldVoteType) {
      update[oldVoteType]--;
    }

    this.pendingUpdates.set(linkId, update);
  }

  /**
   * Process pending updates in batches
   */
  async processPendingUpdates() {
    if (this.pendingUpdates.size === 0) return;

    console.log(`🔄 Processing ${this.pendingUpdates.size} pending vote updates`);

    const batch = this.db.batch();
    let batchCount = 0;

    for (const [linkId, updates] of this.pendingUpdates.entries()) {
      if (batchCount >= this.batchSize) break;

      const linkRef = this.db.collection('links').doc(linkId);
      const updateData = {};

      // Only update non-zero changes
      Object.keys(updates).forEach(voteType => {
        if (updates[voteType] !== 0) {
          updateData[`voteStats.${voteType}`] = admin.firestore.FieldValue.increment(updates[voteType]);
        }
      });

      if (Object.keys(updateData).length > 0) {
        updateData['voteStats.lastUpdated'] = admin.firestore.FieldValue.serverTimestamp();
        batch.update(linkRef, updateData);
        batchCount++;
      }

      this.pendingUpdates.delete(linkId);
    }

    if (batchCount > 0) {
      await batch.commit();
      console.log(`✅ Processed ${batchCount} vote stat updates`);
    }
  }

  /**
   * Start batch processor
   */
  startBatchProcessor() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.updateInterval = setInterval(async () => {
      try {
        await this.processPendingUpdates();
      } catch (error) {
        console.error('Error processing pending updates:', error);
      }
    }, 10000); // Process every 10 seconds
  }

  /**
   * Update link vote stats directly
   */
  async updateLinkVoteStats(linkId, stats) {
    try {
      const linkRef = this.db.collection('links').doc(linkId);
      await linkRef.update({
        voteStats: {
          ...stats,
          lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        }
      });
    } catch (error) {
      console.error('Error updating link vote stats:', error);
    }
  }

  /**
   * Calculate trust score based on votes
   */
  calculateTrustScore(stats) {
    const total = (stats.safe || 0) + (stats.unsafe || 0) + (stats.suspicious || 0);
    if (total === 0) return 50; // Neutral score

    const safeWeight = 1;
    const suspiciousWeight = 0.5;
    const unsafeWeight = 0;

    const weightedScore = (
      (stats.safe || 0) * safeWeight +
      (stats.suspicious || 0) * suspiciousWeight +
      (stats.unsafe || 0) * unsafeWeight
    ) / total;

    return Math.round(weightedScore * 100);
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    console.log('🗑️ Vote cache cleared');
  }

  /**
   * Get cache stats
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      pendingUpdates: this.pendingUpdates.size
    };
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    this.clearCache();
    this.pendingUpdates.clear();
  }
}

module.exports = new VoteOptimizationService();
