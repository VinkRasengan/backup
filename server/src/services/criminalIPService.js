const axios = require('axios');

class CriminalIPService {
  constructor() {
    this.apiKey = process.env.CRIMINAL_IP_API_KEY;
    this.baseUrl = process.env.CRIMINAL_IP_API_URL || 'https://api.criminalip.io';
    this.timeout = 30000;
  }

  /**
   * Check if Criminal IP service is configured
   */
  isConfigured() {
    const isValid = this.apiKey && 
                   this.apiKey !== 'your-criminal-ip-api-key-here' &&
                   this.apiKey.length > 10;

    console.log(`🔑 Criminal IP API Status: ${isValid ? 'Configured ✅' : 'Not configured ❌'}`);
    return isValid;
  }

  /**
   * Check IP address reputation
   */
  async checkIP(ip) {
    try {
      if (!this.isConfigured()) {
        return this.getMockIPResponse(ip);
      }

      console.log(`🔍 Criminal IP: Checking IP - ${ip}`);

      const config = {
        method: 'GET',
        url: `${this.baseUrl}/v1/ip/reputation`,
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json'
        },
        params: {
          ip: ip
        },
        timeout: this.timeout
      };

      const response = await axios(config);

      if (response.data) {
        return this.parseIPResponse(response.data, ip);
      }

      throw new Error('Empty response from Criminal IP API');

    } catch (error) {
      console.error('❌ Criminal IP API Error:', error.message);
      return this.getMockIPResponse(ip);
    }
  }

  /**
   * Check domain reputation
   */
  async checkDomain(domain) {
    try {
      if (!this.isConfigured()) {
        return this.getMockDomainResponse(domain);
      }

      console.log(`🔍 Criminal IP: Checking domain - ${domain}`);

      const config = {
        method: 'GET',
        url: `${this.baseUrl}/v1/domain/reputation`,
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json'
        },
        params: {
          domain: domain
        },
        timeout: this.timeout
      };

      const response = await axios(config);

      if (response.data) {
        return this.parseDomainResponse(response.data, domain);
      }

      throw new Error('Empty response from Criminal IP API');

    } catch (error) {
      console.error('❌ Criminal IP Domain Check Error:', error.message);
      return this.getMockDomainResponse(domain);
    }
  }

  /**
   * Check URL reputation
   */
  async checkUrl(url) {
    try {
      const domain = new URL(url).hostname;
      const domainResult = await this.checkDomain(domain);
      
      // Add URL-specific information to domain result
      return {
        ...domainResult,
        url: url,
        type: 'url'
      };

    } catch (error) {
      console.error('❌ Criminal IP URL Check Error:', error.message);
      return this.getMockUrlResponse(url);
    }
  }

  /**
   * Parse IP reputation response
   */
  parseIPResponse(data, ip) {
    const riskScore = data.score || 0;
    const isSafe = riskScore < 50;
    
    return {
      success: true,
      service: 'Criminal IP',
      ip: ip,
      isSafe: isSafe,
      isRisky: !isSafe,
      riskScore: riskScore,
      details: {
        country: data.country || null,
        asn: data.asn || null,
        organization: data.org || null,
        isp: data.isp || null,
        threatTypes: data.threat_types || [],
        categories: data.categories || [],
        tags: data.tags || [],
        isVpn: data.is_vpn || false,
        isTor: data.is_tor || false,
        isProxy: data.is_proxy || false,
        isMalicious: data.is_malicious || false,
        lastSeen: data.last_seen || null,
        whoisData: data.whois || null
      },
      summary: this.generateIPSummary(data, riskScore),
      rawResponse: data,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Parse domain reputation response
   */
  parseDomainResponse(data, domain) {
    const riskScore = data.score || 0;
    const isSafe = riskScore < 50;
    
    return {
      success: true,
      service: 'Criminal IP',
      domain: domain,
      isSafe: isSafe,
      isRisky: !isSafe,
      riskScore: riskScore,
      details: {
        categories: data.categories || [],
        threatTypes: data.threat_types || [],
        tags: data.tags || [],
        registrar: data.registrar || null,
        creationDate: data.creation_date || null,
        expirationDate: data.expiration_date || null,
        isParked: data.is_parked || false,
        isMalicious: data.is_malicious || false,
        isPhishing: data.is_phishing || false,
        isDga: data.is_dga || false, // Domain Generation Algorithm
        nameservers: data.nameservers || [],
        ipAddresses: data.ip_addresses || []
      },
      summary: this.generateDomainSummary(data, riskScore),
      rawResponse: data,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Generate IP summary
   */
  generateIPSummary(data, riskScore) {
    if (data.is_malicious) return 'IP này được xác định là độc hại';
    if (data.is_tor) return 'IP này thuộc mạng Tor';
    if (data.is_vpn) return 'IP này sử dụng VPN';
    if (data.is_proxy) return 'IP này là proxy server';
    if (riskScore > 75) return 'IP này có rủi ro cao';
    if (riskScore > 50) return 'IP này có rủi ro trung bình';
    return 'IP này có vẻ an toàn';
  }

  /**
   * Generate domain summary
   */
  generateDomainSummary(data, riskScore) {
    if (data.is_malicious) return 'Domain này được xác định là độc hại';
    if (data.is_phishing) return 'Domain này được xác định là phishing';
    if (data.is_dga) return 'Domain này có dấu hiệu được tạo tự động';
    if (data.is_parked) return 'Domain này đang được đỗ (parked)';
    if (riskScore > 75) return 'Domain này có rủi ro cao';
    if (riskScore > 50) return 'Domain này có rủi ro trung bình';
    return 'Domain này có vẻ an toàn';
  }

  /**
   * Mock responses for when API is not available
   */
  getMockIPResponse(ip) {
    const isHighRisk = ip.includes('suspicious') || ip.startsWith('10.') || ip.startsWith('192.168.');
    const mockRiskScore = isHighRisk ? Math.floor(Math.random() * 30) + 60 : Math.floor(Math.random() * 40);

    return {
      success: true,
      service: 'Criminal IP (Mock)',
      ip: ip,
      isSafe: !isHighRisk,
      isRisky: isHighRisk,
      riskScore: mockRiskScore,
      details: {
        country: 'US',
        asn: 'AS15169',
        organization: 'Google LLC',
        isp: 'Google',
        threatTypes: isHighRisk ? ['Suspicious'] : [],
        categories: isHighRisk ? ['Proxy'] : ['Legitimate'],
        tags: isHighRisk ? ['high-risk'] : ['clean'],
        isVpn: isHighRisk && Math.random() > 0.5,
        isTor: false,
        isProxy: isHighRisk && Math.random() > 0.7,
        isMalicious: isHighRisk && Math.random() > 0.8,
        lastSeen: isHighRisk ? new Date().toISOString() : null,
        whoisData: null
      },
      summary: isHighRisk ? 'IP này có rủi ro trung bình (Mock)' : 'IP này có vẻ an toàn (Mock)',
      rawResponse: { mock: true },
      timestamp: new Date().toISOString()
    };
  }

  getMockDomainResponse(domain) {
    const isHighRisk = domain.includes('suspicious') || domain.includes('temp') || domain.includes('fake');
    const mockRiskScore = isHighRisk ? Math.floor(Math.random() * 30) + 70 : Math.floor(Math.random() * 30);

    return {
      success: true,
      service: 'Criminal IP (Mock)',
      domain: domain,
      isSafe: !isHighRisk,
      isRisky: isHighRisk,
      riskScore: mockRiskScore,
      details: {
        categories: isHighRisk ? ['Suspicious', 'High-Risk'] : ['Legitimate'],
        threatTypes: isHighRisk ? ['Phishing'] : [],
        tags: isHighRisk ? ['high-risk', 'suspicious'] : ['clean'],
        registrar: 'Example Registrar',
        creationDate: '2020-01-01',
        expirationDate: '2025-01-01',
        isParked: false,
        isMalicious: isHighRisk,
        isPhishing: isHighRisk && Math.random() > 0.6,
        isDga: isHighRisk && Math.random() > 0.8,
        nameservers: ['ns1.example.com', 'ns2.example.com'],
        ipAddresses: ['192.168.1.1']
      },
      summary: isHighRisk ? 'Domain này có rủi ro cao (Mock)' : 'Domain này có vẻ an toàn (Mock)',
      rawResponse: { mock: true },
      timestamp: new Date().toISOString()
    };
  }

  getMockUrlResponse(url) {
    const domain = new URL(url).hostname;
    const domainResponse = this.getMockDomainResponse(domain);
    
    return {
      ...domainResponse,
      url: url,
      type: 'url'
    };
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      name: 'Criminal IP',
      configured: this.isConfigured(),
      baseUrl: this.baseUrl,
      documentation: 'Private API - Contact vendor for documentation',
      capabilities: ['IP Reputation', 'Domain Analysis', 'Threat Detection', 'VPN/Proxy Detection']
    };
  }
}

module.exports = new CriminalIPService();
