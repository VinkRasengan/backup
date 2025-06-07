#!/usr/bin/env node

/**
 * Simple Firestore Data Seeding Script
 * Creates sample data for FactCheck features
 */

require('dotenv').config();
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

// Sample data
const sampleUsers = [
  {
    id: 'user1',
    email: 'user1@example.com',
    displayName: 'Nguyễn Văn A',
    firstName: 'Nguyễn',
    lastName: 'Văn A',
    role: 'user',
    isVerified: true,
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now()
  },
  {
    id: 'user2',
    email: 'user2@example.com',
    displayName: 'Trần Thị B',
    firstName: 'Trần',
    lastName: 'Thị B',
    role: 'user',
    isVerified: true,
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now()
  }
];

const sampleLinks = [
  {
    id: 'link1',
    url: 'https://vnexpress.net/tin-gia-covid-vaccine',
    title: 'Phát hiện tin giả về vaccine COVID-19 lan truyền trên mạng xã hội',
    description: 'Thông tin sai lệch về tác dụng phụ của vaccine được chia sẻ rộng rãi',
    status: 'suspicious',
    credibilityScore: 25,
    submittedBy: 'user1',
    votes: { safe: 5, suspicious: 15, unsafe: 25 },
    commentsCount: 12,
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now()
  },
  {
    id: 'link2',
    url: 'https://tuoitre.vn/cach-nhan-biet-website-lua-dao',
    title: 'Cách nhận biết website lừa đảo trong mùa mua sắm online',
    description: 'Hướng dẫn chi tiết cách phát hiện và tránh các website lừa đảo',
    status: 'safe',
    credibilityScore: 85,
    submittedBy: 'user2',
    votes: { safe: 35, suspicious: 3, unsafe: 1 },
    commentsCount: 8,
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now()
  },
  {
    id: 'link3',
    url: 'https://example.com/climate-misinformation',
    title: 'Thông tin sai lệch về biến đổi khí hậu được chia sẻ rộng rãi',
    description: 'Các thông tin không chính xác về nguyên nhân biến đổi khí hậu',
    status: 'unsafe',
    credibilityScore: 15,
    submittedBy: 'user1',
    votes: { safe: 2, suspicious: 8, unsafe: 30 },
    commentsCount: 18,
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now()
  }
];

const sampleComments = [
  {
    id: 'comment1',
    linkId: 'link1',
    userId: 'user1',
    content: 'Thông tin này rất đáng ngờ. Tôi đã kiểm tra và không tìm thấy nguồn đáng tin cậy nào.',
    author: { firstName: 'Nguyễn', lastName: 'Văn A' },
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now()
  },
  {
    id: 'comment2',
    linkId: 'link2',
    userId: 'user2',
    content: 'Bài viết rất hữu ích! Cảm ơn tác giả đã chia sẻ.',
    author: { firstName: 'Trần', lastName: 'Thị B' },
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now()
  }
];

const sampleKnowledge = [
  {
    id: 'knowledge1',
    title: 'Cách nhận biết tin giả trên mạng xã hội',
    description: 'Hướng dẫn chi tiết về các dấu hiệu nhận biết tin giả và cách xác minh thông tin.',
    category: 'basics',
    content: `
## Các dấu hiệu nhận biết tin giả

### 1. Kiểm tra nguồn thông tin
- Xem xét độ uy tín của trang web
- Kiểm tra thông tin về tác giả
- Tìm hiểu lịch sử của nguồn tin

### 2. Phân tích nội dung
- Chú ý đến ngôn ngữ cảm xúc quá mức
- Kiểm tra tính logic của thông tin
- So sánh với các nguồn khác

### 3. Xác minh bằng công cụ
- Sử dụng Google Reverse Image Search
- Kiểm tra trên các trang fact-check
- Tìm kiếm thông tin gốc
    `,
    readTime: '5 phút',
    views: 1250,
    featured: true,
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now()
  },
  {
    id: 'knowledge2',
    title: 'Bảo mật thông tin cá nhân trên Internet',
    description: 'Các biện pháp bảo vệ thông tin cá nhân khi sử dụng Internet.',
    category: 'security',
    content: `
## Bảo mật thông tin cá nhân

### 1. Sử dụng mật khẩu mạnh
- Tối thiểu 8 ký tự
- Kết hợp chữ hoa, chữ thường, số và ký tự đặc biệt
- Không sử dụng thông tin cá nhân

### 2. Xác thực hai yếu tố (2FA)
- Kích hoạt 2FA cho các tài khoản quan trọng
- Sử dụng ứng dụng authenticator
- Backup codes an toàn

### 3. Cẩn thận với thông tin chia sẻ
- Hạn chế thông tin cá nhân trên mạng xã hội
- Kiểm tra cài đặt riêng tư
- Không chia sẻ thông tin nhạy cảm
    `,
    readTime: '7 phút',
    views: 890,
    featured: false,
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now()
  }
];

async function seedData() {
  console.log('🚀 Starting Firestore data seeding...');

  try {
    const db = initializeFirebase();
    console.log('✅ Firebase initialized');

    // Seed Users
    console.log('👥 Creating users...');
    for (const user of sampleUsers) {
      await db.collection('users').doc(user.id).set(user);
      console.log(`✅ Created user: ${user.displayName}`);
    }

    // Seed Links (Community Posts)
    console.log('🔗 Creating community posts...');
    for (const link of sampleLinks) {
      await db.collection('links').doc(link.id).set(link);
      console.log(`✅ Created link: ${link.title}`);
    }

    // Seed Comments
    console.log('💬 Creating comments...');
    for (const comment of sampleComments) {
      await db.collection('comments').doc(comment.id).set(comment);
      console.log(`✅ Created comment: ${comment.id}`);
    }

    // Seed Knowledge Base
    console.log('📚 Creating knowledge articles...');
    for (const article of sampleKnowledge) {
      await db.collection('knowledge').doc(article.id).set(article);
      console.log(`✅ Created article: ${article.title}`);
    }

    console.log('\n🎉 Data seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Users: ${sampleUsers.length}`);
    console.log(`- Community Posts: ${sampleLinks.length}`);
    console.log(`- Comments: ${sampleComments.length}`);
    console.log(`- Knowledge Articles: ${sampleKnowledge.length}`);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run seeding
if (require.main === module) {
  seedData();
}

module.exports = { seedData };
