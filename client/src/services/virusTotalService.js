// VirusTotal API Service - Via Backend Services (No Direct Calls)
class VirusTotalService {
  constructor() {
    // ✅ Remove direct API access - all calls go through backend
    this.baseURL = process.env.REACT_APP_API_URL || "http://localhost:8080";
    this.lastRequestTime = 0;
    this.rateLimitDelay = 1000; // Reduced delay since backend handles rate limiting
  }

  async enforceRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.rateLimitDelay) {
      const waitTime = this.rateLimitDelay - timeSinceLastRequest;
      console.log(`⏳ Rate limiting: waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }

  createUrlId(url) {
    // VirusTotal uses base64 encoded URL without padding
    return btoa(url).replace(/=/g, '');
  }

  async scanUrl(url) {
    try {
      await this.enforceRateLimit();

      // ✅ Use backend service instead of direct API call
      const response = await fetch(`${this.baseURL}/api/security/virustotal/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('backendToken')}`
        },
        body: JSON.stringify({ url })
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          analysisId: data.data?.id || data.analysisId
        };
      } else {
        throw new Error(`HTTP ${response.status}`);
      }

    } catch (error) {
      console.error('VirusTotal scan error:', error);
      return {
        success: false,
        error: 'Backend service error - using mock data',
        mockData: this.getMockScanResult(url)
      };
    }
  }

  async getUrlReport(url) {
    try {
      await this.enforceRateLimit();

      // ✅ Use backend service instead of direct API call
      const response = await fetch(`${this.baseURL}/api/security/virustotal/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('backendToken')}`
        },
        body: JSON.stringify({ url })
      });

      if (response.ok) {
        const result = await response.json();
        const data = result.data;

        return {
          success: true,
          url: url,
          scanDate: data.scanDate || new Date().toISOString(),
          stats: data.stats || {},
          reputation: data.reputation || 0,
          malicious: data.malicious || false,
          suspicious: data.suspicious || false,
          harmless: data.harmless || false,
          totalEngines: data.totalEngines || 0
        };
      } else if (response.status === 404) {
        // URL not in database, trigger scan
        const scanResult = await this.scanUrl(url);
        return {
          success: true,
          needsScanning: true,
          scanTriggered: scanResult.success
        };
      } else {
        throw new Error(`HTTP ${response.status}`);
      }

    } catch (error) {
      console.error('VirusTotal report error:', error);
      return {
        success: true,
        mockData: true,
        ...this.getMockScanResult(url)
      };
    }
  }

  getMockScanResult(url) {
    // Generate realistic mock data based on URL characteristics
    const domain = new URL(url).hostname;
    const isHttps = url.startsWith('https://');
    const hasCommonTLD = /\.(com|org|net|edu|gov)$/.test(domain);
    
    let baseScore = 70;
    if (isHttps) baseScore += 15;
    if (hasCommonTLD) baseScore += 10;
    if (domain.includes('google') || domain.includes('microsoft') || domain.includes('apple')) baseScore = 95;
    
    const maliciousCount = baseScore < 60 ? Math.floor(Math.random() * 3) : 0;
    const suspiciousCount = baseScore < 80 ? Math.floor(Math.random() * 2) : 0;
    
    return {
      url,
      scanDate: new Date().toISOString(),
      stats: {
        malicious: maliciousCount,
        suspicious: suspiciousCount,
        harmless: 65 - maliciousCount - suspiciousCount,
        undetected: 5
      },
      reputation: Math.max(0, baseScore + Math.floor(Math.random() * 20) - 10),
      malicious: maliciousCount > 0,
      suspicious: suspiciousCount > 0,
      harmless: maliciousCount === 0 && suspiciousCount === 0,
      totalEngines: 70,
      mockData: true
    };
  }

  calculateSecurityScore(urlReport) {
    if (!urlReport || !urlReport.success) return 50;
    
    let score = 100;
    
    if (urlReport.malicious) score -= 50;
    if (urlReport.suspicious) score -= 25;
    if (urlReport.reputation < 0) score -= 20;
    if (urlReport.stats?.malicious > 0) score -= urlReport.stats.malicious * 10;
    if (urlReport.stats?.suspicious > 0) score -= urlReport.stats.suspicious * 5;
    
    return Math.max(0, Math.min(100, score));
  }

  async analyzeUrl(url) {
    try {
      const urlReport = await this.getUrlReport(url);
      const securityScore = this.calculateSecurityScore(urlReport);
      
      return {
        success: true,
        url,
        securityScore,
        urlAnalysis: urlReport,
        threats: {
          malicious: urlReport.malicious || false,
          suspicious: urlReport.suspicious || false,
          threatNames: []
        },
        analyzedAt: new Date().toISOString(),
        mockData: urlReport.mockData || false
      };
    } catch (error) {
      console.error('URL analysis error:', error);
      return {
        success: false,
        error: 'Analysis failed'
      };
    }
  }
}

const virusTotalService = new VirusTotalService();
export default virusTotalService;
