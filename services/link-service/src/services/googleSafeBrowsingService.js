const axios = require('axios');
const crypto = require('crypto');
const Logger = require('/app/shared/utils/logger');

const logger = new Logger('link-service');

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
      logger.warn('Google Safe Browsing API error', { error: error.message, url });
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

      // Simulate some URLs being flagged
      const isMalicious = riskScore > 92; // 8% chance of being flagged
      
      let threatTypes = [];
      let threatDetails = [];

      if (isMalicious) {
        // Randomly assign threat types
        const possibleThreats = ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE'];
        const threatType = possibleThreats[parseInt(hash.substring(2, 4), 16) % possibleThreats.length];
        
        threatTypes = [threatType];
        threatDetails = [{
          threatType,
          platformType: 'ANY_PLATFORM',
          threatEntryType: 'URL'
        }];
      }

      return {
        success: true,
        url,
        isMalicious,
        threatTypes,
        threatDetails,
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
