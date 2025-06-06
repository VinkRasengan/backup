const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  if (process.env.NODE_ENV === 'production' && process.env.FIREBASE_PRIVATE_KEY) {
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
    // Development: Use emulator or default credentials
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || 'factcheck-1d6e8'
    });
    
    // Configure for emulator in development
    if (process.env.NODE_ENV === 'development') {
      process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8084';
      console.log('🔥 Firebase Admin initialized for development/emulator');
    } else {
      console.log('🔥 Firebase Admin initialized with default credentials');
    }
  }
}

const db = admin.firestore();
const auth = admin.auth();

// Firestore collections - single source of truth
const collections = {
  USERS: 'users',
  LINKS: 'links',
  VERIFICATION_TOKENS: 'verification_tokens',
  PASSWORD_RESET_TOKENS: 'password_reset_tokens',
  CONVERSATIONS: 'conversations',
  CHAT_MESSAGES: 'chat_messages',
  VOTES: 'votes',
  COMMENTS: 'comments',
  REPORTS: 'reports',
  ADMIN_NOTIFICATIONS: 'admin_notifications'
};

module.exports = {
  admin,
  db,
  auth,
  collections
};
