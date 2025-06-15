const admin = require('firebase-admin');

let db, collections;

try {
  // Initialize Firebase Admin SDK
  if (!admin.apps.length) {
    if (process.env.NODE_ENV === 'production') {
      // Production: Use service account from environment variables
      const serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
      };

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID
      });

      console.log('🔥 Firebase Admin initialized for production');
    } else {
      // Development: Use emulator
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || 'factcheck-1d6e8'
      });
      
      // Configure for emulator
      process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8084';
      console.log('🔥 Firebase Admin initialized for emulator');
    }
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
  healthCheck
};
