const axios = require('axios');
const crypto = require('crypto');

class VirusTotalService {
  constructor() {
    this.apiKey = process.env.VIRUSTOTAL_API_KEY;
    this.apiUrl = process.env.VIRUSTOTAL_API_URL || 'https://www.virustotal.com/api/v3';
    this.rateLimitDelay = 15000; // 15 seconds between requests for free tier
    this.lastRequestTime = 0;
  }

  /**
   * Enforce rate limiting for VirusTotal API
   */
  async enforceRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.rateLimitDelay) {
      const waitTime = this.rateLimitDelay - timeSinceLastRequest;
      console.log(`VirusTotal rate limit: waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * Create URL identifier for VirusTotal API
   */
  createUrlId(url) {
    return Buffer.from(url).toString('base64').replace(/=/g, '');
  }

  /**
   * Scan a URL with VirusTotal
   */
  async scanUrl(url) {
    try {
      if (!this.apiKey) {
        console.warn('VirusTotal API key not configured');
        return null;
      }

      await this.enforceRateLimit();

      const response = await axios.post(
        `${this.apiUrl}/urls`,
        `url=${encodeURIComponent(url)}`,
        {
          headers: {
            'x-apikey': this.apiKey,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          timeout: 30000
        }
      );

      return {
        analysisId: response.data.data.id,
        success: true
      };

    } catch (error) {
      console.error('VirusTotal scan URL error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Failed to scan URL'
      };
    }
  }

  /**
   * Get URL analysis report
   */
  async getUrlReport(url) {
    try {
      if (!this.apiKey) {
        console.warn('VirusTotal API key not configured');
        return null;
      }

      await this.enforceRateLimit();

      const urlId = this.createUrlId(url);
      
      const response = await axios.get(
        `${this.apiUrl}/urls/${urlId}`,
        {
          headers: {
            'x-apikey': this.apiKey
          },
          timeout: 30000
        }
      );

      const data = response.data.data.attributes;
      
      return {
        success: true,
        url: url,
        scanDate: data.last_analysis_date ? new Date(data.last_analysis_date * 1000).toISOString() : null,
        stats: data.last_analysis_stats || {},
        reputation: data.reputation || 0,
        categories: data.categories || {},
        threatNames: data.threat_names || [],
        malicious: (data.last_analysis_stats?.malicious || 0) > 0,
        suspicious: (data.last_analysis_stats?.suspicious || 0) > 0,
        harmless: (data.last_analysis_stats?.harmless || 0) > 0,
        undetected: (data.last_analysis_stats?.undetected || 0) > 0,
        totalEngines: Object.keys(data.last_analysis_results || {}).length,
        engines: data.last_analysis_results || {}
      };

    } catch (error) {
      if (error.response?.status === 404) {
        // URL not found in VirusTotal database, trigger a scan
        const scanResult = await this.scanUrl(url);
        return {
          success: true,
          needsScanning: true,
          scanTriggered: scanResult.success,
          analysisId: scanResult.analysisId
        };
      }

      console.error('VirusTotal get URL report error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Failed to get URL report'
      };
    }
  }

  /**
   * Get domain report
   */
  async getDomainReport(domain) {
    try {
      if (!this.apiKey) {
        console.warn('VirusTotal API key not configured');
        return null;
      }

      await this.enforceRateLimit();

      const response = await axios.get(
        `${this.apiUrl}/domains/${domain}`,
        {
          headers: {
            'x-apikey': this.apiKey
          },
          timeout: 30000
        }
      );

      const data = response.data.data.attributes;
      
      return {
        success: true,
        domain: domain,
        reputation: data.reputation || 0,
        categories: data.categories || {},
        stats: data.last_analysis_stats || {},
        malicious: (data.last_analysis_stats?.malicious || 0) > 0,
        suspicious: (data.last_analysis_stats?.suspicious || 0) > 0,
        harmless: (data.last_analysis_stats?.harmless || 0) > 0,
        undetected: (data.last_analysis_stats?.undetected || 0) > 0,
        totalEngines: Object.keys(data.last_analysis_results || {}).length,
        whois: data.whois,
        creationDate: data.creation_date ? new Date(data.creation_date * 1000).toISOString() : null,
        lastModified: data.last_modification_date ? new Date(data.last_modification_date * 1000).toISOString() : null
      };

    } catch (error) {
      console.error('VirusTotal get domain report error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Failed to get domain report'
      };
    }
  }

  /**
   * Calculate security score based on VirusTotal data
   */
  calculateSecurityScore(urlReport, domainReport) {
    let score = 100; // Start with perfect score
    
    if (urlReport && urlReport.success && !urlReport.needsScanning) {
      const { stats } = urlReport;
      const totalEngines = urlReport.totalEngines || 1;
      
      // Deduct points for malicious detections
      if (stats.malicious > 0) {
        const maliciousRatio = stats.malicious / totalEngines;
        score -= maliciousRatio * 80; // Up to 80 points deduction
      }
      
      // Deduct points for suspicious detections
      if (stats.suspicious > 0) {
        const suspiciousRatio = stats.suspicious / totalEngines;
        score -= suspiciousRatio * 40; // Up to 40 points deduction
      }
      
      // Consider reputation
      if (urlReport.reputation < 0) {
        score -= Math.abs(urlReport.reputation) * 2;
      }
    }
    
    if (domainReport && domainReport.success) {
      const { stats } = domainReport;
      const totalEngines = domainReport.totalEngines || 1;
      
      // Deduct points for malicious domain
      if (stats.malicious > 0) {
        const maliciousRatio = stats.malicious / totalEngines;
        score -= maliciousRatio * 60; // Up to 60 points deduction
      }
      
      // Deduct points for suspicious domain
      if (stats.suspicious > 0) {
        const suspiciousRatio = stats.suspicious / totalEngines;
        score -= suspiciousRatio * 30; // Up to 30 points deduction
      }
      
      // Consider domain reputation
      if (domainReport.reputation < 0) {
        score -= Math.abs(domainReport.reputation) * 1.5;
      }
    }
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Get comprehensive analysis for a URL
   */
  async analyzeUrl(url) {
    try {
      const domain = new URL(url).hostname;
      
      // Get both URL and domain reports
      const [urlReport, domainReport] = await Promise.all([
        this.getUrlReport(url),
        this.getDomainReport(domain)
      ]);
      
      const securityScore = this.calculateSecurityScore(urlReport, domainReport);
      
      return {
        success: true,
        url,
        domain,
        securityScore,
        urlAnalysis: urlReport,
        domainAnalysis: domainReport,
        threats: {
          malicious: (urlReport?.malicious || false) || (domainReport?.malicious || false),
          suspicious: (urlReport?.suspicious || false) || (domainReport?.suspicious || false),
          threatNames: urlReport?.threatNames || []
        },
        analyzedAt: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('VirusTotal analyze URL error:', error);
      return {
        success: false,
        error: error.message || 'Failed to analyze URL'
      };
    }
  }

  /**
   * Check URL (wrapper for analyzeUrl for SecurityAggregator compatibility)
   */
  async checkUrl(url) {
    return await this.analyzeUrl(url);
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      name: 'VirusTotal',
      configured: this.apiKey && this.apiKey !== 'your-virustotal-api-key-here',
      baseUrl: this.apiUrl,
      documentation: 'https://developers.virustotal.com/reference',
      capabilities: ['URL Analysis', 'Domain Analysis', 'File Scanning', 'IP Analysis']
    };
  }
}

module.exports = new VirusTotalService();
