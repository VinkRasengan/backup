const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert({
    type: 'service_account',
    project_id: process.env.FIREBASE_PROJECT_ID,
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  }),
  projectId: process.env.FIREBASE_PROJECT_ID
});

const db = admin.firestore();

async function fixProblematicLinks() {
  console.log('🔧 Fixing problematic links...\n');

  try {
    // Get all links to check
    const linksSnapshot = await db.collection('links').get();
    console.log(`📊 Total links: ${linksSnapshot.size}`);

    let fixed = 0;
    const batch = db.batch();

    linksSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const updates = {};

      // Fix missing type
      if (!data.type) {
        updates.type = 'user_post';
        console.log(`🔧 Adding type to ${doc.id}`);
      }

      // Fix missing author
      if (!data.author || !data.author.displayName) {
        updates.author = {
          uid: data.author?.uid || 'anonymous',
          email: data.author?.email || 'anonymous@example.com',
          displayName: data.author?.displayName || 'Người dùng ẩn danh'
        };
        console.log(`🔧 Fixing author for ${doc.id}`);
      }

      // Fix missing voteStats format
      if (data.voteStats && (!data.voteStats.upvotes && !data.voteStats.downvotes)) {
        // Convert old format to new format
        updates.voteStats = {
          upvotes: data.voteStats.safe || data.voteStats.upvotes || 0,
          downvotes: data.voteStats.unsafe || data.voteStats.downvotes || 0,
          total: data.voteStats.total || 0,
          score: data.voteStats.score || 0,
          // Keep old fields for compatibility
          safe: data.voteStats.safe || 0,
          unsafe: data.voteStats.unsafe || 0,
          suspicious: data.voteStats.suspicious || 0
        };
        console.log(`🔧 Updating voteStats format for ${doc.id}`);
      }

      // Fix missing content
      if (!data.content && data.description) {
        updates.content = data.description;
        console.log(`🔧 Moving description to content for ${doc.id}`);
      }

      // Add missing fields for frontend compatibility
      if (!data.commentCount) {
        updates.commentCount = 0;
      }
      if (!data.viewCount) {
        updates.viewCount = 0;
      }
      if (!data.verified) {
        updates.verified = false;
      }

      if (Object.keys(updates).length > 0) {
        batch.update(doc.ref, updates);
        fixed++;
      }
    });

    if (fixed > 0) {
      await batch.commit();
      console.log(`✅ Fixed ${fixed} documents`);
    } else {
      console.log('✅ All documents are already properly formatted');
    }

    // Show final state
    console.log('\n📋 Updated links summary:');
    const updatedSnapshot = await db.collection('links').limit(10).get();
    updatedSnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`${index + 1}. ${doc.id}`);
      console.log(`   Title: ${data.title}`);
      console.log(`   Type: ${data.type}`);
      console.log(`   Author: ${data.author?.displayName}`);
      console.log(`   VoteStats: ${JSON.stringify(data.voteStats)}`);
      console.log(`   Images: imageUrl=${!!data.imageUrl}, screenshot=${!!data.screenshot}, images=${Array.isArray(data.images) ? data.images.length : 0}`);
      console.log('   ---');
    });

  } catch (error) {
    console.error('❌ Error fixing links:', error.message);
  }
  
  process.exit(0);
}

fixProblematicLinks();
