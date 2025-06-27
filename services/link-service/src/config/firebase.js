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
      process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8081';
      console.log('🔥 Firebase Admin initialized for emulator');
    }
  }

  db = admin.firestore();

  // Firestore collections for Link Service
  collections = {
    LINKS: 'links',
    SCAN_RESULTS: 'scan_results',
    SECURITY_REPORTS: 'security_reports',
    SCREENSHOTS: 'screenshots',
    LINK_HISTORY: 'link_history',
    USERS: 'users' // For updating user stats
  };

  console.log('✅ Link Service: Firebase config loaded successfully');
} catch (error) {
  console.error('❌ Link Service: Firebase config failed to load:', error.message);
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
  try {
    // In development mode, skip actual Firebase connection test
    if (process.env.NODE_ENV !== 'production') {
      return {
        status: 'healthy',
        type: 'firebase',
        projectId: process.env.FIREBASE_PROJECT_ID,
        environment: 'emulator-mock',
        note: 'Development mode - health check bypassed'
      };
    }
    
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
  getCollectionStats,
  healthCheck
};
