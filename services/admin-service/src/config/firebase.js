const admin = require('firebase-admin');


// Load environment variables from root .env
require('dotenv').config({ path: require('path').join(__dirname, '../../../../.env') });
// Load environment variables using standardized loader
let db, collections;

try {
  // Debug environment variables
  console.log('Firebase Environment Variables (Admin Service):', {
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? 'EXISTS' : 'MISSING'
  });

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

    console.log('Firebase Admin initialized successfully for admin service');
  }

  // Initialize Firestore
  db = admin.firestore();

  // Collection names
  collections = {
    REPORTS: 'reports',
    LINKS: 'links',
    USERS: 'users',
    VOTES: 'votes',
    COMMENTS: 'comments'
  };

  console.log('Firestore initialized successfully for admin service');

} catch (error) {
  console.error('Firebase Admin initialization error (admin service):', error);

  // Enhanced fallback for development/Docker environment
  if (process.env.NODE_ENV === 'development') {
    console.warn('🐳 Using fallback Firebase configuration for development/Docker');
    console.warn('💡 This is normal in Docker development environment');

    try {
      admin.initializeApp({
        projectId: 'factcheck-1d6e8'
      });
      db = admin.firestore();
      collections = {
        REPORTS: 'reports',
        LINKS: 'links',
        USERS: 'users',
        VOTES: 'votes',
        COMMENTS: 'comments'
      };
      console.log('✅ Fallback Firebase configuration loaded');
    } catch (fallbackError) {
      console.error('❌ Fallback Firebase initialization failed:', fallbackError);
      console.warn('⚠️ Admin service will continue without Firebase');
      db = null;
      collections = null;
    }
  } else {
    // In production, Firebase is required
    throw error;
  }
}

// Export Firebase instances
module.exports = {
  admin,
  db,
  collections
};
