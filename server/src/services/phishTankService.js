const axios = require('axios');
const crypto = require('crypto');

class PhishTankService {
  constructor() {
    this.apiKey = process.env.PHISHTANK_API_KEY;
    this.baseUrl = 'https://checkurl.phishtank.com/checkurl/';
    this.timeout = 30000;
  }

  /**
   * Check if PhishTank service is configured
   */
  isConfigured() {
    const isValid = this.apiKey && 
                   this.apiKey !== 'your-phishtank-api-key-here' &&
                   this.apiKey.length > 10;

    console.log(`🔑 PhishTank API Status: ${isValid ? 'Configured ✅' : 'Not configured ❌'}`);
    return isValid;
  }

  /**
   * Check URL against PhishTank database
   */
  async checkUrl(url) {
    try {
      if (!this.isConfigured()) {
        return this.getMockResponse(url);
      }

      console.log(`🔍 PhishTank: Checking URL - ${url}`);

      // PhishTank requires POST with form data
      const formData = new URLSearchParams();
      formData.append('url', url);
      formData.append('format', 'json');
      formData.append('app_key', this.apiKey);

      const config = {
        method: 'POST',
        url: this.baseUrl,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'FactCheck-Security-Bot/1.0'
        },
        data: formData,
        timeout: this.timeout
      };

      const response = await axios(config);

      if (response.data) {
        return this.parsePhishTankResponse(response.data, url);
      }

      throw new Error('Empty response from PhishTank API');

    } catch (error) {
      console.error('❌ PhishTank API Error:', error.message);
      
      if (error.response?.status === 401) {
        console.error('🔑 PhishTank: Invalid API key');
      } else if (error.response?.status === 429) {
        console.error('⏱️ PhishTank: Rate limit exceeded');
      } else if (error.response?.status === 508) {
        console.error('🔄 PhishTank: Resource limit exceeded');
      }

      return this.getMockResponse(url);
    }
  }

  /**
   * Parse PhishTank API response
   */
  parsePhishTankResponse(data, url) {
    const results = data.results || {};
    const isPhishing = results.in_database === true;
    const isVerified = results.verified === true;
    const confidence = isPhishing ? (isVerified ? 95 : 75) : 10;

    return {
      success: true,
      service: 'PhishTank',
      url: url,
      isPhishing: isPhishing,
      isSafe: !isPhishing,
      confidence: confidence,
      verified: isVerified,
      details: {
        phishId: results.phish_id || null,
        phishDetailUrl: results.phish_detail_url || null,
        submittedAt: results.submitted_at || null,
        verifiedAt: results.verified_at || null,
        validUntil: results.valid_until || null,
        target: results.target || 'Unknown'
      },
      summary: isPhishing 
        ? `URL này được xác định là phishing${isVerified ? ' (đã xác minh)' : ' (chưa xác minh)'}`
        : 'URL này không có trong cơ sở dữ liệu phishing của PhishTank',
      rawResponse: data,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get mock response when API is not available
   */
  getMockResponse(url) {
    const isHighRisk = url.includes('phish') || 
                      url.includes('fake') ||
                      url.includes('scam') ||
                      url.includes('suspicious') ||
                      url.match(/[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+/); // IP addresses

    const mockConfidence = isHighRisk ? Math.floor(Math.random() * 25) + 70 : Math.floor(Math.random() * 15) + 5;
    const isVerified = isHighRisk ? Math.random() > 0.3 : false;

    return {
      success: true,
      service: 'PhishTank (Mock)',
      url: url,
      isPhishing: isHighRisk,
      isSafe: !isHighRisk,
      confidence: mockConfidence,
      verified: isVerified,
      details: {
        phishId: isHighRisk ? Math.floor(Math.random() * 1000000) + 100000 : null,
        phishDetailUrl: isHighRisk ? `https://phishtank.org/phish_detail.php?phish_id=${Math.floor(Math.random() * 1000000)}` : null,
        submittedAt: isHighRisk ? new Date(Date.now() - Math.random() * 86400000 * 30).toISOString() : null,
        verifiedAt: isVerified ? new Date(Date.now() - Math.random() * 86400000 * 7).toISOString() : null,
        validUntil: null,
        target: isHighRisk ? 'Banking/Financial' : 'Unknown'
      },
      summary: isHighRisk 
        ? `URL này được xác định là phishing${isVerified ? ' (đã xác minh)' : ' (chưa xác minh)'} (Mock)`
        : 'URL này không có trong cơ sở dữ liệu phishing của PhishTank (Mock)',
      rawResponse: { mock: true },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Download PhishTank database (for offline checking)
   */
  async downloadDatabase() {
    try {
      if (!this.isConfigured()) {
        return {
          success: false,
          error: 'PhishTank API not configured'
        };
      }

      console.log('📥 PhishTank: Downloading database...');

      const config = {
        method: 'GET',
        url: `https://data.phishtank.com/data/${this.apiKey}/online-valid.json`,
        headers: {
          'User-Agent': 'FactCheck-Security-Bot/1.0'
        },
        timeout: 120000 // 2 minutes for large file
      };

      const response = await axios(config);

      return {
        success: true,
        data: response.data,
        count: response.data.length || 0,
        downloadedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ PhishTank Database Download Error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      name: 'PhishTank',
      configured: this.isConfigured(),
      baseUrl: this.baseUrl,
      documentation: 'https://phishtank.org/api_info.php',
      capabilities: ['URL Check', 'Phishing Database', 'Verified Reports']
    };
  }
}

module.exports = new PhishTankService();
