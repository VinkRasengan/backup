// Mock Comments Service for testing CommentPreview
import { communityAPI } from './api';

class MockCommentsService {
  constructor() {
    this.mockComments = new Map();
    this.initializeMockData();
  }

  initializeMockData() {
    // Mock comments for different posts
    const mockCommentsData = {
      'link1': [
        {
          id: 'comment1',
          content: 'Tôi đã kiểm tra nguồn gốc của thông tin này và thấy nó không có căn cứ khoa học. Đây rõ ràng là tin giả.',
          created_at: new Date(Date.now() - 3600000), // 1 hour ago
          updated_at: new Date(Date.now() - 3600000),
          user_email: 'nguyen.vana@example.com',
          user_name: 'Nguyễn Văn A'
        },
        {
          id: 'comment2',
          content: 'Cảm ơn bạn đã chia sẻ. Mọi người nên kiểm tra thông tin từ các nguồn y tế chính thức trước khi tin.',
          created_at: new Date(Date.now() - 1800000), // 30 minutes ago
          updated_at: new Date(Date.now() - 1800000),
          user_email: 'tran.thib@example.com',
          user_name: 'Trần Thị B'
        },
        {
          id: 'comment3',
          content: 'Bài viết này có vẻ đáng ngờ. Tôi đã tìm hiểu và không thấy bằng chứng nào ủng hộ.',
          created_at: new Date(Date.now() - 900000), // 15 minutes ago
          updated_at: new Date(Date.now() - 900000),
          user_email: 'le.vanc@example.com',
          user_name: 'Lê Văn C'
        }
      ],
      'link2': [
        {
          id: 'comment4',
          content: 'Bài viết rất hữu ích! Tôi đã áp dụng những mẹo này và tránh được một website lừa đảo.',
          created_at: new Date(Date.now() - 7200000), // 2 hours ago
          updated_at: new Date(Date.now() - 7200000),
          user_email: 'pham.thid@example.com',
          user_name: 'Phạm Thị D'
        },
        {
          id: 'comment5',
          content: 'Cảm ơn tác giả! Những thông tin này rất cần thiết trong thời đại số.',
          created_at: new Date(Date.now() - 5400000), // 1.5 hours ago
          updated_at: new Date(Date.now() - 5400000),
          user_email: 'hoang.vane@example.com',
          user_name: 'Hoàng Văn E'
        }
      ],
      'link3': [
        {
          id: 'comment6',
          content: 'Tôi đã bị lừa bởi trang web tương tự. Mọi người cẩn thận!',
          created_at: new Date(Date.now() - 10800000), // 3 hours ago
          updated_at: new Date(Date.now() - 10800000),
          user_email: 'vu.thif@example.com',
          user_name: 'Vũ Thị F'
        }
      ]
    };

    // Store mock data
    Object.entries(mockCommentsData).forEach(([linkId, comments]) => {
      this.mockComments.set(linkId, comments);
    });
  }

  // Get mock comments for a specific link
  getMockComments(linkId, page = 1, limit = 10, sortBy = 'newest') {
    const comments = this.mockComments.get(linkId) || [];
    
    // Sort comments
    const sortedComments = [...comments].sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.created_at) - new Date(a.created_at);
      } else {
        return new Date(a.created_at) - new Date(b.created_at);
      }
    });

    // Paginate
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedComments = sortedComments.slice(startIndex, endIndex);

    return {
      success: true,
      data: {
        comments: paginatedComments,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(sortedComments.length / limit),
          totalComments: sortedComments.length,
          hasNext: endIndex < sortedComments.length,
          hasPrev: page > 1
        }
      }
    };
  }

  // Add a new mock comment
  addMockComment(linkId, content, userEmail = 'test@example.com', userName = 'Test User') {
    const newComment = {
      id: `comment_${Date.now()}`,
      content: content.trim(),
      created_at: new Date(),
      updated_at: new Date(),
      user_email: userEmail,
      user_name: userName
    };

    const existingComments = this.mockComments.get(linkId) || [];
    existingComments.unshift(newComment); // Add to beginning
    this.mockComments.set(linkId, existingComments);

    return {
      success: true,
      data: newComment,
      message: 'Comment created successfully'
    };
  }

  // Check if we should use mock data (when API fails)
  shouldUseMockData(linkId) {
    // Use mock data for testing or when API is not available
    return true; // For now, always use mock data for testing
  }
}

// Create singleton instance
const mockCommentsService = new MockCommentsService();

// Override communityAPI.getComments for testing
const originalGetComments = communityAPI.getComments;
const originalAddComment = communityAPI.addComment;

communityAPI.getComments = async (linkId, page = 1, limit = 10, sortBy = 'newest') => {
  console.log('🧪 Using mock comments for linkId:', linkId);
  
  try {
    // Try real API first
    const response = await originalGetComments(linkId, page, limit, sortBy);
    if (response.data && response.data.success && response.data.data.comments.length > 0) {
      console.log('✅ Using real API comments');
      return response;
    }
  } catch (error) {
    console.log('⚠️ Real API failed, using mock data:', error.message);
  }

  // Fallback to mock data
  console.log('🎭 Using mock comments data');
  return {
    data: mockCommentsService.getMockComments(linkId, page, limit, sortBy)
  };
};

communityAPI.addComment = async (linkId, content) => {
  console.log('🧪 Adding mock comment for linkId:', linkId);
  
  try {
    // Try real API first
    const response = await originalAddComment(linkId, content);
    if (response.data && response.data.success) {
      console.log('✅ Using real API for adding comment');
      return response;
    }
  } catch (error) {
    console.log('⚠️ Real API failed, using mock data for adding comment:', error.message);
  }

  // Fallback to mock data
  console.log('🎭 Adding mock comment');
  return {
    data: mockCommentsService.addMockComment(linkId, content)
  };
};

export default mockCommentsService;
