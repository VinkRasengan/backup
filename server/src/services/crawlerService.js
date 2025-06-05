const axios = require('axios');
const virusTotalService = require('./virusTotalService');

class CrawlerService {
  constructor() {
    this.apiUrl = process.env.CRAWLER_API_URL;
    this.apiKey = process.env.CRAWLER_API_KEY;
  }

  async checkLink(url) {
    try {
      // Get VirusTotal security analysis
      console.log('Starting VirusTotal analysis for:', url);
      const virusTotalAnalysis = await virusTotalService.analyzeUrl(url);

      // Get content credibility analysis (mock implementation)
      const contentAnalysis = await this.mockCrawlerAPI(url);

      // Combine security and credibility scores
      const finalScore = this.calculateFinalScore(
        contentAnalysis.credibilityScore,
        virusTotalAnalysis.success ? virusTotalAnalysis.securityScore : null
      );

      return {
        url: url,
        status: 'completed',
        credibilityScore: contentAnalysis.credibilityScore,
        securityScore: virusTotalAnalysis.success ? virusTotalAnalysis.securityScore : null,
        finalScore: finalScore,
        sources: contentAnalysis.sources,
        summary: this.generateEnhancedSummary(contentAnalysis, virusTotalAnalysis),
        checkedAt: new Date().toISOString(),
        metadata: {
          title: contentAnalysis.title,
          domain: contentAnalysis.domain,
          publishDate: contentAnalysis.publishDate,
          author: contentAnalysis.author
        },
        security: virusTotalAnalysis.success ? {
          threats: virusTotalAnalysis.threats,
          urlAnalysis: virusTotalAnalysis.urlAnalysis,
          domainAnalysis: virusTotalAnalysis.domainAnalysis,
          analyzedAt: virusTotalAnalysis.analyzedAt
        } : {
          error: virusTotalAnalysis.error || 'Security analysis not available'
        }
      };
    } catch (error) {
      console.error('Crawler service error:', error);
      throw new Error('Failed to check link credibility and security');
    }
  }

  /**
   * Calculate final score combining credibility and security
   */
  calculateFinalScore(credibilityScore, securityScore) {
    if (securityScore === null) {
      return credibilityScore; // Use only credibility if security analysis failed
    }

    // If security score is very low (< 30), heavily penalize final score
    if (securityScore < 30) {
      return Math.min(credibilityScore * 0.3, 25);
    }

    // If security score is low (30-60), moderately penalize
    if (securityScore < 60) {
      return Math.round((credibilityScore * 0.7) + (securityScore * 0.3));
    }

    // If security score is good (60+), use weighted average
    return Math.round((credibilityScore * 0.6) + (securityScore * 0.4));
  }

  /**
   * Generate enhanced summary including security information
   */
  generateEnhancedSummary(contentAnalysis, virusTotalAnalysis) {
    let summary = contentAnalysis.summary;

    if (virusTotalAnalysis.success) {
      const { threats, securityScore } = virusTotalAnalysis;

      if (threats.malicious) {
        summary += '\n\n⚠️ CẢNH BÁO BẢO MẬT: URL này được phát hiện là độc hại bởi các công cụ bảo mật.';
        if (threats.threatNames.length > 0) {
          summary += ` Các mối đe dọa được phát hiện: ${threats.threatNames.join(', ')}.`;
        }
      } else if (threats.suspicious) {
        summary += '\n\n⚠️ CẢNH BÁO: URL này được đánh dấu là đáng nghi ngờ bởi một số công cụ bảo mật.';
      } else if (securityScore >= 80) {
        summary += '\n\n✅ BẢO MẬT: URL này được đánh giá là an toàn bởi các công cụ bảo mật.';
      }

      summary += ` Điểm bảo mật: ${securityScore}/100.`;
    } else {
      summary += '\n\nℹ️ Không thể thực hiện phân tích bảo mật cho URL này.';
    }

    return summary;
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

    let credibilityScore;

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
          credibility: this.getCredibilityLevel(credibilityScore, 70, 40)
        },
        {
          name: 'Secondary Source',
          url: 'https://example.com/source2',
          credibility: this.getCredibilityLevel(credibilityScore, 60, 30)
        }
      ]
    };
  }

  /**
   * Helper method to determine credibility level
   */
  getCredibilityLevel(score, highThreshold, mediumThreshold) {
    if (score > highThreshold) return 'high';
    if (score > mediumThreshold) return 'medium';
    return 'low';
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
