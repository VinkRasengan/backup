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

async function createCommentsForRealPosts() {
  console.log('🔥 Creating comments for real post IDs...\n');

  try {
    // Get all links (which are used as community posts)
    const linksSnapshot = await db.collection('links').get();
    
    console.log(`📰 Found ${linksSnapshot.size} posts in links collection`);
    
    const realPostIds = [];
    linksSnapshot.forEach(doc => {
      realPostIds.push({
        id: doc.id,
        title: doc.data().title || 'No title',
        url: doc.data().url || 'No URL'
      });
    });

    // Show all post IDs
    console.log('\n📋 All post IDs:');
    realPostIds.forEach((post, index) => {
      console.log(`   ${index + 1}. ID: "${post.id}" - Title: "${post.title}"`);
    });

    // Create comments for the first 5 posts
    console.log('\n💬 Creating comments for first 5 posts...');
    
    const commentsToCreate = [
      {
        content: 'Bài viết rất hữu ích, cảm ơn bạn đã chia sẻ!',
        userId: 'user1'
      },
      {
        content: 'Tôi cũng gặp vấn đề tương tự, cảm ơn thông tin này.',
        userId: 'user2'
      },
      {
        content: 'Thông tin này rất quan trọng, mọi người nên biết.',
        userId: 'user3'
      }
    ];

    for (let i = 0; i < Math.min(5, realPostIds.length); i++) {
      const post = realPostIds[i];
      
      console.log(`\n📝 Creating comments for post "${post.id}"`);
      
      // Create 2-3 comments for each post
      for (let j = 0; j < commentsToCreate.length; j++) {
        const commentTemplate = commentsToCreate[j];
        
        const comment = {
          linkId: post.id,
          userId: commentTemplate.userId,
          content: `${commentTemplate.content} (Post: ${post.title.substring(0, 30)}...)`,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await db.collection('comments').add(comment);
        console.log(`   ✅ Created comment ${j + 1}: ${docRef.id}`);
      }
    }

    // Summary of all comments
    console.log('\n📊 Final comments summary:');
    const allCommentsSnapshot = await db.collection('comments').get();
    const commentsByLink = {};
    
    allCommentsSnapshot.forEach(doc => {
      const data = doc.data();
      if (!commentsByLink[data.linkId]) {
        commentsByLink[data.linkId] = 0;
      }
      commentsByLink[data.linkId]++;
    });
    
    Object.entries(commentsByLink).forEach(([linkId, count]) => {
      const post = realPostIds.find(p => p.id === linkId);
      const title = post ? post.title.substring(0, 40) : 'Unknown post';
      console.log(`   LinkId "${linkId}": ${count} comments (${title}...)`);
    });

    console.log('\n🎉 Comments created successfully!');

  } catch (error) {
    console.error('❌ Error creating comments:', error);
  }
}

createCommentsForRealPosts().then(() => {
  console.log('\n✅ Script completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
