const axios = require('axios');

class APWGService {
  constructor() {
    this.apiKey = process.env.APWG_API_KEY;
    this.baseUrl = process.env.APWG_API_URL || 'https://ecx.apwg.org/api';
    this.timeout = 30000; // 30 seconds
  }

  /**
   * Check if APWG service is configured
   */
  isConfigured() {
    const isValid = this.apiKey && 
                   this.apiKey !== 'your-apwg-api-key-here' &&
                   this.apiKey.length > 10;

    console.log(`🔑 APWG API Status: ${isValid ? 'Configured ✅' : 'Not configured ❌'}`);
    return isValid;
  }

  /**
   * Check URL against APWG database
   */
  async checkUrl(url) {
    try {
      if (!this.isConfigured()) {
        return this.getMockResponse(url);
      }

      console.log(`🔍 APWG: Checking URL - ${url}`);

      const config = {
        method: 'POST',
        url: `${this.baseUrl}/check`,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'FactCheck-Security-Bot/1.0'
        },
        data: {
          url: url,
          format: 'json'
        },
        timeout: this.timeout
      };

      const response = await axios(config);

      if (response.data) {
        return this.parseAPWGResponse(response.data, url);
      }

      throw new Error('Empty response from APWG API');

    } catch (error) {
      console.error('❌ APWG API Error:', error.message);
      
      if (error.response?.status === 401) {
        console.error('🔑 APWG: Invalid API key');
      } else if (error.response?.status === 429) {
        console.error('⏱️ APWG: Rate limit exceeded');
      } else if (error.code === 'ECONNABORTED') {
        console.error('⏰ APWG: Request timeout');
      }

      // Return mock data on error
      return this.getMockResponse(url);
    }
  }

  /**
   * Parse APWG API response
   */
  parseAPWGResponse(data, url) {
    const isPhishing = data.result === 'phishing' || data.threat_detected === true;
    const confidence = data.confidence || (isPhishing ? 85 : 15);

    return {
      success: true,
      service: 'APWG',
      url: url,
      isPhishing: isPhishing,
      isSafe: !isPhishing,
      confidence: confidence,
      threatType: data.threat_type || (isPhishing ? 'Phishing' : 'Clean'),
      details: {
        category: data.category || 'Unknown',
        source: data.source || 'APWG Database',
        lastSeen: data.last_seen || null,
        reportCount: data.report_count || 0,
        verificationStatus: data.verification_status || 'Unverified'
      },
      rawResponse: data,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get mock response when API is not available
   */
  getMockResponse(url) {
    const isHighRisk = url.includes('suspicious') || 
                      url.includes('phish') || 
                      url.includes('scam') ||
                      url.match(/[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+/); // IP addresses

    const mockConfidence = isHighRisk ? Math.floor(Math.random() * 30) + 70 : Math.floor(Math.random() * 20) + 5;

    return {
      success: true,
      service: 'APWG (Mock)',
      url: url,
      isPhishing: isHighRisk,
      isSafe: !isHighRisk,
      confidence: mockConfidence,
      threatType: isHighRisk ? 'Phishing' : 'Clean',
      details: {
        category: isHighRisk ? 'Phishing/Fraud' : 'Legitimate',
        source: 'APWG Database (Mock)',
        lastSeen: isHighRisk ? new Date(Date.now() - Math.random() * 86400000 * 7).toISOString() : null,
        reportCount: isHighRisk ? Math.floor(Math.random() * 50) + 5 : 0,
        verificationStatus: 'Mock Data'
      },
      rawResponse: { mock: true },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Submit URL for analysis (if supported)
   */
  async submitUrl(url) {
    try {
      if (!this.isConfigured()) {
        return {
          success: false,
          error: 'APWG API not configured'
        };
      }

      const config = {
        method: 'POST',
        url: `${this.baseUrl}/submit`,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        data: {
          url: url,
          source: 'FactCheck Security System'
        },
        timeout: this.timeout
      };

      const response = await axios(config);

      return {
        success: true,
        submissionId: response.data.id || 'submitted',
        message: 'URL submitted to APWG for analysis'
      };

    } catch (error) {
      console.error('❌ APWG Submit Error:', error.message);
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
      name: 'APWG',
      configured: this.isConfigured(),
      baseUrl: this.baseUrl,
      documentation: 'https://apwg.org/ecx/',
      capabilities: ['URL Check', 'Phishing Detection', 'Threat Classification']
    };
  }
}

module.exports = new APWGService();
