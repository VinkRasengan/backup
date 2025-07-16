const axios = require('axios');
const crypto = require('crypto');
const logger = require('../utils/logger');

// Logger already initialized

class VietnameseSecurityService {
  constructor() {
    this.timeout = 10000;
    this.services = {
      bkav: 'https://api.bkav.com/security/check',
      vncert: 'https://api.vncert.vn/threat/check',
      fpt: 'https://api.fpt.ai/security/scan'
    };
  }

  /**
   * Check all Vietnamese security services
   */
  async checkAllServices(url) {
    try {
      const results = await Promise.allSettled([
        this.checkBKAV(url),
        this.checkVNCERT(url),
        this.checkFPT(url)
      ]);

      const processedResults = {};
      const errors = {};

      results.forEach((result, index) => {
        const serviceName = ['bkav', 'vncert', 'fpt'][index];
        
        if (result.status === 'fulfilled' && result.value.success) {
          processedResults[serviceName] = result.value;
        } else {
          errors[serviceName] = result.reason?.message || result.value?.error || 'Service unavailable';
        }
      });

      // Calculate overall risk from Vietnamese services
      const overallRisk = this.calculateOverallRisk(processedResults);

      return {
        success: true,
        url,
        results: processedResults,
        errors,
        overallRisk,
        servicesChecked: Object.keys(processedResults).length,
        analyzedAt: new Date().toISOString()
      };

    } catch (error) {
      logger.warn('Vietnamese security services error', { error: error.message, url });
      return this.getMockResult(url);
    }
  }

  /**
   * Check with BKAV (mock implementation)
   */
  async checkBKAV(url) {
    try {
      // Mock BKAV API call
      return this.getMockServiceResult(url, 'bkav');
    } catch (error) {
      return {
        success: false,
        error: error.message,
        service: 'bkav'
      };
    }
  }

  /**
   * Check with VNCERT (mock implementation)
   */
  async checkVNCERT(url) {
    try {
      // Mock VNCERT API call
      return this.getMockServiceResult(url, 'vncert');
    } catch (error) {
      return {
        success: false,
        error: error.message,
        service: 'vncert'
      };
    }
  }

  /**
   * Check with FPT Security (mock implementation)
   */
  async checkFPT(url) {
    try {
      // Mock FPT API call
      return this.getMockServiceResult(url, 'fpt');
    } catch (error) {
      return {
        success: false,
        error: error.message,
        service: 'fpt'
      };
    }
  }

  /**
   * Get mock service result
   */
  getMockServiceResult(url, serviceName) {
    const hash = crypto.createHash('md5').update(url + serviceName).digest('hex');
    const riskScore = parseInt(hash.substring(0, 2), 16) % 100;

    // Different services have different detection patterns
    let isMalicious = false;
    let isPhishing = false;
    let isSuspicious = false;

    switch (serviceName) {
      case 'bkav':
        isMalicious = riskScore > 88;
        isPhishing = riskScore > 92;
        isSuspicious = riskScore > 75;
        break;
      case 'vncert':
        isMalicious = riskScore > 85;
        isPhishing = riskScore > 90;
        isSuspicious = riskScore > 70;
        break;
      case 'fpt':
        isMalicious = riskScore > 90;
        isPhishing = riskScore > 95;
        isSuspicious = riskScore > 80;
        break;
    }

    const threats = [];
    if (isMalicious) threats.push('malware');
    if (isPhishing) threats.push('phishing');
    if (isSuspicious && !isMalicious && !isPhishing) threats.push('suspicious');

    return {
      success: true,
      service: serviceName,
      url,
      riskScore,
      isMalicious,
      isPhishing,
      isSuspicious,
      threats,
      details: {
        scanEngine: `${serviceName.toUpperCase()} Security Engine`,
        version: '1.0.0',
        database: 'Vietnamese Threat Database',
        lastUpdate: new Date().toISOString()
      },
      mock: true,
      analyzedAt: new Date().toISOString()
    };
  }

  /**
   * Calculate overall risk from Vietnamese services
   */
  calculateOverallRisk(results) {
    if (Object.keys(results).length === 0) {
      return {
        score: 50,
        level: 'medium',
        confidence: 0
      };
    }

    let totalScore = 0;
    let totalWeight = 0;
    const weights = { bkav: 0.4, vncert: 0.4, fpt: 0.2 };

    Object.entries(results).forEach(([service, result]) => {
      const weight = weights[service] || 0.1;
      totalScore += result.riskScore * weight;
      totalWeight += weight;
    });

    const finalScore = totalWeight > 0 ? Math.round(totalScore / totalWeight) : 50;
    
    let riskLevel = 'low';
    if (finalScore >= 70) {
      riskLevel = 'high';
    } else if (finalScore >= 40) {
      riskLevel = 'medium';
    }

    return {
      score: finalScore,
      level: riskLevel,
      confidence: Math.min(Object.keys(results).length / 3, 1)
    };
  }

  /**
   * Get mock result for all services
   */
  getMockResult(url) {
    const results = {
      bkav: this.getMockServiceResult(url, 'bkav'),
      vncert: this.getMockServiceResult(url, 'vncert'),
      fpt: this.getMockServiceResult(url, 'fpt')
    };

    const overallRisk = this.calculateOverallRisk(results);

    return {
      success: true,
      url,
      results,
      errors: {},
      overallRisk,
      servicesChecked: 3,
      mock: true,
      analyzedAt: new Date().toISOString()
    };
  }

  /**
   * Get service status
   */
  async getStatus() {
    const status = {};
    
    for (const serviceName of ['bkav', 'vncert', 'fpt']) {
      try {
        // Mock service status check
        status[serviceName] = {
          available: true,
          mock: true,
          lastTest: new Date().toISOString()
        };
      } catch (error) {
        status[serviceName] = {
          available: false,
          error: error.message,
          mock: true
        };
      }
    }

    return {
      services: status,
      overall: {
        available: Object.values(status).some(s => s.available),
        servicesUp: Object.values(status).filter(s => s.available).length,
        totalServices: Object.keys(status).length
      }
    };
  }
}

module.exports = new VietnameseSecurityService();
