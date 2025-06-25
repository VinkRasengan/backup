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
    const { category = 'technology', limit = 10 } = params;

    try {
      // Fetch from real APIs
      const newsAPIResults = await this.fetchFromNewsAPI({ category, pageSize: Math.ceil(limit / 2) });
      const newsDataResults = await this.fetchFromNewsData({ category, size: Math.ceil(limit / 2) });

      const combinedResults = [...newsAPIResults, ...newsDataResults];

      if (combinedResults.length > 0) {
        return combinedResults.slice(0, limit);
      }

      // If no results from APIs, return empty array
      console.warn('No news data available from APIs');
      return [];
    } catch (error) {
      console.error('Failed to fetch news from APIs:', error);
      return [];
    }
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
