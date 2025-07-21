const axios = require('axios');
const crypto = require('crypto');
const logger = require('../utils/logger');

// Load environment variables from root .env
require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });

// Logger already initialized

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
      logger.error('PhishTank API error', { error: error.message, url });
      return {
        success: false,
        error: 'PhishTank API unavailable',
        url,
        analyzedAt: new Date().toISOString()
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
