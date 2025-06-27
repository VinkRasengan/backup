/**
 * Security API Service
 * Integrates multiple security APIs for comprehensive threat analysis
 */

const axios = require('axios');
const { config } = require('../config/thirdPartyAPIs');
const { Logger } = require('@factcheck/shared');

const logger = new Logger('link-service');

class SecurityAPIService {
  constructor() {
    this.config = config;
    this.requestConfig = config.requestConfig;
  }

  /**
   * Check URL with Google Safe Browsing API
   */
  async checkGoogleSafeBrowsing(url) {
    try {
      if (!this.config.googleSafeBrowsing.enabled) {
        return { enabled: false, source: 'Google Safe Browsing' };
      }

      const requestBody = {
        client: {
          clientId: this.config.googleSafeBrowsing.clientId,
          clientVersion: this.config.googleSafeBrowsing.clientVersion
        },
        threatInfo: {
          threatTypes: this.config.googleSafeBrowsing.threatTypes,
          platformTypes: this.config.googleSafeBrowsing.platformTypes,
          threatEntryTypes: this.config.googleSafeBrowsing.threatEntryTypes,
          threatEntries: [{ url }]
        }
      };

      const response = await axios.post(
        `${this.config.googleSafeBrowsing.baseUrl}/threatMatches:find?key=${this.config.googleSafeBrowsing.apiKey}`,
        requestBody,
        { timeout: this.requestConfig.timeout }
      );

      const threats = response.data.matches || [];
      const isSafe = threats.length === 0;

      return {
        enabled: true,
        source: 'Google Safe Browsing',
        safe: isSafe,
        threats: threats.map(threat => ({
          type: threat.threatType,
          platform: threat.platformType,
          entryType: threat.threatEntryType
        })),
        score: isSafe ? 100 : Math.max(0, 100 - (threats.length * 25)),
        checkedAt: new Date().toISOString()
      };

    } catch (error) {
      logger.warn('Google Safe Browsing API error', { error: error.message, url });
      return {
        enabled: true,
        source: 'Google Safe Browsing',
        error: error.message,
        score: null
      };
    }
  }

  /**
   * Check URL with PhishTank API
   */
  async checkPhishTank(url) {
    try {
      if (!this.config.phishTank.enabled) {
        return { enabled: false, source: 'PhishTank' };
      }

      const formData = new URLSearchParams();
      formData.append('url', url);
      formData.append('format', this.config.phishTank.format);
      formData.append('app_key', this.config.phishTank.apiKey);

      const response = await axios.post(
        `${this.config.phishTank.baseUrl}/checkurl/`,
        formData,
        {
          timeout: this.requestConfig.timeout,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        }
      );

      const result = response.data.results;
      const isPhish = result.in_database && result.valid;

      return {
        enabled: true,
        source: 'PhishTank',
        safe: !isPhish,
        inDatabase: result.in_database,
        verified: result.valid,
        phishId: result.phish_id,
        submissionTime: result.submission_time,
        score: isPhish ? 0 : 95,
        checkedAt: new Date().toISOString()
      };

    } catch (error) {
      logger.warn('PhishTank API error', { error: error.message, url });
      return {
        enabled: true,
        source: 'PhishTank',
        error: error.message,
        score: null
      };
    }
  }

  /**
   * Check domain with ScamAdviser API
   */
  async checkScamAdviser(url) {
    try {
      if (!this.config.scamAdviser.enabled) {
        return { enabled: false, source: 'ScamAdviser' };
      }

      const domain = new URL(url).hostname;
      
      const response = await axios.get(
        `${this.config.scamAdviser.baseUrl}${this.config.scamAdviser.endpoints.trustScore}`,
        {
          params: { domain },
          headers: { 'X-API-Key': this.config.scamAdviser.apiKey },
          timeout: this.requestConfig.timeout
        }
      );

      const data = response.data;

      return {
        enabled: true,
        source: 'ScamAdviser',
        safe: data.trust_score >= 70,
        trustScore: data.trust_score,
        riskLevel: data.risk_level,
        country: data.country,
        registrationDate: data.registration_date,
        score: data.trust_score,
        checkedAt: new Date().toISOString()
      };

    } catch (error) {
      logger.warn('ScamAdviser API error', { error: error.message, url });
      return {
        enabled: true,
        source: 'ScamAdviser',
        error: error.message,
        score: null
      };
    }
  }

  /**
   * Check IP/domain with CriminalIP API
   */
  async checkCriminalIP(url) {
    try {
      if (!this.config.criminalIP.enabled) {
        return { enabled: false, source: 'CriminalIP' };
      }

      const domain = new URL(url).hostname;
      
      const response = await axios.get(
        `${this.config.criminalIP.baseUrl}${this.config.criminalIP.endpoints.domainReport}`,
        {
          params: { query: domain },
          headers: { 'x-api-key': this.config.criminalIP.apiKey },
          timeout: this.requestConfig.timeout
        }
      );

      const data = response.data;
      const isSafe = data.score >= 70;

      return {
        enabled: true,
        source: 'CriminalIP',
        safe: isSafe,
        score: data.score,
        riskLevel: data.risk_level,
        categories: data.categories || [],
        malwareDetected: data.malware_detected || false,
        phishingDetected: data.phishing_detected || false,
        checkedAt: new Date().toISOString()
      };

    } catch (error) {
      logger.warn('CriminalIP API error', { error: error.message, url });
      return {
        enabled: true,
        source: 'CriminalIP',
        error: error.message,
        score: null
      };
    }
  }

  /**
   * Check URL with IP Quality Score API
   */
  async checkIPQualityScore(url) {
    try {
      if (!this.config.ipQualityScore.enabled) {
        return { enabled: false, source: 'IP Quality Score' };
      }

      const response = await axios.get(
        `${this.config.ipQualityScore.baseUrl}${this.config.ipQualityScore.endpoints.url}/${this.config.ipQualityScore.apiKey}/${encodeURIComponent(url)}`,
        { timeout: this.requestConfig.timeout }
      );

      const data = response.data;
      const isSafe = !data.unsafe && !data.malware && !data.phishing && !data.suspicious;

      return {
        enabled: true,
        source: 'IP Quality Score',
        safe: isSafe,
        riskScore: data.risk_score || 0,
        malware: data.malware || false,
        phishing: data.phishing || false,
        suspicious: data.suspicious || false,
        adultContent: data.adult || false,
        score: isSafe ? Math.max(0, 100 - (data.risk_score || 0)) : Math.min(50, 100 - (data.risk_score || 0)),
        checkedAt: new Date().toISOString()
      };

    } catch (error) {
      logger.warn('IP Quality Score API error', { error: error.message, url });
      return {
        enabled: true,
        source: 'IP Quality Score',
        error: error.message,
        score: null
      };
    }
  }

  /**
   * Check URL with VirusTotal API (enhanced)
   */
  async checkVirusTotal(url) {
    try {
      if (!this.config.virusTotal.enabled) {
        return { enabled: false, source: 'VirusTotal' };
      }

      const response = await axios.post(
        `${this.config.virusTotal.baseUrl}${this.config.virusTotal.endpoints.urlReport}`,
        `apikey=${this.config.virusTotal.apiKey}&resource=${encodeURIComponent(url)}`,
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          timeout: this.requestConfig.timeout
        }
      );

      const data = response.data;
      const positives = data.positives || 0;
      const total = data.total || 1;
      const isSafe = positives === 0;

      return {
        enabled: true,
        source: 'VirusTotal',
        safe: isSafe,
        positives,
        total,
        scanDate: data.scan_date,
        permalink: data.permalink,
        score: Math.max(0, 100 - (positives / total * 100)),
        checkedAt: new Date().toISOString()
      };

    } catch (error) {
      logger.warn('VirusTotal API error', { error: error.message, url });
      return {
        enabled: true,
        source: 'VirusTotal',
        error: error.message,
        score: null
      };
    }
  }

  /**
   * Run comprehensive security check across all APIs
   */
  async comprehensiveCheck(url) {
    const startTime = Date.now();
    
    logger.info('Starting comprehensive security check', { url });

    const checks = await Promise.allSettled([
      this.checkGoogleSafeBrowsing(url),
      this.checkPhishTank(url),
      this.checkScamAdviser(url),
      this.checkCriminalIP(url),
      this.checkIPQualityScore(url),
      this.checkVirusTotal(url)
    ]);

    const results = checks.map((check, index) => {
      const sources = ['Google Safe Browsing', 'PhishTank', 'ScamAdviser', 'CriminalIP', 'IP Quality Score', 'VirusTotal'];
      
      if (check.status === 'fulfilled') {
        return check.value;
      } else {
        return {
          enabled: true,
          source: sources[index],
          error: check.reason.message,
          score: null
        };
      }
    });

    // Calculate overall score
    const validScores = results.filter(r => r.score !== null && r.enabled).map(r => r.score);
    const overallScore = validScores.length > 0 
      ? Math.round(validScores.reduce((sum, score) => sum + score, 0) / validScores.length)
      : null;

    // Determine safety status
    const safeCount = results.filter(r => r.safe === true && r.enabled).length;
    const unsafeCount = results.filter(r => r.safe === false && r.enabled).length;
    const enabledCount = results.filter(r => r.enabled).length;

    const endTime = Date.now();
    
    logger.info('Comprehensive security check completed', { 
      url, 
      duration: endTime - startTime,
      overallScore,
      safeCount,
      unsafeCount,
      enabledCount
    });

    return {
      url,
      overallScore,
      overallSafety: safeCount > unsafeCount ? 'safe' : (unsafeCount > safeCount ? 'unsafe' : 'unknown'),
      summary: {
        total: results.length,
        enabled: enabledCount,
        safe: safeCount,
        unsafe: unsafeCount,
        errors: results.filter(r => r.error).length
      },
      results,
      checkedAt: new Date().toISOString(),
      duration: endTime - startTime
    };
  }
}

module.exports = new SecurityAPIService();
