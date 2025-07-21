const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Load environment variables from root .env
require('dotenv').config({ path: require('path').join(__dirname, '../../../../.env') });

// Required environment variables
const requiredVars = [
  'NODE_ENV',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
  'JWT_SECRET'
];

let db, auth, collections;

// Mock functions for development/testing
function createMockFirestore() {
  return {
    collection: (name) => ({
      doc: (id) => ({
        get: () => Promise.resolve({ exists: false, data: () => ({}) }),
        set: (data) => Promise.resolve(),
        update: (data) => Promise.resolve(),
        delete: () => Promise.resolve()
      }),
      add: (data) => Promise.resolve({ id: 'mock-id-' + Date.now() }),
      where: (field, op, value) => ({
        get: () => Promise.resolve({ docs: [] })
      }),
      get: () => Promise.resolve({ docs: [] }),
      limit: (num) => ({
        get: () => Promise.resolve({ docs: [] })
      })
    }),
    doc: (path) => ({
      get: () => Promise.resolve({ exists: false, data: () => ({}) }),
      set: (data) => Promise.resolve(),
      update: (data) => Promise.resolve(),
      delete: () => Promise.resolve()
    }),
    batch: () => ({
      set: (ref, data) => {},
      update: (ref, data) => {},
      delete: (ref) => {},
      commit: () => Promise.resolve()
    })
  };
}

function createMockAuth() {
  return {
    verifyIdToken: (token) => Promise.resolve({
      uid: 'mock-user-id',
      email: 'mock@example.com',
      email_verified: true,
      name: 'Mock User'
    }),
    createUser: (userData) => Promise.resolve({
      uid: 'mock-user-id',
      email: userData.email
    }),
    updateUser: (uid, userData) => Promise.resolve({
      uid: uid,
      ...userData
    }),
    deleteUser: (uid) => Promise.resolve(),
    getUser: (uid) => Promise.resolve({
      uid: uid,
      email: 'mock@example.com'
    })
  };
}

// Firestore collections
collections = {
  USERS: 'users',
  VERIFICATION_TOKENS: 'verification_tokens',
  PASSWORD_RESET_TOKENS: 'password_reset_tokens',
  USER_SESSIONS: 'user_sessions',
  AUDIT_LOGS: 'audit_logs'
};

// Skip Firebase initialization in test environment
if (process.env.NODE_ENV === 'test') {
  console.log('🧪 Auth Service: Skipping Firebase initialization in test environment');

  // Create mock objects for test environment
  db = createMockFirestore();
  auth = createMockAuth();
} else {
  try {
    // Initialize Firebase Admin SDK with environment variables only
    if (!admin.apps.length) {
      // Parse private key properly - handle different formats
      let privateKey = process.env.FIREBASE_PRIVATE_KEY;

      if (!privateKey) {
        throw new Error('FIREBASE_PRIVATE_KEY environment variable is missing');
      }

      // Clean up the private key
      privateKey = privateKey.trim();

      // Remove outer quotes if present
      if ((privateKey.startsWith('"') && privateKey.endsWith('"')) ||
          (privateKey.startsWith("'") && privateKey.endsWith("'"))) {
        privateKey = privateKey.slice(1, -1);
      }

      // Replace escaped newlines with actual newlines
      privateKey = privateKey.replace(/\\n/g, '\n');

      // Ensure proper PEM format
      if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
        throw new Error('Invalid private key format - missing BEGIN marker');
      }

      if (!privateKey.includes('-----END PRIVATE KEY-----')) {
        throw new Error('Invalid private key format - missing END marker');
      }

      const serviceAccount = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        private_key: privateKey
      };

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID
      });

      console.log('🔥 Firebase Admin initialized from environment variables');
    }

    db = admin.firestore();
    auth = admin.auth();
    console.log('✅ Auth Service: Firebase config loaded successfully');
  } catch (error) {
    console.error('❌ Auth Service: Firebase config failed to load:', error.message);
    throw new Error(`Firebase configuration failed: ${error.message}`);
  }
}

/**
 * Test Firebase connection
 */
async function testConnection() {
  try {
    await db.collection('health_check').limit(1).get();
    console.log('✅ Firebase connection test successful');
    return true;
  } catch (error) {
    console.error('❌ Firebase connection test failed:', error.message);
    return false;
  }
}

/**
 * Get collection statistics
 */
async function getCollectionStats() {
  const stats = {};
  
  for (const [name, collection] of Object.entries(collections)) {
    try {
      const snapshot = await db.collection(collection).get();
      stats[collection] = snapshot.size;
    } catch (error) {
      stats[collection] = 'error';
    }
  }
  
  return stats;
}

/**
 * Health check for Firebase
 */
async function healthCheck() {
  // Skip health check in test environment
  if (process.env.NODE_ENV === 'test') {
    return {
      status: 'healthy',
      type: 'firebase',
      projectId: 'test-project',
      environment: 'test'
    };
  }

  try {
    await db.collection('health_check').limit(1).get();
    return {
      status: 'healthy',
      type: 'firebase',
      projectId: process.env.FIREBASE_PROJECT_ID,
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'emulator'
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      type: 'firebase',
      error: error.message
    };
  }
}

module.exports = {
  admin,
  db,
  auth,
  collections,
  testConnection,
  getCollectionStats,
  healthCheck
};
