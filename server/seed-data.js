require('dotenv').config({ path: '../.env' });
const firebaseConfig = require('./src/config/firebase-config');

async function seedData() {
  try {
    console.log('🌱 Starting data seeding...');

    const db = await firebaseConfig.initialize();
    
    // Sample links data
    const sampleLinks = [
      {
        url: 'https://example.com/covid-vaccine-news',
        title: 'Tin tức về vaccine COVID-19 mới nhất',
        description: 'Thông tin chính thức về vaccine COVID-19 từ Bộ Y tế',
        category: 'health',
        status: 'active',
        userId: 'user1',
        voteCount: 45,
        commentCount: 23,
        engagementScore: 92,
        trustScore: 85,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        updatedAt: new Date()
      },
      {
        url: 'https://example.com/online-shopping-scam',
        title: 'Cách nhận biết website lừa đảo trong mùa mua sắm online',
        description: 'Hướng dẫn chi tiết cách phát hiện và tránh các website lừa đảo',
        category: 'technology',
        status: 'active',
        userId: 'user2',
        voteCount: 38,
        commentCount: 15,
        engagementScore: 68,
        trustScore: 90,
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
        updatedAt: new Date()
      },
      {
        url: 'https://example.com/climate-change-misinformation',
        title: 'Thông tin sai lệch về biến đổi khí hậu được chia sẻ rộng rãi',
        description: 'Phân tích các thông tin sai lệch về biến đổi khí hậu trên mạng xã hội',
        category: 'environment',
        status: 'active',
        userId: 'user3',
        voteCount: 52,
        commentCount: 31,
        engagementScore: 114,
        trustScore: 25,
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
        updatedAt: new Date()
      },
      {
        url: 'https://example.com/financial-scam-warning',
        title: 'Cảnh báo lừa đảo tài chính qua tin nhắn SMS',
        description: 'Các thủ đoạn lừa đảo tài chính mới qua tin nhắn SMS',
        category: 'finance',
        status: 'active',
        userId: 'user4',
        voteCount: 29,
        commentCount: 12,
        engagementScore: 55,
        trustScore: 95,
        createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
        updatedAt: new Date()
      },
      {
        url: 'https://example.com/fake-news-detection',
        title: 'Công cụ AI mới giúp phát hiện tin giả',
        description: 'Giới thiệu về công cụ AI mới có thể phát hiện tin giả với độ chính xác cao',
        category: 'technology',
        status: 'active',
        userId: 'user5',
        voteCount: 67,
        commentCount: 28,
        engagementScore: 128,
        trustScore: 88,
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
        updatedAt: new Date()
      }
    ];

    // Add links to Firestore
    const batch = db.batch();
    
    for (const link of sampleLinks) {
      const linkRef = db.collection('links').doc();
      batch.set(linkRef, link);
    }

    await batch.commit();
    
    console.log('✅ Sample links added successfully');
    console.log(`📊 Added ${sampleLinks.length} sample links`);
    
    // Add some sample votes
    const sampleVotes = [
      { linkId: 'link1', userId: 'user1', voteType: 'safe', createdAt: new Date() },
      { linkId: 'link1', userId: 'user2', voteType: 'safe', createdAt: new Date() },
      { linkId: 'link2', userId: 'user3', voteType: 'safe', createdAt: new Date() },
      { linkId: 'link3', userId: 'user4', voteType: 'unsafe', createdAt: new Date() },
      { linkId: 'link3', userId: 'user5', voteType: 'unsafe', createdAt: new Date() }
    ];

    const voteBatch = db.batch();
    for (const vote of sampleVotes) {
      const voteRef = db.collection('votes').doc();
      voteBatch.set(voteRef, vote);
    }
    await voteBatch.commit();
    
    console.log('✅ Sample votes added successfully');
    console.log('🎉 Data seeding completed!');
    
  } catch (error) {
    console.error('❌ Error seeding data:', error);
  }
}

// Run the seeding
seedData().then(() => {
  console.log('🏁 Seeding process finished');
  process.exit(0);
}).catch(error => {
  console.error('💥 Seeding failed:', error);
  process.exit(1);
});
