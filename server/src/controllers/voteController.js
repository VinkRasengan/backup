// Use production config based on environment
const firebaseConfig = process.env.NODE_ENV === 'production'
  ? require('../config/firebase-production')
  : require('../config/firebase-emulator');

const { db, collections, admin } = firebaseConfig;

class VoteController {
  // Submit or update a vote for a link
  async submitVote(req, res, next) {
    try {
      const { linkId } = req.params;
      const { voteType } = req.body; // 'trusted', 'suspicious', 'untrusted'
      const userId = req.user.userId;

      // Validate vote type
      const validVoteTypes = ['trusted', 'suspicious', 'untrusted'];
      if (!validVoteTypes.includes(voteType)) {
        return res.status(400).json({
          error: 'Invalid vote type. Must be: trusted, suspicious, or untrusted',
          code: 'INVALID_VOTE_TYPE'
        });
      }

      // Check if link exists
      const linkDoc = await db.collection(collections.LINKS).doc(linkId).get();
      if (!linkDoc.exists) {
        return res.status(404).json({
          error: 'Link not found',
          code: 'LINK_NOT_FOUND'
        });
      }

      // Check if user already voted on this link
      const existingVoteQuery = await db.collection(collections.VOTES)
        .where('linkId', '==', linkId)
        .where('userId', '==', userId)
        .limit(1)
        .get();

      const batch = db.batch();
      let voteRef;
      let isUpdate = false;

      if (!existingVoteQuery.empty) {
        // Update existing vote
        voteRef = existingVoteQuery.docs[0].ref;
        const oldVoteData = existingVoteQuery.docs[0].data();
        
        batch.update(voteRef, {
          voteType,
          updatedAt: new Date().toISOString()
        });

        // Update link vote counts (decrement old, increment new)
        const linkRef = db.collection(collections.LINKS).doc(linkId);
        batch.update(linkRef, {
          [`communityStats.votes.${oldVoteData.voteType}`]: admin.firestore.FieldValue.increment(-1),
          [`communityStats.votes.${voteType}`]: admin.firestore.FieldValue.increment(1),
          'communityStats.lastVoteAt': new Date().toISOString()
        });

        isUpdate = true;
      } else {
        // Create new vote
        voteRef = db.collection(collections.VOTES).doc();
        const voteData = {
          linkId,
          userId,
          voteType,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        batch.set(voteRef, voteData);

        // Update link vote counts and total
        const linkRef = db.collection(collections.LINKS).doc(linkId);
        batch.update(linkRef, {
          [`communityStats.votes.${voteType}`]: admin.firestore.FieldValue.increment(1),
          'communityStats.totalVotes': admin.firestore.FieldValue.increment(1),
          'communityStats.lastVoteAt': new Date().toISOString()
        });
      }

      await batch.commit();

      // Get updated vote statistics
      const updatedStats = await this.getVoteStatistics(linkId);

      res.json({
        message: isUpdate ? 'Vote updated successfully' : 'Vote submitted successfully',
        voteId: voteRef.id,
        statistics: updatedStats
      });

    } catch (error) {
      next(error);
    }
  }

  // Get vote statistics for a link
  async getVoteStatistics(linkId) {
    try {
      const linkDoc = await db.collection(collections.LINKS).doc(linkId).get();
      
      if (!linkDoc.exists) {
        throw new Error('Link not found');
      }

      const linkData = linkDoc.data();
      const communityStats = linkData.communityStats || {
        votes: { trusted: 0, suspicious: 0, untrusted: 0 },
        totalVotes: 0
      };

      // Calculate community consensus
      const { trusted = 0, suspicious = 0, untrusted = 0 } = communityStats.votes || {};
      const total = trusted + suspicious + untrusted;
      
      let consensus = 'unknown';
      let consensusPercentage = 0;

      if (total > 0) {
        const trustedPercent = (trusted / total) * 100;
        const suspiciousPercent = (suspicious / total) * 100;
        const untrustedPercent = (untrusted / total) * 100;

        if (trustedPercent >= 60) {
          consensus = 'trusted';
          consensusPercentage = trustedPercent;
        } else if (untrustedPercent >= 60) {
          consensus = 'untrusted';
          consensusPercentage = untrustedPercent;
        } else if (suspiciousPercent >= 40 || (trustedPercent < 60 && untrustedPercent < 60)) {
          consensus = 'suspicious';
          consensusPercentage = suspiciousPercent;
        }
      }

      return {
        votes: {
          trusted,
          suspicious,
          untrusted
        },
        totalVotes: total,
        consensus: {
          type: consensus,
          percentage: Math.round(consensusPercentage)
        },
        lastVoteAt: communityStats.lastVoteAt || null
      };

    } catch (error) {
      throw error;
    }
  }

  // Get vote statistics endpoint
  async getVoteStats(req, res, next) {
    try {
      const { linkId } = req.params;

      // Check if link exists
      const linkDoc = await db.collection(collections.LINKS).doc(linkId).get();
      if (!linkDoc.exists) {
        return res.status(404).json({
          error: 'Link not found',
          code: 'LINK_NOT_FOUND'
        });
      }

      const statistics = await this.getVoteStatistics(linkId);

      res.json({
        linkId,
        statistics
      });

    } catch (error) {
      next(error);
    }
  }

  // Get user's vote for a specific link
  async getUserVote(req, res, next) {
    try {
      const { linkId } = req.params;
      const userId = req.user.userId;

      const voteQuery = await db.collection(collections.VOTES)
        .where('linkId', '==', linkId)
        .where('userId', '==', userId)
        .limit(1)
        .get();

      if (voteQuery.empty) {
        return res.json({
          linkId,
          userVote: null
        });
      }

      const voteData = voteQuery.docs[0].data();
      
      res.json({
        linkId,
        userVote: {
          voteType: voteData.voteType,
          createdAt: voteData.createdAt,
          updatedAt: voteData.updatedAt
        }
      });

    } catch (error) {
      next(error);
    }
  }

  // Delete user's vote
  async deleteVote(req, res, next) {
    try {
      const { linkId } = req.params;
      const userId = req.user.userId;

      const voteQuery = await db.collection(collections.VOTES)
        .where('linkId', '==', linkId)
        .where('userId', '==', userId)
        .limit(1)
        .get();

      if (voteQuery.empty) {
        return res.status(404).json({
          error: 'Vote not found',
          code: 'VOTE_NOT_FOUND'
        });
      }

      const voteDoc = voteQuery.docs[0];
      const voteData = voteDoc.data();

      const batch = db.batch();

      // Delete vote
      batch.delete(voteDoc.ref);

      // Update link vote counts
      const linkRef = db.collection(collections.LINKS).doc(linkId);
      batch.update(linkRef, {
        [`communityStats.votes.${voteData.voteType}`]: admin.firestore.FieldValue.increment(-1),
        'communityStats.totalVotes': admin.firestore.FieldValue.increment(-1)
      });

      await batch.commit();

      // Get updated statistics
      const updatedStats = await this.getVoteStatistics(linkId);

      res.json({
        message: 'Vote deleted successfully',
        statistics: updatedStats
      });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = new VoteController();
