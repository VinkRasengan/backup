// Firestore Database Configuration (Fallback)
const admin = require('firebase-admin');

class FirestoreDatabase {
  constructor() {
    this.db = null;
    this.isConnected = false;
    this.initialize();
  }

  initialize() {
    try {
      // Initialize Firebase Admin if not already done
      if (!admin.apps.length) {
        const serviceAccount = {
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
        };

        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: process.env.FIREBASE_PROJECT_ID
        });
      }

      this.db = admin.firestore();
      this.isConnected = true;
      console.log('✅ Firestore initialized successfully');
    } catch (error) {
      console.error('❌ Firestore initialization failed:', error.message);
      this.isConnected = false;
    }
  }

  // Health check
  async healthCheck() {
    if (!this.isConnected) {
      return {
        status: 'disconnected',
        type: 'firestore',
        message: 'Firestore not connected'
      };
    }

    try {
      // Test connection with a simple read
      await this.db.collection('_health').limit(1).get();
      return {
        status: 'connected',
        type: 'firestore',
        message: 'Firestore connection healthy'
      };
    } catch (error) {
      return {
        status: 'error',
        type: 'firestore',
        error: error.message
      };
    }
  }

  // Generic CRUD operations
  async create(collection, data) {
    if (!this.isConnected) throw new Error('Firestore not connected');
    
    const docRef = await this.db.collection(collection).add({
      ...data,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return { id: docRef.id, ...data };
  }

  async findById(collection, id) {
    if (!this.isConnected) throw new Error('Firestore not connected');
    
    const doc = await this.db.collection(collection).doc(id).get();
    if (!doc.exists) return null;
    
    return { id: doc.id, ...doc.data() };
  }

  async findAll(collection, limit = 50) {
    if (!this.isConnected) throw new Error('Firestore not connected');
    
    const snapshot = await this.db.collection(collection).limit(limit).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async update(collection, id, data) {
    if (!this.isConnected) throw new Error('Firestore not connected');
    
    await this.db.collection(collection).doc(id).update({
      ...data,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return { id, ...data };
  }

  async delete(collection, id) {
    if (!this.isConnected) throw new Error('Firestore not connected');
    
    await this.db.collection(collection).doc(id).delete();
    return { id };
  }

  // Query operations
  async query(collection, field, operator, value, limit = 50) {
    if (!this.isConnected) throw new Error('Firestore not connected');
    
    const snapshot = await this.db.collection(collection)
      .where(field, operator, value)
      .limit(limit)
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  getDb() {
    return this.db;
  }
}

// Export singleton instance
module.exports = new FirestoreDatabase();
