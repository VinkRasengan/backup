const axios = require('axios');
const crypto = require('crypto');
const Logger = require('../../../shared/utils/logger');

const logger = new Logger('link-service');

class CriminalIPService {
  constructor() {
    this.apiKey = process.env.CRIMINALIP_API_KEY;
    this.baseUrl = 'https://api.criminalip.io/v1';
    this.timeout = 10000;
  }

  /**
   * Check URL with CriminalIP
   */
  async checkUrl(url) {
    try {
      if (!this.apiKey) {
        return this.getMockResult(url);
      }

      const response = await axios.get(`${this.baseUrl}/domain/scan`, {
        params: {
          query: new URL(url).hostname
        },
        headers: {
          'x-api-key': this.apiKey
        },
        timeout: this.timeout
      });

      const data = response.data;

      if (data.status === 200) {
        return {
          success: true,
          url,
          riskLevel: this.calculateRiskLevel(data.score),
          score: data.score || 0,
          categories: data.categories || [],
          malwareDetected: data.malware_detected || false,
          phishingDetected: data.phishing_detected || false,
          countryCode: data.country_code || 'unknown',
          registrar: data.registrar || 'unknown',
          analyzedAt: new Date().toISOString()
        };
      } else {
        throw new Error(data.message || 'CriminalIP API error');
      }

    } catch (error) {
      logger.warn('CriminalIP API error', { error: error.message, url });
      return this.getMockResult(url);
    }
  }

  /**
   * Calculate risk level from score
   */
  calculateRiskLevel(score) {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }

  /**
   * Get mock result when API is not available
   */
  getMockResult(url) {
    try {
      const domain = new URL(url).hostname;
      const hash = crypto.createHash('md5').update(url).digest('hex');
      const score = parseInt(hash.substring(0, 2), 16) % 100;

      // Simulate threat detection
      const malwareDetected = score > 85;
      const phishingDetected = score > 90;

      // Mock categories
      const allCategories = ['business', 'technology', 'news', 'entertainment', 'shopping', 'social', 'suspicious', 'malware'];
      const categories = [];
      
      if (malwareDetected) categories.push('malware');
      if (phishingDetected) categories.push('suspicious');
      if (categories.length === 0) {
        categories.push(allCategories[parseInt(hash.substring(2, 4), 16) % (allCategories.length - 2)]);
      }

      // Mock country codes
      const countries = ['US', 'CN', 'RU', 'DE', 'GB', 'FR', 'JP', 'CA', 'AU', 'BR'];
      const countryCode = countries[parseInt(hash.substring(4, 6), 16) % countries.length];

      // Mock registrars
      const registrars = ['GoDaddy', 'Namecheap', 'Cloudflare', 'Google Domains', 'Amazon', 'Unknown'];
      const registrar = registrars[parseInt(hash.substring(6, 8), 16) % registrars.length];

      return {
        success: true,
        url,
        riskLevel: this.calculateRiskLevel(score),
        score,
        categories,
        malwareDetected,
        phishingDetected,
        countryCode,
        registrar,
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

      const response = await axios.get(`${this.baseUrl}/ip/scan`, {
        params: {
          query: ip
        },
        headers: {
          'x-api-key': this.apiKey
        },
        timeout: this.timeout
      });

      const data = response.data;

      if (data.status === 200) {
        return {
          success: true,
          ip,
          riskLevel: this.calculateRiskLevel(data.score),
          score: data.score || 0,
          isMalicious: data.is_malicious || false,
          countryCode: data.country_code || 'unknown',
          city: data.city || 'unknown',
          isp: data.isp || 'unknown',
          analyzedAt: new Date().toISOString()
        };
      } else {
        throw new Error(data.message || 'CriminalIP IP API error');
      }

    } catch (error) {
      logger.warn('CriminalIP IP API error', { error: error.message, ip });
      return this.getMockIPResult(ip);
    }
  }

  /**
   * Get mock IP result
   */
  getMockIPResult(ip) {
    const hash = crypto.createHash('md5').update(ip).digest('hex');
    const score = parseInt(hash.substring(0, 2), 16) % 100;

    const countries = ['US', 'CN', 'RU', 'DE', 'GB', 'FR', 'JP', 'CA', 'AU', 'BR'];
    const countryCode = countries[parseInt(hash.substring(2, 4), 16) % countries.length];

    const cities = ['New York', 'London', 'Tokyo', 'Berlin', 'Paris', 'Sydney', 'Toronto', 'Moscow'];
    const city = cities[parseInt(hash.substring(4, 6), 16) % cities.length];

    const isps = ['Comcast', 'Verizon', 'AT&T', 'Deutsche Telekom', 'BT Group', 'NTT', 'China Telecom'];
    const isp = isps[parseInt(hash.substring(6, 8), 16) % isps.length];

    return {
      success: true,
      ip,
      riskLevel: this.calculateRiskLevel(score),
      score,
      isMalicious: score > 80,
      countryCode,
      city,
      isp,
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

      // Test with a known safe domain
      const response = await axios.get(`${this.baseUrl}/domain/scan`, {
        params: {
          query: 'google.com'
        },
        headers: {
          'x-api-key': this.apiKey
        },
        timeout: 5000
      });

      return {
        available: response.data.status === 200,
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

module.exports = new CriminalIPService();
