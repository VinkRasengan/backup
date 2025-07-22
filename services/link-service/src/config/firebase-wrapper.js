/**
 * Firebase Wrapper for Development Mode
 * Handles DISABLE_FIREBASE environment variable
 */

let db, collections;

if (process.env.DISABLE_FIREBASE === 'true') {
  console.log('⚠️  Link Service: Firebase disabled for development mode');
  
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
    collections = firebaseConfig.collections;
  } catch (error) {
    console.error('❌ Link Service: Firebase config failed:', error.message);
    console.log('⚠️  Link Service: Falling back to mock Firebase for development');

    // Fallback to mock Firebase
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
      USERS: 'users',
      REPORTS: 'reports'
    };
  }
}

module.exports = {
  db,
  collections
};
