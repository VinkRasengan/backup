const axios = require('axios');
const crypto = require('crypto');
const logger = require('../utils/logger');

// Logger already initialized

class GoogleSafeBrowsingService {
  constructor() {
    this.apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
    this.baseUrl = 'https://safebrowsing.googleapis.com/v4/threatMatches:find';
    this.timeout = 10000;
  }

  /**
   * Check URL against Google Safe Browsing
   */
  async checkUrl(url) {
    try {
      if (!this.apiKey) {
        return this.getMockResult(url);
      }

      const requestBody = {
        client: {
          clientId: 'anti-fraud-platform',
          clientVersion: '1.0.0'
        },
        threatInfo: {
          threatTypes: [
            'MALWARE',
            'SOCIAL_ENGINEERING',
            'UNWANTED_SOFTWARE',
            'POTENTIALLY_HARMFUL_APPLICATION'
          ],
          platformTypes: ['ANY_PLATFORM'],
          threatEntryTypes: ['URL'],
          threatEntries: [{ url }]
        }
      };

      const response = await axios.post(`${this.baseUrl}?key=${this.apiKey}`, requestBody, {
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = response.data;
      const isMalicious = data.matches && data.matches.length > 0;

      let threatTypes = [];
      let threatDetails = [];

      if (isMalicious) {
        data.matches.forEach(match => {
          threatTypes.push(match.threatType);
          threatDetails.push({
            threatType: match.threatType,
            platformType: match.platformType,
            threatEntryType: match.threatEntryType
          });
        });
      }

      return {
        success: true,
        url,
        isMalicious,
        threatTypes: [...new Set(threatTypes)], // Remove duplicates
        threatDetails,
        analyzedAt: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Google Safe Browsing API error', { error: error.message, url });
      return {
        success: false,
        error: 'Google Safe Browsing API unavailable',
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
      if (!this.apiKey) {
        return {
          available: false,
          error: 'No API key configured',
          mock: true
        };
      }

      // Test with a known safe URL
      const testBody = {
        client: {
          clientId: 'anti-fraud-platform',
          clientVersion: '1.0.0'
        },
        threatInfo: {
          threatTypes: ['MALWARE'],
          platformTypes: ['ANY_PLATFORM'],
          threatEntryTypes: ['URL'],
          threatEntries: [{ url: 'https://google.com' }]
        }
      };

      const response = await axios.post(`${this.baseUrl}?key=${this.apiKey}`, testBody, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return {
        available: response.status === 200,
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

module.exports = new GoogleSafeBrowsingService();
