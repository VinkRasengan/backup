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
      logger.error('IPQualityScore API error', { error: error.message, url });
      return {
        success: false,
        error: 'IPQualityScore API unavailable',
        url,
        analyzedAt: new Date().toISOString()
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
      logger.error('IPQualityScore IP API error', { error: error.message, ip });
      return {
        success: false,
        error: 'IPQualityScore API unavailable',
        ip,
        analyzedAt: new Date().toISOString()
      };
    }
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
