const axios = require('axios');
const cheerio = require('cheerio');
const crypto = require('crypto');
const Logger = require('../../shared/utils/logger');

const logger = new Logger('link-service');

class CrawlerService {
  constructor() {
    this.timeout = 15000;
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
  }

  /**
   * Mock crawler API for content analysis
   */
  async mockCrawlerAPI(url) {
    try {
      // Try to fetch real content first
      const content = await this.fetchContent(url);
      if (content.success) {
        return this.analyzeContent(url, content.data);
      }
    } catch (error) {
      logger.warn('Content fetch failed, using mock data', { url, error: error.message });
    }

    // Fallback to mock data
    return this.generateMockAnalysis(url);
  }

  /**
   * Fetch content from URL
   */
  async fetchContent(url) {
    try {
      const response = await axios.get(url, {
        timeout: this.timeout,
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive'
        },
        maxRedirects: 5,
        validateStatus: (status) => status < 400
      });

      return {
        success: true,
        data: {
          html: response.data,
          headers: response.headers,
          status: response.status,
          finalUrl: response.request.res.responseUrl || url
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Analyze content from fetched HTML
   */
  analyzeContent(url, contentData) {
    try {
      const $ = cheerio.load(contentData.html);
      
      // Extract metadata
      const title = this.extractTitle($);
      const description = this.extractDescription($);
      const keywords = this.extractKeywords($);
      const language = this.detectLanguage($);
      
      // Analyze content quality
      const contentQuality = this.analyzeContentQuality($);
      const technicalFactors = this.analyzeTechnicalFactors(contentData);
      
      // Calculate credibility score
      const credibilityScore = this.calculateCredibilityScore({
        title,
        description,
        contentQuality,
        technicalFactors,
        url
      });

      return {
        url,
        title: title || this.generateTitleFromUrl(url),
        description: description || 'No description available',
        keywords,
        language,
        credibilityScore,
        contentQuality,
        technicalFactors,
        analyzedAt: new Date().toISOString()
      };

    } catch (error) {
      logger.warn('Content analysis failed', { url, error: error.message });
      return this.generateMockAnalysis(url);
    }
  }

  /**
   * Extract title from HTML
   */
  extractTitle($) {
    return $('title').text().trim() ||
           $('meta[property="og:title"]').attr('content') ||
           $('meta[name="twitter:title"]').attr('content') ||
           $('h1').first().text().trim();
  }

  /**
   * Extract description from HTML
   */
  extractDescription($) {
    return $('meta[name="description"]').attr('content') ||
           $('meta[property="og:description"]').attr('content') ||
           $('meta[name="twitter:description"]').attr('content') ||
           $('p').first().text().trim().substring(0, 200);
  }

  /**
   * Extract keywords from HTML
   */
  extractKeywords($) {
    const keywords = $('meta[name="keywords"]').attr('content');
    return keywords ? keywords.split(',').map(k => k.trim()) : [];
  }

  /**
   * Detect language
   */
  detectLanguage($) {
    return $('html').attr('lang') || 
           $('meta[http-equiv="content-language"]').attr('content') || 
           'en';
  }

  /**
   * Analyze content quality
   */
  analyzeContentQuality($) {
    const textContent = $('body').text().trim();
    const wordCount = textContent.split(/\s+/).length;
    const paragraphs = $('p').length;
    const headings = $('h1, h2, h3, h4, h5, h6').length;
    const images = $('img').length;
    const links = $('a').length;

    return {
      wordCount,
      paragraphs,
      headings,
      images,
      links,
      hasStructure: headings > 0 && paragraphs > 2,
      contentRatio: this.calculateContentRatio(textContent, $('body').html())
    };
  }

  /**
   * Analyze technical factors
   */
  analyzeTechnicalFactors(contentData) {
    const headers = contentData.headers;
    
    return {
      hasSSL: contentData.finalUrl.startsWith('https://'),
      statusCode: contentData.status,
      hasSecurityHeaders: !!(headers['strict-transport-security'] || headers['x-frame-options']),
      contentType: headers['content-type'] || 'unknown',
      serverInfo: headers['server'] || 'unknown',
      responseTime: Date.now() // Mock response time
    };
  }

  /**
   * Calculate content to HTML ratio
   */
  calculateContentRatio(textContent, htmlContent) {
    if (!htmlContent) return 0;
    return Math.round((textContent.length / htmlContent.length) * 100);
  }

  /**
   * Calculate credibility score
   */
  calculateCredibilityScore(factors) {
    let score = 50; // Base score

    // Title quality
    if (factors.title && factors.title.length > 10) score += 10;
    if (factors.title && factors.title.length > 30) score += 5;

    // Description quality
    if (factors.description && factors.description.length > 50) score += 10;

    // Content quality
    if (factors.contentQuality.wordCount > 300) score += 10;
    if (factors.contentQuality.hasStructure) score += 10;
    if (factors.contentQuality.contentRatio > 20) score += 5;

    // Technical factors
    if (factors.technicalFactors.hasSSL) score += 10;
    if (factors.technicalFactors.hasSecurityHeaders) score += 5;
    if (factors.technicalFactors.statusCode === 200) score += 5;

    // URL quality
    const domain = new URL(factors.url).hostname;
    if (domain.includes('.gov') || domain.includes('.edu')) score += 15;
    if (domain.includes('.org')) score += 10;
    if (domain.split('.').length <= 3) score += 5; // Not too many subdomains

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Generate mock analysis when real content is not available
   */
  generateMockAnalysis(url) {
    try {
      const domain = new URL(url).hostname;
      const hash = crypto.createHash('md5').update(url).digest('hex');
      const credibilityScore = 30 + (parseInt(hash.substring(0, 2), 16) % 60); // 30-90 range

      return {
        url,
        title: this.generateTitleFromUrl(url),
        description: `Content analysis for ${domain}. This is a mock description generated for testing purposes.`,
        keywords: ['mock', 'analysis', 'testing'],
        language: 'en',
        credibilityScore,
        contentQuality: {
          wordCount: 500 + (parseInt(hash.substring(2, 4), 16) % 1000),
          paragraphs: 5 + (parseInt(hash.substring(4, 6), 16) % 10),
          headings: 2 + (parseInt(hash.substring(6, 8), 16) % 5),
          images: parseInt(hash.substring(8, 10), 16) % 10,
          links: 10 + (parseInt(hash.substring(10, 12), 16) % 20),
          hasStructure: credibilityScore > 50,
          contentRatio: 20 + (parseInt(hash.substring(12, 14), 16) % 30)
        },
        technicalFactors: {
          hasSSL: url.startsWith('https://'),
          statusCode: 200,
          hasSecurityHeaders: credibilityScore > 60,
          contentType: 'text/html; charset=utf-8',
          serverInfo: 'nginx/1.18.0',
          responseTime: 200 + (parseInt(hash.substring(14, 16), 16) % 800)
        },
        mock: true,
        analyzedAt: new Date().toISOString()
      };

    } catch (error) {
      return {
        url,
        title: 'Invalid URL',
        description: 'Unable to analyze invalid URL',
        credibilityScore: 0,
        error: error.message
      };
    }
  }

  /**
   * Generate title from URL
   */
  generateTitleFromUrl(url) {
    try {
      const domain = new URL(url).hostname;
      const path = new URL(url).pathname;
      
      if (path && path !== '/') {
        const pathParts = path.split('/').filter(p => p);
        const lastPart = pathParts[pathParts.length - 1];
        return `${lastPart.replace(/[-_]/g, ' ')} - ${domain}`;
      }
      
      return `Homepage - ${domain}`;
    } catch (error) {
      return 'Unknown Page';
    }
  }

  /**
   * Calculate final score combining credibility and security
   */
  calculateFinalScore(credibilityScore, securityScore) {
    // Weighted average: 60% credibility, 40% security
    return Math.round((credibilityScore * 0.6) + (securityScore * 0.4));
  }

  /**
   * Get service status
   */
  async getStatus() {
    try {
      // Test with a reliable URL
      const testResult = await this.fetchContent('https://google.com');
      
      return {
        available: testResult.success,
        error: testResult.error || null,
        lastTest: new Date().toISOString()
      };

    } catch (error) {
      return {
        available: false,
        error: error.message
      };
    }
  }
}

module.exports = new CrawlerService();
