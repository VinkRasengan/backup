const axios = require('axios');

class IPQualityScoreService {
  constructor() {
    this.apiKey = process.env.IPQUALITYSCORE_API_KEY;
    this.baseUrl = 'https://ipqualityscore.com/api/json';
    this.timeout = 30000;
  }

  /**
   * Check if IPQualityScore service is configured
   */
  isConfigured() {
    const isValid = this.apiKey && 
                   this.apiKey !== 'your-ipqualityscore-api-key-here' &&
                   this.apiKey.length > 10;

    console.log(`🔑 IPQualityScore API Status: ${isValid ? 'Configured ✅' : 'Not configured ❌'}`);
    return isValid;
  }

  /**
   * Check URL reputation and safety
   */
  async checkUrl(url) {
    try {
      if (!this.isConfigured()) {
        return this.getMockUrlResponse(url);
      }

      console.log(`🔍 IPQualityScore: Checking URL - ${url}`);

      const config = {
        method: 'GET',
        url: `${this.baseUrl}/url/${this.apiKey}/${encodeURIComponent(url)}`,
        params: {
          strictness: 1,
          fast: false
        },
        timeout: this.timeout
      };

      const response = await axios(config);

      if (response.data) {
        return this.parseUrlResponse(response.data, url);
      }

      throw new Error('Empty response from IPQualityScore API');

    } catch (error) {
      console.error('❌ IPQualityScore URL Check Error:', error.message);
      return this.getMockUrlResponse(url);
    }
  }

  /**
   * Check IP address reputation
   */
  async checkIP(ip) {
    try {
      if (!this.isConfigured()) {
        return this.getMockIPResponse(ip);
      }

      console.log(`🔍 IPQualityScore: Checking IP - ${ip}`);

      const config = {
        method: 'GET',
        url: `${this.baseUrl}/ip/${this.apiKey}/${ip}`,
        params: {
          strictness: 1,
          allow_public_access_points: true,
          fast: false,
          lighter_penalties: false
        },
        timeout: this.timeout
      };

      const response = await axios(config);

      if (response.data) {
        return this.parseIPResponse(response.data, ip);
      }

      throw new Error('Empty response from IPQualityScore API');

    } catch (error) {
      console.error('❌ IPQualityScore IP Check Error:', error.message);
      return this.getMockIPResponse(ip);
    }
  }

  /**
   * Check email address reputation
   */
  async checkEmail(email) {
    try {
      if (!this.isConfigured()) {
        return this.getMockEmailResponse(email);
      }

      console.log(`🔍 IPQualityScore: Checking email - ${email.substring(0, 3)}***`);

      const config = {
        method: 'GET',
        url: `${this.baseUrl}/email/${this.apiKey}/${encodeURIComponent(email)}`,
        params: {
          fast: false,
          timeout: 7
        },
        timeout: this.timeout
      };

      const response = await axios(config);

      if (response.data) {
        return this.parseEmailResponse(response.data, email);
      }

      throw new Error('Empty response from IPQualityScore API');

    } catch (error) {
      console.error('❌ IPQualityScore Email Check Error:', error.message);
      return this.getMockEmailResponse(email);
    }
  }

  /**
   * Parse URL response from IPQualityScore
   */
  parseUrlResponse(data, url) {
    const riskScore = data.risk_score || 0;
    const isSafe = riskScore < 50 && !data.malware && !data.phishing && !data.suspicious;
    
    return {
      success: true,
      service: 'IPQualityScore',
      url: url,
      isSafe: isSafe,
      isRisky: !isSafe,
      riskScore: riskScore,
      details: {
        malware: data.malware || false,
        phishing: data.phishing || false,
        suspicious: data.suspicious || false,
        adultContent: data.adult || false,
        category: data.category || 'Unknown',
        domain: data.domain || null,
        countryCode: data.country_code || null,
        ipAddress: data.ip_address || null,
        server: data.server || null,
        contentType: data.content_type || null,
        statusCode: data.status_code || null,
        pageSize: data.page_size || null,
        domainAge: data.domain_age?.human || null,
        dnsSecurity: {
          spfRecord: data.spf || false,
          dmarcRecord: data.dmarc || false
        }
      },
      summary: this.generateUrlSummary(data, riskScore),
      rawResponse: data,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Parse IP response from IPQualityScore
   */
  parseIPResponse(data, ip) {
    const fraudScore = data.fraud_score || 0;
    const isSafe = fraudScore < 50 && !data.vpn && !data.tor && !data.proxy;

    return {
      success: true,
      service: 'IPQualityScore',
      ip: ip,
      isSafe: isSafe,
      isRisky: !isSafe,
      fraudScore: fraudScore,
      details: {
        country: data.country_code || null,
        region: data.region || null,
        city: data.city || null,
        isp: data.ISP || null,
        organization: data.organization || null,
        vpn: data.vpn || false,
        tor: data.tor || false,
        proxy: data.proxy || false,
        bot: data.bot_status || false,
        recentAbuse: data.recent_abuse || false,
        connectionType: data.connection_type || null,
        abuseVelocity: data.abuse_velocity || null,
        timezone: data.timezone || null
      },
      summary: this.generateIPSummary(data, fraudScore),
      rawResponse: data,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Parse email response from IPQualityScore
   */
  parseEmailResponse(data, email) {
    const riskScore = data.overall_score || 0;
    const isValid = data.valid && !data.disposable && !data.toxic;

    return {
      success: true,
      service: 'IPQualityScore',
      email: email.replace(/(.{3}).*(@.*)/, '$1***$2'),
      isValid: isValid,
      isSafe: isValid && riskScore < 50,
      riskScore: riskScore,
      details: {
        valid: data.valid || false,
        disposable: data.disposable || false,
        toxic: data.toxic || false,
        fraud: data.fraud || false,
        spamTrapScore: data.spam_trap_score || 0,
        recentAbuse: data.recent_abuse || false,
        deliverability: data.deliverability || 'unknown',
        catchAll: data.catch_all || false,
        genericAccount: data.generic || false,
        commonEmailProvider: data.common || false,
        dnsSecurity: {
          validMx: data.dns_valid || false,
          spfStrict: data.spf_strict || false,
          dmarcEnforced: data.dmarc_enforced || false
        }
      },
      summary: this.generateEmailSummary(data, riskScore),
      rawResponse: data,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Generate URL summary
   */
  generateUrlSummary(data, riskScore) {
    if (data.malware) return 'URL này chứa malware - NGUY HIỂM!';
    if (data.phishing) return 'URL này là trang phishing - NGUY HIỂM!';
    if (data.suspicious) return 'URL này có dấu hiệu đáng ngờ';
    if (riskScore > 75) return 'URL này có rủi ro cao';
    if (riskScore > 50) return 'URL này có rủi ro trung bình';
    return 'URL này có vẻ an toàn';
  }

  /**
   * Generate IP summary
   */
  generateIPSummary(data, fraudScore) {
    if (data.tor) return 'IP này sử dụng mạng Tor - cần thận trọng';
    if (data.vpn) return 'IP này sử dụng VPN';
    if (data.proxy) return 'IP này sử dụng proxy';
    if (data.recent_abuse) return 'IP này có lịch sử lạm dụng gần đây';
    if (fraudScore > 75) return 'IP này có rủi ro lừa đảo cao';
    if (fraudScore > 50) return 'IP này có rủi ro lừa đảo trung bình';
    return 'IP này có vẻ an toàn';
  }

  /**
   * Generate email summary
   */
  generateEmailSummary(data, riskScore) {
    if (!data.valid) return 'Email này không hợp lệ';
    if (data.disposable) return 'Email này là tài khoản tạm thời';
    if (data.toxic) return 'Email này có dấu hiệu độc hại';
    if (data.fraud) return 'Email này có rủi ro lừa đảo';
    if (riskScore > 75) return 'Email này có rủi ro cao';
    if (riskScore > 50) return 'Email này có rủi ro trung bình';
    return 'Email này có vẻ hợp lệ và an toàn';
  }

  /**
   * Mock responses for when API is not available
   */
  getMockUrlResponse(url) {
    const isHighRisk = url.includes('suspicious') || url.includes('malware') || url.includes('phish');
    const mockRiskScore = isHighRisk ? Math.floor(Math.random() * 30) + 70 : Math.floor(Math.random() * 40);

    return {
      success: true,
      service: 'IPQualityScore (Mock)',
      url: url,
      isSafe: !isHighRisk,
      isRisky: isHighRisk,
      riskScore: mockRiskScore,
      details: {
        malware: isHighRisk && Math.random() > 0.7,
        phishing: isHighRisk && Math.random() > 0.6,
        suspicious: isHighRisk,
        adultContent: false,
        category: isHighRisk ? 'Suspicious' : 'Safe',
        domain: new URL(url).hostname,
        countryCode: 'US',
        ipAddress: '192.168.1.1',
        server: 'nginx',
        contentType: 'text/html',
        statusCode: 200,
        pageSize: 1024,
        domainAge: '2 years',
        dnsSecurity: {
          spfRecord: true,
          dmarcRecord: false
        }
      },
      summary: isHighRisk ? 'URL này có dấu hiệu đáng ngờ (Mock)' : 'URL này có vẻ an toàn (Mock)',
      rawResponse: { mock: true },
      timestamp: new Date().toISOString()
    };
  }

  getMockIPResponse(ip) {
    const isHighRisk = ip.includes('suspicious') || ip.startsWith('10.') || ip.startsWith('192.168.');
    const mockFraudScore = isHighRisk ? Math.floor(Math.random() * 30) + 60 : Math.floor(Math.random() * 40);

    return {
      success: true,
      service: 'IPQualityScore (Mock)',
      ip: ip,
      isSafe: !isHighRisk,
      isRisky: isHighRisk,
      fraudScore: mockFraudScore,
      details: {
        country: 'US',
        region: 'California',
        city: 'San Francisco',
        isp: 'Example ISP',
        organization: 'Example Org',
        vpn: isHighRisk && Math.random() > 0.5,
        tor: false,
        proxy: isHighRisk && Math.random() > 0.7,
        bot: false,
        recentAbuse: isHighRisk && Math.random() > 0.8,
        connectionType: 'residential',
        abuseVelocity: 'low',
        timezone: 'America/Los_Angeles'
      },
      summary: isHighRisk ? 'IP này có rủi ro trung bình (Mock)' : 'IP này có vẻ an toàn (Mock)',
      rawResponse: { mock: true },
      timestamp: new Date().toISOString()
    };
  }

  getMockEmailResponse(email) {
    const isHighRisk = email.includes('test') || email.includes('temp');
    const mockRiskScore = isHighRisk ? Math.floor(Math.random() * 30) + 60 : Math.floor(Math.random() * 30);

    return {
      success: true,
      service: 'IPQualityScore (Mock)',
      email: email.replace(/(.{3}).*(@.*)/, '$1***$2'),
      isValid: !isHighRisk,
      isSafe: !isHighRisk,
      riskScore: mockRiskScore,
      details: {
        valid: !isHighRisk,
        disposable: isHighRisk,
        toxic: false,
        fraud: isHighRisk && Math.random() > 0.8,
        spamTrapScore: isHighRisk ? 50 : 10,
        recentAbuse: false,
        deliverability: isHighRisk ? 'low' : 'high',
        catchAll: false,
        genericAccount: false,
        commonEmailProvider: true,
        dnsSecurity: {
          validMx: true,
          spfStrict: false,
          dmarcEnforced: false
        }
      },
      summary: isHighRisk ? 'Email này là tài khoản tạm thời (Mock)' : 'Email này có vẻ hợp lệ và an toàn (Mock)',
      rawResponse: { mock: true },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      name: 'IPQualityScore',
      configured: this.isConfigured(),
      baseUrl: this.baseUrl,
      documentation: 'https://ipqualityscore.com/documentation/overview',
      capabilities: ['URL Reputation', 'IP Fraud Detection', 'Email Validation', 'Malware Detection']
    };
  }
}

module.exports = new IPQualityScoreService();
