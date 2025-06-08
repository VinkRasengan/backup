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

async function createTestComments() {
  console.log('🔥 Creating test comments in Firestore...\n');

  const testComments = [
    // Comments for different linkIds that might exist in community posts
    {
      linkId: '1',
      userId: 'user1',
      content: 'Bài viết rất hữu ích, cảm ơn bạn đã chia sẻ!',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      linkId: '1',
      userId: 'user2', 
      content: 'Tôi cũng gặp vấn đề tương tự, cảm ơn thông tin này.',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      linkId: '2',
      userId: 'user1',
      content: 'Thông tin này cần được cập nhật thêm.',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      linkId: 'article-1',
      userId: 'user3',
      content: 'Bài viết hay, đã chia sẻ cho bạn bè.',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      linkId: 'article-2',
      userId: 'user2',
      content: 'Cần thêm nguồn tham khảo cho bài viết này.',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      linkId: 'news-1',
      userId: 'user1',
      content: 'Tin tức này đã được xác minh chưa?',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }
  ];

  // Create test users first
  const testUsers = [
    {
      id: 'user1',
      email: 'user1@example.com',
      displayName: 'Nguyễn Văn A',
      firstName: 'Nguyễn Văn A'
    },
    {
      id: 'user2', 
      email: 'user2@example.com',
      displayName: 'Trần Thị B',
      firstName: 'Trần Thị B'
    },
    {
      id: 'user3',
      email: 'user3@example.com', 
      displayName: 'Lê Văn C',
      firstName: 'Lê Văn C'
    }
  ];

  try {
    // Create users
    console.log('👥 Creating test users...');
    for (const user of testUsers) {
      await db.collection('users').doc(user.id).set(user);
      console.log(`✅ Created user: ${user.displayName}`);
    }

    // Create comments
    console.log('\n💬 Creating test comments...');
    for (const comment of testComments) {
      const docRef = await db.collection('comments').add(comment);
      console.log(`✅ Created comment for linkId "${comment.linkId}": ${docRef.id}`);
    }

    console.log('\n🎉 All test data created successfully!');
    
    // List all comments by linkId
    console.log('\n📊 Comments summary:');
    const commentsSnapshot = await db.collection('comments').get();
    const commentsByLink = {};
    
    commentsSnapshot.forEach(doc => {
      const data = doc.data();
      if (!commentsByLink[data.linkId]) {
        commentsByLink[data.linkId] = 0;
      }
      commentsByLink[data.linkId]++;
    });
    
    Object.entries(commentsByLink).forEach(([linkId, count]) => {
      console.log(`   LinkId "${linkId}": ${count} comments`);
    });

  } catch (error) {
    console.error('❌ Error creating test data:', error);
  }
}

createTestComments().then(() => {
  console.log('\n✅ Script completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
