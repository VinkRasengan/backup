const axios = require('axios');

class ScamAdviserService {  constructor() {
    this.apiKey = process.env.SCAMADVISER_API_KEY;
    this.apiUrl = 'https://scamadviser1.p.rapidapi.com';
    this.rateLimitDelay = 3000; // 3 seconds between requests for RapidAPI free tier
    this.lastRequestTime = 0;
  }

  /**
   * Enforce rate limiting for ScamAdviser API
   */
  async enforceRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.rateLimitDelay) {
      const waitTime = this.rateLimitDelay - timeSinceLastRequest;
      console.log(`ScamAdviser rate limit: waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }
  /**
   * Extract domain from URL
   */
  extractDomain(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (error) {
      console.error('Invalid URL for domain extraction:', url, error.message);
      throw new Error(`Invalid URL format: ${error.message}`);
    }
  }

  /**
   * Analyze URL/domain with ScamAdviser
   */
  async analyzeUrl(url) {
    try {
      if (!this.apiKey) {
        console.warn('ScamAdviser API key not configured');
        return {
          success: false,
          error: 'ScamAdviser API key not configured',
          trustScore: null,
          riskLevel: 'unknown',
          details: {}
        };
      }

      await this.enforceRateLimit();

      const domain = this.extractDomain(url);
      console.log(`Analyzing domain with ScamAdviser: ${domain}`);      const response = await axios.get(`${this.apiUrl}/v1/trust/single`, {
        headers: {
          'X-RapidAPI-Key': this.apiKey,
          'X-RapidAPI-Host': 'scamadviser1.p.rapidapi.com',
          'Content-Type': 'application/json'
        },
        params: {
          domain: domain
        },
        timeout: 30000 // 30 second timeout
      });

      const data = response.data;
      console.log('ScamAdviser response:', JSON.stringify(data, null, 2));

      return this.processScamAdviserResponse(data, domain);

    } catch (error) {
      console.error('ScamAdviser API error:', error.message);
      
      if (error.response) {
        const status = error.response.status;
        const errorData = error.response.data;
        
        if (status === 401) {
          return {
            success: false,
            error: 'ScamAdviser API authentication failed',
            trustScore: null,
            riskLevel: 'unknown',
            details: {}
          };
        } else if (status === 429) {
          return {
            success: false,
            error: 'ScamAdviser API rate limit exceeded',
            trustScore: null,
            riskLevel: 'unknown',
            details: {}
          };        } else if (status === 403) {
          return {
            success: false,
            error: 'ScamAdviser API subscription required - please subscribe to the API on RapidAPI',
            trustScore: null,
            riskLevel: 'unknown',
            details: {}
          };
        } else if (status === 404) {
          return {
            success: false,
            error: 'Domain not found in ScamAdviser database',
            trustScore: null,
            riskLevel: 'unknown',
            details: {}
          };
        }
        
        return {
          success: false,
          error: `ScamAdviser API error: ${status} - ${errorData?.message || 'Unknown error'}`,
          trustScore: null,
          riskLevel: 'unknown',
          details: {}
        };
      }

      return {
        success: false,
        error: 'Failed to connect to ScamAdviser API',
        trustScore: null,
        riskLevel: 'unknown',
        details: {}
      };
    }
  }
  /**
   * Process ScamAdviser API response
   */
  processScamAdviserResponse(data, domain) {
    try {
      // Extract trust score (assuming it's in percentage 0-100)
      const trustScore = data?.trust_score ?? data?.trustScore ?? data?.score;
      
      // Determine risk level based on trust score
      const riskLevel = this.determineRiskLevel(trustScore);
      
      // Extract additional details
      const details = {
        domain: domain,
        country: data?.country,
        registrationDate: data?.creation_date ?? data?.registrationDate,
        ssl: data?.ssl ?? data?.https,
        socialMedia: data?.social_media ?? data?.socialMedia,
        reviews: data?.reviews,
        warnings: data?.warnings ?? [],
        tags: data?.tags ?? [],
        lastChecked: data?.last_checked ?? new Date().toISOString()
      };

      // Extract risk factors
      const riskFactors = this.extractRiskFactors(data);

      return {
        success: true,
        trustScore: trustScore,
        riskLevel: riskLevel,
        details: details,
        riskFactors: riskFactors,
        analyzedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error processing ScamAdviser response:', error);
      return {
        success: false,
        error: 'Failed to process ScamAdviser response',
        trustScore: null,
        riskLevel: 'unknown',
        details: {}
      };
    }
  }
  /**
   * Determine risk level based on trust score
   */
  determineRiskLevel(trustScore) {
    if (trustScore == null) {
      return 'unknown';
    }

    if (trustScore >= 80) {
      return 'low';
    } else if (trustScore >= 60) {
      return 'medium';
    } else if (trustScore >= 40) {
      return 'high';
    } else {
      return 'very_high';
    }
  }
  /**
   * Extract risk factors from ScamAdviser response
   */
  extractRiskFactors(data) {
    const factors = [];

    // Check various risk indicators
    if (data?.suspicious_activity) {
      factors.push('Suspicious activity detected');
    }

    if (data?.phishing_risk > 50) {
      factors.push('High phishing risk');
    }

    if (data?.malware_risk > 50) {
      factors.push('High malware risk');
    }

    if (data?.fake_shop_risk > 50) {
      factors.push('Potential fake shop');
    }

    if (data?.country_risk === 'high') {
      factors.push('High-risk country');
    }

    if (data?.domain_age < 30) {
      factors.push('Very new domain');
    }

    if (!data?.ssl && !data?.https) {
      factors.push('No SSL/HTTPS security');
    }

    if (data?.blacklisted) {
      factors.push('Domain is blacklisted');
    }

    if (data?.warnings?.length > 0) {
      factors.push(...data.warnings);
    }

    return factors;
  }
  /**
   * Convert trust score to security score format (0-100)
   */
  convertToSecurityScore(trustScore, riskLevel) {
    if (trustScore == null) {
      return 50; // Neutral score when unknown
    }

    // ScamAdviser trust score is already 0-100, but we might want to adjust
    // based on risk level for consistency
    switch (riskLevel) {
      case 'very_high':
        return Math.min(trustScore, 30);
      case 'high':
        return Math.min(trustScore, 50);
      case 'medium':
        return trustScore;
      case 'low':
        return Math.max(trustScore, 70);
      default:
        return trustScore;
    }
  }
}

module.exports = new ScamAdviserService();
