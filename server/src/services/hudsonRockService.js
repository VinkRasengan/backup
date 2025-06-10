const axios = require('axios');

class HudsonRockService {
  constructor() {
    this.apiKey = process.env.HUDSON_ROCK_API_KEY;
    this.baseUrl = process.env.HUDSON_ROCK_API_URL || 'https://cavalier.hudsonrock.com/api/json/v2';
    this.timeout = 30000;
  }

  /**
   * Check if Hudson Rock service is configured
   */
  isConfigured() {
    const isValid = this.apiKey && 
                   this.apiKey !== 'your-hudson-rock-api-key-here' &&
                   this.apiKey.length > 10;

    console.log(`🔑 Hudson Rock API Status: ${isValid ? 'Configured ✅' : 'Not configured ❌'}`);
    return isValid;
  }

  /**
   * Search for domain in stolen credentials database
   */
  async searchDomain(domain) {
    try {
      if (!this.isConfigured()) {
        return this.getMockDomainResponse(domain);
      }

      console.log(`🔍 Hudson Rock: Searching domain - ${domain}`);

      const config = {
        method: 'GET',
        url: `${this.baseUrl}/osint-tools/search-by-domain`,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        params: {
          domain: domain
        },
        timeout: this.timeout
      };

      const response = await axios(config);

      if (response.data) {
        return this.parseHudsonRockResponse(response.data, domain);
      }

      throw new Error('Empty response from Hudson Rock API');

    } catch (error) {
      console.error('❌ Hudson Rock API Error:', error.message);
      return this.getMockDomainResponse(domain);
    }
  }

  /**
   * Search for email in data breaches
   */
  async searchEmail(email) {
    try {
      if (!this.isConfigured()) {
        return this.getMockEmailResponse(email);
      }

      console.log(`🔍 Hudson Rock: Searching email - ${email.substring(0, 3)}***`);

      const config = {
        method: 'GET',
        url: `${this.baseUrl}/osint-tools/search-by-email`,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        params: {
          email: email
        },
        timeout: this.timeout
      };

      const response = await axios(config);

      if (response.data) {
        return this.parseEmailResponse(response.data, email);
      }

      throw new Error('Empty response from Hudson Rock API');

    } catch (error) {
      console.error('❌ Hudson Rock Email Search Error:', error.message);
      return this.getMockEmailResponse(email);
    }
  }

  /**
   * Parse Hudson Rock domain response
   */
  parseHudsonRockResponse(data, domain) {
    const stealersCount = data.stealers_data?.length || 0;
    const isCompromised = stealersCount > 0;
    const riskScore = isCompromised ? Math.min(90, 30 + stealersCount * 10) : 10;

    return {
      success: true,
      service: 'Hudson Rock',
      domain: domain,
      isCompromised: isCompromised,
      riskScore: riskScore,
      stealersCount: stealersCount,
      details: {
        stealers: data.stealers_data || [],
        totalRecords: data.total_records || 0,
        lastSeen: data.last_seen || null,
        infectedComputers: data.infected_computers || 0,
        uniquePasswords: data.unique_passwords || 0
      },
      summary: isCompromised 
        ? `Tìm thấy ${stealersCount} stealer với thông tin từ domain này`
        : 'Không tìm thấy thông tin bị đánh cắp từ domain này',
      rawResponse: data,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Parse email search response
   */
  parseEmailResponse(data, email) {
    const breachCount = data.data_breaches?.length || 0;
    const isBreached = breachCount > 0;
    const riskScore = isBreached ? Math.min(95, 40 + breachCount * 15) : 5;

    return {
      success: true,
      service: 'Hudson Rock',
      email: email.replace(/(.{3}).*(@.*)/, '$1***$2'), // Mask email for privacy
      isBreached: isBreached,
      riskScore: riskScore,
      breachCount: breachCount,
      details: {
        breaches: data.data_breaches || [],
        passwords: data.passwords || [],
        lastBreach: data.last_breach_date || null,
        compromisedAccounts: data.compromised_accounts || 0
      },
      summary: isBreached 
        ? `Email này xuất hiện trong ${breachCount} vụ rò rỉ dữ liệu`
        : 'Email này không xuất hiện trong cơ sở dữ liệu rò rỉ',
      rawResponse: data,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Mock response for domain search
   */
  getMockDomainResponse(domain) {
    const isHighRisk = domain.includes('suspicious') || 
                      domain.includes('temp') ||
                      domain.includes('fake');

    const mockStealersCount = isHighRisk ? Math.floor(Math.random() * 5) + 1 : 0;
    const mockRiskScore = isHighRisk ? Math.floor(Math.random() * 40) + 50 : Math.floor(Math.random() * 20);

    return {
      success: true,
      service: 'Hudson Rock (Mock)',
      domain: domain,
      isCompromised: isHighRisk,
      riskScore: mockRiskScore,
      stealersCount: mockStealersCount,
      details: {
        stealers: isHighRisk ? [`Stealer${Math.floor(Math.random() * 10) + 1}`] : [],
        totalRecords: isHighRisk ? Math.floor(Math.random() * 100) + 10 : 0,
        lastSeen: isHighRisk ? new Date(Date.now() - Math.random() * 86400000 * 30).toISOString() : null,
        infectedComputers: isHighRisk ? Math.floor(Math.random() * 20) + 1 : 0,
        uniquePasswords: isHighRisk ? Math.floor(Math.random() * 50) + 5 : 0
      },
      summary: isHighRisk 
        ? `Tìm thấy ${mockStealersCount} stealer với thông tin từ domain này (Mock)`
        : 'Không tìm thấy thông tin bị đánh cắp từ domain này (Mock)',
      rawResponse: { mock: true },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Mock response for email search
   */
  getMockEmailResponse(email) {
    const isHighRisk = email.includes('test') || email.includes('admin');
    const mockBreachCount = isHighRisk ? Math.floor(Math.random() * 3) + 1 : 0;
    const mockRiskScore = isHighRisk ? Math.floor(Math.random() * 30) + 60 : Math.floor(Math.random() * 15);

    return {
      success: true,
      service: 'Hudson Rock (Mock)',
      email: email.replace(/(.{3}).*(@.*)/, '$1***$2'),
      isBreached: isHighRisk,
      riskScore: mockRiskScore,
      breachCount: mockBreachCount,
      details: {
        breaches: isHighRisk ? [`Breach${Math.floor(Math.random() * 5) + 1}`] : [],
        passwords: isHighRisk ? ['***hidden***'] : [],
        lastBreach: isHighRisk ? new Date(Date.now() - Math.random() * 86400000 * 180).toISOString() : null,
        compromisedAccounts: isHighRisk ? Math.floor(Math.random() * 10) + 1 : 0
      },
      summary: isHighRisk 
        ? `Email này xuất hiện trong ${mockBreachCount} vụ rò rỉ dữ liệu (Mock)`
        : 'Email này không xuất hiện trong cơ sở dữ liệu rò rỉ (Mock)',
      rawResponse: { mock: true },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      name: 'Hudson Rock',
      configured: this.isConfigured(),
      baseUrl: this.baseUrl,
      documentation: 'https://docs.hudsonrock.com/',
      capabilities: ['Domain Search', 'Email Breach Check', 'Stealer Data Analysis']
    };
  }
}

module.exports = new HudsonRockService();
