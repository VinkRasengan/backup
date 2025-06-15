const axios = require('axios');
const crypto = require('crypto');
const Logger = require('../../../shared/utils/logger');

const logger = new Logger('link-service');

class VirusTotalService {
  constructor() {
    this.apiKey = process.env.VIRUSTOTAL_API_KEY;
    this.baseUrl = 'https://www.virustotal.com/vtapi/v2';
    this.timeout = 15000;
  }

  /**
   * Analyze URL with VirusTotal
   */
  async analyzeUrl(url) {
    try {
      if (!this.apiKey) {
        return this.getMockResult(url);
      }

      const urlId = Buffer.from(url).toString('base64').replace(/=/g, '');
      
      const response = await axios.get(`${this.baseUrl}/url/report`, {
        params: {
          apikey: this.apiKey,
          resource: url,
          scan: 1
        },
        timeout: this.timeout
      });

      const data = response.data;

      if (data.response_code === 1) {
        // URL found in database
        const threats = this.analyzeThreats(data);
        
        return {
          success: true,
          url,
          scanId: data.scan_id,
          scanDate: data.scan_date,
          positives: data.positives,
          total: data.total,
          threats,
          permalink: data.permalink,
          securityScore: this.calculateSecurityScore(data),
          analyzedAt: new Date().toISOString()
        };
      } else if (data.response_code === 0) {
        // URL not found, submit for scanning
        await this.submitUrl(url);
        return {
          success: true,
          url,
          status: 'queued',
          message: 'URL submitted for scanning',
          securityScore: 50, // Neutral score for unknown URLs
          analyzedAt: new Date().toISOString()
        };
      } else {
        throw new Error('Invalid API response');
      }

    } catch (error) {
      logger.warn('VirusTotal API error', { error: error.message, url });
      return this.getMockResult(url);
    }
  }

  /**
   * Submit URL for scanning
   */
  async submitUrl(url) {
    try {
      if (!this.apiKey) {
        return { success: false, error: 'No API key' };
      }

      const response = await axios.post(`${this.baseUrl}/url/scan`, {
        apikey: this.apiKey,
        url: url
      }, {
        timeout: this.timeout
      });

      return {
        success: true,
        scanId: response.data.scan_id,
        permalink: response.data.permalink
      };

    } catch (error) {
      logger.warn('VirusTotal URL submission error', { error: error.message, url });
      return { success: false, error: error.message };
    }
  }

  /**
   * Analyze threats from VirusTotal response
   */
  analyzeThreats(data) {
    const threats = {
      malicious: false,
      suspicious: false,
      threatNames: []
    };

    if (data.positives > 0) {
      threats.malicious = data.positives >= 3; // 3+ detections = malicious
      threats.suspicious = data.positives >= 1 && data.positives < 3;

      // Extract threat names from scans
      if (data.scans) {
        Object.entries(data.scans).forEach(([engine, result]) => {
          if (result.detected && result.result) {
            threats.threatNames.push(`${engine}: ${result.result}`);
          }
        });
      }
    }

    return threats;
  }

  /**
   * Calculate security score based on VirusTotal results
   */
  calculateSecurityScore(data) {
    if (data.total === 0) return 50; // No data available

    const detectionRate = data.positives / data.total;
    
    if (detectionRate >= 0.1) return 10; // 10%+ detection = very dangerous
    if (detectionRate >= 0.05) return 30; // 5%+ detection = dangerous
    if (detectionRate >= 0.02) return 60; // 2%+ detection = suspicious
    if (detectionRate > 0) return 80; // Any detection = slightly suspicious
    
    return 95; // Clean
  }

  /**
   * Get mock result when API is not available
   */
  getMockResult(url) {
    // Generate deterministic mock result based on URL
    const hash = crypto.createHash('md5').update(url).digest('hex');
    const riskScore = parseInt(hash.substring(0, 2), 16) % 100;

    let threats = {
      malicious: false,
      suspicious: false,
      threatNames: []
    };

    let securityScore = 85;

    // Simulate some URLs being flagged
    if (riskScore > 90) {
      threats.malicious = true;
      threats.threatNames = ['Mock-Engine: Trojan.Generic', 'Mock-Scanner: Malware.Suspicious'];
      securityScore = 15;
    } else if (riskScore > 80) {
      threats.suspicious = true;
      threats.threatNames = ['Mock-Engine: PUP.Optional'];
      securityScore = 45;
    }

    return {
      success: true,
      url,
      scanId: `mock-${hash.substring(0, 8)}`,
      scanDate: new Date().toISOString(),
      positives: threats.malicious ? 5 : threats.suspicious ? 2 : 0,
      total: 70,
      threats,
      securityScore,
      mock: true,
      analyzedAt: new Date().toISOString()
    };
  }

  /**
   * Check URL (alias for analyzeUrl for compatibility)
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
      const response = await axios.get(`${this.baseUrl}/url/report`, {
        params: {
          apikey: this.apiKey,
          resource: 'https://google.com'
        },
        timeout: 5000
      });

      return {
        available: true,
        rateLimit: response.headers['x-api-quota-remaining'] || 'unknown',
        mock: false
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

module.exports = new VirusTotalService();
