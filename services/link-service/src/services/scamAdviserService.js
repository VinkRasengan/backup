const axios = require('axios');
const crypto = require('crypto');
const logger = require('../utils/logger');

// Logger already initialized

class ScamAdviserService {
  constructor() {
    this.apiKey = process.env.SCAMADVISER_API_KEY;
    this.baseUrl = 'https://api.scamadviser.com';
    this.timeout = 15000;
  }

  /**
   * Analyze URL with ScamAdviser
   */
  async analyzeUrl(url) {
    try {
      if (!this.apiKey) {
        return this.getMockResult(url);
      }

      const domain = new URL(url).hostname;
      
      const response = await axios.get(`${this.baseUrl}/v1/check`, {
        params: {
          url: domain,
          key: this.apiKey
        },
        timeout: this.timeout
      });

      const data = response.data;

      if (data.success) {
        return {
          success: true,
          url,
          domain,
          trustScore: data.trustscore || 50,
          riskLevel: this.calculateRiskLevel(data.trustscore),
          details: {
            countryCode: data.country_code,
            serverLocation: data.server_location,
            domainAge: data.domain_age,
            httpsValid: data.https_valid,
            suspiciousActivity: data.suspicious_activity,
            malwareDetected: data.malware_detected
          },
          analyzedAt: new Date().toISOString()
        };
      } else {
        throw new Error(data.message || 'ScamAdviser API error');
      }

    } catch (error) {
      logger.warn('ScamAdviser API error', { error: error.message, url });
      return this.getMockResult(url);
    }
  }

  /**
   * Calculate risk level from trust score
   */
  calculateRiskLevel(trustScore) {
    if (trustScore >= 80) return 'low';
    if (trustScore >= 60) return 'medium';
    if (trustScore >= 40) return 'high';
    return 'critical';
  }

  /**
   * Get mock result when API is not available
   */
  getMockResult(url) {
    try {
      const domain = new URL(url).hostname;
      const hash = crypto.createHash('md5').update(domain).digest('hex');
      const trustScore = 30 + (parseInt(hash.substring(0, 2), 16) % 60); // 30-90 range

      // Simulate some domains being flagged
      let suspiciousActivity = false;
      let malwareDetected = false;

      if (trustScore < 40) {
        suspiciousActivity = true;
      }
      if (trustScore < 30) {
        malwareDetected = true;
      }

      return {
        success: true,
        url,
        domain,
        trustScore,
        riskLevel: this.calculateRiskLevel(trustScore),
        details: {
          countryCode: 'US',
          serverLocation: 'United States',
          domainAge: Math.floor(Math.random() * 3650) + 30, // 30-3650 days
          httpsValid: trustScore > 50,
          suspiciousActivity,
          malwareDetected
        },
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
   * Check URL (alias for analyzeUrl)
   */
  async checkUrl(url) {
    return this.analyzeUrl(url);
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

      // Test API with a simple request
      const response = await axios.get(`${this.baseUrl}/v1/check`, {
        params: {
          url: 'google.com',
          key: this.apiKey
        },
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

module.exports = new ScamAdviserService();
