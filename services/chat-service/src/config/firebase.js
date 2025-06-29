const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Load environment variables - conditional for development vs production
if (process.env.NODE_ENV !== 'production') {
  const rootEnvPath = path.join(__dirname, '../../../../.env');
  // Try to load from root first, fallback to local if not found
  if (fs.existsSync(rootEnvPath)) {
    require('dotenv').config({ path: rootEnvPath });
  } else {
    // Fallback for development environments
    require('dotenv').config();
  }
}
// In production (Render, Docker), environment variables are set by platform

let db, collections;

try {
  // Initialize Firebase Admin SDK
  if (!admin.apps.length) {
    // Use production Firebase with service account credentials
    const serviceAccount = {
      type: 'service_account',
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

  // Firestore collections for Chat Service
  collections = {
    CONVERSATIONS: 'conversations',
    MESSAGES: 'messages',
    USERS: 'users' // For user stats
  };

  console.log('✅ Chat Service: Firebase config loaded successfully');
} catch (error) {
  console.error('❌ Chat Service: Firebase config failed to load:', error.message);
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
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'development'
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
