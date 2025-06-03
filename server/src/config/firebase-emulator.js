const admin = require('firebase-admin');

// Initialize Firebase Admin SDK for emulator
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'factcheck-1d6e8'
  });
}

// Configure for emulator
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8084';

const db = admin.firestore();
const auth = admin.auth();

// Firestore collections
const collections = {
  USERS: 'users',
  LINKS: 'links',
  VERIFICATION_TOKENS: 'verification_tokens',
  PASSWORD_RESET_TOKENS: 'password_reset_tokens'
};

module.exports = {
  admin,
  db,
  auth,
  collections
};
