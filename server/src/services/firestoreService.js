// Firestore Service - Replaces Sequelize models
const database = require('../config/database');

class FirestoreService {
  constructor() {
    this.db = database;
  }

  // User operations
  async createUser(userData) {
    if (this.db.dbType === 'firestore') {
      return await this.db.firestoreDb.create('users', userData);
    }
    // Fallback to in-memory or PostgreSQL
    return await this.createUserFallback(userData);
  }

  async findUserByEmail(email) {
    if (this.db.dbType === 'firestore') {
      const users = await this.db.firestoreDb.query('users', 'email', '==', email, 1);
      return users.length > 0 ? users[0] : null;
    }
    return await this.findUserByEmailFallback(email);
  }

  async findUserById(userId) {
    if (this.db.dbType === 'firestore') {
      return await this.db.firestoreDb.findById('users', userId);
    }
    return await this.findUserByIdFallback(userId);
  }

  // Link operations
  async createLink(linkData) {
    if (this.db.dbType === 'firestore') {
      return await this.db.firestoreDb.create('links', linkData);
    }
    return await this.createLinkFallback(linkData);
  }

  async findAllLinks(limit = 50) {
    if (this.db.dbType === 'firestore') {
      return await this.db.firestoreDb.findAll('links', limit);
    }
    return await this.findAllLinksFallback(limit);
  }

  async findLinkById(linkId) {
    if (this.db.dbType === 'firestore') {
      return await this.db.firestoreDb.findById('links', linkId);
    }
    return await this.findLinkByIdFallback(linkId);
  }

  // Vote operations
  async createVote(voteData) {
    // Validate required fields to prevent Firestore errors
    if (!voteData.userId || !voteData.linkId) {
      throw new Error('Missing required fields: userId and linkId are required');
    }

    if (this.db.dbType === 'firestore') {
      // Check if vote already exists
      const existingVotes = await this.db.firestoreDb.getDb()
        .collection('votes')
        .where('userId', '==', voteData.userId)
        .where('linkId', '==', voteData.linkId)
        .get();

      if (!existingVotes.empty) {
        // Update existing vote
        const voteId = existingVotes.docs[0].id;
        return await this.db.firestoreDb.update('votes', voteId, voteData);
      } else {
        // Create new vote
        return await this.db.firestoreDb.create('votes', voteData);
      }
    }
    return await this.createVoteFallback(voteData);
  }

  async getVotesForLink(linkId) {
    if (this.db.dbType === 'firestore') {
      return await this.db.firestoreDb.query('votes', 'linkId', '==', linkId);
    }
    return await this.getVotesForLinkFallback(linkId);
  }

  // Comment operations
  async createComment(commentData) {
    if (this.db.dbType === 'firestore') {
      return await this.db.firestoreDb.create('comments', commentData);
    }
    return await this.createCommentFallback(commentData);
  }

  async getCommentsForLink(linkId) {
    if (this.db.dbType === 'firestore') {
      return await this.db.firestoreDb.query('comments', 'linkId', '==', linkId);
    }
    return await this.getCommentsForLinkFallback(linkId);
  }

  // Chat operations
  async createConversation(conversationData) {
    if (this.db.dbType === 'firestore') {
      return await this.db.firestoreDb.create('conversations', conversationData);
    }
    return await this.createConversationFallback(conversationData);
  }

  async createChatMessage(messageData) {
    if (this.db.dbType === 'firestore') {
      return await this.db.firestoreDb.create('chatMessages', messageData);
    }
    return await this.createChatMessageFallback(messageData);
  }

  async getConversationMessages(conversationId, limit = 50) {
    if (this.db.dbType === 'firestore') {
      return await this.db.firestoreDb.query('chatMessages', 'conversationId', '==', conversationId, limit);
    }
    return await this.getConversationMessagesFallback(conversationId, limit);
  }

  // Report operations
  async createReport(reportData) {
    if (this.db.dbType === 'firestore') {
      return await this.db.firestoreDb.create('reports', reportData);
    }
    return await this.createReportFallback(reportData);
  }

  async getAllReports(limit = 50) {
    if (this.db.dbType === 'firestore') {
      return await this.db.firestoreDb.findAll('reports', limit);
    }
    return await this.getAllReportsFallback(limit);
  }

  // Fallback methods (in-memory storage)
  async createUserFallback(userData) {
    const userId = Date.now().toString();
    global.inMemoryDB.users.set(userId, { id: userId, ...userData });
    return { id: userId, ...userData };
  }

  async findUserByEmailFallback(email) {
    for (const [, user] of global.inMemoryDB.users) {
      if (user.email === email) return user;
    }
    return null;
  }

  async findUserByIdFallback(userId) {
    return global.inMemoryDB.users.get(userId) || null;
  }

  async createLinkFallback(linkData) {
    const linkId = Date.now().toString();
    global.inMemoryDB.links.set(linkId, { id: linkId, ...linkData });
    return { id: linkId, ...linkData };
  }

  async findAllLinksFallback(limit) {
    return Array.from(global.inMemoryDB.links.values()).slice(0, limit);
  }

  async findLinkByIdFallback(linkId) {
    return global.inMemoryDB.links.get(linkId) || null;
  }

  async createVoteFallback(voteData) {
    const voteId = Date.now().toString();
    global.inMemoryDB.votes.set(voteId, { id: voteId, ...voteData });
    return { id: voteId, ...voteData };
  }

  async getVotesForLinkFallback(linkId) {
    return Array.from(global.inMemoryDB.votes.values()).filter(vote => vote.linkId === linkId);
  }

  async createCommentFallback(commentData) {
    const commentId = Date.now().toString();
    global.inMemoryDB.comments.set(commentId, { id: commentId, ...commentData });
    return { id: commentId, ...commentData };
  }

  async getCommentsForLinkFallback(linkId) {
    return Array.from(global.inMemoryDB.comments.values()).filter(comment => comment.linkId === linkId);
  }

  async createConversationFallback(conversationData) {
    const conversationId = Date.now().toString();
    global.inMemoryDB.conversations.set(conversationId, { id: conversationId, ...conversationData });
    return { id: conversationId, ...conversationData };
  }

  async createChatMessageFallback(messageData) {
    const messageId = Date.now().toString();
    global.inMemoryDB.messages.set(messageId, { id: messageId, ...messageData });
    return { id: messageId, ...messageData };
  }

  async getConversationMessagesFallback(conversationId, limit) {
    return Array.from(global.inMemoryDB.messages.values())
      .filter(msg => msg.conversationId === conversationId)
      .slice(0, limit);
  }

  async createReportFallback(reportData) {
    const reportId = Date.now().toString();
    global.inMemoryDB.reports.set(reportId, { id: reportId, ...reportData });
    return { id: reportId, ...reportData };
  }

  async getAllReportsFallback(limit) {
    return Array.from(global.inMemoryDB.reports.values()).slice(0, limit);
  }
}

module.exports = new FirestoreService();
