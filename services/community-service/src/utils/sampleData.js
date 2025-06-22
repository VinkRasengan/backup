const { db, collections } = require('../config/firebase');
const Logger = require('../../shared/utils/logger');

const logger = new Logger('community-service');

// Sample data for links and comments
const sampleLinks = [
  {
    title: 'Cảnh báo: Trang web lừa đảo mới được phát hiện',
    content: 'Một trang web giả mạo ngân hàng đã được phát hiện. Trang web này có giao diện rất giống với website chính thức của ngân hàng, nhưng có URL khác biệt. Hãy cẩn thận khi nhập thông tin cá nhân và luôn kiểm tra URL trước khi đăng nhập.',
    author: {
      uid: 'user1',
      email: 'security.expert@example.com',
      displayName: 'Chuyên gia bảo mật'
    },
    type: 'user_post',
    category: 'phishing',
    url: 'https://suspicious-bank-site.com',
    tags: ['phishing', 'banking', 'scam', 'security'],
    voteStats: {
      upvotes: 25,
      downvotes: 3,
      total: 28,
      score: 22
    },
    voteScore: 22,
    commentCount: 8,
    verified: true,
    searchTerms: ['cảnh', 'báo', 'trang', 'web', 'lừa', 'đảo', 'ngân', 'hàng']
  },
  {
    title: 'Chia sẻ: Cách nhận biết email lừa đảo',
    content: 'Dựa trên kinh nghiệm cá nhân, tôi muốn chia sẻ một số dấu hiệu nhận biết email lừa đảo: 1) Người gửi không rõ ràng, 2) Yêu cầu cung cấp thông tin cá nhân ngay lập tức, 3) Có lỗi chính tả và ngữ pháp, 4) Link dẫn đến trang web khả nghi.',
    author: {
      uid: 'user2',
      email: 'user.experienced@example.com',
      displayName: 'Người dùng có kinh nghiệm'
    },
    type: 'user_post',
    category: 'education',
    tags: ['education', 'email', 'tips', 'security'],
    voteStats: {
      upvotes: 42,
      downvotes: 2,
      total: 44,
      score: 40
    },
    voteScore: 40,
    commentCount: 15,
    verified: false,
    searchTerms: ['chia', 'sẻ', 'cách', 'nhận', 'biết', 'email', 'lừa', 'đảo']
  },
  {
    title: 'Bộ TT&TT cảnh báo: Xuất hiện chiêu thức lừa đảo mới qua tin nhắn',
    content: 'Bộ Thông tin và Truyền thông vừa phát đi cảnh báo về chiêu thức lừa đảo mới thông qua tin nhắn SMS. Các đối tượng xấu giả mạo các tổ chức tín dụng, ngân hàng để gửi tin nhắn yêu cầu người dân cung cấp thông tin cá nhân.',
    author: {
      uid: 'news1',
      email: 'news@vnexpress.net',
      displayName: 'VnExpress'
    },
    type: 'news',
    category: 'official_warning',
    source: 'VnExpress',
    url: 'https://vnexpress.net/canh-bao-lua-dao-moi',
    tags: ['official', 'sms', 'warning', 'government'],
    voteStats: {
      upvotes: 156,
      downvotes: 4,
      total: 160,
      score: 152
    },
    voteScore: 152,
    commentCount: 23,
    verified: true,
    trustScore: 95,
    searchTerms: ['bộ', 'tt&tt', 'cảnh', 'báo', 'chiêu', 'thức', 'lừa', 'đảo', 'tin', 'nhắn']
  },
  {
    title: 'Ngân hàng Nhà nước cảnh báo website giả mạo các ngân hàng',
    content: 'Ngân hàng Nhà nước Việt Nam đã phát hiện nhiều website giả mạo các ngân hàng thương mại. Các website này có giao diện tương tự website chính thức nhưng có tên miền khác, nhằm đánh cắp thông tin tài khoản của khách hàng.',
    author: {
      uid: 'news2',
      email: 'news@tuoitre.vn',
      displayName: 'Tuổi Trẻ Online'
    },
    type: 'news',
    category: 'banking_security',
    source: 'Tuổi Trẻ',
    url: 'https://tuoitre.vn/ngan-hang-gia-mao',
    tags: ['banking', 'official', 'website', 'security'],
    voteStats: {
      upvotes: 89,
      downvotes: 1,
      total: 90,
      score: 88
    },
    voteScore: 88,
    commentCount: 12,
    verified: true,
    trustScore: 92,
    searchTerms: ['ngân', 'hàng', 'nhà', 'nước', 'cảnh', 'báo', 'website', 'giả', 'mạo']
  }
];

const sampleComments = [
  {
    content: 'Cảm ơn bạn đã chia sẻ thông tin hữu ích này. Tôi đã từng suýt bị lừa bởi một trang web tương tự.',
    author: {
      uid: 'commenter1',
      email: 'user1@example.com',
      displayName: 'Người dùng A'
    },
    voteStats: {
      upvotes: 5,
      downvotes: 0,
      total: 5,
      score: 5
    },
    voteScore: 5,
    replyCount: 2,
    status: 'active'
  },
  {
    content: 'Thông tin rất bổ ích! Mọi người nên cẩn thận hơn khi duyệt web.',
    author: {
      uid: 'commenter2',
      email: 'user2@example.com',
      displayName: 'Người dùng B'
    },
    voteStats: {
      upvotes: 3,
      downvotes: 0,
      total: 3,
      score: 3
    },
    voteScore: 3,
    replyCount: 0,
    status: 'active'
  },
  {
    content: 'Tôi nghĩ nên có thêm hướng dẫn chi tiết về cách kiểm tra tính xác thực của website.',
    author: {
      uid: 'commenter3',
      email: 'user3@example.com',
      displayName: 'Người dùng C'
    },
    voteStats: {
      upvotes: 8,
      downvotes: 1,
      total: 9,
      score: 7
    },
    voteScore: 7,
    replyCount: 1,
    status: 'active'
  }
];

// Function to create sample data in Firestore
async function createSampleData() {
  try {
    logger.info('Creating sample data for community service...');

    // Create sample links
    const linkPromises = sampleLinks.map(async (linkData) => {
      const link = {
        ...linkData,
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random time in last 7 days
        updatedAt: new Date()
      };

      const docRef = await db.collection(collections.POSTS).add(link);
      logger.info('Sample link created', { id: docRef.id, title: link.title });

      // Create sample comments for this link
      const commentPromises = sampleComments.map(async (commentData, index) => {
        const comment = {
          ...commentData,
          linkId: docRef.id,
          createdAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000), // Random time in last 24 hours
          updatedAt: new Date()
        };

        const commentRef = await db.collection(collections.COMMENTS).add(comment);
        logger.info('Sample comment created', { id: commentRef.id, linkId: docRef.id });
        return commentRef.id;
      });

      await Promise.all(commentPromises);
      return docRef.id;
    });

    const linkIds = await Promise.all(linkPromises);
    logger.info('Sample data creation completed', { linksCreated: linkIds.length });

    return {
      success: true,
      linksCreated: linkIds.length,
      commentsCreated: sampleComments.length * linkIds.length
    };

  } catch (error) {
    logger.error('Error creating sample data', { error: error.message });
    throw error;
  }
}

// Function to clear all sample data
async function clearSampleData() {
  try {
    logger.info('Clearing sample data...');

    // Clear links
    const linksSnapshot = await db.collection(collections.POSTS).get();
    const linkDeletePromises = linksSnapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(linkDeletePromises);

    // Clear comments
    const commentsSnapshot = await db.collection(collections.COMMENTS).get();
    const commentDeletePromises = commentsSnapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(commentDeletePromises);

    // Clear votes
    const votesSnapshot = await db.collection(collections.VOTES).get();
    const voteDeletePromises = votesSnapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(voteDeletePromises);

    logger.info('Sample data cleared successfully');
    return { success: true };

  } catch (error) {
    logger.error('Error clearing sample data', { error: error.message });
    throw error;
  }
}

module.exports = {
  createSampleData,
  clearSampleData,
  sampleLinks,
  sampleComments
};
