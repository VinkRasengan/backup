const virusTotalService = require('../virusTotalService');

// Mock axios
jest.mock('axios');
const axios = require('axios');

describe('VirusTotalService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset rate limiting
    virusTotalService.lastRequestTime = 0;
  });

  describe('createUrlId', () => {
    it('should create correct URL ID', () => {
      const url = 'https://example.com';
      const urlId = virusTotalService.createUrlId(url);
      expect(urlId).toBe(Buffer.from(url).toString('base64').replace(/=/g, ''));
    });
  });

  describe('calculateSecurityScore', () => {
    it('should return 100 for clean results', () => {
      const urlReport = {
        success: true,
        stats: { malicious: 0, suspicious: 0 },
        reputation: 1,
        totalEngines: 10
      };
      const domainReport = {
        success: true,
        stats: { malicious: 0, suspicious: 0 },
        reputation: 1,
        totalEngines: 10
      };
      
      const score = virusTotalService.calculateSecurityScore(urlReport, domainReport);
      expect(score).toBe(100);
    });

    it('should penalize malicious detections', () => {
      const urlReport = {
        success: true,
        stats: { malicious: 5, suspicious: 0 },
        reputation: 0,
        totalEngines: 10
      };
      const domainReport = {
        success: true,
        stats: { malicious: 0, suspicious: 0 },
        reputation: 0,
        totalEngines: 10
      };
      
      const score = virusTotalService.calculateSecurityScore(urlReport, domainReport);
      expect(score).toBeLessThan(100);
    });

    it('should handle null reports', () => {
      const score = virusTotalService.calculateSecurityScore(null, null);
      expect(score).toBe(100);
    });
  });

  describe('scanUrl', () => {
    it('should scan URL successfully', async () => {
      const mockResponse = {
        data: {
          data: {
            id: 'analysis-id-123'
          }
        }
      };
      
      axios.post.mockResolvedValue(mockResponse);
      
      const result = await virusTotalService.scanUrl('https://example.com');
      
      expect(result.success).toBe(true);
      expect(result.analysisId).toBe('analysis-id-123');
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/urls'),
        expect.stringContaining('url='),
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-apikey': virusTotalService.apiKey,
            'Content-Type': 'application/x-www-form-urlencoded'
          })
        })
      );
    });

    it('should handle API errors', async () => {
      axios.post.mockRejectedValue(new Error('API Error'));
      
      const result = await virusTotalService.scanUrl('https://example.com');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return null when API key is not configured', async () => {
      const originalApiKey = virusTotalService.apiKey;
      virusTotalService.apiKey = null;
      
      const result = await virusTotalService.scanUrl('https://example.com');
      
      expect(result).toBeNull();
      
      // Restore API key
      virusTotalService.apiKey = originalApiKey;
    });
  });

  describe('getUrlReport', () => {
    it('should get URL report successfully', async () => {
      const mockResponse = {
        data: {
          data: {
            attributes: {
              last_analysis_date: 1640995200, // 2022-01-01
              last_analysis_stats: {
                malicious: 0,
                suspicious: 0,
                harmless: 5,
                undetected: 2
              },
              reputation: 1,
              categories: {},
              threat_names: [],
              last_analysis_results: {
                engine1: { result: 'clean' },
                engine2: { result: 'clean' }
              }
            }
          }
        }
      };
      
      axios.get.mockResolvedValue(mockResponse);
      
      const result = await virusTotalService.getUrlReport('https://example.com');
      
      expect(result.success).toBe(true);
      expect(result.malicious).toBe(false);
      expect(result.stats.harmless).toBe(5);
      expect(result.totalEngines).toBe(2);
    });

    it('should trigger scan for unknown URLs', async () => {
      const error = new Error('Not found');
      error.response = { status: 404 };
      axios.get.mockRejectedValue(error);
      
      // Mock successful scan
      const mockScanResponse = {
        data: {
          data: {
            id: 'analysis-id-123'
          }
        }
      };
      axios.post.mockResolvedValue(mockScanResponse);
      
      const result = await virusTotalService.getUrlReport('https://example.com');
      
      expect(result.success).toBe(true);
      expect(result.needsScanning).toBe(true);
      expect(result.scanTriggered).toBe(true);
      expect(result.analysisId).toBe('analysis-id-123');
    });
  });

  describe('analyzeUrl', () => {
    it('should analyze URL comprehensively', async () => {
      const mockUrlReport = {
        success: true,
        malicious: false,
        suspicious: false,
        threatNames: [],
        stats: { malicious: 0, suspicious: 0, harmless: 5 },
        totalEngines: 5
      };
      
      const mockDomainReport = {
        success: true,
        malicious: false,
        suspicious: false,
        reputation: 1,
        stats: { malicious: 0, suspicious: 0, harmless: 3 },
        totalEngines: 3
      };
      
      // Mock the service methods
      virusTotalService.getUrlReport = jest.fn().mockResolvedValue(mockUrlReport);
      virusTotalService.getDomainReport = jest.fn().mockResolvedValue(mockDomainReport);
      
      const result = await virusTotalService.analyzeUrl('https://example.com');
      
      expect(result.success).toBe(true);
      expect(result.url).toBe('https://example.com');
      expect(result.domain).toBe('example.com');
      expect(result.securityScore).toBe(100);
      expect(result.threats.malicious).toBe(false);
      expect(result.urlAnalysis).toEqual(mockUrlReport);
      expect(result.domainAnalysis).toEqual(mockDomainReport);
    });

    it('should handle invalid URLs', async () => {
      const result = await virusTotalService.analyzeUrl('invalid-url');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('rate limiting', () => {
    it('should enforce rate limiting', async () => {
      const startTime = Date.now();
      
      // Set last request time to now
      virusTotalService.lastRequestTime = startTime;
      
      // This should wait for rate limit
      await virusTotalService.enforceRateLimit();
      
      const endTime = Date.now();
      const elapsed = endTime - startTime;
      
      // Should have waited close to the rate limit delay
      expect(elapsed).toBeGreaterThanOrEqual(virusTotalService.rateLimitDelay - 100);
    });
  });
});
