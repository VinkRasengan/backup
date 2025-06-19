// Create mock comments in Firestore
const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase Admin using environment variables
try {
  if (!admin.apps.length) {
    const serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID
    });

    console.log('🔥 Firebase Admin initialized for production');
  }
} catch (error) {
  console.error('❌ Firebase Admin initialization failed:', error.message);
  process.exit(1);
}

const db = admin.firestore();

// Mock comments data
const mockComments = [
  {
    postId: 'mgCwAo4AzPW0l7o6Ufrx',
    content: 'Tôi đã kiểm tra nguồn gốc của thông tin này và thấy nó không có căn cứ khoa học. Đây rõ ràng là tin giả.',
    author: {
      uid: 'user1',
      email: 'nguyen.vana@example.com',
      displayName: 'Nguyễn Văn A',
      photoURL: null
    },
    parentId: null,
    voteStats: { upvotes: 5, downvotes: 1, total: 6, score: 4 },
    voteScore: 4,
    replyCount: 0,
    status: 'active',
    isEdited: false,
    editHistory: [],
    createdAt: new Date(Date.now() - 3600000), // 1 hour ago
    updatedAt: new Date(Date.now() - 3600000)
  },
  {
    postId: 'mgCwAo4AzPW0l7o6Ufrx',
    content: 'Cảm ơn bạn đã chia sẻ. Mọi người nên kiểm tra thông tin từ các nguồn y tế chính thức trước khi tin.',
    author: {
      uid: 'user2',
      email: 'tran.thib@example.com',
      displayName: 'Trần Thị B',
      photoURL: null
    },
    parentId: null,
    voteStats: { upvotes: 8, downvotes: 0, total: 8, score: 8 },
    voteScore: 8,
    replyCount: 0,
    status: 'active',
    isEdited: false,
    editHistory: [],
    createdAt: new Date(Date.now() - 1800000), // 30 minutes ago
    updatedAt: new Date(Date.now() - 1800000)
  },
  {
    postId: 'mgCwAo4AzPW0l7o6Ufrx',
    content: 'Bài viết này có vẻ đáng ngờ. Tôi đã tìm hiểu và không thấy bằng chứng nào ủng hộ.',
    author: {
      uid: 'user3',
      email: 'le.vanc@example.com',
      displayName: 'Lê Văn C',
      photoURL: null
    },
    parentId: null,
    voteStats: { upvotes: 3, downvotes: 2, total: 5, score: 1 },
    voteScore: 1,
    replyCount: 0,
    status: 'active',
    isEdited: false,
    editHistory: [],
    createdAt: new Date(Date.now() - 900000), // 15 minutes ago
    updatedAt: new Date(Date.now() - 900000)
  },
  {
    postId: 'test-post-2',
    content: 'Bài viết rất hữu ích! Tôi đã áp dụng những mẹo này và tránh được một website lừa đảo.',
    author: {
      uid: 'user4',
      email: 'pham.thid@example.com',
      displayName: 'Phạm Thị D',
      photoURL: null
    },
    parentId: null,
    voteStats: { upvotes: 12, downvotes: 1, total: 13, score: 11 },
    voteScore: 11,
    replyCount: 0,
    status: 'active',
    isEdited: false,
    editHistory: [],
    createdAt: new Date(Date.now() - 7200000), // 2 hours ago
    updatedAt: new Date(Date.now() - 7200000)
  },
  {
    postId: 'test-post-2',
    content: 'Cảm ơn tác giả! Những thông tin này rất cần thiết trong thời đại số.',
    author: {
      uid: 'user5',
      email: 'hoang.vane@example.com',
      displayName: 'Hoàng Văn E',
      photoURL: null
    },
    parentId: null,
    voteStats: { upvotes: 7, downvotes: 0, total: 7, score: 7 },
    voteScore: 7,
    replyCount: 0,
    status: 'active',
    isEdited: false,
    editHistory: [],
    createdAt: new Date(Date.now() - 5400000), // 1.5 hours ago
    updatedAt: new Date(Date.now() - 5400000)
  }
];

async function createMockComments() {
  console.log('🚀 Creating mock comments in Firestore...');
  
  try {
    const batch = db.batch();
    
    for (const comment of mockComments) {
      const commentRef = db.collection('comments').doc();
      batch.set(commentRef, comment);
      console.log(`📝 Adding comment: ${comment.content.substring(0, 50)}...`);
    }
    
    await batch.commit();
    console.log('✅ Mock comments created successfully!');
    
    // Update post comment counts
    console.log('📊 Updating post comment counts...');
    
    const postIds = [...new Set(mockComments.map(c => c.postId))];
    
    for (const postId of postIds) {
      const commentsCount = mockComments.filter(c => c.postId === postId).length;
      
      // Try to update in posts collection
      const postsQuery = await db.collection('posts').where('id', '==', postId).get();
      if (!postsQuery.empty) {
        await postsQuery.docs[0].ref.update({ commentCount: commentsCount });
        console.log(`📊 Updated post ${postId} comment count: ${commentsCount}`);
      } else {
        console.log(`⚠️ Post ${postId} not found in posts collection`);
      }
    }
    
    console.log('🎉 All done! Mock comments and counts updated.');
    
  } catch (error) {
    console.error('❌ Error creating mock comments:', error);
  } finally {
    process.exit(0);
  }
}

// Run the script
createMockComments();
