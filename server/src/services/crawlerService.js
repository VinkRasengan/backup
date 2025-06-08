const axios = require('axios');
const virusTotalService = require('./virusTotalService');
const scamAdviserService = require('./scamAdviserService');

class CrawlerService {
  constructor() {
    this.apiUrl = process.env.CRAWLER_API_URL;
    this.apiKey = process.env.CRAWLER_API_KEY;
  }
  async checkLink(url) {
    try {
      // Run security analyses in parallel for better performance
      console.log('Starting security analysis for:', url);
      const [virusTotalAnalysis, scamAdviserAnalysis] = await Promise.allSettled([
        virusTotalService.analyzeUrl(url),
        scamAdviserService.analyzeUrl(url)
      ]);

      // Process VirusTotal results
      const virusTotalData = virusTotalAnalysis.status === 'fulfilled' 
        ? virusTotalAnalysis.value 
        : { success: false, error: 'VirusTotal analysis failed' };

      // Process ScamAdviser results
      const scamAdviserData = scamAdviserAnalysis.status === 'fulfilled' 
        ? scamAdviserAnalysis.value 
        : { success: false, error: 'ScamAdviser analysis failed' };

      // Get content credibility analysis (mock implementation)
      const contentAnalysis = await this.mockCrawlerAPI(url);

      // Calculate enhanced security score combining both sources
      const combinedSecurityScore = this.calculateCombinedSecurityScore(
        virusTotalData,
        scamAdviserData
      );

      // Combine security and credibility scores
      const finalScore = this.calculateFinalScore(
        contentAnalysis.credibilityScore,
        combinedSecurityScore
      );

      return {
        url: url,
        status: 'completed',
        credibilityScore: contentAnalysis.credibilityScore,
        securityScore: combinedSecurityScore,
        finalScore: finalScore,
        sources: contentAnalysis.sources,
        summary: this.generateEnhancedSummary(contentAnalysis, virusTotalData, scamAdviserData),
        checkedAt: new Date().toISOString(),
        metadata: {
          title: contentAnalysis.title,
          domain: contentAnalysis.domain,
          publishDate: contentAnalysis.publishDate,
          author: contentAnalysis.author
        },
        security: {
          virusTotal: virusTotalData.success ? {
            threats: virusTotalData.threats,
            urlAnalysis: virusTotalData.urlAnalysis,
            domainAnalysis: virusTotalData.domainAnalysis,
            analyzedAt: virusTotalData.analyzedAt,
            securityScore: virusTotalData.securityScore
          } : {
            error: virusTotalData.error || 'VirusTotal analysis not available'
          },
          scamAdviser: scamAdviserData.success ? {
            trustScore: scamAdviserData.trustScore,
            riskLevel: scamAdviserData.riskLevel,
            riskFactors: scamAdviserData.riskFactors,
            details: scamAdviserData.details,
            analyzedAt: scamAdviserData.analyzedAt
          } : {
            error: scamAdviserData.error || 'ScamAdviser analysis not available'
          },
          combinedScore: combinedSecurityScore
        }
      };
    } catch (error) {
      console.error('Crawler service error:', error);
      throw new Error('Failed to check link credibility and security');
    }
  }
  /**
   * Calculate combined security score from multiple sources
   */  calculateCombinedSecurityScore(virusTotalData, scamAdviserData) {
    const scores = [];
    const weights = [];

    // Add VirusTotal score if available
    if (virusTotalData.success && virusTotalData.securityScore != null) {
      scores.push(virusTotalData.securityScore);
      weights.push(0.6); // Higher weight for VirusTotal (malware detection)
    }

    // Add ScamAdviser score if available
    if (scamAdviserData.success && scamAdviserData.trustScore != null) {
      const scamAdviserSecurityScore = scamAdviserService.convertToSecurityScore(
        scamAdviserData.trustScore, 
        scamAdviserData.riskLevel
      );
      scores.push(scamAdviserSecurityScore);
      weights.push(0.4); // Lower weight for ScamAdviser (trust/scam detection)
    }

    // If no scores available, return null
    if (scores.length === 0) {
      return null;
    }

    // If only one score available, return it
    if (scores.length === 1) {
      return scores[0];
    }

    // Calculate weighted average
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    const weightedSum = scores.reduce((sum, score, index) => sum + (score * weights[index]), 0);
    
    return Math.round(weightedSum / totalWeight);
  }
  /**
   * Calculate final score combining credibility and security
   */
  calculateFinalScore(credibilityScore, securityScore) {
    if (securityScore == null) {
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
  }/**
   * Generate enhanced summary including security information from multiple sources
   */
  generateEnhancedSummary(contentAnalysis, virusTotalData, scamAdviserData) {
    let summary = contentAnalysis.summary;

    // Add VirusTotal security information
    summary += this.addVirusTotalSummary(virusTotalData);

    // Add ScamAdviser security information
    summary += this.addScamAdviserSummary(scamAdviserData);

    // Add combined security assessment
    summary += this.addCombinedSecurityAssessment(virusTotalData.success, scamAdviserData.success);

    return summary;
  }

  /**
   * Add VirusTotal information to summary
   */
  addVirusTotalSummary(virusTotalData) {
    if (!virusTotalData.success) {
      return '';
    }

    const { threats } = virusTotalData;
    let vtSummary = '';

    if (threats.malicious) {
      vtSummary += '\n\n⚠️ CẢNH BÁO BẢO MẬT: URL này được VirusTotal phát hiện là độc hại.';
      if (threats.threatNames.length > 0) {
        vtSummary += ` Các mối đe dọa: ${threats.threatNames.join(', ')}.`;
      }
    } else if (threats.suspicious) {
      vtSummary += '\n\n⚠️ CẢNH BÁO: URL này được VirusTotal đánh dấu là đáng nghi ngờ.';
    }

    return vtSummary;
  }

  /**
   * Add ScamAdviser information to summary
   */
  addScamAdviserSummary(scamAdviserData) {
    if (!scamAdviserData.success) {
      return '';
    }

    const { trustScore, riskLevel, riskFactors } = scamAdviserData;
    let saSummary = '';

    const riskMessages = {
      'very_high': '\n\n🚨 CẢNH BÁO SCAM: ScamAdviser đánh giá trang web này có nguy cơ lừa đảo rất cao.',
      'high': '\n\n⚠️ CẢNH BÁO: ScamAdviser đánh giá trang web này có nguy cơ lừa đảo cao.',
      'medium': '\n\n⚠️ LƯU Ý: ScamAdviser đánh giá trang web này có nguy cơ lừa đảo trung bình.',
      'low': '\n\n✅ AN TOÀN: ScamAdviser đánh giá trang web này có độ tin cậy cao.'    };

    if (riskMessages[riskLevel]) {
      saSummary += riskMessages[riskLevel];
    }

    if (trustScore != null) {
      saSummary += ` Điểm tin cậy: ${trustScore}/100.`;
    }

    if (riskFactors?.length > 0) {
      saSummary += `\n\nCác yếu tố rủi ro được phát hiện: ${riskFactors.join(', ')}.`;
    }

    return saSummary;
  }

  /**
   * Add combined security assessment to summary
   */
  addCombinedSecurityAssessment(hasVirusTotal, hasScamAdviser) {
    if (hasVirusTotal && hasScamAdviser) {
      return '\n\n🔒 Đã thực hiện kiểm tra bảo mật toàn diện với VirusTotal và ScamAdviser.';
    } else if (hasVirusTotal) {
      return '\n\n🔒 Đã kiểm tra bảo mật với VirusTotal. ScamAdviser không khả dụng.';
    } else if (hasScamAdviser) {
      return '\n\n🔒 Đã kiểm tra độ tin cậy với ScamAdviser. VirusTotal không khả dụng.';
    } else {
      return '\n\nℹ️ Không thể thực hiện phân tích bảo mật chi tiết cho URL này.';
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
