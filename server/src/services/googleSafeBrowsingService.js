const axios = require('axios');

class GoogleSafeBrowsingService {
  constructor() {
    this.apiKey = process.env.GOOGLE_SAFEBROWSING_API_KEY;
    this.baseUrl = 'https://safebrowsing.googleapis.com/v4';
    this.timeout = 30000;
    this.clientId = 'factcheck-security';
    this.clientVersion = '1.0.0';
  }

  /**
   * Check if Google Safe Browsing service is configured
   */
  isConfigured() {
    const isValid = this.apiKey && 
                   this.apiKey !== 'your-google-safebrowsing-api-key-here' &&
                   this.apiKey.length > 20;

    console.log(`🔑 Google Safe Browsing API Status: ${isValid ? 'Configured ✅' : 'Not configured ❌'}`);
    return isValid;
  }

  /**
   * Check URLs against Google Safe Browsing database
   */
  async checkUrls(urls) {
    try {
      if (!this.isConfigured()) {
        return this.getMockResponse(urls);
      }

      // Ensure urls is an array
      const urlsArray = Array.isArray(urls) ? urls : [urls];
      
      console.log(`🔍 Google Safe Browsing: Checking ${urlsArray.length} URL(s)`);

      const requestBody = {
        client: {
          clientId: this.clientId,
          clientVersion: this.clientVersion
        },
        threatInfo: {
          threatTypes: [
            'MALWARE',
            'SOCIAL_ENGINEERING',
            'UNWANTED_SOFTWARE',
            'POTENTIALLY_HARMFUL_APPLICATION',
            'THREAT_TYPE_UNSPECIFIED'
          ],
          platformTypes: ['ANY_PLATFORM'],
          threatEntryTypes: ['URL'],
          threatEntries: urlsArray.map(url => ({ url: url }))
        }
      };

      const config = {
        method: 'POST',
        url: `${this.baseUrl}/threatMatches:find?key=${this.apiKey}`,
        headers: {
          'Content-Type': 'application/json'
        },
        data: requestBody,
        timeout: this.timeout
      };

      const response = await axios(config);

      return this.parseGoogleSafeBrowsingResponse(response.data, urlsArray);

    } catch (error) {
      console.error('❌ Google Safe Browsing API Error:', error.message);
      
      if (error.response?.status === 400) {
        console.error('🔑 Google Safe Browsing: Bad request - check API key and request format');
      } else if (error.response?.status === 429) {
        console.error('⏱️ Google Safe Browsing: Quota exceeded');
      }

      return this.getMockResponse(Array.isArray(urls) ? urls : [urls]);
    }
  }

  /**
   * Check single URL (convenience method)
   */
  async checkUrl(url) {
    const result = await this.checkUrls([url]);
    return result.results && result.results.length > 0 ? result.results[0] : result;
  }

  /**
   * Parse Google Safe Browsing response
   */
  parseGoogleSafeBrowsingResponse(data, urls) {
    const matches = data.matches || [];
    const results = [];

    // Process each URL
    urls.forEach(url => {
      const urlMatches = matches.filter(match => match.threat.url === url);
      const isUnsafe = urlMatches.length > 0;
      
      let threatTypes = [];
      let platforms = [];
      let cacheDuration = null;

      if (isUnsafe) {
        threatTypes = urlMatches.map(match => match.threatType);
        platforms = urlMatches.map(match => match.platformType);
        cacheDuration = urlMatches[0]?.cacheDuration || null;
      }

      results.push({
        url: url,
        isSafe: !isUnsafe,
        isUnsafe: isUnsafe,
        threatTypes: threatTypes,
        platforms: platforms,
        details: {
          matches: urlMatches,
          threatCount: urlMatches.length,
          primaryThreat: threatTypes[0] || null,
          cacheDuration: cacheDuration
        },
        summary: this.generateThreatSummary(threatTypes),
        confidence: isUnsafe ? 95 : 5 // Google Safe Browsing is highly reliable
      });
    });

    return {
      success: true,
      service: 'Google Safe Browsing',
      totalUrls: urls.length,
      unsafeUrls: results.filter(r => r.isUnsafe).length,
      results: results,
      rawResponse: data,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Generate threat summary based on threat types
   */
  generateThreatSummary(threatTypes) {
    if (threatTypes.length === 0) {
      return 'URL này an toàn theo Google Safe Browsing';
    }

    const threatMessages = {
      'MALWARE': 'Chứa malware',
      'SOCIAL_ENGINEERING': 'Trang lừa đảo (phishing)',
      'UNWANTED_SOFTWARE': 'Phần mềm không mong muốn',
      'POTENTIALLY_HARMFUL_APPLICATION': 'Ứng dụng có thể có hại',
      'THREAT_TYPE_UNSPECIFIED': 'Mối đe dọa không xác định'
    };

    const messages = threatTypes.map(type => threatMessages[type] || type);
    return `NGUY HIỂM: ${messages.join(', ')}`;
  }

  /**
   * Get threat list updates (for advanced usage)
   */
  async getThreatListUpdates(clientState = {}) {
    try {
      if (!this.isConfigured()) {
        return {
          success: false,
          error: 'Google Safe Browsing API not configured'
        };
      }

      const requestBody = {
        client: {
          clientId: this.clientId,
          clientVersion: this.clientVersion
        },
        listUpdateRequests: [
          {
            threatType: 'MALWARE',
            platformType: 'ANY_PLATFORM',
            threatEntryType: 'URL',
            state: clientState.malware || '',
            constraints: {
              maxUpdateEntries: 1000,
              maxDatabaseEntries: 10000
            }
          },
          {
            threatType: 'SOCIAL_ENGINEERING',
            platformType: 'ANY_PLATFORM',
            threatEntryType: 'URL',
            state: clientState.socialEngineering || '',
            constraints: {
              maxUpdateEntries: 1000,
              maxDatabaseEntries: 10000
            }
          }
        ]
      };

      const config = {
        method: 'POST',
        url: `${this.baseUrl}/threatListUpdates:fetch?key=${this.apiKey}`,
        headers: {
          'Content-Type': 'application/json'
        },
        data: requestBody,
        timeout: this.timeout
      };

      const response = await axios(config);

      return {
        success: true,
        data: response.data,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Google Safe Browsing Threat List Update Error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get mock response when API is not available
   */
  getMockResponse(urls) {
    const results = urls.map(url => {
      const isHighRisk = url.includes('malware') || 
                        url.includes('phish') || 
                        url.includes('scam') ||
                        url.includes('suspicious');

      let threatTypes = [];
      if (isHighRisk) {
        if (url.includes('malware')) threatTypes.push('MALWARE');
        if (url.includes('phish')) threatTypes.push('SOCIAL_ENGINEERING');
        if (url.includes('unwanted')) threatTypes.push('UNWANTED_SOFTWARE');
        if (threatTypes.length === 0) threatTypes.push('SOCIAL_ENGINEERING');
      }

      return {
        url: url,
        isSafe: !isHighRisk,
        isUnsafe: isHighRisk,
        threatTypes: threatTypes,
        platforms: isHighRisk ? ['ANY_PLATFORM'] : [],
        details: {
          matches: isHighRisk ? [{
            threatType: threatTypes[0],
            platformType: 'ANY_PLATFORM',
            threat: { url: url }
          }] : [],
          threatCount: threatTypes.length,
          primaryThreat: threatTypes[0] || null,
          cacheDuration: null
        },
        summary: isHighRisk ? `NGUY HIỂM: ${this.generateThreatSummary(threatTypes)} (Mock)` : 'URL này an toàn theo Google Safe Browsing (Mock)',
        confidence: isHighRisk ? 95 : 5
      };
    });

    return {
      success: true,
      service: 'Google Safe Browsing (Mock)',
      totalUrls: urls.length,
      unsafeUrls: results.filter(r => r.isUnsafe).length,
      results: results,
      rawResponse: { mock: true },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      name: 'Google Safe Browsing',
      configured: this.isConfigured(),
      baseUrl: this.baseUrl,
      documentation: 'https://developers.google.com/safe-browsing/v4',
      capabilities: ['Malware Detection', 'Phishing Detection', 'Unwanted Software Detection', 'Bulk URL Checking']
    };
  }
}

module.exports = new GoogleSafeBrowsingService();
