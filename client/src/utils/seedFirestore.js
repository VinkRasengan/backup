import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

// Mock data for seeding Firestore
const mockPosts = [
  {
    title: 'Cảnh báo: Website lừa đảo giả mạo ngân hàng VCB',
    description: 'Phát hiện website có domain tương tự ngân hàng VCB đang hoạt động lừa đảo. Mọi người cần cẩn thận khi truy cập các trang web ngân hàng.',
    url: 'https://vcb-fake-example.com',
    userId: 'mock-user-1',
    userEmail: 'nguyen.van.an@example.com',
    status: 'unsafe',
    finalScore: 25,
    credibilityScore: 20,
    securityScore: 30,
    metadata: {
      title: 'VCB Bank - Đăng nhập',
      domain: 'vcb-fake-example.com',
      description: 'Trang đăng nhập ngân hàng VCB'
    },
    tags: ['cảnh báo', 'ngân hàng', 'lừa đảo'],
    category: 'security'
  },
  {
    title: 'Chia sẻ cách nhận biết email phishing hiệu quả',
    description: 'Sau khi bị lừa một lần, mình đã học được cách nhận biết email lừa đảo. Chia sẻ với mọi người một số tip hữu ích để tránh bị lừa.',
    url: 'https://phishing-example.com',
    userId: 'mock-user-2',
    userEmail: 'tran.thi.binh@example.com',
    status: 'suspicious',
    finalScore: 45,
    credibilityScore: 40,
    securityScore: 50,
    metadata: {
      title: 'Khuyến mãi đặc biệt - Nhận ngay 1 triệu đồng',
      domain: 'phishing-example.com',
      description: 'Chương trình khuyến mãi hấp dẫn'
    },
    tags: ['email', 'phishing', 'bảo mật'],
    category: 'education'
  },
  {
    title: 'Phân tích: Xu hướng lừa đảo mới qua mạng xã hội',
    description: 'Báo cáo chi tiết về các phương thức lừa đảo mới xuất hiện trên Facebook và TikTok trong tháng vừa qua. Cần cảnh giác với các chiêu trò mới.',
    url: 'https://social-scam-analysis.com',
    userId: 'mock-user-3',
    userEmail: 'le.minh.cuong@example.com',
    status: 'safe',
    finalScore: 85,
    credibilityScore: 90,
    securityScore: 80,
    metadata: {
      title: 'Báo cáo xu hướng lừa đảo 2024',
      domain: 'social-scam-analysis.com',
      description: 'Phân tích chuyên sâu về lừa đảo mạng xã hội'
    },
    tags: ['phân tích', 'mạng xã hội', 'xu hướng'],
    category: 'analysis'
  },
  {
    title: 'Kiểm tra trang web bán hàng online đáng ngờ',
    description: 'Trang web này bán điện thoại với giá rất rẻ, nhưng có nhiều dấu hiệu đáng ngờ. Mọi người xem và góp ý.',
    url: 'https://cheap-phones-scam.com',
    userId: 'mock-user-4',
    userEmail: 'pham.thi.dao@example.com',
    status: 'unsafe',
    finalScore: 15,
    credibilityScore: 10,
    securityScore: 20,
    metadata: {
      title: 'iPhone 15 Pro Max chỉ 5 triệu - Khuyến mãi sốc',
      domain: 'cheap-phones-scam.com',
      description: 'Cửa hàng điện thoại giá rẻ nhất Việt Nam'
    },
    tags: ['mua sắm', 'điện thoại', 'lừa đảo'],
    category: 'ecommerce'
  },
  {
    title: 'Website tin tức đáng tin cậy về công nghệ',
    description: 'Chia sẻ một trang web tin tức công nghệ uy tín, cập nhật thường xuyên và có thông tin chính xác.',
    url: 'https://tech-news-reliable.com',
    userId: 'mock-user-5',
    userEmail: 'hoang.van.duc@example.com',
    status: 'safe',
    finalScore: 92,
    credibilityScore: 95,
    securityScore: 89,
    metadata: {
      title: 'TechNews - Tin tức công nghệ hàng đầu',
      domain: 'tech-news-reliable.com',
      description: 'Cập nhật tin tức công nghệ mới nhất'
    },
    tags: ['tin tức', 'công nghệ', 'đáng tin'],
    category: 'news'
  }
];

const mockComments = [
  {
    content: 'Cảm ơn bạn đã chia sẻ! Mình suýt bị lừa rồi.',
    userId: 'mock-user-2',
    userEmail: 'tran.thi.binh@example.com'
  },
  {
    content: 'Thông tin rất hữu ích, mọi người nên cẩn thận.',
    userId: 'mock-user-3',
    userEmail: 'le.minh.cuong@example.com'
  },
  {
    content: 'Đã báo cáo trang web này cho cơ quan chức năng.',
    userId: 'mock-user-4',
    userEmail: 'pham.thi.dao@example.com'
  },
  {
    content: 'Bài phân tích rất chi tiết và chuyên nghiệp.',
    userId: 'mock-user-1',
    userEmail: 'nguyen.van.an@example.com'
  },
  {
    content: 'Cần thêm nhiều bài viết như thế này.',
    userId: 'mock-user-5',
    userEmail: 'hoang.van.duc@example.com'
  }
];

const voteTypes = ['safe', 'unsafe', 'suspicious'];

export const seedFirestore = async () => {
  try {
    console.log('🌱 Bắt đầu seed data vào Firestore...');

    // Seed posts
    const postIds = [];
    for (const post of mockPosts) {
      const postData = {
        ...post,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        voteCount: Math.floor(Math.random() * 50) + 1,
        commentCount: Math.floor(Math.random() * 10) + 1,
        views: Math.floor(Math.random() * 500) + 50
      };

      const docRef = await addDoc(collection(db, 'links'), postData);
      postIds.push(docRef.id);
      console.log(`✅ Đã tạo post: ${post.title}`);
    }

    // Seed comments
    for (let i = 0; i < mockComments.length; i++) {
      const comment = mockComments[i];
      const randomPostId = postIds[Math.floor(Math.random() * postIds.length)];
      
      const commentData = {
        ...comment,
        linkId: randomPostId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'comments'), commentData);
      console.log(`✅ Đã tạo comment: ${comment.content.substring(0, 30)}...`);
    }

    // Seed votes
    for (const postId of postIds) {
      const numVotes = Math.floor(Math.random() * 20) + 5;
      
      for (let i = 0; i < numVotes; i++) {
        const voteData = {
          linkId: postId,
          userId: `mock-voter-${i}`,
          userEmail: `voter${i}@example.com`,
          voteType: voteTypes[Math.floor(Math.random() * voteTypes.length)],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        await addDoc(collection(db, 'votes'), voteData);
      }
      console.log(`✅ Đã tạo ${numVotes} votes cho post ${postId}`);
    }

    console.log('🎉 Hoàn thành seed data!');
    console.log(`📊 Đã tạo: ${mockPosts.length} posts, ${mockComments.length} comments, và nhiều votes`);
    
    return {
      success: true,
      postsCreated: mockPosts.length,
      commentsCreated: mockComments.length,
      postIds
    };

  } catch (error) {
    console.error('❌ Lỗi khi seed data:', error);
    throw error;
  }
};

// Helper function to clear all data (use with caution!)
export const clearFirestoreData = async () => {
  console.log('⚠️ Chức năng này cần được implement cẩn thận để tránh xóa nhầm data thật');
  // Implementation would require admin SDK or batch operations
};

// Test connection
export const testFirestoreConnection = async () => {
  try {
    const testDoc = {
      test: true,
      timestamp: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'test'), testDoc);
    console.log('✅ Kết nối Firestore thành công, test doc ID:', docRef.id);
    return true;
  } catch (error) {
    console.error('❌ Lỗi kết nối Firestore:', error);
    return false;
  }
};
