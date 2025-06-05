// Community Voting Controller - Firebase-Backend Bridge
const database = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class VoteController {
  // Submit or update a vote for a link
  async submitVote(req, res, next) {
    try {
      const { linkId } = req.params;
      const { voteType } = req.body; // 'safe', 'unsafe', 'suspicious'
      const userId = req.user.userId;

      // Validate vote type
      const validVoteTypes = ['safe', 'unsafe', 'suspicious'];
      if (!validVoteTypes.includes(voteType)) {
        return res.status(400).json({
          error: 'Invalid vote type. Must be: safe, unsafe, or suspicious',
          code: 'INVALID_VOTE_TYPE'
        });
      }

      // Check if link exists
      const link = await this.findLinkById(linkId);
      if (!link) {
        return res.status(404).json({
          error: 'Link not found',
          code: 'LINK_NOT_FOUND'
        });
      }

      // Check if user already voted on this link
      const existingVote = await this.findUserVoteOnLink(userId, linkId);

      if (existingVote) {
        // Update existing vote
        await this.updateVote(existingVote.id, voteType);

        // Get updated vote summary
        const voteSummary = await this.getVoteSummary(linkId);

        return res.json({
          message: 'Vote updated successfully',
          vote: {
            id: existingVote.id,
            linkId,
            voteType,
            updatedAt: new Date().toISOString()
          },
          summary: voteSummary
        });
      } else {
        // Create new vote
        const voteId = uuidv4();
        const voteData = {
          id: voteId,
          userId,
          linkId,
          voteType,
          createdAt: new Date().toISOString()
        };

        await this.saveVote(voteData);

        // Increment user stats
        try {
          const firebaseBackendController = require('./firebaseBackendController');
          await firebaseBackendController.incrementUserStats(userId, 'votesSubmitted');
        } catch (statsError) {
          console.warn('⚠️ Failed to increment vote stats:', statsError.message);
        }

        // Get updated vote summary
        const voteSummary = await this.getVoteSummary(linkId);

        return res.status(201).json({
          message: 'Vote submitted successfully',
          vote: voteData,
          summary: voteSummary
        });
      }

    } catch (error) {
      next(error);
    }
  }

  // Get vote summary for a link
  async getVoteSummary(linkId) {
    if (database.isConnected) {
      try {
        const result = await database.query(
          `SELECT vote_type, COUNT(*) as count
           FROM votes
           WHERE link_id = $1
           GROUP BY vote_type`,
          [linkId]
        );

        const summary = {
          safe: 0,
          unsafe: 0,
          suspicious: 0,
          total: 0
        };

        result.rows.forEach(row => {
          summary[row.vote_type] = parseInt(row.count);
          summary.total += parseInt(row.count);
        });

        // Calculate trust label
        summary.trustLabel = this.calculateTrustLabel(summary);

        return summary;
      } catch (error) {
        console.error('Database error in getVoteSummary:', error);
        return this.getVoteSummaryInMemory(linkId);
      }
    } else {
      return this.getVoteSummaryInMemory(linkId);
    }
  }

  // Calculate trust label based on votes
  calculateTrustLabel(summary) {
    if (summary.total === 0) return 'unrated';

    const safePercentage = (summary.safe / summary.total) * 100;
    const unsafePercentage = (summary.unsafe / summary.total) * 100;
    const suspiciousPercentage = (summary.suspicious / summary.total) * 100;

    if (safePercentage >= 60) return 'trusted';
    if (unsafePercentage >= 60) return 'dangerous';
    if (suspiciousPercentage >= 60) return 'suspicious';
    if (safePercentage >= 40) return 'likely-safe';
    if (unsafePercentage >= 40) return 'likely-dangerous';

    return 'mixed-reviews';
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
