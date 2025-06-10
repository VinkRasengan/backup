const apwgService = require('./apwgService');
const hudsonRockService = require('./hudsonRockService');
const phishTankService = require('./phishTankService');
const ipQualityScoreService = require('./ipQualityScoreService');
const googleSafeBrowsingService = require('./googleSafeBrowsingService');
const criminalIPService = require('./criminalIPService');
const scamAdviserService = require('./scamAdviserService');
const virusTotalService = require('./virusTotalService');
const vietnameseSecurityService = require('./vietnameseSecurityService');

class SecurityAggregatorService {
  constructor() {
    this.services = {
      apwg: apwgService,
      hudsonRock: hudsonRockService,
      phishTank: phishTankService,
      ipQualityScore: ipQualityScoreService,
      googleSafeBrowsing: googleSafeBrowsingService,
      criminalIP: criminalIPService,
      scamAdviser: scamAdviserService,
      virusTotal: virusTotalService,
      vietnameseSecurity: vietnameseSecurityService
    };

    this.timeout = 45000; // 45 seconds for aggregated analysis
  }

  /**
   * Perform comprehensive URL security analysis
   */
  async analyzeUrl(url) {
    console.log(`🔍 Security Aggregator: Analyzing URL - ${url}`);
    
    const startTime = Date.now();
    const results = {};
    const errors = {};

    // Run all URL-capable services in parallel
    const urlAnalysisPromises = [
      this.runService('apwg', () => this.services.apwg.checkUrl(url)),
      this.runService('phishTank', () => this.services.phishTank.checkUrl(url)),
      this.runService('ipQualityScore', () => this.services.ipQualityScore.checkUrl(url)),
      this.runService('googleSafeBrowsing', () => this.services.googleSafeBrowsing.checkUrl(url)),
      this.runService('criminalIP', () => this.services.criminalIP.checkUrl(url)),
      this.runService('scamAdviser', () => this.services.scamAdviser.analyzeUrl(url)),
      this.runService('virusTotal', () => this.services.virusTotal.checkUrl(url)),
      this.runService('vietnameseSecurity', () => this.services.vietnameseSecurity.checkAllServices(url))
    ];

    const serviceResults = await Promise.allSettled(urlAnalysisPromises);

    // Process results
    serviceResults.forEach((result, index) => {
      const serviceName = ['apwg', 'phishTank', 'ipQualityScore', 'googleSafeBrowsing', 'criminalIP', 'scamAdviser', 'virusTotal', 'vietnameseSecurity'][index];
      
      if (result.status === 'fulfilled' && result.value.success) {
        results[serviceName] = result.value.data;
      } else {
        errors[serviceName] = result.reason?.message || 'Service unavailable';
      }
    });

    // Also check domain separately with Hudson Rock
    try {
      const domain = new URL(url).hostname;
      const hudsonRockResult = await this.runService('hudsonRock', () => this.services.hudsonRock.searchDomain(domain));
      if (hudsonRockResult.success) {
        results.hudsonRock = hudsonRockResult.data;
      }
    } catch (error) {
      errors.hudsonRock = error.message;
    }

    const analysisTime = Date.now() - startTime;

    return {
      success: true,
      url: url,
      analysisTime: `${analysisTime}ms`,
      servicesChecked: Object.keys(this.services).length,
      servicesSucceeded: Object.keys(results).length,
      servicesFailed: Object.keys(errors).length,
      overallRisk: this.calculateOverallRisk(results),
      riskFactors: this.identifyRiskFactors(results),
      recommendations: this.generateRecommendations(results),
      results: results,
      errors: errors,
      summary: this.generateSummary(results),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Run a service with error handling
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
      console.error(`❌ ${serviceName} service error:`, error.message);
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
      virusTotal: 0.20,
      googleSafeBrowsing: 0.20,
      phishTank: 0.12,
      ipQualityScore: 0.12,
      vietnameseSecurity: 0.15, // High weight for Vietnamese services
      scamAdviser: 0.10,
      apwg: 0.05,
      criminalIP: 0.04,
      hudsonRock: 0.02
    };

    Object.entries(results).forEach(([service, result]) => {
      let score = 0;
      const weight = weights[service] || 0.01;

      if (service === 'virusTotal') {
        score = result.securityScore ? (100 - result.securityScore) : 0;
      } else if (service === 'googleSafeBrowsing') {
        score = result.isUnsafe ? 90 : 10;
      } else if (service === 'phishTank') {
        score = result.isPhishing ? (result.verified ? 95 : 80) : 5;
      } else if (service === 'ipQualityScore') {
        score = result.riskScore || 0;
      } else if (service === 'scamAdviser') {
        score = result.trustScore ? (100 - result.trustScore) : 50;
      } else if (service === 'apwg') {
        score = result.isPhishing ? 85 : 15;
      } else if (service === 'criminalIP') {
        score = result.riskScore || 0;
      } else if (service === 'hudsonRock') {
        score = result.isCompromised ? result.riskScore : 10;
      } else if (service === 'vietnameseSecurity') {
        score = result.overallScore ? (100 - result.overallScore) : 50;
      }

      scores.push({ score, weight });
    });

    if (scores.length === 0) return { score: 50, level: 'unknown' };

    const weightedScore = scores.reduce((total, item) => total + (item.score * item.weight), 0) / 
                         scores.reduce((total, item) => total + item.weight, 0);

    return {
      score: Math.round(weightedScore),
      level: this.getRiskLevel(weightedScore),
      confidence: Math.min(95, scores.length * 12) // Higher confidence with more services
    };
  }

  /**
   * Get risk level based on score
   */
  getRiskLevel(score) {
    if (score >= 80) return 'very-high';
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    if (score >= 20) return 'low';
    return 'very-low';
  }

  /**
   * Identify specific risk factors
   */
  identifyRiskFactors(results) {
    const factors = [];

    Object.entries(results).forEach(([service, result]) => {
      if (service === 'virusTotal' && result.threats?.malicious) {
        factors.push('Malware detected by VirusTotal');
      }
      if (service === 'googleSafeBrowsing' && result.isUnsafe) {
        factors.push(`Google Safe Browsing: ${result.threatTypes?.join(', ')}`);
      }
      if (service === 'phishTank' && result.isPhishing) {
        factors.push('Listed in PhishTank database');
      }
      if (service === 'ipQualityScore') {
        if (result.details?.malware) factors.push('Malware detected by IPQualityScore');
        if (result.details?.phishing) factors.push('Phishing detected by IPQualityScore');
        if (result.details?.suspicious) factors.push('Suspicious activity detected');
      }
      if (service === 'scamAdviser' && result.riskLevel === 'high') {
        factors.push('High risk according to ScamAdviser');
      }
      if (service === 'apwg' && result.isPhishing) {
        factors.push('Listed in APWG database');
      }
      if (service === 'criminalIP' && result.details?.isMalicious) {
        factors.push('Marked as malicious by Criminal IP');
      }
      if (service === 'hudsonRock' && result.isCompromised) {
        factors.push('Domain found in data breach records');
      }
      if (service === 'vietnameseSecurity' && result.suspiciousResults > 0) {
        factors.push(`${result.suspiciousResults} Vietnamese security service(s) detected threats`);
      }
    });

    return factors;
  }

  /**
   * Generate security recommendations
   */
  generateRecommendations(results) {
    const riskFactors = this.identifyRiskFactors(results);
    const recommendations = [];

    if (riskFactors.length === 0) {
      recommendations.push('URL appears to be safe based on current analysis');
      recommendations.push('Still exercise caution and avoid entering sensitive information');
    } else {
      recommendations.push('⚠️ DO NOT visit this URL - multiple security risks detected');
      recommendations.push('🚫 Do not enter any personal information');
      recommendations.push('🔒 Use a VPN if you must investigate further');
      recommendations.push('📱 Report this URL to appropriate authorities');
      
      if (riskFactors.some(f => f.includes('Malware'))) {
        recommendations.push('🦠 Scan your system if you already visited this URL');
      }
      
      if (riskFactors.some(f => f.includes('Phishing'))) {
        recommendations.push('🎣 Be aware of similar phishing attempts');
      }
    }

    return recommendations;
  }

  /**
   * Generate human-readable summary
   */
  generateSummary(results) {
    const riskFactors = this.identifyRiskFactors(results);
    const serviceCount = Object.keys(results).length;

    if (riskFactors.length === 0) {
      return `✅ URL được kiểm tra bởi ${serviceCount} dịch vụ bảo mật - Không phát hiện mối đe dọa`;
    }

    const severityCount = riskFactors.length;
    if (severityCount >= 3) {
      return `🚨 NGUY HIỂM CAO: Phát hiện ${severityCount} mối đe dọa từ ${serviceCount} dịch vụ bảo mật`;
    } else if (severityCount >= 2) {
      return `⚠️ RỦI RO TRUNG BÌNH: Phát hiện ${severityCount} mối đe dọa từ ${serviceCount} dịch vụ bảo mật`;
    } else {
      return `⚠️ RỦI RO THẤP: Phát hiện ${severityCount} mối đe dọa từ ${serviceCount} dịch vụ bảo mật`;
    }
  }

  /**
   * Analyze IP address across all applicable services
   */
  async analyzeIP(ip) {
    console.log(`🔍 Security Aggregator: Analyzing IP - ${ip}`);
    
    const results = {};
    const errors = {};

    const ipAnalysisPromises = [
      this.runService('ipQualityScore', () => this.services.ipQualityScore.checkIP(ip)),
      this.runService('criminalIP', () => this.services.criminalIP.checkIP(ip)),
      this.runService('virusTotal', () => this.services.virusTotal.checkIP?.(ip))
    ].filter(Boolean);

    const serviceResults = await Promise.allSettled(ipAnalysisPromises);

    serviceResults.forEach((result, index) => {
      const serviceName = ['ipQualityScore', 'criminalIP', 'virusTotal'][index];
      
      if (result.status === 'fulfilled' && result.value.success) {
        results[serviceName] = result.value.data;
      } else {
        errors[serviceName] = result.reason?.message || 'Service unavailable';
      }
    });

    return {
      success: true,
      ip: ip,
      results: results,
      errors: errors,
      overallRisk: this.calculateOverallRisk(results),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get status of all security services
   */
  getServicesStatus() {
    const status = {};
    
    Object.entries(this.services).forEach(([name, service]) => {
      try {
        status[name] = service.getStatus();
      } catch (error) {
        status[name] = {
          name: name,
          configured: false,
          error: error.message
        };
      }
    });

    return {
      totalServices: Object.keys(this.services).length,
      configuredServices: Object.values(status).filter(s => s.configured).length,
      services: status,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new SecurityAggregatorService();
