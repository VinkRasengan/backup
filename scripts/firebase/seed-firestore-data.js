#!/usr/bin/env node

/**
 * Firestore Data Seeding Script
 * Creates sample data for all FactCheck features
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

// Sample Users Data
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
  },
  {
    id: 'user3',
    email: 'community@factcheck.com', 
    displayName: 'Community Member',
    firstName: 'Community',
    lastName: 'Member',
    isVerified: true,
    authProvider: 'firebase',
    bio: 'Active community contributor',
    avatarUrl: 'https://ui-avatars.com/api/?name=Community+Member&background=388e3c&color=fff',
    stats: { linksChecked: 15, chatMessages: 20 },
    createdAt: admin.firestore.Timestamp.now(),
    lastLoginAt: admin.firestore.Timestamp.now()
  }
];

// Sample Links Data (Community Posts)
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
  },
  {
    id: 'link3',
    url: 'https://known-phishing-site.scam',
    title: 'Known Phishing Website',
    description: 'Confirmed phishing site attempting to steal login credentials',
    status: 'unsafe',
    scanResults: {
      virusTotal: { positives: 25, total: 70, scanDate: new Date().toISOString() },
      sslCheck: { valid: false, error: 'Certificate mismatch' },
      domainAge: { days: 7, trustScore: 5 },
      blacklisted: true
    },
    submittedBy: 'user1',
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now()
  },
  {
    id: 'link4',
    url: 'https://legitimate-news-site.com',
    title: 'Trusted News Website',
    description: 'Well-established news organization with verified content',
    status: 'safe',
    scanResults: {
      virusTotal: { positives: 0, total: 70, scanDate: new Date().toISOString() },
      sslCheck: { valid: true, issuer: 'Let\'s Encrypt', expiryDate: '2025-06-15' },
      domainAge: { years: 8, trustScore: 90 }
    },
    submittedBy: 'user3',
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now()
  },
  {
    id: 'link5',
    url: 'https://fake-shopping-deals.scam',
    title: 'Fake Shopping Deals Site',
    description: 'Website offering too-good-to-be-true deals on popular products',
    status: 'unsafe',
    scanResults: {
      virusTotal: { positives: 15, total: 70, scanDate: new Date().toISOString() },
      sslCheck: { valid: true, issuer: 'Unknown CA', suspicious: true },
      domainAge: { days: 14, trustScore: 10 }
    },
    submittedBy: 'user2',
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now()
  }
];

// Sample Votes Data
const sampleVotes = [
  { id: 'vote1', linkId: 'link1', userId: 'user2', voteType: 'safe', createdAt: admin.firestore.Timestamp.now() },
  { id: 'vote2', linkId: 'link1', userId: 'user3', voteType: 'safe', createdAt: admin.firestore.Timestamp.now() },
  { id: 'vote3', linkId: 'link2', userId: 'user1', voteType: 'suspicious', createdAt: admin.firestore.Timestamp.now() },
  { id: 'vote4', linkId: 'link2', userId: 'user3', voteType: 'unsafe', createdAt: admin.firestore.Timestamp.now() },
  { id: 'vote5', linkId: 'link3', userId: 'user1', voteType: 'unsafe', createdAt: admin.firestore.Timestamp.now() },
  { id: 'vote6', linkId: 'link3', userId: 'user2', voteType: 'unsafe', createdAt: admin.firestore.Timestamp.now() },
  { id: 'vote7', linkId: 'link4', userId: 'user2', voteType: 'safe', createdAt: admin.firestore.Timestamp.now() },
  { id: 'vote8', linkId: 'link5', userId: 'user1', voteType: 'unsafe', createdAt: admin.firestore.Timestamp.now() }
];

// Sample Comments Data
const sampleComments = [
  {
    id: 'comment1',
    linkId: 'link1',
    userId: 'user2',
    content: 'I\'ve been using this bank for years. Completely legitimate and secure.',
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now()
  },
  {
    id: 'comment2',
    linkId: 'link2',
    userId: 'user1',
    content: 'Red flags everywhere! Promises 500% returns in 30 days. Classic scam.',
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now()
  },
  {
    id: 'comment3',
    linkId: 'link3',
    userId: 'user2',
    content: 'Confirmed phishing. They tried to steal my credentials. Stay away!',
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now()
  },
  {
    id: 'comment4',
    linkId: 'link4',
    userId: 'user3',
    content: 'Reliable news source. I check their articles regularly.',
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now()
  }
];

// Sample Chat Conversations
const sampleConversations = [
  {
    id: 'conv1',
    userId: 'user1',
    title: 'Security Best Practices',
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now()
  },
  {
    id: 'conv2',
    userId: 'user2',
    title: 'Phishing Detection Help',
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now()
  }
];

// Sample Chat Messages
const sampleChatMessages = [
  {
    id: 'msg1',
    conversationId: 'conv1',
    userId: 'user1',
    content: 'What are the best practices for online security?',
    role: 'user',
    createdAt: admin.firestore.Timestamp.now()
  },
  {
    id: 'msg2',
    conversationId: 'conv1',
    userId: 'user1',
    content: 'Dưới đây là các thực hành bảo mật tốt nhất:\n\n1. **Sử dụng mật khẩu mạnh**: Tối thiểu 12 ký tự, kết hợp chữ hoa, chữ thường, số và ký tự đặc biệt\n2. **Bật xác thực 2 yếu tố (2FA)**: Thêm lớp bảo vệ cho tài khoản\n3. **Cập nhật phần mềm thường xuyên**: Vá các lỗ hổng bảo mật\n4. **Cẩn thận với email lạ**: Không click vào link hoặc tải file từ nguồn không tin cậy\n5. **Sử dụng VPN**: Khi kết nối WiFi công cộng',
    role: 'assistant',
    createdAt: admin.firestore.Timestamp.now()
  },
  {
    id: 'msg3',
    conversationId: 'conv2',
    userId: 'user2',
    content: 'How can I identify phishing websites?',
    role: 'user',
    createdAt: admin.firestore.Timestamp.now()
  },
  {
    id: 'msg4',
    conversationId: 'conv2',
    userId: 'user2',
    content: 'Để nhận biết website lừa đảo (phishing):\n\n🔍 **Kiểm tra URL**:\n- Chính tả sai (gooogle.com thay vì google.com)\n- Domain lạ (.tk, .ml thay vì .com)\n- HTTP thay vì HTTPS\n\n🛡️ **Dấu hiệu cảnh báo**:\n- Yêu cầu thông tin nhạy cảm ngay lập tức\n- Thiết kế kém, lỗi chính tả\n- Popup quá nhiều\n- Không có thông tin liên hệ rõ ràng\n\n✅ **Cách xác minh**:\n- Kiểm tra certificate SSL\n- Tìm kiếm reviews về website\n- Sử dụng công cụ như FactCheck để scan',
    role: 'assistant',
    createdAt: admin.firestore.Timestamp.now()
  }
];

async function seedData() {
  console.log('🌱 Starting Firestore data seeding...');

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

    // Seed Votes
    console.log('🗳️ Creating votes...');
    for (const vote of sampleVotes) {
      await db.collection('votes').doc(vote.id).set(vote);
      console.log(`✅ Created vote: ${vote.id}`);
    }

    // Seed Comments
    console.log('💬 Creating comments...');
    for (const comment of sampleComments) {
      await db.collection('comments').doc(comment.id).set(comment);
      console.log(`✅ Created comment: ${comment.id}`);
    }

    // Seed Conversations
    console.log('🗨️ Creating conversations...');
    for (const conversation of sampleConversations) {
      await db.collection('conversations').doc(conversation.id).set(conversation);
      console.log(`✅ Created conversation: ${conversation.title}`);
    }

    // Seed Chat Messages
    console.log('📝 Creating chat messages...');
    for (const message of sampleChatMessages) {
      await db.collection('chat_messages').doc(message.id).set(message);
      console.log(`✅ Created message: ${message.id}`);
    }

    console.log('\n🎉 Data seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Users: ${sampleUsers.length}`);
    console.log(`- Community Posts: ${sampleLinks.length}`);
    console.log(`- Votes: ${sampleVotes.length}`);
    console.log(`- Comments: ${sampleComments.length}`);
    console.log(`- Conversations: ${sampleConversations.length}`);
    console.log(`- Chat Messages: ${sampleChatMessages.length}`);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run seeding
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedData();
}

export default { seedData };
