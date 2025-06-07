// Simple seed script for Firestore data
require('dotenv').config({ path: '../.env' });

console.log('🌱 Starting Firestore data seeding...');

const admin = require('firebase-admin');

// Initialize Firebase Admin
function initializeFirebase() {
  if (!admin.apps.length) {
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    };

    console.log('📋 Firebase config:', {
      projectId: serviceAccount.projectId,
      clientEmail: serviceAccount.clientEmail,
      hasPrivateKey: !!serviceAccount.privateKey
    });

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID
    });
  }
  return admin.firestore();
}

// Sample data
const sampleUsers = [
  {
    id: 'user1',
    email: 'admin@factcheck.com',
    displayName: 'Admin User',
    firstName: 'Admin',
    lastName: 'User',
    isVerified: true,
    authProvider: 'backend',
    bio: 'System administrator and security expert',
    avatarUrl: 'https://ui-avatars.com/api/?name=Admin+User&background=0d47a1&color=fff',
    stats: { linksChecked: 25, chatMessages: 50 },
    createdAt: admin.firestore.Timestamp.now(),
    lastLoginAt: admin.firestore.Timestamp.now()
  },
  {
    id: 'user2', 
    email: 'expert@factcheck.com',
    displayName: 'Security Expert',
    firstName: 'Security',
    lastName: 'Expert',
    isVerified: true,
    authProvider: 'firebase',
    bio: 'Cybersecurity specialist with 10+ years experience',
    avatarUrl: 'https://ui-avatars.com/api/?name=Security+Expert&background=1976d2&color=fff',
    stats: { linksChecked: 45, chatMessages: 30 },
    createdAt: admin.firestore.Timestamp.now(),
    lastLoginAt: admin.firestore.Timestamp.now()
  }
];

const sampleLinks = [
  {
    id: 'link1',
    url: 'https://example-safe-banking.com',
    title: 'Legitimate Banking Website',
    description: 'Official website of a trusted bank with proper SSL and security measures',
    status: 'safe',
    scanResults: {
      virusTotal: { positives: 0, total: 70, scanDate: new Date().toISOString() },
      sslCheck: { valid: true, issuer: 'DigiCert Inc', expiryDate: '2025-12-31' },
      domainAge: { years: 15, trustScore: 95 }
    },
    submittedBy: 'user1',
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now()
  },
  {
    id: 'link2',
    url: 'https://suspicious-crypto-investment.fake',
    title: 'Suspicious Crypto Investment Site',
    description: 'Website promising unrealistic returns on cryptocurrency investments',
    status: 'suspicious',
    scanResults: {
      virusTotal: { positives: 3, total: 70, scanDate: new Date().toISOString() },
      sslCheck: { valid: false, error: 'Self-signed certificate' },
      domainAge: { days: 30, trustScore: 25 }
    },
    submittedBy: 'user2',
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now()
  }
];

const sampleVotes = [
  { id: 'vote1', linkId: 'link1', userId: 'user2', voteType: 'safe', createdAt: admin.firestore.Timestamp.now() },
  { id: 'vote2', linkId: 'link2', userId: 'user1', voteType: 'suspicious', createdAt: admin.firestore.Timestamp.now() }
];

async function seedData() {
  try {
    const db = initializeFirebase();
    console.log('✅ Firebase initialized');

    // Seed Users
    console.log('👥 Creating users...');
    for (const user of sampleUsers) {
      await db.collection('users').doc(user.id).set(user);
      console.log(`✅ Created user: ${user.displayName}`);
    }

    // Seed Links
    console.log('🔗 Creating community posts...');
    for (const link of sampleLinks) {
      await db.collection('links').doc(link.id).set(link);
      console.log(`✅ Created link: ${link.title}`);
    }

    // Seed Votes
    console.log('🗳️ Creating votes...');
    for (const vote of sampleVotes) {
      await db.collection('votes').doc(vote.id).set(vote);
      console.log(`✅ Created vote: ${vote.id}`);
    }

    console.log('\n🎉 Data seeding completed successfully!');
    console.log(`- Users: ${sampleUsers.length}`);
    console.log(`- Links: ${sampleLinks.length}`);
    console.log(`- Votes: ${sampleVotes.length}`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedData();
