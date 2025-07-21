const admin = require('firebase-admin');
const path = require('path');


// Load environment variables from root .env
require('dotenv').config({ path: require('path').join(__dirname, '../../../../.env') });
// Load environment variables using standardized loader
let db, collections;

try {
  // Debug environment variables
  console.log('Firebase Environment Variables:', { // eslint-disable-line no-console
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID, // eslint-disable-line no-process-env
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL, // eslint-disable-line no-process-env
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? 'EXISTS' : 'MISSING' // eslint-disable-line no-process-env
  });

  // Initialize Firebase Admin SDK
  if (!admin.apps.length) {
    // Use production Firebase with service account credentials
    const serviceAccount = {
      type: 'service_account',
      project_id: process.env.FIREBASE_PROJECT_ID, // eslint-disable-line no-process-env
      client_email: process.env.FIREBASE_CLIENT_EMAIL, // eslint-disable-line no-process-env
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') // eslint-disable-line no-process-env
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID // eslint-disable-line no-process-env
    });

    console.log('🔥 Firebase Admin initialized for production'); // eslint-disable-line no-console
  }

  db = admin.firestore();

  // Firestore collections for Community Service
  collections = {
    POSTS: 'links', // Use 'links' collection to match client-side and link-service
    COMMENTS: 'comments',
    VOTES: 'votes',
    COMMENT_VOTES: 'comment_votes', // For comment voting
    REPORTS: 'reports',
    USERS: 'users' // For user stats
  };

  console.log('✅ Community Service: Firebase config loaded successfully'); // eslint-disable-line no-console
} catch (error) {
  console.error('❌ Community Service: Firebase config failed to load:', error.message); // eslint-disable-line no-console
  throw new Error('Firebase configuration failed');
}

/**
 * Test Firebase connection
 */
async function testConnection() {
  try {
    await db.collection('health_check').limit(1).get();
    console.log('✅ Firebase connection test successful'); // eslint-disable-line no-console
    return true;
  } catch (error) {
    console.error('❌ Firebase connection test failed:', error.message); // eslint-disable-line no-console
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
      projectId: process.env.FIREBASE_PROJECT_ID, // eslint-disable-line no-process-env
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'emulator' // eslint-disable-line no-process-env
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
