// News Service for fetching real news data
class NewsService {
  constructor() {
    this.newsAPIs = {
      // NewsAPI.org - Free tier: 100 requests/day
      newsAPI: {
        baseUrl: 'https://newsapi.org/v2',
        apiKey: process.env.REACT_APP_NEWS_API_KEY || 'demo', // Replace with real key
        endpoints: {
          topHeadlines: '/top-headlines',
          everything: '/everything'
        }
      },
      // NewsData.io - Free tier: 200 requests/day
      newsData: {
        baseUrl: 'https://newsdata.io/api/1',
        apiKey: process.env.REACT_APP_NEWSDATA_API_KEY || 'demo',
        endpoints: {
          news: '/news'
        }
      }
    };

    this.mockNews = this.generateMockNews();
  }

  generateMockNews() {
    return [
      {
        id: 'news1',
        title: 'Cảnh báo: Xuất hiện chiêu thức lừa đảo mới qua tin nhắn SMS giả mạo ngân hàng',
        description: 'Ngân hàng Nhà nước cảnh báo về hình thức lừa đảo mới qua tin nhắn SMS giả mạo các ngân hàng, yêu cầu khách hàng cập nhật thông tin tài khoản.',
        content: 'Theo thông tin từ Ngân hàng Nhà nước Việt Nam, thời gian gần đây xuất hiện nhiều trường hợp khách hàng nhận được tin nhắn SMS giả mạo từ các ngân hàng...',
        url: 'https://vnexpress.net/canh-bao-lua-dao-sms-gia-mao-ngan-hang',
        urlToImage: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=200&fit=crop',
        publishedAt: new Date(Date.now() - 1800000), // 30 minutes ago
        source: {
          id: 'vnexpress',
          name: 'VnExpress'
        },
        author: 'Phạm Hương',
        category: 'technology',
        tags: ['lừa đảo', 'SMS', 'ngân hàng', 'an toàn'],
        trustScore: 95,
        type: 'news'
      },
      {
        id: 'news2',
        title: 'Bộ Công an triệt phá đường dây lừa đảo qua mạng xã hội với số tiền hơn 50 tỷ đồng',
        description: 'Cơ quan chức năng đã bắt giữ 15 đối tượng trong đường dây lừa đảo chiếm đoạt tài sản qua các nền tảng mạng xã hội.',
        content: 'Phòng An ninh mạng và phòng chống tội phạm công nghệ cao, Công an TP.HCM cho biết đã triệt phá thành công đường dây lừa đảo...',
        url: 'https://tuoitre.vn/triet-pha-duong-day-lua-dao-mang-xa-hoi-50-ty',
        urlToImage: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=200&fit=crop',
        publishedAt: new Date(Date.now() - 3600000), // 1 hour ago
        source: {
          id: 'tuoitre',
          name: 'Tuổi Trẻ'
        },
        author: 'Minh Châu',
        category: 'general',
        tags: ['lừa đảo', 'mạng xã hội', 'công an', 'triệt phá'],
        trustScore: 98,
        type: 'news'
      },
      {
        id: 'news3',
        title: 'Cảnh báo ứng dụng giả mạo ví điện tử trên các cửa hàng ứng dụng',
        description: 'Cục An toàn thông tin phát hiện nhiều ứng dụng giả mạo các ví điện tử phổ biến, có thể đánh cắp thông tin người dùng.',
        content: 'Cục An toàn thông tin (Bộ TT&TT) vừa phát đi cảnh báo về tình trạng xuất hiện nhiều ứng dụng giả mạo...',
        url: 'https://dantri.com.vn/canh-bao-ung-dung-gia-mao-vi-dien-tu',
        urlToImage: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=200&fit=crop',
        publishedAt: new Date(Date.now() - 5400000), // 1.5 hours ago
        source: {
          id: 'dantri',
          name: 'Dân Trí'
        },
        author: 'Hoàng Nam',
        category: 'technology',
        tags: ['ứng dụng', 'ví điện tử', 'giả mạo', 'an toàn'],
        trustScore: 92,
        type: 'news'
      },
      {
        id: 'news4',
        title: 'Hướng dẫn bảo vệ thông tin cá nhân khi mua sắm online',
        description: 'Chuyên gia an ninh mạng chia sẻ những lưu ý quan trọng để bảo vệ thông tin cá nhân khi giao dịch trực tuyến.',
        content: 'Với sự phát triển mạnh mẽ của thương mại điện tử, việc bảo vệ thông tin cá nhân khi mua sắm online trở nên...',
        url: 'https://vietnamnet.vn/huong-dan-bao-ve-thong-tin-mua-sam-online',
        urlToImage: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=200&fit=crop',
        publishedAt: new Date(Date.now() - 7200000), // 2 hours ago
        source: {
          id: 'vietnamnet',
          name: 'VietnamNet'
        },
        author: 'Thu Hà',
        category: 'technology',
        tags: ['mua sắm online', 'bảo mật', 'thông tin cá nhân'],
        trustScore: 88,
        type: 'news'
      },
      {
        id: 'news5',
        title: 'Ngân hàng Nhà nước cảnh báo về tiền điện tử lừa đảo',
        description: 'NHNN khuyến cáo người dân cảnh giác với các dự án tiền điện tử hứa hẹn lợi nhuận cao, có dấu hiệu lừa đảo.',
        content: 'Ngân hàng Nhà nước Việt Nam tiếp tục cảnh báo về các rủi ro từ việc đầu tư vào tiền điện tử...',
        url: 'https://cafef.vn/ngan-hang-nha-nuoc-canh-bao-tien-dien-tu-lua-dao',
        urlToImage: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=400&h=200&fit=crop',
        publishedAt: new Date(Date.now() - 10800000), // 3 hours ago
        source: {
          id: 'cafef',
          name: 'CafeF'
        },
        author: 'Minh Quân',
        category: 'business',
        tags: ['tiền điện tử', 'lừa đảo', 'NHNN', 'cảnh báo'],
        trustScore: 96,
        type: 'news'
      },
      {
        id: 'news6',
        title: 'Phát hiện website giả mạo cơ quan thuế để lừa đảo',
        description: 'Tổng cục Thuế cảnh báo về website giả mạo có giao diện tương tự trang chính thức, yêu cầu người dân cung cấp thông tin.',
        content: 'Tổng cục Thuế vừa phát đi thông báo cảnh báo về việc xuất hiện website giả mạo...',
        url: 'https://baochinhphu.vn/website-gia-mao-co-quan-thue-lua-dao',
        urlToImage: 'https://images.unsplash.com/photo-1554224154-26032fced8bd?w=400&h=200&fit=crop',
        publishedAt: new Date(Date.now() - 14400000), // 4 hours ago
        source: {
          id: 'baochinhphu',
          name: 'Báo Chính phủ'
        },
        author: 'Văn Đức',
        category: 'general',
        tags: ['website giả', 'cơ quan thuế', 'lừa đảo'],
        trustScore: 99,
        type: 'news'
      }
    ];
  }

  // Fetch news from NewsAPI.org
  async fetchFromNewsAPI(params = {}) {
    const { category = 'technology', country = 'us', pageSize = 10 } = params;
    
    try {
      const url = `${this.newsAPIs.newsAPI.baseUrl}${this.newsAPIs.newsAPI.endpoints.topHeadlines}?country=${country}&category=${category}&pageSize=${pageSize}&apiKey=${this.newsAPIs.newsAPI.apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'ok') {
        return data.articles.map(article => ({
          id: `newsapi_${Date.now()}_${Math.random()}`,
          title: article.title,
          description: article.description,
          content: article.content,
          url: article.url,
          urlToImage: article.urlToImage,
          publishedAt: new Date(article.publishedAt),
          source: article.source,
          author: article.author,
          category: category,
          tags: this.extractTags(article.title + ' ' + article.description),
          trustScore: this.calculateTrustScore(article.source.name),
          type: 'news'
        }));
      }
    } catch (error) {
      console.warn('NewsAPI fetch failed:', error);
    }
    
    return [];
  }

  // Fetch news from NewsData.io
  async fetchFromNewsData(params = {}) {
    const { category = 'technology', country = 'vi', size = 10 } = params;
    
    try {
      const url = `${this.newsAPIs.newsData.baseUrl}${this.newsAPIs.newsData.endpoints.news}?apikey=${this.newsAPIs.newsData.apiKey}&country=${country}&category=${category}&size=${size}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'success') {
        return data.results.map(article => ({
          id: `newsdata_${Date.now()}_${Math.random()}`,
          title: article.title,
          description: article.description,
          content: article.content,
          url: article.link,
          urlToImage: article.image_url,
          publishedAt: new Date(article.pubDate),
          source: {
            id: article.source_id,
            name: article.source_id
          },
          author: article.creator?.[0] || 'Unknown',
          category: category,
          tags: article.keywords || [],
          trustScore: this.calculateTrustScore(article.source_id),
          type: 'news'
        }));
      }
    } catch (error) {
      console.warn('NewsData fetch failed:', error);
    }
    
    return [];
  }

  // Extract tags from text
  extractTags(text) {
    const keywords = ['lừa đảo', 'an toàn', 'bảo mật', 'ngân hàng', 'tiền điện tử', 'phishing', 'malware', 'virus', 'hack', 'scam'];
    const foundTags = [];
    
    keywords.forEach(keyword => {
      if (text.toLowerCase().includes(keyword.toLowerCase())) {
        foundTags.push(keyword);
      }
    });
    
    return foundTags;
  }

  // Calculate trust score based on source
  calculateTrustScore(sourceName) {
    const trustedSources = {
      'vnexpress': 95,
      'tuoitre': 98,
      'dantri': 92,
      'vietnamnet': 88,
      'cafef': 96,
      'baochinhphu': 99,
      'bbc': 98,
      'reuters': 97,
      'ap': 96
    };
    
    const sourceKey = sourceName.toLowerCase().replace(/[^a-z]/g, '');
    return trustedSources[sourceKey] || 75;
  }

  // Main method to get news
  async getNews(params = {}) {
    const { useRealAPI = false, category = 'technology', limit = 10 } = params;
    
    if (useRealAPI) {
      try {
        // Try to fetch from real APIs
        const newsAPIResults = await this.fetchFromNewsAPI({ category, pageSize: Math.ceil(limit / 2) });
        const newsDataResults = await this.fetchFromNewsData({ category, size: Math.ceil(limit / 2) });
        
        const combinedResults = [...newsAPIResults, ...newsDataResults];
        
        if (combinedResults.length > 0) {
          return combinedResults.slice(0, limit);
        }
      } catch (error) {
        console.warn('Real API failed, using mock data:', error);
      }
    }
    
    // Fallback to mock data
    console.log('🎭 Using mock news data');
    return this.mockNews.slice(0, limit);
  }

  // Get news by category
  async getNewsByCategory(category, limit = 5) {
    const allNews = await this.getNews({ limit: 20 });
    return allNews.filter(news => news.category === category).slice(0, limit);
  }

  // Search news
  async searchNews(query, limit = 10) {
    const allNews = await this.getNews({ limit: 50 });
    const searchResults = allNews.filter(news => 
      news.title.toLowerCase().includes(query.toLowerCase()) ||
      news.description.toLowerCase().includes(query.toLowerCase()) ||
      news.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    );
    
    return searchResults.slice(0, limit);
  }
}

// Create singleton instance
const newsService = new NewsService();

export default newsService;
