#!/usr/bin/env node

/**
 * Firestore Initialization Script for Sprint 2
 * This script initializes Firestore with sample data for testing Sprint 2 features
 */

const admin = require('firebase-admin');
import path from 'path';

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '../server/serviceAccountKey.json');

try {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (error) {
  console.log('Using emulator mode...');
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8084';
  admin.initializeApp({
    projectId: 'factcheck-platform'
  });
}

const db = admin.firestore();

// Collections
const collections = {
  USERS: 'users',
  LINKS: 'links',
  VOTES: 'votes',
  COMMENTS: 'comments',
  REPORTS: 'reports',
  ADMIN_NOTIFICATIONS: 'admin_notifications'
};

// Sample data
const sampleUsers = [
  {
    id: 'admin-user-1',
    email: 'admin@factcheck.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    isVerified: true,
    createdAt: new Date().toISOString(),
    profile: {
      avatar: null,
      bio: 'Platform Administrator'
    }
  },
  {
    id: 'user-1',
    email: 'user1@example.com',
    firstName: 'Nguyen',
    lastName: 'Van A',
    role: 'user',
    isVerified: true,
    createdAt: new Date().toISOString(),
    profile: {
      avatar: null,
      bio: 'Community member'
    }
  },
  {
    id: 'user-2',
    email: 'user2@example.com',
    firstName: 'Tran',
    lastName: 'Thi B',
    role: 'user',
    isVerified: true,
    createdAt: new Date().toISOString(),
    profile: {
      avatar: null,
      bio: 'Active contributor'
    }
  }
];

const sampleLinks = [
  {
    id: 'link-1',
    url: 'https://example.com/news/fake-story',
    title: 'Breaking: Fake News Story for Testing',
    userId: 'user-1',
    credibilityScore: 25,
    checkedAt: new Date().toISOString(),
    communityStats: {
      votes: {
        trusted: 2,
        suspicious: 8,
        untrusted: 15
      },
      totalVotes: 25,
      totalComments: 5,
      totalReports: 3,
      consensus: {
        type: 'untrusted',
        percentage: 60
      },
      lastVoteAt: new Date().toISOString(),
      lastCommentAt: new Date().toISOString(),
      lastReportAt: new Date().toISOString()
    }
  },
  {
    id: 'link-2',
    url: 'https://reliable-news.com/verified-story',
    title: 'Verified News Story from Reliable Source',
    userId: 'user-2',
    credibilityScore: 92,
    checkedAt: new Date().toISOString(),
    communityStats: {
      votes: {
        trusted: 18,
        suspicious: 2,
        untrusted: 1
      },
      totalVotes: 21,
      totalComments: 8,
      totalReports: 0,
      consensus: {
        type: 'trusted',
        percentage: 86
      },
      lastVoteAt: new Date().toISOString(),
      lastCommentAt: new Date().toISOString(),
      lastReportAt: null
    }
  }
];

const sampleVotes = [
  {
    id: 'vote-1',
    linkId: 'link-1',
    userId: 'user-1',
    voteType: 'untrusted',
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    updatedAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'vote-2',
    linkId: 'link-1',
    userId: 'user-2',
    voteType: 'suspicious',
    createdAt: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
    updatedAt: new Date(Date.now() - 43200000).toISOString()
  },
  {
    id: 'vote-3',
    linkId: 'link-2',
    userId: 'user-1',
    voteType: 'trusted',
    createdAt: new Date(Date.now() - 21600000).toISOString(), // 6 hours ago
    updatedAt: new Date(Date.now() - 21600000).toISOString()
  }
];

const sampleComments = [
  {
    id: 'comment-1',
    linkId: 'link-1',
    userId: 'user-1',
    content: 'This looks like misinformation. The source is not credible.',
    author: {
      firstName: 'Nguyen',
      lastName: 'Van A',
      avatar: null
    },
    createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    isEdited: false
  },
  {
    id: 'comment-2',
    linkId: 'link-2',
    userId: 'user-2',
    content: 'Great article! Well-researched and from a reliable source.',
    author: {
      firstName: 'Tran',
      lastName: 'Thi B',
      avatar: null
    },
    createdAt: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
    updatedAt: new Date(Date.now() - 1800000).toISOString(),
    isEdited: false
  }
];

const sampleReports = [
  {
    id: 'report-1',
    linkId: 'link-1',
    userId: 'user-2',
    category: 'fake_news',
    description: 'This article contains false information and misleading claims.',
    status: 'pending',
    reporter: {
      firstName: 'Tran',
      lastName: 'Thi B',
      email: 'user2@example.com'
    },
    linkInfo: {
      url: 'https://example.com/news/fake-story',
      title: 'Breaking: Fake News Story for Testing',
      credibilityScore: 25
    },
    createdAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
    reviewedAt: null,
    reviewedBy: null,
    adminNotes: null
  }
];

const sampleNotifications = [
  {
    id: 'notification-1',
    type: 'new_report',
    reportId: 'report-1',
    linkId: 'link-1',
    category: 'fake_news',
    reporterName: 'Tran Thi B',
    linkUrl: 'https://example.com/news/fake-story',
    message: 'New fake news report submitted',
    isRead: false,
    createdAt: new Date(Date.now() - 7200000).toISOString()
  }
];

async function initializeFirestore() {
  console.log('🚀 Initializing Firestore for Sprint 2...');

  try {
    // Create users
    console.log('📝 Creating sample users...');
    for (const user of sampleUsers) {
      await db.collection(collections.USERS).doc(user.id).set(user);
      console.log(`✅ Created user: ${user.email}`);
    }

    // Create links
    console.log('🔗 Creating sample links...');
    for (const link of sampleLinks) {
      await db.collection(collections.LINKS).doc(link.id).set(link);
      console.log(`✅ Created link: ${link.title}`);
    }

    // Create votes
    console.log('🗳️ Creating sample votes...');
    for (const vote of sampleVotes) {
      await db.collection(collections.VOTES).doc(vote.id).set(vote);
      console.log(`✅ Created vote: ${vote.voteType} for ${vote.linkId}`);
    }

    // Create comments
    console.log('💬 Creating sample comments...');
    for (const comment of sampleComments) {
      await db.collection(collections.COMMENTS).doc(comment.id).set(comment);
      console.log(`✅ Created comment for ${comment.linkId}`);
    }

    // Create reports
    console.log('📋 Creating sample reports...');
    for (const report of sampleReports) {
      await db.collection(collections.REPORTS).doc(report.id).set(report);
      console.log(`✅ Created report: ${report.category}`);
    }

    // Create admin notifications
    console.log('🔔 Creating sample notifications...');
    for (const notification of sampleNotifications) {
      await db.collection(collections.ADMIN_NOTIFICATIONS).doc(notification.id).set(notification);
      console.log(`✅ Created notification: ${notification.type}`);
    }

    console.log('\n🎉 Firestore initialization completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Users: ${sampleUsers.length}`);
    console.log(`   Links: ${sampleLinks.length}`);
    console.log(`   Votes: ${sampleVotes.length}`);
    console.log(`   Comments: ${sampleComments.length}`);
    console.log(`   Reports: ${sampleReports.length}`);
    console.log(`   Notifications: ${sampleNotifications.length}`);

  } catch (error) {
    console.error('❌ Error initializing Firestore:', error);
    process.exit(1);
  }
}

// Run initialization
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  initializeFirestore()
    .then(() => {
      console.log('\n✨ Ready for Sprint 2 testing!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Initialization failed:', error);
      process.exit(1);
    });
}

export default { initializeFirestore };
