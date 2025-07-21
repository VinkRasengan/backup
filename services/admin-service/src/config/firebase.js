const admin = require('firebase-admin');

// Load environment variables using standardized loader
const { quickSetup } = require('../../../../config/env-loader.js');
quickSetup('admin-service-firebase');

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
  
  // Fallback for development without proper credentials
  if (process.env.NODE_ENV === 'development') {
    console.warn('Using fallback Firebase configuration for development');
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
    } catch (fallbackError) {
      console.error('Fallback Firebase initialization failed:', fallbackError);
    }
  }
}

// Export Firebase instances
module.exports = {
  admin,
  db,
  collections
};
