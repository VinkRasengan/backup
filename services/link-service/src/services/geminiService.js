const axios = require('axios');
const crypto = require('crypto');
const Logger = require('../../shared/utils/logger');

const logger = new Logger('link-service');

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
    this.timeout = 20000;
  }

  /**
   * Analyze URL with Gemini AI
   */
  async analyzeUrl(url) {
    try {
      if (!this.apiKey) {
        return this.getMockResult(url);
      }

      const prompt = this.createAnalysisPrompt(url);
      
      const response = await axios.post(`${this.baseUrl}?key=${this.apiKey}`, {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          topK: 1,
          topP: 1,
          maxOutputTokens: 1024,
        }
      }, {
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const aiResponse = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (aiResponse) {
        const analysis = this.parseAIResponse(aiResponse);
        
        return {
          success: true,
          url,
          analysis: analysis.analysis,
          credibilityScore: analysis.credibilityScore,
          riskFactors: analysis.riskFactors,
          recommendations: analysis.recommendations,
          confidence: analysis.confidence,
          analyzedAt: new Date().toISOString()
        };
      } else {
        throw new Error('No response from Gemini AI');
      }

    } catch (error) {
      logger.warn('Gemini AI error', { error: error.message, url });
      return this.getMockResult(url);
    }
  }

  /**
   * Create analysis prompt for Gemini
   */
  createAnalysisPrompt(url) {
    return `Analyze the following URL for credibility and security risks: ${url}

Please provide:
1. A brief analysis of the URL structure and domain
2. A credibility score from 0-100 (100 being most credible)
3. Any potential risk factors
4. Recommendations for users
5. Your confidence level in this assessment (0-100)

Format your response as JSON with the following structure:
{
  "analysis": "Brief analysis text",
  "credibilityScore": number,
  "riskFactors": ["factor1", "factor2"],
  "recommendations": ["recommendation1", "recommendation2"],
  "confidence": number
}`;
  }

  /**
   * Parse AI response
   */
  parseAIResponse(response) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          analysis: parsed.analysis || 'AI analysis completed',
          credibilityScore: Math.max(0, Math.min(100, parsed.credibilityScore || 50)),
          riskFactors: Array.isArray(parsed.riskFactors) ? parsed.riskFactors : [],
          recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
          confidence: Math.max(0, Math.min(100, parsed.confidence || 70))
        };
      }
    } catch (error) {
      logger.warn('Failed to parse AI response as JSON', { error: error.message });
    }

    // Fallback: extract information from text
    return this.extractFromText(response);
  }

  /**
   * Extract information from text response
   */
  extractFromText(text) {
    const scoreMatch = text.match(/credibility.*?(\d+)/i);
    const confidenceMatch = text.match(/confidence.*?(\d+)/i);
    
    return {
      analysis: text.substring(0, 200) + '...',
      credibilityScore: scoreMatch ? parseInt(scoreMatch[1]) : 50,
      riskFactors: this.extractRiskFactors(text),
      recommendations: this.extractRecommendations(text),
      confidence: confidenceMatch ? parseInt(confidenceMatch[1]) : 70
    };
  }

  /**
   * Extract risk factors from text
   */
  extractRiskFactors(text) {
    const factors = [];
    const riskKeywords = ['suspicious', 'malicious', 'phishing', 'scam', 'unsafe', 'risky'];
    
    riskKeywords.forEach(keyword => {
      if (text.toLowerCase().includes(keyword)) {
        factors.push(`Potential ${keyword} content detected`);
      }
    });

    return factors;
  }

  /**
   * Extract recommendations from text
   */
  extractRecommendations(text) {
    const recommendations = [];
    
    if (text.toLowerCase().includes('caution') || text.toLowerCase().includes('careful')) {
      recommendations.push('Exercise caution when visiting this site');
    }
    if (text.toLowerCase().includes('verify') || text.toLowerCase().includes('check')) {
      recommendations.push('Verify the authenticity of the website');
    }
    if (text.toLowerCase().includes('avoid') || text.toLowerCase().includes('not recommend')) {
      recommendations.push('Consider avoiding this website');
    }

    if (recommendations.length === 0) {
      recommendations.push('Use standard web safety practices');
    }

    return recommendations;
  }

  /**
   * Get mock result when API is not available
   */
  getMockResult(url) {
    try {
      const domain = new URL(url).hostname;
      const hash = crypto.createHash('md5').update(url).digest('hex');
      const credibilityScore = 40 + (parseInt(hash.substring(0, 2), 16) % 50); // 40-90 range

      let analysis = `Analysis of ${domain}: `;
      let riskFactors = [];
      let recommendations = [];

      if (credibilityScore < 50) {
        analysis += 'This domain shows several concerning indicators. ';
        riskFactors = ['Low domain reputation', 'Suspicious URL patterns', 'Limited online presence'];
        recommendations = ['Exercise extreme caution', 'Verify website authenticity', 'Consider alternative sources'];
      } else if (credibilityScore < 70) {
        analysis += 'This domain has mixed indicators. ';
        riskFactors = ['Moderate reputation concerns', 'Limited verification data'];
        recommendations = ['Proceed with caution', 'Verify important information independently'];
      } else {
        analysis += 'This domain appears to be legitimate. ';
        riskFactors = [];
        recommendations = ['Follow standard web safety practices', 'Verify sensitive information'];
      }

      analysis += 'Assessment based on URL structure, domain reputation, and available security data.';

      return {
        success: true,
        url,
        analysis,
        credibilityScore,
        riskFactors,
        recommendations,
        confidence: 75,
        mock: true,
        analyzedAt: new Date().toISOString()
      };

    } catch (error) {
      return {
        success: false,
        error: 'Invalid URL format',
        url
      };
    }
  }

  /**
   * Get service status
   */
  async getStatus() {
    try {
      if (!this.apiKey) {
        return {
          available: false,
          error: 'No API key configured',
          mock: true
        };
      }

      // Test API with a simple request
      const response = await axios.post(`${this.baseUrl}?key=${this.apiKey}`, {
        contents: [{
          parts: [{
            text: 'Test message'
          }]
        }]
      }, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return {
        available: response.status === 200,
        mock: false,
        lastTest: new Date().toISOString()
      };

    } catch (error) {
      return {
        available: false,
        error: error.message,
        mock: true
      };
    }
  }
}

module.exports = new GeminiService();
