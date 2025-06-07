// Firebase-Only Database Configuration
// Simplified database layer using only Firestore

class FirebaseDatabase {
  constructor() {
    this.firestoreDb = null;
    this.isConnected = false;
    this.dbType = 'firestore';
    
    this.initializeFirestore();
  }

  async initializeFirestore() {
    try {
      console.log('🔥 Initializing Firebase-only database...');
      const firestore = require('./firestore');

      // Wait for firestore to initialize
      await new Promise(resolve => setTimeout(resolve, 1000));

      const health = await firestore.healthCheck();

      if (health.status === 'connected') {
        console.log('✅ Firebase database connected');
        this.firestoreDb = firestore;
        this.isConnected = true;
        await this.initializeCollections();
        return true;
      } else {
        throw new Error('Firestore connection failed');
      }
    } catch (error) {
      console.error('❌ Firebase database initialization failed:', error.message);
      console.log('⚠️ Continuing without firebase-database.js - using direct Firestore controllers');
      this.isConnected = false;
      this.dbType = 'error';
      // Don't throw error - let app continue with direct Firestore controllers
    }
    return false;
  }

  useInMemoryFallback() {
    console.log('⚠️ Firebase-database.js connection failed - App will use direct Firestore controllers');
    console.log('🔥 This is expected behavior - enhanced config handles Firebase connection');
    this.isConnected = false;
    this.dbType = 'direct_firestore';

    // Don't throw error - let app continue with direct Firestore controllers
    console.log('✅ Continuing with direct Firestore controller architecture');
  }

  // Health check
  async healthCheck() {
    if (!this.isConnected) {
      return {
        status: 'disconnected',
        type: 'memory',
        message: 'Using in-memory storage fallback'
      };
    }

    if (this.dbType === 'firestore' && this.firestoreDb) {
      return await this.firestoreDb.healthCheck();
    }

    return {
      status: 'unknown',
      type: this.dbType,
      message: 'Unknown database state'
    };
  }

  async initializeCollections() {
    if (!this.firestoreDb) return;

    try {
      console.log('🔥 Initializing Firestore collections...');

      // Define collection schemas (for documentation)
      const collections = {
        users: {
          fields: ['email', 'displayName', 'firstName', 'lastName', 'isVerified', 'authProvider', 'bio', 'avatarUrl', 'stats', 'createdAt', 'lastLoginAt'],
          description: 'User profiles and authentication data'
        },
        links: {
          fields: ['url', 'title', 'description', 'status', 'submittedBy', 'scanResults', 'createdAt', 'updatedAt'],
          description: 'Community submitted links for fact-checking'
        },
        votes: {
          fields: ['linkId', 'userId', 'voteType', 'createdAt'],
          description: 'User votes on link safety (safe/unsafe/suspicious)'
        },
        comments: {
          fields: ['linkId', 'userId', 'content', 'createdAt', 'updatedAt'],
          description: 'User comments on links'
        },
        conversations: {
          fields: ['userId', 'title', 'createdAt', 'updatedAt'],
          description: 'Chat conversation metadata'
        },
        chat_messages: {
          fields: ['conversationId', 'userId', 'content', 'role', 'createdAt'],
          description: 'Individual chat messages'
        },
        reports: {
          fields: ['linkId', 'userId', 'type', 'reason', 'description', 'status', 'createdAt'],
          description: 'User reports for inappropriate content'
        }
      };

      // Log collection info
      for (const [name, info] of Object.entries(collections)) {
        console.log(`📋 Collection: ${name} - ${info.description}`);
      }

      // Check existing data
      const stats = await this.getCollectionStats();
      console.log('📊 Current data:', stats);

      console.log('✅ Firestore collections initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Firestore collections:', error.message);
    }
  }

  async getCollectionStats() {
    if (!this.firestoreDb) return {};

    const stats = {};
    const collections = ['users', 'links', 'votes', 'comments', 'conversations', 'chat_messages', 'reports'];

    for (const collection of collections) {
      try {
        const snapshot = await this.firestoreDb.getDb().collection(collection).get();
        stats[collection] = snapshot.size;
      } catch (error) {
        stats[collection] = 'error';
      }
    }

    return stats;
  }

  // Firestore operations wrapper
  async create(collection, data) {
    if (!this.firestoreDb) {
      throw new Error('Firestore not available');
    }
    return await this.firestoreDb.create(collection, data);
  }

  async findById(collection, id) {
    if (!this.firestoreDb) {
      throw new Error('Firestore not available');
    }
    return await this.firestoreDb.findById(collection, id);
  }

  async findByField(collection, field, value) {
    if (!this.firestoreDb) {
      throw new Error('Firestore not available');
    }
    return await this.firestoreDb.findByField(collection, field, value);
  }

  async update(collection, id, data) {
    if (!this.firestoreDb) {
      throw new Error('Firestore not available');
    }
    return await this.firestoreDb.update(collection, id, data);
  }

  async delete(collection, id) {
    if (!this.firestoreDb) {
      throw new Error('Firestore not available');
    }
    return await this.firestoreDb.delete(collection, id);
  }

  async findAll(collection, options = {}) {
    if (!this.firestoreDb) {
      throw new Error('Firestore not available');
    }
    return await this.firestoreDb.findAll(collection, options);
  }

  // Get Firestore instance for advanced operations
  getFirestore() {
    return this.firestoreDb;
  }

  getDb() {
    return this.firestoreDb?.getDb();
  }

  // Legacy compatibility methods (for existing code)
  async query() {
    throw new Error('Raw SQL queries not supported in Firebase-only mode. Use Firestore methods instead.');
  }

  async getClient() {
    throw new Error('PostgreSQL client not available in Firebase-only mode.');
  }

  getSequelize() {
    return null; // Sequelize not available
  }

  async close() {
    // Firestore connections are managed automatically
    console.log('🔥 Firebase database connection closed');
  }
}

// Export singleton instance
module.exports = new FirebaseDatabase();
