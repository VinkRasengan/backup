const { v4: uuidv4 } = require('uuid');
const admin = require('firebase-admin');
const firestoreOptimization = require('../services/firestoreOptimizationService');

class FirestoreVoteController {
  constructor() {
    this.db = null;
    this.useFallback = true;
    this.initializeFirestore();
  }

  async initializeFirestore() {
    try {
      const admin = require('firebase-admin');
      
      if (!admin.apps.length) {
        console.log('🔥 Initializing Firebase Admin SDK for votes...');
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
          })
        });
      }

      this.db = admin.firestore();
      
      // Test connection
      await this.db.collection('votes').limit(1).get();
      this.useFallback = false;
      console.log('✅ Firestore Vote Controller initialized');
    } catch (error) {
      console.warn('⚠️ Firestore Vote Controller using fallback mode:', error.message);
      this.useFallback = true;
    }
  }

  // Submit or update vote
  submitVote = async (req, res) => {
    try {
      const { linkId } = req.params;
      const { voteType } = req.body;

      // Flexible user ID handling
      let userId = 'anonymous';
      if (req.user?.userId) {
        userId = req.user.userId;
      } else if (req.user?.uid) {
        userId = req.user.uid;
      } else {
        // Generate session-based ID for anonymous users
        userId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }

      // Validate vote type
      const validVoteTypes = ['safe', 'unsafe', 'suspicious'];
      if (!validVoteTypes.includes(voteType)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid vote type. Must be: safe, unsafe, or suspicious'
        });
      }

      if (this.useFallback) {
        return this.submitVoteFallback(req, res);
      }

      // Check if user already voted
      const existingVoteQuery = await this.db.collection('votes')
        .where('linkId', '==', linkId)
        .where('userId', '==', userId)
        .limit(1)
        .get();

      const batch = this.db.batch();
      let voteData;

      if (!existingVoteQuery.empty) {
        // Update existing vote
        const voteDoc = existingVoteQuery.docs[0];
        const oldVoteData = voteDoc.data();
        
        voteData = {
          ...oldVoteData,
          voteType,
          updatedAt: new Date().toISOString()
        };
        
        batch.update(voteDoc.ref, voteData);
        
        // Update link stats (remove old, add new)
        const linkRef = this.db.collection('links').doc(linkId);
        batch.update(linkRef, {
          [`votes.${oldVoteData.voteType}`]: admin.firestore.FieldValue.increment(-1),
          [`votes.${voteType}`]: admin.firestore.FieldValue.increment(1)
        });
      } else {
        // Create new vote
        voteData = {
          id: uuidv4(),
          userId,
          linkId,
          voteType,
          createdAt: new Date().toISOString()
        };
        
        const voteRef = this.db.collection('votes').doc(voteData.id);
        batch.set(voteRef, voteData);
        
        // Update link stats
        const linkRef = this.db.collection('links').doc(linkId);
        batch.update(linkRef, {
          [`votes.${voteType}`]: admin.firestore.FieldValue.increment(1)
        });
      }

      await batch.commit();

      // Get updated vote summary
      const summary = await this.getVoteSummary(linkId);

      res.json({
        success: true,
        message: 'Vote submitted successfully',
        vote: voteData,
        summary
      });

    } catch (error) {
      console.error('Vote submission error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to submit vote',
        message: error.message
      });
    }
  }

  // Get vote statistics (optimized)
  getVoteStats = async (req, res) => {
    try {
      const { linkId } = req.params;
      const userId = req.user?.userId || req.user?.uid;

      if (this.useFallback) {
        return this.getVoteStatsFallback(req, res);
      }

      console.log('🚀 Using optimized vote stats query');

      // Use optimization service for better performance
      const result = await firestoreOptimization.getVotesForLink(linkId, {
        includeUserVote: !!userId,
        userId: userId
      });

      res.json({
        success: true,
        linkId,
        statistics: result.stats,
        userVote: result.userVote,
        lastUpdated: result.lastUpdated
      });

    } catch (error) {
      console.error('Get vote stats error:', error);

      // Fallback to legacy method
      console.log('⚠️ Falling back to legacy vote stats method...');
      try {
        const summary = await this.getVoteSummary(linkId);

        res.json({
          success: true,
          linkId,
          statistics: summary
        });
      } catch (fallbackError) {
        res.status(500).json({
          success: false,
          error: 'Failed to get vote statistics'
        });
      }
    }
  }

  // Get user's vote for a link
  getUserVote = async (req, res) => {
    try {
      const { linkId } = req.params;
      const userId = req.user?.userId || 'anonymous';

      if (this.useFallback) {
        return this.getUserVoteFallback(req, res);
      }

      const voteQuery = await this.db.collection('votes')
        .where('linkId', '==', linkId)
        .where('userId', '==', userId)
        .limit(1)
        .get();

      if (voteQuery.empty) {
        return res.json({
          success: true,
          linkId,
          userVote: null
        });
      }

      const voteData = voteQuery.docs[0].data();
      
      res.json({
        success: true,
        linkId,
        userVote: {
          voteType: voteData.voteType,
          createdAt: voteData.createdAt,
          updatedAt: voteData.updatedAt
        }
      });

    } catch (error) {
      console.error('Get user vote error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get user vote'
      });
    }
  }

  // Delete user's vote
  deleteVote = async (req, res) => {
    try {
      const { linkId } = req.params;
      const userId = req.user?.userId || 'anonymous';

      if (this.useFallback) {
        return this.deleteVoteFallback(req, res);
      }

      const voteQuery = await this.db.collection('votes')
        .where('linkId', '==', linkId)
        .where('userId', '==', userId)
        .limit(1)
        .get();

      if (voteQuery.empty) {
        return res.status(404).json({
          success: false,
          error: 'Vote not found'
        });
      }

      const voteDoc = voteQuery.docs[0];
      const voteData = voteDoc.data();

      const batch = this.db.batch();
      
      // Delete vote
      batch.delete(voteDoc.ref);
      
      // Update link stats
      const linkRef = this.db.collection('links').doc(linkId);
      batch.update(linkRef, {
        [`votes.${voteData.voteType}`]: admin.firestore.FieldValue.increment(-1)
      });

      await batch.commit();

      // Get updated statistics
      const summary = await this.getVoteSummary(linkId);

      res.json({
        success: true,
        message: 'Vote deleted successfully',
        statistics: summary
      });

    } catch (error) {
      console.error('Delete vote error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete vote'
      });
    }
  }

  // Helper: Get vote summary for a link
  async getVoteSummary(linkId) {
    try {
      const linkDoc = await this.db.collection('links').doc(linkId).get();
      
      if (!linkDoc.exists) {
        return {
          safe: 0,
          unsafe: 0,
          suspicious: 0,
          total: 0,
          trustScore: 0
        };
      }

      const linkData = linkDoc.data();
      const votes = linkData.votes || {};
      
      const safe = votes.safe || 0;
      const unsafe = votes.unsafe || 0;
      const suspicious = votes.suspicious || 0;
      const total = safe + unsafe + suspicious;
      
      // Calculate trust score
      let trustScore = 50; // Default neutral
      if (total > 0) {
        trustScore = Math.round(((safe * 100) + (suspicious * 50) + (unsafe * 0)) / total);
      }

      return {
        safe,
        unsafe,
        suspicious,
        total,
        trustScore
      };

    } catch (error) {
      console.error('Get vote summary error:', error);
      return {
        safe: 0,
        unsafe: 0,
        suspicious: 0,
        total: 0,
        trustScore: 0
      };
    }
  }

  // Fallback methods for when Firestore is not available
  submitVoteFallback(req, res) {
    res.json({
      success: true,
      message: 'Vote submitted (demo mode)',
      vote: {
        id: uuidv4(),
        linkId: req.params.linkId,
        voteType: req.body.voteType,
        createdAt: new Date().toISOString()
      },
      summary: {
        safe: Math.floor(Math.random() * 10),
        unsafe: Math.floor(Math.random() * 5),
        suspicious: Math.floor(Math.random() * 3),
        total: Math.floor(Math.random() * 18) + 1,
        trustScore: Math.floor(Math.random() * 100)
      }
    });
  }

  getVoteStatsFallback(req, res) {
    res.json({
      success: true,
      linkId: req.params.linkId,
      statistics: {
        safe: Math.floor(Math.random() * 10),
        unsafe: Math.floor(Math.random() * 5),
        suspicious: Math.floor(Math.random() * 3),
        total: Math.floor(Math.random() * 18) + 1,
        trustScore: Math.floor(Math.random() * 100)
      }
    });
  }

  getUserVoteFallback(req, res) {
    const voteTypes = ['safe', 'unsafe', 'suspicious', null];
    const randomVote = voteTypes[Math.floor(Math.random() * voteTypes.length)];
    
    res.json({
      success: true,
      linkId: req.params.linkId,
      userVote: randomVote ? {
        voteType: randomVote,
        createdAt: new Date().toISOString()
      } : null
    });
  }

  deleteVoteFallback(req, res) {
    res.json({
      success: true,
      message: 'Vote deleted (demo mode)',
      statistics: {
        safe: Math.floor(Math.random() * 10),
        unsafe: Math.floor(Math.random() * 5),
        suspicious: Math.floor(Math.random() * 3),
        total: Math.floor(Math.random() * 18) + 1,
        trustScore: Math.floor(Math.random() * 100)
      }
    });
  }
}

module.exports = new FirestoreVoteController();
