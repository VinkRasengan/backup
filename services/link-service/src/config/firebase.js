const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');


// Load environment variables from root .env
require('dotenv').config({ path: require('path').join(__dirname, '../../../../.env') });
// Load environment variables using standardized loader
let db, collections, adminInstance;

try {
  // Initialize Firebase Admin SDK
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
      type: 'service_account',
      project_id: process.env.FIREBASE_PROJECT_ID,
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      private_key: privateKey
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID
    });

    console.log('🔥 Firebase Admin initialized for production');
  }

  adminInstance = admin;
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
  console.log('⚠️  Link Service: Running in development mode without Firebase');

  // Create mock admin instance
  adminInstance = {
    firestore: () => ({
      collection: (name) => ({
        doc: (id) => ({
          get: () => Promise.resolve({ exists: false, data: () => null }),
          set: (data) => Promise.resolve(),
          update: (data) => Promise.resolve(),
          delete: () => Promise.resolve()
        }),
        add: (data) => Promise.resolve({ id: 'mock-id' }),
        where: () => ({
          get: () => Promise.resolve({ docs: [] })
        })
      })
    })
  };

  // Create mock Firebase for development
  db = {
    collection: (name) => ({
      doc: (id) => ({
        get: () => Promise.resolve({ exists: false, data: () => null }),
        set: (data) => Promise.resolve(),
        update: (data) => Promise.resolve(),
        delete: () => Promise.resolve()
      }),
      add: (data) => Promise.resolve({ id: 'mock-id' }),
      where: () => ({
        get: () => Promise.resolve({ docs: [] })
      })
    })
  };

  collections = {
    LINKS: 'links',
    LINK_ANALYSIS: 'link_analysis',
    LINK_HISTORY: 'link_history',
    USERS: 'users'
  };

  console.log('✅ Link Service: Mock Firebase initialized for development');
}

/**
 * Test Firebase connection
 */
async function testConnection() {
  try {
    if (db && db.collection) {
      await db.collection('health_check').limit(1).get();
      console.log('✅ Firebase connection test successful');
      return true;
    } else {
      console.log('✅ Mock Firebase connection test successful');
      return true;
    }
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
      if (db && db.collection) {
        const snapshot = await db.collection(collection).get();
        stats[collection] = snapshot.size || 0;
      } else {
        stats[collection] = 0; // Mock data
      }
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
    if (db && db.collection) {
      await db.collection('health_check').limit(1).get();
      return {
        status: 'healthy',
        type: 'firebase',
        projectId: process.env.FIREBASE_PROJECT_ID,
        environment: process.env.NODE_ENV === 'production' ? 'production' : 'development'
      };
    } else {
      return {
        status: 'healthy',
        type: 'mock-firebase',
        projectId: 'mock-project',
        environment: 'development'
      };
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      type: 'firebase',
      error: error.message
    };
  }
}

module.exports = {
  admin: adminInstance,
  db,
  collections,
  testConnection,
  getCollectionStats,
  healthCheck
};
