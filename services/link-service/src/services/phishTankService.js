const axios = require('axios');
const crypto = require('crypto');
const Logger = require('../../shared/utils/logger');

const logger = new Logger('link-service');

class PhishTankService {
  constructor() {
    this.baseUrl = 'https://checkurl.phishtank.com/checkurl/';
    this.timeout = 10000;
  }

  /**
   * Check URL against PhishTank database
   */
  async checkUrl(url) {
    try {
      // PhishTank requires POST request with form data
      const response = await axios.post(this.baseUrl, 
        new URLSearchParams({
          url: url,
          format: 'json',
          app_key: process.env.PHISHTANK_API_KEY || 'demo'
        }), {
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Anti-Fraud-Platform/1.0'
          }
        }
      );

      const data = response.data;

      if (data.meta && data.meta.status === 'success') {
        return {
          success: true,
          url,
          isPhishing: data.results.in_database && data.results.valid,
          phishId: data.results.phish_id || null,
          phishDetailUrl: data.results.phish_detail_url || null,
          verifiedAt: data.results.verified_at || null,
          analyzedAt: new Date().toISOString()
        };
      } else {
        throw new Error(data.meta?.error || 'PhishTank API error');
      }

    } catch (error) {
      logger.warn('PhishTank API error', { error: error.message, url });
      return this.getMockResult(url);
    }
  }

  /**
   * Get mock result when API is not available
   */
  getMockResult(url) {
    try {
      const hash = crypto.createHash('md5').update(url).digest('hex');
      const riskScore = parseInt(hash.substring(0, 2), 16) % 100;

      // Simulate some URLs being flagged as phishing
      const isPhishing = riskScore > 95; // 5% chance of being flagged

      return {
        success: true,
        url,
        isPhishing,
        phishId: isPhishing ? `mock-${hash.substring(0, 8)}` : null,
        phishDetailUrl: isPhishing ? `https://phishtank.com/phish_detail.php?phish_id=mock-${hash.substring(0, 8)}` : null,
        verifiedAt: isPhishing ? new Date().toISOString() : null,
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
   * Get service status
   */
  async getStatus() {
    try {
      // Test with a known safe URL
      const response = await axios.post(this.baseUrl, 
        new URLSearchParams({
          url: 'https://google.com',
          format: 'json',
          app_key: process.env.PHISHTANK_API_KEY || 'demo'
        }), {
          timeout: 5000,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Anti-Fraud-Platform/1.0'
          }
        }
      );

      return {
        available: response.data.meta?.status === 'success',
        mock: !process.env.PHISHTANK_API_KEY,
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

module.exports = new PhishTankService();
