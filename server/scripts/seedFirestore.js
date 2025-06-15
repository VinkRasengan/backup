const admin = require('firebase-admin');
const path = require('path');

// Use existing Firebase config
const firebaseConfig = require('../src/config/firebase-config');

async function initializeFirebase() {
  try {
    console.log('🔥 Initializing Firebase for seeding...');
    const db = await firebaseConfig.initialize();
    return db;
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    throw error;
  }
}

// Sample data for seeding
const sampleUsers = [
  {
    id: 'user1',
    email: 'nguyen.van.a@example.com',
    displayName: 'Nguyễn Văn A',
    firstName: 'Nguyễn',
    lastName: 'Văn A',
    avatarUrl: 'https://ui-avatars.com/api/?name=Nguyen+Van+A&background=0D8ABC&color=fff',
    createdAt: admin.firestore.Timestamp.now(),
    isActive: true,
    role: 'user'
  },
  {
    id: 'user2', 
    email: 'tran.thi.b@example.com',
    displayName: 'Trần Thị B',
    firstName: 'Trần',
    lastName: 'Thị B',
    avatarUrl: 'https://ui-avatars.com/api/?name=Tran+Thi+B&background=6366F1&color=fff',
    createdAt: admin.firestore.Timestamp.now(),
    isActive: true,
    role: 'user'
  },
  {
    id: 'user3',
    email: 'le.van.c@example.com', 
    displayName: 'Lê Văn C',
    firstName: 'Lê',
    lastName: 'Văn C',
    avatarUrl: 'https://ui-avatars.com/api/?name=Le+Van+C&background=EF4444&color=fff',
    createdAt: admin.firestore.Timestamp.now(),
    isActive: true,
    role: 'moderator'
  }
];

const sampleLinks = [
  {
    id: 'link1',
    title: 'Phát hiện tin giả về vaccine COVID-19 lan truyền trên mạng xã hội',
    description: 'Một bài viết đang lan truyền thông tin sai lệch về tác dụng phụ của vaccine COVID-19. Cộng đồng cần kiểm chứng thông tin này.',
    url: 'https://fake-covid-news.com/vaccine-danger',
    status: 'unsafe',
    category: 'health',
    submittedBy: 'user1',
    userId: 'user1',
    createdAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 2 * 60 * 60 * 1000)),
    screenshot: 'https://images.unsplash.com/photo-1584118624012-df056829fbd0?w=400',
    metadata: {
      domain: 'fake-covid-news.com',
      title: 'Vaccine COVID-19 gây tác dụng phụ nghiêm trọng',
      description: 'Nghiên cứu mới cho thấy vaccine có thể gây...'
    }
  },
  {
    id: 'link2',
    title: 'Cách nhận biết website lừa đảo trong mùa mua sắm online',
    description: 'Hướng dẫn chi tiết cách phát hiện và tránh các website lừa đảo khi mua sắm trực tuyến, đặc biệt trong các dịp khuyến mãi.',
    url: 'https://security-guide.vn/avoid-shopping-scams',
    status: 'safe',
    category: 'security',
    submittedBy: 'user2',
    userId: 'user2', 
    createdAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 4 * 60 * 60 * 1000)),
    screenshot: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400',
    metadata: {
      domain: 'security-guide.vn',
      title: 'Bảo vệ bản thân khỏi lừa đảo online',
      description: 'Những dấu hiệu nhận biết website lừa đảo...'
    }
  },
  {
    id: 'link3',
    title: 'Thông tin sai lệch về biến đổi khí hậu được chia sẻ rộng rãi',
    description: 'Một video trên mạng xã hội đang phủ nhận hiện tượng biến đổi khí hậu với những lập luận thiếu căn cứ khoa học.',
    url: 'https://climate-denial.org/global-warming-hoax',
    status: 'unsafe',
    category: 'environment',
    submittedBy: 'user3',
    userId: 'user3',
    createdAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 6 * 60 * 60 * 1000)),
    screenshot: 'https://images.unsplash.com/photo-1569163139394-de4e4f43e4e5?w=400',
    metadata: {
      domain: 'climate-denial.org',
      title: 'Biến đổi khí hậu là trò lừa bịp',
      description: 'Bằng chứng cho thấy biến đổi khí hậu không có thật...'
    }
  },
  {
    id: 'link4',
    title: 'Cảnh báo: Trang web giả mạo Shopee đang lừa đảo người dùng',
    description: 'Phát hiện trang web có giao diện giống hệt Shopee nhưng có domain khác, đang thu thập thông tin cá nhân và thẻ tín dụng.',
    url: 'https://shopee-fake.com/deals',
    status: 'unsafe',
    category: 'security',
    submittedBy: 'user1',
    userId: 'user1',
    createdAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 1 * 60 * 60 * 1000)),
    screenshot: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400',
    metadata: {
      domain: 'shopee-fake.com',
      title: 'Shopee - Khuyến mãi đặc biệt',
      description: 'Giảm giá 90% tất cả sản phẩm...'
    }
  },
  {
    id: 'link5',
    title: 'Hướng dẫn kiểm tra độ tin cậy của nguồn tin trực tuyến',
    description: 'Bài viết hướng dẫn chi tiết các bước kiểm tra độ tin cậy của thông tin trên internet, bao gồm cách xác minh nguồn và cross-check.',
    url: 'https://factcheck-guide.edu.vn/verify-sources',
    status: 'safe',
    category: 'education',
    submittedBy: 'user2',
    userId: 'user2',
    createdAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 30 * 60 * 1000)),
    screenshot: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400',
    metadata: {
      domain: 'factcheck-guide.edu.vn',
      title: 'Cẩm nang kiểm chứng thông tin',
      description: 'Hướng dẫn từng bước để xác minh tin tức...'
    }
  }
];

const sampleVotes = [
  // Votes for link1 (COVID vaccine fake news)
  { linkId: 'link1', userId: 'user1', voteType: 'unsafe', createdAt: admin.firestore.Timestamp.now() },
  { linkId: 'link1', userId: 'user2', voteType: 'unsafe', createdAt: admin.firestore.Timestamp.now() },
  { linkId: 'link1', userId: 'user3', voteType: 'suspicious', createdAt: admin.firestore.Timestamp.now() },
  
  // Votes for link2 (Shopping security guide)
  { linkId: 'link2', userId: 'user1', voteType: 'safe', createdAt: admin.firestore.Timestamp.now() },
  { linkId: 'link2', userId: 'user2', voteType: 'safe', createdAt: admin.firestore.Timestamp.now() },
  { linkId: 'link2', userId: 'user3', voteType: 'safe', createdAt: admin.firestore.Timestamp.now() },
  
  // Votes for link3 (Climate change denial)
  { linkId: 'link3', userId: 'user1', voteType: 'unsafe', createdAt: admin.firestore.Timestamp.now() },
  { linkId: 'link3', userId: 'user2', voteType: 'unsafe', createdAt: admin.firestore.Timestamp.now() },
  
  // Votes for link4 (Fake Shopee)
  { linkId: 'link4', userId: 'user2', voteType: 'unsafe', createdAt: admin.firestore.Timestamp.now() },
  { linkId: 'link4', userId: 'user3', voteType: 'unsafe', createdAt: admin.firestore.Timestamp.now() },
  
  // Votes for link5 (Fact-check guide)
  { linkId: 'link5', userId: 'user1', voteType: 'safe', createdAt: admin.firestore.Timestamp.now() },
  { linkId: 'link5', userId: 'user3', voteType: 'safe', createdAt: admin.firestore.Timestamp.now() }
];

const sampleComments = [
  {
    linkId: 'link1',
    userId: 'user2',
    content: 'Tôi đã kiểm tra nguồn gốc của thông tin này và thấy nó không có căn cứ khoa học. Đây rõ ràng là tin giả.',
    createdAt: admin.firestore.Timestamp.now(),
    isVerified: false
  },
  {
    linkId: 'link1', 
    userId: 'user3',
    content: 'Cảm ơn bạn đã chia sẻ. Mọi người nên kiểm tra thông tin từ các nguồn y tế chính thức trước khi tin.',
    createdAt: admin.firestore.Timestamp.now(),
    isVerified: false
  },
  {
    linkId: 'link2',
    userId: 'user1',
    content: 'Bài viết rất hữu ích! Tôi đã áp dụng những mẹo này và tránh được một website lừa đảo.',
    createdAt: admin.firestore.Timestamp.now(),
    isVerified: false
  },
  {
    linkId: 'link4',
    userId: 'user3',
    content: 'Tôi suýt bị lừa bởi trang này. May mà có cảnh báo từ cộng đồng.',
    createdAt: admin.firestore.Timestamp.now(),
    isVerified: false
  }
];

async function seedFirestore() {
  let db;
  try {
    console.log('🌱 Starting Firestore seeding...');

    // Initialize Firebase
    db = await initializeFirebase();

    // Add users
    console.log('👥 Adding sample users...');
    for (const user of sampleUsers) {
      await db.collection('users').doc(user.id).set(user);
      console.log(`✅ Added user: ${user.displayName}`);
    }

    // Add links
    console.log('🔗 Adding sample links...');
    for (const link of sampleLinks) {
      await db.collection('links').doc(link.id).set(link);
      console.log(`✅ Added link: ${link.title.substring(0, 50)}...`);
    }

    // Add votes
    console.log('🗳️ Adding sample votes...');
    for (const vote of sampleVotes) {
      await db.collection('votes').add(vote);
      console.log(`✅ Added vote: ${vote.voteType} for ${vote.linkId}`);
    }

    // Add comments
    console.log('💬 Adding sample comments...');
    for (const comment of sampleComments) {
      await db.collection('comments').add(comment);
      console.log(`✅ Added comment for ${comment.linkId}`);
    }

    console.log('🎉 Firestore seeding completed successfully!');
    console.log('📊 Summary:');
    console.log(`   - Users: ${sampleUsers.length}`);
    console.log(`   - Links: ${sampleLinks.length}`);
    console.log(`   - Votes: ${sampleVotes.length}`);
    console.log(`   - Comments: ${sampleComments.length}`);

  } catch (error) {
    console.error('❌ Error seeding Firestore:', error);
  } finally {
    process.exit(0);
  }
}

// Run the seeding
seedFirestore();
