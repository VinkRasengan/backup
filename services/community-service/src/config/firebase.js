const admin = require('firebase-admin');
const path = require('path');

// Load environment variables from root .env file
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

let db, collections;

try {
  // Debug environment variables
  console.log('Firebase Environment Variables:', {
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? 'EXISTS' : 'MISSING'
  });

  // Initialize Firebase Admin SDK
  if (!admin.apps.length) {
    // Use production Firebase with service account credentials
    const serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID
    });

    console.log('🔥 Firebase Admin initialized for production');
  }

  db = admin.firestore();

  // Firestore collections for Community Service
  collections = {
    POSTS: 'posts', // Use 'posts' collection where the actual data is stored
    COMMENTS: 'comments',
    VOTES: 'votes',
    COMMENT_VOTES: 'comment_votes', // For comment voting
    REPORTS: 'reports',
    USERS: 'users' // For user stats
  };

  console.log('✅ Community Service: Firebase config loaded successfully');
} catch (error) {
  console.error('❌ Community Service: Firebase config failed to load:', error.message);
  throw new Error('Firebase configuration failed');
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
 * Health check for Firebase
 */
async function healthCheck() {
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
  collections,
  testConnection,
  healthCheck
};
