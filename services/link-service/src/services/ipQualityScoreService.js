const axios = require('axios');
const crypto = require('crypto');
const Logger = require('../../shared/utils/logger');

const logger = new Logger('link-service');

class IPQualityScoreService {
  constructor() {
    this.apiKey = process.env.IPQUALITYSCORE_API_KEY;
    this.baseUrl = 'https://ipqualityscore.com/api/json/url';
    this.timeout = 10000;
  }

  /**
   * Check URL with IPQualityScore
   */
  async checkUrl(url) {
    try {
      if (!this.apiKey) {
        return this.getMockResult(url);
      }

      const response = await axios.get(`${this.baseUrl}/${this.apiKey}/${encodeURIComponent(url)}`, {
        params: {
          strictness: 1,
          fast: true
        },
        timeout: this.timeout
      });

      const data = response.data;

      if (data.success) {
        return {
          success: true,
          url,
          riskScore: data.risk_score || 0,
          isSuspicious: data.suspicious || false,
          isMalware: data.malware || false,
          isPhishing: data.phishing || false,
          isProxy: data.proxy || false,
          isVPN: data.vpn || false,
          countryCode: data.country_code || 'unknown',
          language: data.language || 'unknown',
          category: data.category || 'unknown',
          domainAge: data.domain_age || null,
          analyzedAt: new Date().toISOString()
        };
      } else {
        throw new Error(data.message || 'IPQualityScore API error');
      }

    } catch (error) {
      logger.warn('IPQualityScore API error', { error: error.message, url });
      return this.getMockResult(url);
    }
  }

  /**
   * Get mock result when API is not available
   */
  getMockResult(url) {
    try {
      const domain = new URL(url).hostname;
      const hash = crypto.createHash('md5').update(url).digest('hex');
      const riskScore = parseInt(hash.substring(0, 2), 16) % 100;

      // Simulate various risk factors
      const isSuspicious = riskScore > 70;
      const isMalware = riskScore > 85;
      const isPhishing = riskScore > 90;
      const isProxy = parseInt(hash.substring(2, 4), 16) % 100 > 80;
      const isVPN = parseInt(hash.substring(4, 6), 16) % 100 > 85;

      // Mock country codes
      const countries = ['US', 'CN', 'RU', 'DE', 'GB', 'FR', 'JP', 'CA', 'AU', 'BR'];
      const countryCode = countries[parseInt(hash.substring(6, 8), 16) % countries.length];

      // Mock categories
      const categories = ['Business', 'Technology', 'News', 'Entertainment', 'Shopping', 'Social Media', 'Unknown'];
      const category = categories[parseInt(hash.substring(8, 10), 16) % categories.length];

      return {
        success: true,
        url,
        riskScore,
        isSuspicious,
        isMalware,
        isPhishing,
        isProxy,
        isVPN,
        countryCode,
        language: 'en',
        category,
        domainAge: Math.floor(Math.random() * 3650) + 30, // 30-3650 days
        mock: true,
        analyzedAt: new Date().toISOString()
      };

    } catch (error) {
      return {
        success: false,
        error: 'Invalid URL format',
        url
      };
    }
  }

  /**
   * Check IP address
   */
  async checkIP(ip) {
    try {
      if (!this.apiKey) {
        return this.getMockIPResult(ip);
      }

      const response = await axios.get(`https://ipqualityscore.com/api/json/ip/${this.apiKey}/${ip}`, {
        params: {
          strictness: 1,
          allow_public_access_points: true,
          fast: true
        },
        timeout: this.timeout
      });

      const data = response.data;

      if (data.success) {
        return {
          success: true,
          ip,
          fraudScore: data.fraud_score || 0,
          countryCode: data.country_code || 'unknown',
          region: data.region || 'unknown',
          city: data.city || 'unknown',
          isp: data.ISP || 'unknown',
          isProxy: data.proxy || false,
          isVPN: data.vpn || false,
          isTor: data.tor || false,
          isCrawler: data.crawler || false,
          analyzedAt: new Date().toISOString()
        };
      } else {
        throw new Error(data.message || 'IPQualityScore IP API error');
      }

    } catch (error) {
      logger.warn('IPQualityScore IP API error', { error: error.message, ip });
      return this.getMockIPResult(ip);
    }
  }

  /**
   * Get mock IP result
   */
  getMockIPResult(ip) {
    const hash = crypto.createHash('md5').update(ip).digest('hex');
    const fraudScore = parseInt(hash.substring(0, 2), 16) % 100;

    const countries = ['US', 'CN', 'RU', 'DE', 'GB', 'FR', 'JP', 'CA', 'AU', 'BR'];
    const countryCode = countries[parseInt(hash.substring(2, 4), 16) % countries.length];

    return {
      success: true,
      ip,
      fraudScore,
      countryCode,
      region: 'Mock Region',
      city: 'Mock City',
      isp: 'Mock ISP',
      isProxy: fraudScore > 80,
      isVPN: fraudScore > 85,
      isTor: fraudScore > 95,
      isCrawler: fraudScore < 10,
      mock: true,
      analyzedAt: new Date().toISOString()
    };
  }

  /**
   * Get service status
   */
  async getStatus() {
    try {
      if (!this.apiKey) {
        return {
          available: false,
          error: 'No API key configured',
          mock: true
        };
      }

      // Test with a known safe URL
      const response = await axios.get(`${this.baseUrl}/${this.apiKey}/${encodeURIComponent('https://google.com')}`, {
        params: { fast: true },
        timeout: 5000
      });

      return {
        available: response.data.success,
        mock: false,
        lastTest: new Date().toISOString()
      };

    } catch (error) {
      return {
        available: false,
        error: error.message,
        mock: true
      };
    }
  }
}

module.exports = new IPQualityScoreService();
