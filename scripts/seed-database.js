#!/usr/bin/env node

/**
 * 🌱 Database Seeding Script
 * 
 * This script seeds the Firestore database with sample data for testing
 * Run with: node scripts/seed-database.js
 */

const admin = require('firebase-admin');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Initialize Firebase Admin
function initializeFirebase() {
  try {
    log('🔥 Connecting to Firestore Emulator...', 'cyan');
    
    // Set emulator host
    process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
    
    if (!admin.apps.length) {
      admin.initializeApp({
        projectId: 'factcheck-1d6e8'
      });
    }
    
    return admin.firestore();
  } catch (error) {
    log(`❌ Firebase initialization failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Sample data
const sampleUsers = [
  {
    id: 'user1',
    email: 'john@example.com',
    displayName: 'John Doe',
    role: 'user',
    reputation: 150,
    joinedAt: admin.firestore.Timestamp.now(),
    verified: true
  },
  {
    id: 'user2', 
    email: 'jane@example.com',
    displayName: 'Jane Smith',
    role: 'moderator',
    reputation: 300,
    joinedAt: admin.firestore.Timestamp.now(),
    verified: true
  }
];

const samplePosts = [
  {
    id: 'post1',
    title: 'Cảnh báo: Website lừa đảo giả mạo ngân hàng',
    content: 'Tôi vừa phát hiện một website giả mạo ngân hàng Vietcombank. Website này có giao diện rất giống thật và đang lừa đảo thông tin tài khoản của người dùng.',
    type: 'user_post',
    category: 'phishing',
    author: {
      uid: 'user1',
      email: 'john@example.com',
      displayName: 'John Doe'
    },
    url: 'https://fake-vietcombank.com',
    tags: ['phishing', 'banking', 'scam'],
    status: 'active',
    voteStats: {
      upvotes: 5,
      downvotes: 15,
      score: -10,
      total: 20
    },
    voteScore: -10,
    commentCount: 5,
    viewCount: 150,
    verified: false,
    trustScore: 85,
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now()
  },
  {
    id: 'post2',
    title: 'Bộ TT&TT cảnh báo chiêu thức lừa đảo mới qua SMS',
    content: 'Bộ Thông tin và Truyền thông vừa phát đi cảnh báo về chiêu thức lừa đảo mới thông qua tin nhắn SMS giả mạo các ngân hàng...',
    type: 'news',
    category: 'official_warning',
    author: {
      uid: 'system',
      email: 'news@vnexpress.net',
      displayName: 'VnExpress'
    },
    source: 'VnExpress',
    tags: ['official', 'sms', 'warning'],
    status: 'active',
    voteStats: {
      upvotes: 45,
      downvotes: 3,
      score: 42,
      total: 48
    },
    voteScore: 42,
    commentCount: 8,
    viewCount: 500,
    verified: true,
    trustScore: 95,
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now()
  }
];

const sampleVotes = [
  {
    linkId: 'post1',
    userId: 'user1',
    userEmail: 'john@example.com',
    voteType: 'downvote',
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now()
  },
  {
    linkId: 'post1',
    userId: 'user2',
    userEmail: 'jane@example.com',
    voteType: 'downvote',
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now()
  },
  {
    linkId: 'post2',
    userId: 'user1',
    userEmail: 'john@example.com',
    voteType: 'upvote',
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now()
  },
  {
    linkId: 'post2',
    userId: 'user2',
    userEmail: 'jane@example.com',
    voteType: 'upvote',
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now()
  }
];

const sampleComments = [
  {
    postId: 'post1',
    author: {
      uid: 'user2',
      email: 'jane@example.com',
      displayName: 'Jane Smith'
    },
    content: 'Cảm ơn bạn đã chia sẻ! Tôi cũng đã gặp website này và suýt bị lừa.',
    voteScore: 5,
    status: 'active',
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now()
  },
  {
    postId: 'post2',
    author: {
      uid: 'user1',
      email: 'john@example.com',
      displayName: 'John Doe'
    },
    content: 'Thông tin rất hữu ích. Mọi người nên cẩn thận với các tin nhắn SMS lạ.',
    voteScore: 3,
    status: 'active',
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now()
  }
];

// Seeding functions
async function seedUsers(db) {
  log('👥 Seeding users...', 'blue');
  
  const batch = db.batch();
  
  sampleUsers.forEach(user => {
    const userRef = db.collection('users').doc(user.id);
    batch.set(userRef, user);
  });
  
  await batch.commit();
  log(`   ✅ Seeded ${sampleUsers.length} users`, 'green');
}

async function seedPosts(db) {
  log('📝 Seeding posts...', 'blue');
  
  const batch = db.batch();
  
  samplePosts.forEach(post => {
    const postRef = db.collection('posts').doc(post.id);
    batch.set(postRef, post);
  });
  
  await batch.commit();
  log(`   ✅ Seeded ${samplePosts.length} posts`, 'green');
}

async function seedVotes(db) {
  log('🗳️ Seeding votes...', 'blue');
  
  const batch = db.batch();
  
  sampleVotes.forEach(vote => {
    const voteRef = db.collection('votes').doc();
    batch.set(voteRef, vote);
  });
  
  await batch.commit();
  log(`   ✅ Seeded ${sampleVotes.length} votes`, 'green');
}

async function seedComments(db) {
  log('💬 Seeding comments...', 'blue');
  
  const batch = db.batch();
  
  sampleComments.forEach(comment => {
    const commentRef = db.collection('comments').doc();
    batch.set(commentRef, comment);
  });
  
  await batch.commit();
  log(`   ✅ Seeded ${sampleComments.length} comments`, 'green');
}

// Main seeding function
async function seedDatabase() {
  log('🌱 Starting Database Seeding', 'cyan');
  log('==============================', 'cyan');
  
  const db = initializeFirebase();
  
  try {
    await seedUsers(db);
    await seedPosts(db);
    await seedVotes(db);
    await seedComments(db);
    
    log('', 'reset');
    log('🎉 Database seeding completed successfully!', 'green');
    log('==============================', 'green');
    log('📋 Seeded data:', 'cyan');
    log(`   - ${sampleUsers.length} users`, 'cyan');
    log(`   - ${samplePosts.length} posts`, 'cyan');
    log(`   - ${sampleVotes.length} votes`, 'cyan');
    log(`   - ${sampleComments.length} comments`, 'cyan');
    log('', 'reset');
    log('🔗 View data at: http://127.0.0.1:4000/firestore', 'cyan');
    
  } catch (error) {
    log('', 'reset');
    log('❌ Database seeding failed!', 'red');
    log(`Error: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Handle command line arguments
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    log('🌱 Database Seeding Script', 'cyan');
    log('Usage: node scripts/seed-database.js [options]', 'cyan');
    log('', 'reset');
    log('Options:', 'cyan');
    log('  --help, -h     Show this help message', 'cyan');
    log('', 'reset');
    log('Environment Variables:', 'cyan');
    log('  FIRESTORE_EMULATOR_HOST  Use Firestore emulator (default: localhost:8080)', 'cyan');
    process.exit(0);
  }
  
  seedDatabase();
}

module.exports = {
  seedDatabase,
  seedUsers,
  seedPosts,
  seedVotes,
  seedComments
};
