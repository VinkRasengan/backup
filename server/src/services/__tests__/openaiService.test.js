const openaiService = require('../openaiService');

// Mock axios
jest.mock('axios');
const axios = require('axios');

describe('OpenAIService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock environment variables
    process.env.OPENAI_API_KEY = 'test-api-key';
    process.env.OPENAI_MODEL = 'gpt-3.5-turbo';
    process.env.OPENAI_MAX_TOKENS = '500';
    process.env.OPENAI_TEMPERATURE = '0.7';
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_MODEL;
    delete process.env.OPENAI_MAX_TOKENS;
    delete process.env.OPENAI_TEMPERATURE;
  });

  describe('isConfigured', () => {
    it('should return true when API key is configured', () => {
      expect(openaiService.isConfigured()).toBe(true);
    });

    it('should return false when API key is not configured', () => {
      process.env.OPENAI_API_KEY = '';
      expect(openaiService.isConfigured()).toBe(false);
    });

    it('should return false when API key is placeholder', () => {
      process.env.OPENAI_API_KEY = 'your-openai-api-key-here';
      expect(openaiService.isConfigured()).toBe(false);
    });
  });

  describe('validateMessage', () => {
    it('should validate correct message', () => {
      const result = openaiService.validateMessage('Hello, how are you?');
      expect(result.valid).toBe(true);
      expect(result.message).toBe('Hello, how are you?');
    });

    it('should reject empty message', () => {
      const result = openaiService.validateMessage('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Tin nhắn không được để trống');
    });

    it('should reject null message', () => {
      const result = openaiService.validateMessage(null);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Tin nhắn không hợp lệ');
    });

    it('should reject too long message', () => {
      const longMessage = 'a'.repeat(1001);
      const result = openaiService.validateMessage(longMessage);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Tin nhắn quá dài (tối đa 1000 ký tự)');
    });

    it('should reject harmful content', () => {
      const result = openaiService.validateMessage('How to hack a website?');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('nội dung không phù hợp');
    });

    it('should trim whitespace', () => {
      const result = openaiService.validateMessage('  Hello  ');
      expect(result.valid).toBe(true);
      expect(result.message).toBe('Hello');
    });
  });

  describe('sendMessage', () => {
    it('should send message successfully', async () => {
      const mockResponse = {
        data: {
          choices: [{
            message: {
              content: 'This is a test response from AI'
            }
          }],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 20,
            total_tokens: 30
          }
        }
      };

      axios.post.mockResolvedValue(mockResponse);

      const result = await openaiService.sendMessage('Test message');

      expect(result.success).toBe(true);
      expect(result.message).toBe('This is a test response from AI');
      expect(result.usage).toEqual(mockResponse.data.usage);
      expect(result.model).toBe('gpt-3.5-turbo');

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/chat/completions'),
        expect.objectContaining({
          model: 'gpt-3.5-turbo',
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'system',
              content: expect.stringContaining('chuyên gia bảo mật')
            }),
            expect.objectContaining({
              role: 'user',
              content: 'Test message'
            })
          ]),
          max_tokens: 500,
          temperature: 0.7
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key',
            'Content-Type': 'application/json'
          })
        })
      );
    });

    it('should handle API not configured', async () => {
      process.env.OPENAI_API_KEY = '';
      
      const result = await openaiService.sendMessage('Test message');

      expect(result.success).toBe(false);
      expect(result.error).toContain('chưa được cấu hình');
    });

    it('should handle 401 unauthorized error', async () => {
      const error = new Error('Unauthorized');
      error.response = { status: 401 };
      axios.post.mockRejectedValue(error);

      const result = await openaiService.sendMessage('Test message');

      expect(result.success).toBe(false);
      expect(result.error).toContain('API key không hợp lệ');
    });

    it('should handle 429 rate limit error', async () => {
      const error = new Error('Rate limit exceeded');
      error.response = { status: 429 };
      axios.post.mockRejectedValue(error);

      const result = await openaiService.sendMessage('Test message');

      expect(result.success).toBe(false);
      expect(result.error).toContain('vượt quá giới hạn API');
    });

    it('should handle 400 bad request error', async () => {
      const error = new Error('Bad request');
      error.response = { status: 400 };
      axios.post.mockRejectedValue(error);

      const result = await openaiService.sendMessage('Test message');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Yêu cầu không hợp lệ');
    });

    it('should handle general errors', async () => {
      const error = new Error('Network error');
      axios.post.mockRejectedValue(error);

      const result = await openaiService.sendMessage('Test message');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Có lỗi xảy ra');
    });

    it('should include conversation history', async () => {
      const mockResponse = {
        data: {
          choices: [{ message: { content: 'Response' } }],
          usage: { total_tokens: 30 }
        }
      };

      axios.post.mockResolvedValue(mockResponse);

      const conversationHistory = [
        { role: 'user', content: 'Previous message' },
        { role: 'assistant', content: 'Previous response' }
      ];

      await openaiService.sendMessage('New message', conversationHistory);

      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'system' }),
            expect.objectContaining({ role: 'user', content: 'Previous message' }),
            expect.objectContaining({ role: 'assistant', content: 'Previous response' }),
            expect.objectContaining({ role: 'user', content: 'New message' })
          ])
        }),
        expect.any(Object)
      );
    });

    it('should limit conversation history to 10 messages', async () => {
      const mockResponse = {
        data: {
          choices: [{ message: { content: 'Response' } }],
          usage: { total_tokens: 30 }
        }
      };

      axios.post.mockResolvedValue(mockResponse);

      // Create 15 messages in history
      const conversationHistory = Array.from({ length: 15 }, (_, i) => ({
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Message ${i}`
      }));

      await openaiService.sendMessage('New message', conversationHistory);

      const calledMessages = axios.post.mock.calls[0][1].messages;
      // Should have: 1 system + 10 history + 1 new = 12 messages
      expect(calledMessages).toHaveLength(12);
      expect(calledMessages[0].role).toBe('system');
      expect(calledMessages[calledMessages.length - 1].content).toBe('New message');
    });
  });

  describe('getConversationStarters', () => {
    it('should return array of conversation starters', () => {
      const starters = openaiService.getConversationStarters();
      
      expect(Array.isArray(starters)).toBe(true);
      expect(starters.length).toBeGreaterThan(0);
      expect(starters[0]).toContain('email lừa đảo');
    });
  });

  describe('analyzeUrlSecurity', () => {
    it('should analyze URL security without VirusTotal data', async () => {
      const mockResponse = {
        data: {
          choices: [{ message: { content: 'Security analysis result' } }],
          usage: { total_tokens: 30 }
        }
      };

      axios.post.mockResolvedValue(mockResponse);

      const result = await openaiService.analyzeUrlSecurity('https://example.com');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Security analysis result');
    });

    it('should analyze URL security with VirusTotal data', async () => {
      const mockResponse = {
        data: {
          choices: [{ message: { content: 'Enhanced security analysis' } }],
          usage: { total_tokens: 30 }
        }
      };

      axios.post.mockResolvedValue(mockResponse);

      const virusTotalData = {
        success: true,
        securityScore: 85,
        threats: {
          malicious: false,
          suspicious: false,
          threatNames: []
        }
      };

      const result = await openaiService.analyzeUrlSecurity('https://example.com', virusTotalData);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Enhanced security analysis');

      // Check that VirusTotal data was included in the prompt
      const calledPrompt = axios.post.mock.calls[0][1].messages[1].content;
      expect(calledPrompt).toContain('VirusTotal');
      expect(calledPrompt).toContain('85/100');
    });
  });

  describe('getSecurityTips', () => {
    it('should get general security tips', async () => {
      const mockResponse = {
        data: {
          choices: [{ message: { content: 'General security tips' } }],
          usage: { total_tokens: 30 }
        }
      };

      axios.post.mockResolvedValue(mockResponse);

      const result = await openaiService.getSecurityTips('general');

      expect(result.success).toBe(true);
      expect(result.message).toBe('General security tips');
    });

    it('should get category-specific security tips', async () => {
      const mockResponse = {
        data: {
          choices: [{ message: { content: 'Phishing security tips' } }],
          usage: { total_tokens: 30 }
        }
      };

      axios.post.mockResolvedValue(mockResponse);

      const result = await openaiService.getSecurityTips('phishing');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Phishing security tips');
    });

    it('should handle unknown category', async () => {
      const mockResponse = {
        data: {
          choices: [{ message: { content: 'General security tips' } }],
          usage: { total_tokens: 30 }
        }
      };

      axios.post.mockResolvedValue(mockResponse);

      const result = await openaiService.getSecurityTips('unknown-category');

      expect(result.success).toBe(true);
      expect(result.message).toBe('General security tips');
    });
  });
});
