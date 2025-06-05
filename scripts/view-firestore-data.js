#!/usr/bin/env node

/**
 * Firestore Data Viewer Script
 * This script displays current data in Firestore collections
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '../server/serviceAccountKey.json');

try {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('🔗 Connected to Production Firestore');
} catch (error) {
  console.log('🧪 Using emulator mode...');
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8084';
  admin.initializeApp({
    projectId: 'factcheck-platform'
  });
}

const db = admin.firestore();

// Collections to check
const collections = {
  USERS: 'users',
  LINKS: 'links',
  VOTES: 'votes',
  COMMENTS: 'comments',
  REPORTS: 'reports',
  ADMIN_NOTIFICATIONS: 'admin_notifications',
  CONVERSATIONS: 'conversations',
  CHAT_MESSAGES: 'chat_messages',
  VERIFICATION_TOKENS: 'verification_tokens',
  PASSWORD_RESET_TOKENS: 'password_reset_tokens'
};

async function viewCollectionData(collectionName, limit = 5) {
  try {
    const snapshot = await db.collection(collectionName)
      .limit(limit)
      .get();

    if (snapshot.empty) {
      console.log(`   📭 Empty collection`);
      return { count: 0, docs: [] };
    }

    const docs = [];
    snapshot.forEach(doc => {
      docs.push({
        id: doc.id,
        data: doc.data()
      });
    });

    console.log(`   📊 ${snapshot.size} documents (showing first ${Math.min(limit, snapshot.size)}):`);
    
    docs.forEach((doc, index) => {
      console.log(`   ${index + 1}. ID: ${doc.id}`);
      
      // Show key fields based on collection type
      const data = doc.data;
      switch (collectionName) {
        case 'users':
          console.log(`      📧 Email: ${data.email}`);
          console.log(`      👤 Name: ${data.firstName} ${data.lastName}`);
          console.log(`      🔐 Role: ${data.role}`);
          console.log(`      ✅ Verified: ${data.isVerified}`);
          break;
          
        case 'links':
          console.log(`      🔗 URL: ${data.url}`);
          console.log(`      📰 Title: ${data.title || 'No title'}`);
          console.log(`      📊 Score: ${data.credibilityScore}`);
          if (data.communityStats) {
            console.log(`      🗳️  Votes: ${data.communityStats.totalVotes || 0}`);
            console.log(`      💬 Comments: ${data.communityStats.totalComments || 0}`);
            console.log(`      📋 Reports: ${data.communityStats.totalReports || 0}`);
          }
          break;
          
        case 'votes':
          console.log(`      🔗 Link: ${data.linkId}`);
          console.log(`      👤 User: ${data.userId}`);
          console.log(`      🗳️  Type: ${data.voteType}`);
          console.log(`      📅 Created: ${data.createdAt}`);
          break;
          
        case 'comments':
          console.log(`      🔗 Link: ${data.linkId}`);
          console.log(`      👤 Author: ${data.author?.firstName} ${data.author?.lastName}`);
          console.log(`      💬 Content: ${data.content?.substring(0, 50)}...`);
          console.log(`      📅 Created: ${data.createdAt}`);
          break;
          
        case 'reports':
          console.log(`      🔗 Link: ${data.linkId}`);
          console.log(`      📂 Category: ${data.category}`);
          console.log(`      📝 Status: ${data.status}`);
          console.log(`      👤 Reporter: ${data.reporter?.firstName} ${data.reporter?.lastName}`);
          console.log(`      📅 Created: ${data.createdAt}`);
          break;
          
        case 'admin_notifications':
          console.log(`      🔔 Type: ${data.type}`);
          console.log(`      📨 Message: ${data.message}`);
          console.log(`      👁️  Read: ${data.isRead}`);
          console.log(`      📅 Created: ${data.createdAt}`);
          break;
          
        case 'conversations':
          console.log(`      👤 User: ${data.userId}`);
          console.log(`      📰 Title: ${data.title}`);
          console.log(`      📅 Created: ${data.createdAt}`);
          break;
          
        case 'chat_messages':
          console.log(`      💬 Conversation: ${data.conversationId}`);
          console.log(`      👤 Sender: ${data.sender}`);
          console.log(`      📝 Message: ${data.message?.substring(0, 50)}...`);
          console.log(`      📅 Created: ${data.createdAt}`);
          break;
          
        default:
          // Show first few fields for unknown collections
          const keys = Object.keys(data).slice(0, 3);
          keys.forEach(key => {
            let value = data[key];
            if (typeof value === 'string' && value.length > 50) {
              value = value.substring(0, 50) + '...';
            }
            console.log(`      ${key}: ${value}`);
          });
      }
      console.log('');
    });

    // Get total count
    const totalSnapshot = await db.collection(collectionName).get();
    return { count: totalSnapshot.size, docs };

  } catch (error) {
    console.log(`   ❌ Error reading collection: ${error.message}`);
    return { count: 0, docs: [] };
  }
}

async function viewFirestoreData() {
  console.log('🔍 Viewing Firestore Data...\n');

  const summary = {};

  for (const [key, collectionName] of Object.entries(collections)) {
    console.log(`📁 Collection: ${collectionName}`);
    const result = await viewCollectionData(collectionName);
    summary[collectionName] = result.count;
    console.log('─'.repeat(60));
  }

  // Summary
  console.log('\n📊 SUMMARY:');
  console.log('═'.repeat(40));
  
  let totalDocs = 0;
  Object.entries(summary).forEach(([collection, count]) => {
    console.log(`${collection.padEnd(25)} : ${count.toString().padStart(5)} docs`);
    totalDocs += count;
  });
  
  console.log('─'.repeat(40));
  console.log(`${'TOTAL'.padEnd(25)} : ${totalDocs.toString().padStart(5)} docs`);
  
  // Check if Sprint 2 collections exist
  console.log('\n🚀 Sprint 2 Readiness:');
  console.log('═'.repeat(40));
  
  const sprint2Collections = ['votes', 'comments', 'reports', 'admin_notifications'];
  let readyCount = 0;
  
  sprint2Collections.forEach(collection => {
    const exists = summary[collection] !== undefined;
    const hasData = summary[collection] > 0;
    const status = exists ? (hasData ? '✅ Ready' : '⚠️  Empty') : '❌ Missing';
    console.log(`${collection.padEnd(20)} : ${status}`);
    if (exists) readyCount++;
  });
  
  console.log('─'.repeat(40));
  console.log(`Sprint 2 Progress: ${readyCount}/${sprint2Collections.length} collections ready`);
  
  if (readyCount === sprint2Collections.length) {
    console.log('\n🎉 All Sprint 2 collections are ready!');
  } else {
    console.log('\n⚠️  Some Sprint 2 collections are missing. Run initialization:');
    console.log('   npm run firestore:init');
  }
}

// Add command line options
const args = process.argv.slice(2);
const showHelp = args.includes('--help') || args.includes('-h');
const collectionName = args.find(arg => !arg.startsWith('--'));
const limit = parseInt(args.find(arg => arg.startsWith('--limit='))?.split('=')[1]) || 5;

if (showHelp) {
  console.log(`
🔍 Firestore Data Viewer

Usage:
  node view-firestore-data.js [collection] [options]

Examples:
  node view-firestore-data.js                    # View all collections
  node view-firestore-data.js users              # View users collection
  node view-firestore-data.js votes --limit=10   # View 10 votes

Options:
  --limit=N     Number of documents to show per collection (default: 5)
  --help, -h    Show this help message

Collections:
  users, links, votes, comments, reports, admin_notifications,
  conversations, chat_messages, verification_tokens, password_reset_tokens
`);
  process.exit(0);
}

// Run the viewer
if (require.main === module) {
  if (collectionName && Object.values(collections).includes(collectionName)) {
    // View specific collection
    console.log(`🔍 Viewing collection: ${collectionName}\n`);
    viewCollectionData(collectionName, limit)
      .then(() => process.exit(0))
      .catch(error => {
        console.error('❌ Error:', error);
        process.exit(1);
      });
  } else if (collectionName) {
    console.error(`❌ Unknown collection: ${collectionName}`);
    console.log('Available collections:', Object.values(collections).join(', '));
    process.exit(1);
  } else {
    // View all collections
    viewFirestoreData()
      .then(() => process.exit(0))
      .catch(error => {
        console.error('❌ Error:', error);
        process.exit(1);
      });
  }
}

module.exports = { viewFirestoreData, viewCollectionData };
