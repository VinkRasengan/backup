const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase Admin (using environment variables)
if (admin.apps.length === 0) {
  const serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
  };
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID
  });
}

const db = admin.firestore();

async function debugCommunityData() {
  console.log('🔍 Debugging Community Posts and Comments...\n');

  try {
    // 1. Check community posts
    console.log('📰 Community Posts:');
    const postsSnapshot = await db.collection('community_posts').limit(10).get();
    
    if (postsSnapshot.empty) {
      console.log('   No community posts found in Firestore');
    } else {
      postsSnapshot.forEach((doc, index) => {
        const data = doc.data();
        console.log(`   Post ${index + 1}:`);
        console.log(`     ID: "${doc.id}"`);
        console.log(`     Title: "${data.title || 'No title'}"`);
        console.log(`     URL: "${data.url || 'No URL'}"`);
        console.log(`     Created: ${data.createdAt?.toDate?.() || 'No date'}`);
        console.log('');
      });
    }

    // 2. Check links collection (might be used for community)
    console.log('🔗 Links Collection:');
    const linksSnapshot = await db.collection('links').limit(10).get();
    
    if (linksSnapshot.empty) {
      console.log('   No links found in Firestore');
    } else {
      linksSnapshot.forEach((doc, index) => {
        const data = doc.data();
        console.log(`   Link ${index + 1}:`);
        console.log(`     ID: "${doc.id}"`);
        console.log(`     URL: "${data.url || 'No URL'}"`);
        console.log(`     Title: "${data.title || 'No title'}"`);
        console.log(`     Status: "${data.status || 'No status'}"`);
        console.log('');
      });
    }

    // 3. Check all collections
    console.log('📚 All Collections:');
    const collections = await db.listCollections();
    collections.forEach(collection => {
      console.log(`   - ${collection.id}`);
    });

    // 4. Check comments and their linkIds
    console.log('\n💬 Comments by LinkId:');
    const commentsSnapshot = await db.collection('comments').get();
    const commentsByLink = {};
    
    commentsSnapshot.forEach(doc => {
      const data = doc.data();
      if (!commentsByLink[data.linkId]) {
        commentsByLink[data.linkId] = [];
      }
      commentsByLink[data.linkId].push({
        id: doc.id,
        content: data.content,
        userId: data.userId
      });
    });
    
    Object.entries(commentsByLink).forEach(([linkId, comments]) => {
      console.log(`   LinkId "${linkId}": ${comments.length} comments`);
      comments.forEach((comment, index) => {
        console.log(`     ${index + 1}. "${comment.content}" (by ${comment.userId})`);
      });
      console.log('');
    });

    // 5. Create comments for actual post IDs if they exist
    if (!postsSnapshot.empty) {
      console.log('🔧 Creating comments for actual post IDs...');
      const actualPostIds = [];
      postsSnapshot.forEach(doc => {
        actualPostIds.push(doc.id);
      });

      for (const postId of actualPostIds.slice(0, 3)) { // Only first 3 posts
        const testComment = {
          linkId: postId,
          userId: 'user1',
          content: `Test comment for actual post ID: ${postId}`,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await db.collection('comments').add(testComment);
        console.log(`   ✅ Created comment for post "${postId}": ${docRef.id}`);
      }
    }

  } catch (error) {
    console.error('❌ Error debugging community data:', error);
  }
}

debugCommunityData().then(() => {
  console.log('\n✅ Debug completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Debug failed:', error);
  process.exit(1);
});
