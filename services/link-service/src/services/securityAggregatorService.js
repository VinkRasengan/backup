const virusTotalService = require('./virusTotalService');
const scamAdviserService = require('./scamAdviserService');
const phishTankService = require('./phishTankService');
const googleSafeBrowsingService = require('./googleSafeBrowsingService');
const ipQualityScoreService = require('./ipQualityScoreService');
const criminalIPService = require('./criminalIPService');
const vietnameseSecurityService = require('./vietnameseSecurityService');
const Logger = require('/app/shared/utils/logger');

const logger = new Logger('link-service');

class SecurityAggregatorService {
  constructor() {
    this.services = {
      virusTotal: virusTotalService,
      scamAdviser: scamAdviserService,
      phishTank: phishTankService,
      googleSafeBrowsing: googleSafeBrowsingService,
      ipQualityScore: ipQualityScoreService,
      criminalIP: criminalIPService,
      vietnameseSecurity: vietnameseSecurityService
    };

    this.timeout = 30000; // 30 seconds timeout
  }

  /**
   * Perform comprehensive URL security analysis
   */
  async analyzeUrl(url) {
    logger.info('Starting security analysis', { url });
    
    const startTime = Date.now();
    const results = {};
    const errors = {};

    // Run all security services in parallel
    const analysisPromises = [
      this.runService('virusTotal', () => this.services.virusTotal.analyzeUrl(url)),
      this.runService('scamAdviser', () => this.services.scamAdviser.analyzeUrl(url)),
      this.runService('phishTank', () => this.services.phishTank.checkUrl(url)),
      this.runService('googleSafeBrowsing', () => this.services.googleSafeBrowsing.checkUrl(url)),
      this.runService('ipQualityScore', () => this.services.ipQualityScore.checkUrl(url)),
      this.runService('criminalIP', () => this.services.criminalIP.checkUrl(url)),
      this.runService('vietnameseSecurity', () => this.services.vietnameseSecurity.checkAllServices(url))
    ];

    const serviceResults = await Promise.allSettled(analysisPromises);

    // Process results
    serviceResults.forEach((result, index) => {
      const serviceName = ['virusTotal', 'scamAdviser', 'phishTank', 'googleSafeBrowsing', 'ipQualityScore', 'criminalIP', 'vietnameseSecurity'][index];
      
      if (result.status === 'fulfilled' && result.value.success) {
        results[serviceName] = result.value.data;
      } else {
        errors[serviceName] = result.reason?.message || result.value?.error || 'Service unavailable';
      }
    });

    // Calculate overall risk assessment
    const overallRisk = this.calculateOverallRisk(results);
    const threats = this.extractThreats(results);
    const riskFactors = this.identifyRiskFactors(results);

    const analysisTime = Date.now() - startTime;

    logger.info('Security analysis completed', {
      url,
      servicesChecked: Object.keys(results).length,
      overallRiskScore: overallRisk.score,
      analysisTime
    });

    return {
      success: true,
      url,
      results,
      errors,
      overallRisk,
      threats,
      riskFactors,
      servicesChecked: Object.keys(results).length,
      analysisTime,
      analyzedAt: new Date().toISOString()
    };
  }

  /**
   * Run a service with error handling and timeout
   */
  async runService(serviceName, serviceCall) {
    try {
      const result = await Promise.race([
        serviceCall(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Service timeout')), this.timeout)
        )
      ]);

      return {
        success: true,
        data: result,
        serviceName: serviceName
      };
    } catch (error) {
      logger.warn(`Security service error: ${serviceName}`, { error: error.message });
      return {
        success: false,
        error: error.message,
        serviceName: serviceName
      };
    }
  }

  /**
   * Calculate overall risk score from all services
   */
  calculateOverallRisk(results) {
    const scores = [];
    const weights = {
      virusTotal: 0.25,
      googleSafeBrowsing: 0.20,
      phishTank: 0.15,
      ipQualityScore: 0.15,
      vietnameseSecurity: 0.10,
      scamAdviser: 0.10,
      criminalIP: 0.05
    };

    let totalWeight = 0;
    let weightedScore = 0;

    Object.entries(results).forEach(([service, result]) => {
      const weight = weights[service] || 0.01;
      let score = 0;

      // Extract risk score from each service result
      if (service === 'virusTotal' && result.threats) {
        score = result.threats.malicious ? 90 : result.threats.suspicious ? 60 : 10;
      } else if (service === 'googleSafeBrowsing' && result.threats) {
        score = result.isMalicious ? 95 : 5;
      } else if (service === 'phishTank' && result.isPhishing !== undefined) {
        score = result.isPhishing ? 85 : 5;
      } else if (service === 'scamAdviser' && result.trustScore !== undefined) {
        score = 100 - result.trustScore; // Convert trust score to risk score
      } else if (service === 'ipQualityScore' && result.riskScore !== undefined) {
        score = result.riskScore;
      } else if (service === 'criminalIP' && result.riskLevel) {
        const riskLevels = { low: 10, medium: 50, high: 80, critical: 95 };
        score = riskLevels[result.riskLevel.toLowerCase()] || 30;
      } else if (service === 'vietnameseSecurity' && result.overallRisk) {
        score = result.overallRisk;
      } else {
        score = 30; // Default moderate risk for unknown results
      }

      weightedScore += score * weight;
      totalWeight += weight;
    });

    const finalScore = totalWeight > 0 ? Math.round(weightedScore / totalWeight) : 50;
    
    let riskLevel = 'low';
    if (finalScore >= 70) {
      riskLevel = 'high';
    } else if (finalScore >= 40) {
      riskLevel = 'medium';
    }

    return {
      score: finalScore,
      level: riskLevel,
      confidence: Math.min(Object.keys(results).length / 5, 1) // Confidence based on number of services
    };
  }

  /**
   * Extract threat information from all services
   */
  extractThreats(results) {
    const threats = {
      malware: false,
      phishing: false,
      spam: false,
      suspicious: false,
      scam: false,
      details: []
    };

    Object.entries(results).forEach(([service, result]) => {
      if (service === 'virusTotal' && result.threats) {
        if (result.threats.malicious) {
          threats.malware = true;
          threats.details.push(`VirusTotal: Malicious content detected`);
        }
        if (result.threats.suspicious) {
          threats.suspicious = true;
          threats.details.push(`VirusTotal: Suspicious activity detected`);
        }
      }

      if (service === 'googleSafeBrowsing' && result.isMalicious) {
        threats.malware = true;
        threats.details.push(`Google Safe Browsing: Malicious site detected`);
      }

      if (service === 'phishTank' && result.isPhishing) {
        threats.phishing = true;
        threats.details.push(`PhishTank: Phishing site detected`);
      }

      if (service === 'scamAdviser' && result.trustScore < 30) {
        threats.scam = true;
        threats.details.push(`ScamAdviser: Low trust score (${result.trustScore})`);
      }

      if (service === 'ipQualityScore' && result.riskScore > 70) {
        threats.suspicious = true;
        threats.details.push(`IPQualityScore: High risk score (${result.riskScore})`);
      }
    });

    return threats;
  }

  /**
   * Identify specific risk factors
   */
  identifyRiskFactors(results) {
    const riskFactors = [];

    Object.entries(results).forEach(([service, result]) => {
      if (service === 'virusTotal') {
        if (result.threats?.threatNames?.length > 0) {
          riskFactors.push({
            factor: 'Malware Detection',
            severity: 'high',
            source: 'VirusTotal',
            details: result.threats.threatNames.join(', ')
          });
        }
      }

      if (service === 'scamAdviser' && result.trustScore < 50) {
        riskFactors.push({
          factor: 'Low Trust Score',
          severity: result.trustScore < 30 ? 'high' : 'medium',
          source: 'ScamAdviser',
          details: `Trust score: ${result.trustScore}/100`
        });
      }

      if (service === 'ipQualityScore') {
        if (result.isProxy) {
          riskFactors.push({
            factor: 'Proxy/VPN Usage',
            severity: 'medium',
            source: 'IPQualityScore',
            details: 'Traffic routed through proxy or VPN'
          });
        }
        if (result.isSuspicious) {
          riskFactors.push({
            factor: 'Suspicious Activity',
            severity: 'medium',
            source: 'IPQualityScore',
            details: 'Suspicious network activity detected'
          });
        }
      }
    });

    return riskFactors;
  }

  /**
   * Get service status for health checks
   */
  async getServiceStatus() {
    const status = {};
    
    for (const [serviceName, service] of Object.entries(this.services)) {
      try {
        // Test with a safe URL
        const testResult = await this.runService(serviceName, () => 
          service.checkUrl ? service.checkUrl('https://google.com') : 
          service.analyzeUrl ? service.analyzeUrl('https://google.com') :
          Promise.resolve({ success: true })
        );
        
        status[serviceName] = {
          available: testResult.success,
          error: testResult.error || null
        };
      } catch (error) {
        status[serviceName] = {
          available: false,
          error: error.message
        };
      }
    }

    return status;
  }
}

module.exports = new SecurityAggregatorService();
