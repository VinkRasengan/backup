/**
 * Firebase Wrapper for Development Mode
 * Handles DISABLE_FIREBASE environment variable
 */

let db, collections, admin, FieldPath;

if (process.env.DISABLE_FIREBASE === 'true') {
  console.log('⚠️  Community Service: Firebase disabled for development mode');
  
  // Mock Firebase objects for development
  const mockCollection = {
    doc: () => ({
      get: () => Promise.resolve({ exists: false, data: () => ({}) }),
      set: () => Promise.resolve(),
      update: () => Promise.resolve(),
      delete: () => Promise.resolve()
    }),
    add: () => Promise.resolve({ id: 'mock-id' }),
    where: () => mockCollection,
    orderBy: () => mockCollection,
    limit: () => mockCollection,
    get: () => Promise.resolve({ docs: [], empty: true })
  };

  db = {
    collection: () => mockCollection
  };

  collections = {
    USERS: 'users',
    LINKS: 'links',
    COMMENTS: 'comments',
    VOTES: 'votes',
    REPORTS: 'reports'
  };
} else {
  // Use real Firebase
  try {
    const firebaseConfig = require('./firebase');
    db = firebaseConfig.db;
    admin = firebaseConfig.admin;
    collections = firebaseConfig.collections;
    FieldPath = firebaseConfig.FieldPath || require('firebase-admin/firestore').FieldPath;
  } catch (error) {
    console.error('❌ Community Service: Firebase config failed:', error.message);
    throw error;
  }
}

module.exports = {
  db,
  collections,
  admin,
  FieldPath
};
