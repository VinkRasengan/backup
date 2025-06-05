const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
let db, auth;

if (process.env.NODE_ENV === 'development') {
  // Use emulator for development
  console.log('🔧 Using Firebase Emulator for development');

  if (!admin.apps.length) {
    admin.initializeApp({
      projectId: 'demo-project'
    });
  }

  db = admin.firestore();
  auth = admin.auth();

  // Connect to emulator
  db.settings({
    host: 'localhost:8080',
    ssl: false
  });

} else {
  // Use production Firebase
  console.log('🚀 Using Production Firebase');

  const serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: `https://www.googleapis.com/oauth2/v1/certs`,
    client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
  };

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID
    });
  }

  db = admin.firestore();
  auth = admin.auth();
}

// Firestore collections
const collections = {
  USERS: 'users',
  LINKS: 'links',
  VERIFICATION_TOKENS: 'verification_tokens',
  PASSWORD_RESET_TOKENS: 'password_reset_tokens',
  VOTES: 'votes',
  COMMENTS: 'comments',
  REPORTS: 'reports',
  ADMIN_NOTIFICATIONS: 'admin_notifications',
  CONVERSATIONS: 'conversations',
  CHAT_MESSAGES: 'chat_messages'
};

module.exports = {
  admin,
  db,
  auth,
  collections
};
