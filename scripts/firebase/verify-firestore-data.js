#!/usr/bin/env node

/**
 * Firestore Data Verification Script
 * Verifies all seeded data and displays statistics
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
function initializeFirebase() {
  if (!admin.apps.length) {
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID
    });
  }
  return admin.firestore();
}

async function verifyData() {
  console.log('🔍 Verifying Firestore data...');
  
  try {
    const db = initializeFirebase();
    console.log('✅ Firebase connected');

    // Check Users
    console.log('\n👥 Users Collection:');
    const usersSnapshot = await db.collection('users').get();
    console.log(`📊 Total users: ${usersSnapshot.size}`);
    
    usersSnapshot.forEach(doc => {
      const user = doc.data();
      console.log(`  - ${user.displayName} (${user.email}) - ${user.authProvider}`);
    });

    // Check Links (Community Posts)
    console.log('\n🔗 Links Collection:');
    const linksSnapshot = await db.collection('links').get();
    console.log(`📊 Total links: ${linksSnapshot.size}`);
    
    const statusCounts = { safe: 0, suspicious: 0, unsafe: 0 };
    linksSnapshot.forEach(doc => {
      const link = doc.data();
      statusCounts[link.status]++;
      console.log(`  - ${link.title} (${link.status})`);
    });
    
    console.log(`📈 Status breakdown: Safe: ${statusCounts.safe}, Suspicious: ${statusCounts.suspicious}, Unsafe: ${statusCounts.unsafe}`);

    // Check Votes
    console.log('\n🗳️ Votes Collection:');
    const votesSnapshot = await db.collection('votes').get();
    console.log(`📊 Total votes: ${votesSnapshot.size}`);
    
    const voteCounts = { safe: 0, suspicious: 0, unsafe: 0 };
    votesSnapshot.forEach(doc => {
      const vote = doc.data();
      voteCounts[vote.voteType]++;
    });
    
    console.log(`📈 Vote breakdown: Safe: ${voteCounts.safe}, Suspicious: ${voteCounts.suspicious}, Unsafe: ${voteCounts.unsafe}`);

    // Check Comments
    console.log('\n💬 Comments Collection:');
    const commentsSnapshot = await db.collection('comments').get();
    console.log(`📊 Total comments: ${commentsSnapshot.size}`);
    
    commentsSnapshot.forEach(doc => {
      const comment = doc.data();
      console.log(`  - Comment on ${comment.linkId}: "${comment.content.substring(0, 50)}..."`);
    });

    // Check Conversations
    console.log('\n🗨️ Conversations Collection:');
    const conversationsSnapshot = await db.collection('conversations').get();
    console.log(`📊 Total conversations: ${conversationsSnapshot.size}`);
    
    conversationsSnapshot.forEach(doc => {
      const conversation = doc.data();
      console.log(`  - ${conversation.title} (User: ${conversation.userId})`);
    });

    // Check Chat Messages
    console.log('\n📝 Chat Messages Collection:');
    const messagesSnapshot = await db.collection('chat_messages').get();
    console.log(`📊 Total messages: ${messagesSnapshot.size}`);
    
    const messageCounts = { user: 0, assistant: 0 };
    messagesSnapshot.forEach(doc => {
      const message = doc.data();
      messageCounts[message.role]++;
    });
    
    console.log(`📈 Message breakdown: User: ${messageCounts.user}, Assistant: ${messageCounts.assistant}`);

    // Summary
    console.log('\n🎯 Data Verification Summary:');
    console.log('================================');
    console.log(`✅ Users: ${usersSnapshot.size}`);
    console.log(`✅ Community Posts: ${linksSnapshot.size}`);
    console.log(`✅ Votes: ${votesSnapshot.size}`);
    console.log(`✅ Comments: ${commentsSnapshot.size}`);
    console.log(`✅ Conversations: ${conversationsSnapshot.size}`);
    console.log(`✅ Chat Messages: ${messagesSnapshot.size}`);
    
    console.log('\n🌐 Test URLs:');
    console.log('- Community API: https://factcheck-backend.onrender.com/api/community/posts');
    console.log('- Community Stats: https://factcheck-backend.onrender.com/api/community/stats');
    console.log('- Health Check: https://factcheck-backend.onrender.com/health');
    
    console.log('\n🎉 All data verified successfully!');
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  }
}

async function clearAllData() {
  console.log('🗑️ Clearing all Firestore data...');
  
  try {
    const db = initializeFirebase();
    
    const collections = ['users', 'links', 'votes', 'comments', 'conversations', 'chat_messages'];
    
    for (const collectionName of collections) {
      console.log(`🧹 Clearing ${collectionName}...`);
      const snapshot = await db.collection(collectionName).get();
      
      const batch = db.batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      console.log(`✅ Cleared ${snapshot.size} documents from ${collectionName}`);
    }
    
    console.log('🎉 All data cleared successfully!');
    
  } catch (error) {
    console.error('❌ Clear failed:', error);
    process.exit(1);
  }
}

// Command line interface
const command = process.argv[2];

if (command === 'clear') {
  clearAllData();
} else {
  verifyData();
}

module.exports = { verifyData, clearAllData };
