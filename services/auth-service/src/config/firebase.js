const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Load environment variables using standardized loader
const { setupEnvironment, getRequiredVarsForService } = require('../utils/env-loader');
setupEnvironment('auth-service', getRequiredVarsForService('auth'), false);

let db, auth, collections;

// Skip Firebase initialization in test environment
if (process.env.NODE_ENV === 'test') {
  console.log('🧪 Auth Service: Skipping Firebase initialization in test environment');

  // Create mock objects for test environment
  db = null;
  auth = null;
  collections = {
    USERS: 'users',
    VERIFICATION_TOKENS: 'verification_tokens',
    PASSWORD_RESET_TOKENS: 'password_reset_tokens',
    USER_SESSIONS: 'user_sessions',
    AUDIT_LOGS: 'audit_logs'
  };
} else {
  try {
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
    auth = admin.auth();

    // Firestore collections
    collections = {
      USERS: 'users',
      VERIFICATION_TOKENS: 'verification_tokens',
      PASSWORD_RESET_TOKENS: 'password_reset_tokens',
      USER_SESSIONS: 'user_sessions',
      AUDIT_LOGS: 'audit_logs'
    };

    console.log('✅ Auth Service: Firebase config loaded successfully');
  } catch (error) {
    console.error('❌ Auth Service: Firebase config failed to load:', error.message);
    throw new Error('Firebase configuration failed');
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
