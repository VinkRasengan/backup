const axios = require('axios');

class CrawlerService {
  constructor() {
    this.apiUrl = process.env.CRAWLER_API_URL;
    this.apiKey = process.env.CRAWLER_API_KEY;
  }

  async checkLink(url) {
    try {
      // Mock implementation - replace with actual crawler API
      const response = await this.mockCrawlerAPI(url);
      
      return {
        url: url,
        status: 'completed',
        credibilityScore: response.credibilityScore,
        sources: response.sources,
        summary: response.summary,
        checkedAt: new Date().toISOString(),
        metadata: {
          title: response.title,
          domain: response.domain,
          publishDate: response.publishDate,
          author: response.author
        }
      };
    } catch (error) {
      console.error('Crawler service error:', error);
      throw new Error('Failed to check link credibility');
    }
  }

  // Mock implementation - replace with actual API call
  async mockCrawlerAPI(url) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const domain = new URL(url).hostname;
    
    // Mock credibility scoring based on domain
    const trustedDomains = [
      'bbc.com', 'reuters.com', 'ap.org', 'npr.org', 
      'cnn.com', 'nytimes.com', 'washingtonpost.com'
    ];
    
    const questionableDomains = [
      'example-fake-news.com', 'unreliable-source.net'
    ];

    let credibilityScore = 50; // Default neutral score
    
    if (trustedDomains.some(trusted => domain.includes(trusted))) {
      credibilityScore = Math.floor(Math.random() * 20) + 80; // 80-100
    } else if (questionableDomains.some(questionable => domain.includes(questionable))) {
      credibilityScore = Math.floor(Math.random() * 30) + 10; // 10-40
    } else {
      credibilityScore = Math.floor(Math.random() * 40) + 40; // 40-80
    }

    return {
      credibilityScore,
      title: `Sample Article Title from ${domain}`,
      domain,
      publishDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      author: 'Sample Author',
      summary: `This is a sample summary of the article content. The credibility score is ${credibilityScore}/100 based on source reliability and content analysis.`,
      sources: [
        {
          name: 'Primary Source',
          url: 'https://example.com/source1',
          credibility: credibilityScore > 70 ? 'high' : credibilityScore > 40 ? 'medium' : 'low'
        },
        {
          name: 'Secondary Source',
          url: 'https://example.com/source2',
          credibility: credibilityScore > 60 ? 'high' : credibilityScore > 30 ? 'medium' : 'low'
        }
      ]
    };
  }

  // Real API implementation template
  async realCrawlerAPI(url) {
    const config = {
      method: 'POST',
      url: `${this.apiUrl}/check`,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      data: {
        url: url,
        options: {
          includeMetadata: true,
          includeSources: true,
          timeout: 30000
        }
      }
    };

    const response = await axios(config);
    return response.data;
  }
}

module.exports = new CrawlerService();
