// Mock Posts Service for testing Community Feed
class MockPostsService {
  constructor() {
    this.mockPosts = this.generateMockPosts();
  }

  generateMockPosts() {
    return [
      {
        id: 'link1',
        title: 'Cảnh báo: Website lừa đảo mạo danh ngân hàng Vietcombank',
        content: 'Phát hiện website giả mạo giao diện Vietcombank để đánh cắp thông tin tài khoản. Website có domain tương tự nhưng không phải chính thức.',
        url: 'https://fake-vietcombank-scam.com',
        imageUrl: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=200&fit=crop',
        screenshot: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=200&fit=crop',
        type: 'user_post',
        source: 'Cộng đồng',
        author: { name: 'Nguyễn Văn A' },
        userInfo: { name: 'Nguyễn Văn A' },
        createdAt: new Date(Date.now() - 3600000), // 1 hour ago
        isVerified: false,
        trustScore: 25,
        tags: ['lừa đảo', 'ngân hàng', 'phishing'],
        viewCount: 156,
        commentCount: 3,
        voteCount: 12
      },
      {
        id: 'link2',
        title: 'Hướng dẫn nhận biết email lừa đảo mạo danh cơ quan thuế',
        content: 'Cơ quan thuế cảnh báo về tình trạng email giả mạo yêu cầu cung cấp thông tin cá nhân và tài khoản ngân hàng.',
        url: 'https://gdt.gov.vn/canh-bao-email-lua-dao',
        imageUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=200&fit=crop',
        screenshot: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=200&fit=crop',
        type: 'news',
        source: 'Tổng cục Thuế',
        author: { name: 'Tổng cục Thuế' },
        userInfo: { name: 'Tổng cục Thuế' },
        createdAt: new Date(Date.now() - 7200000), // 2 hours ago
        isVerified: true,
        trustScore: 95,
        tags: ['thuế', 'email', 'cảnh báo'],
        viewCount: 324,
        commentCount: 2,
        voteCount: 28
      },
      {
        id: 'link3',
        title: 'Phát hiện ứng dụng giả mạo ví điện tử MoMo trên CH Play',
        content: 'Ứng dụng có giao diện tương tự MoMo nhưng được phát triển bởi nhà phát triển không rõ danh tính, có thể đánh cắp thông tin người dùng.',
        url: 'https://fake-momo-app-warning.com',
        imageUrl: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=200&fit=crop',
        screenshot: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=200&fit=crop',
        type: 'user_post',
        source: 'Cộng đồng',
        author: { name: 'Trần Thị B' },
        userInfo: { name: 'Trần Thị B' },
        createdAt: new Date(Date.now() - 10800000), // 3 hours ago
        isVerified: false,
        trustScore: 78,
        tags: ['ứng dụng', 'momo', 'giả mạo'],
        viewCount: 89,
        commentCount: 1,
        voteCount: 15
      },
      {
        id: 'link4',
        title: 'Tin tức: Ngân hàng Nhà nước cảnh báo về tiền điện tử lừa đảo',
        content: 'NHNN khuyến cáo người dân cảnh giác với các dự án tiền điện tử hứa hẹn lợi nhuận cao, có dấu hiệu lừa đảo.',
        url: 'https://sbv.gov.vn/canh-bao-tien-dien-tu',
        imageUrl: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=400&h=200&fit=crop',
        screenshot: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=400&h=200&fit=crop',
        type: 'news',
        source: 'Ngân hàng Nhà nước',
        author: { name: 'NHNN' },
        userInfo: { name: 'NHNN' },
        createdAt: new Date(Date.now() - 14400000), // 4 hours ago
        isVerified: true,
        trustScore: 98,
        tags: ['tiền điện tử', 'cảnh báo', 'NHNN'],
        viewCount: 567,
        commentCount: 0,
        voteCount: 45
      },
      {
        id: 'link5',
        title: 'Kinh nghiệm: Cách nhận biết website thương mại điện tử giả',
        content: 'Chia sẻ kinh nghiệm nhận biết các dấu hiệu của website bán hàng online lừa đảo qua giao diện, chính sách và phương thức thanh toán.',
        url: 'https://tips-ecommerce-safety.com',
        imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=200&fit=crop',
        screenshot: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=200&fit=crop',
        type: 'user_post',
        source: 'Cộng đồng',
        author: { name: 'Lê Văn C' },
        userInfo: { name: 'Lê Văn C' },
        createdAt: new Date(Date.now() - 18000000), // 5 hours ago
        isVerified: false,
        trustScore: 82,
        tags: ['thương mại điện tử', 'kinh nghiệm', 'an toàn'],
        viewCount: 234,
        commentCount: 0,
        voteCount: 19
      }
    ];
  }

  // Get mock posts with pagination
  getMockPosts(params = {}) {
    const { page = 1, limit = 10, sort = 'trending', filter = 'all', search = '' } = params;
    
    let filteredPosts = [...this.mockPosts];

    // Apply search filter
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filteredPosts = filteredPosts.filter(post => 
        post.title.toLowerCase().includes(searchLower) ||
        post.content.toLowerCase().includes(searchLower) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Apply category filter
    if (filter !== 'all') {
      filteredPosts = filteredPosts.filter(post => {
        switch (filter) {
          case 'news':
            return post.type === 'news';
          case 'user_posts':
            return post.type === 'user_post';
          case 'verified':
            return post.isVerified;
          case 'high_trust':
            return post.trustScore >= 80;
          default:
            return true;
        }
      });
    }

    // Apply sorting
    filteredPosts.sort((a, b) => {
      switch (sort) {
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'most_voted':
          return (b.voteCount || 0) - (a.voteCount || 0);
        case 'most_viewed':
          return (b.viewCount || 0) - (a.viewCount || 0);
        case 'trending':
        default:
          // Trending algorithm: combine recency, votes, and views
          const aScore = (a.voteCount || 0) * 2 + (a.viewCount || 0) * 0.1 + (a.commentCount || 0) * 3;
          const bScore = (b.voteCount || 0) * 2 + (b.viewCount || 0) * 0.1 + (b.commentCount || 0) * 3;
          return bScore - aScore;
      }
    });

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPosts = filteredPosts.slice(startIndex, endIndex);

    return {
      posts: paginatedPosts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(filteredPosts.length / limit),
        totalPosts: filteredPosts.length,
        hasNext: endIndex < filteredPosts.length,
        hasPrev: page > 1,
        limit
      }
    };
  }

  // Check if we should use mock data
  shouldUseMockData() {
    // Use mock data for testing when API is not available
    return true; // For now, always use mock data for testing
  }
}

// Create singleton instance
const mockPostsService = new MockPostsService();

// Override fetch function for community posts API
const originalFetch = window.fetch;
window.fetch = async (url, options = {}) => {
  // Check if this is a community posts request
  if (url.includes('/api/community/posts') && mockPostsService.shouldUseMockData()) {
    console.log('🎭 Using mock posts data for:', url);
    
    // Parse URL parameters
    const urlObj = new URL(url, window.location.origin);
    const params = {
      page: parseInt(urlObj.searchParams.get('page')) || 1,
      limit: parseInt(urlObj.searchParams.get('limit')) || 10,
      sort: urlObj.searchParams.get('sort') || 'trending',
      filter: urlObj.searchParams.get('category') || 'all',
      search: urlObj.searchParams.get('search') || ''
    };

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 200));

    const mockData = mockPostsService.getMockPosts(params);
    
    return new Response(JSON.stringify({
      success: true,
      data: mockData,
      message: 'Posts retrieved successfully (mock data)'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  // For all other requests, use original fetch
  return originalFetch(url, options);
};

export default mockPostsService;
