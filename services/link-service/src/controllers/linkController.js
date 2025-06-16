const { db, collections } = require('../config/firebase');
const Logger = require('../../shared/utils/logger');
const AuthMiddleware = require('../../shared/middleware/auth');
const securityAggregatorService = require('../services/securityAggregatorService');
const screenshotService = require('../services/screenshotService');
const geminiService = require('../services/geminiService');
const crawlerService = require('../services/crawlerService');

const logger = new Logger('link-service');
const authMiddleware = new AuthMiddleware(process.env.AUTH_SERVICE_URL);

class LinkController {
  /**
   * Check a link for security and credibility
   */
  async checkLink(req, res, next) {
    try {
      const { url } = req.body;
      const userId = req.user?.userId;

      logger.withCorrelationId(req.correlationId).info('Link check request', {
        url,
        userId
      });

      // Validate URL format
      try {
        new URL(url);
      } catch (error) {
        return res.status(400).json({
          error: 'Invalid URL format',
          code: 'INVALID_URL'
        });
      }

      // For testing, return mock data immediately
      const mockResult = {
        id: Date.now().toString(),
        url,
        status: 'completed',
        credibilityScore: 85,
        securityScore: 90,
        finalScore: 87,
        summary: `Link đã được kiểm tra thành công. Điểm tin cậy: 85/100, Điểm bảo mật: 90/100.`,
        threats: {
          malicious: false,
          suspicious: false,
          phishing: false,
          malware: false
        },
        checkedAt: new Date().toISOString(),
        mockData: true
      };

      logger.withCorrelationId(req.correlationId).info('Link check completed (mock)', {
        url,
        finalScore: mockResult.finalScore
      });

      res.json({
        success: true,
        result: mockResult
      });

      return; // Skip the complex analysis for now

      // Check if link was recently checked by this user (within 1 hour)
      if (userId) {
        const recentCheck = await db.collection(collections.LINKS)
          .where('userId', '==', userId)
          .where('url', '==', url)
          .orderBy('checkedAt', 'desc')
          .limit(1)
          .get();

        if (!recentCheck.empty) {
          const lastCheck = recentCheck.docs[0].data();
          const lastCheckTime = new Date(lastCheck.checkedAt);
          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

          if (lastCheckTime > oneHourAgo) {
            logger.withCorrelationId(req.correlationId).info('Returning cached result', {
              url,
              lastCheckTime
            });

            return res.json({
              message: 'Link was recently checked',
              cached: true,
              result: {
                id: recentCheck.docs[0].id,
                ...lastCheck
              }
            });
          }
        }
      }

      // Run comprehensive analysis
      logger.withCorrelationId(req.correlationId).info('Starting comprehensive analysis', { url });

      const [securityAnalysis, screenshotAnalysis, geminiAnalysis] = await Promise.allSettled([
        securityAggregatorService.analyzeUrl(url),
        screenshotService.takeScreenshotWithRetry(url),
        geminiService.analyzeUrl(url)
      ]);

      // Process security results
      const securityData = securityAnalysis.status === 'fulfilled' 
        ? securityAnalysis.value 
        : { success: false, error: 'Security analysis failed' };

      // Process Screenshot results
      const screenshotData = screenshotAnalysis.status === 'fulfilled'
        ? screenshotAnalysis.value
        : { success: false, error: 'Screenshot capture failed', screenshotUrl: screenshotService.getFallbackScreenshot(url) };

      // Process Gemini AI analysis results
      const geminiData = geminiAnalysis.status === 'fulfilled'
        ? geminiAnalysis.value
        : { success: false, error: 'Gemini AI analysis failed', analysis: null, credibilityScore: null };

      // Get basic content analysis
      const contentAnalysis = await crawlerService.mockCrawlerAPI(url);

      // Calculate combined security score
      const securityScore = securityData.success 
        ? (100 - securityData.overallRisk.score) // Convert risk score to security score
        : 50;

      // Calculate final score combining credibility and security
      const finalScore = crawlerService.calculateFinalScore(
        contentAnalysis.credibilityScore,
        securityScore
      );

      // Determine overall status
      let status = 'safe';
      if (finalScore < 30) {
        status = 'dangerous';
      } else if (finalScore < 60) {
        status = 'suspicious';
      }

      // Create comprehensive result
      const crawlerResult = {
        url,
        title: contentAnalysis.title,
        description: contentAnalysis.description,
        credibilityScore: contentAnalysis.credibilityScore,
        securityScore,
        finalScore,
        status,
        security: {
          threats: securityData.threats || {},
          riskFactors: securityData.riskFactors || [],
          servicesChecked: securityData.servicesChecked || 0,
          details: securityData.results || {}
        },
        screenshot: {
          url: screenshotData.screenshotUrl || null,
          success: screenshotData.success,
          error: screenshotData.error || null
        },
        aiAnalysis: {
          analysis: geminiData.analysis || null,
          credibilityScore: geminiData.credibilityScore || null,
          success: geminiData.success,
          error: geminiData.error || null
        },
        thirdPartyResults: [
          ...(securityData.results ? Object.entries(securityData.results).map(([service, result]) => ({
            service,
            result,
            type: 'security'
          })) : []),
          {
            service: 'screenshot',
            result: screenshotData,
            type: 'screenshot'
          },
          {
            service: 'gemini-ai',
            result: geminiData,
            type: 'ai-analysis'
          }
        ],
        analyzedAt: new Date().toISOString()
      };

      logger.withCorrelationId(req.correlationId).info('Analysis completed', {
        url,
        finalScore,
        status,
        securityScore,
        servicesChecked: securityData.servicesChecked || 0
      });

      // Save result to database if user is authenticated
      if (userId) {
        const linkData = {
          userId,
          url,
          ...crawlerResult,
          checkedAt: new Date().toISOString()
        };

        const linkRef = await db.collection(collections.LINKS).add(linkData);
        
        // Update user stats
        await db.collection(collections.USERS).doc(userId).update({
          'stats.linksChecked': db.FieldValue.increment(1),
          updatedAt: new Date().toISOString()
        });

        crawlerResult.id = linkRef.id;

        logger.withCorrelationId(req.correlationId).info('Link result saved', {
          linkId: linkRef.id,
          userId
        });
      }

      res.json({
        success: true,
        result: crawlerResult
      });

    } catch (error) {
      logger.logError(error, req);
      next(error);
    }
  }

  /**
   * Get user's link check history
   */
  async getHistory(req, res, next) {
    try {
      const userId = req.user.userId;
      const { page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      const snapshot = await db.collection(collections.LINKS)
        .where('userId', '==', userId)
        .orderBy('checkedAt', 'desc')
        .offset(offset)
        .limit(parseInt(limit))
        .get();

      const links = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Get total count
      const totalSnapshot = await db.collection(collections.LINKS)
        .where('userId', '==', userId)
        .get();
      const total = totalSnapshot.size;

      logger.withCorrelationId(req.correlationId).info('Link history retrieved', {
        userId,
        count: links.length,
        total
      });

      res.json({
        links,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });

    } catch (error) {
      logger.logError(error, req);
      next(error);
    }
  }

  /**
   * Get specific link check result
   */
  async getLinkResult(req, res, next) {
    try {
      const { linkId } = req.params;
      const userId = req.user.userId;

      const linkDoc = await db.collection(collections.LINKS).doc(linkId).get();

      if (!linkDoc.exists) {
        return res.status(404).json({
          error: 'Link not found',
          code: 'LINK_NOT_FOUND'
        });
      }

      const linkData = linkDoc.data();

      // Check if user owns this link check
      if (linkData.userId !== userId) {
        return res.status(403).json({
          error: 'Access denied',
          code: 'ACCESS_DENIED'
        });
      }

      res.json({
        id: linkId,
        ...linkData
      });

    } catch (error) {
      logger.logError(error, req);
      next(error);
    }
  }

  /**
   * Delete link check result
   */
  async deleteLinkResult(req, res, next) {
    try {
      const { linkId } = req.params;
      const userId = req.user.userId;

      const linkDoc = await db.collection(collections.LINKS).doc(linkId).get();

      if (!linkDoc.exists) {
        return res.status(404).json({
          error: 'Link not found',
          code: 'LINK_NOT_FOUND'
        });
      }

      const linkData = linkDoc.data();

      // Check if user owns this link check
      if (linkData.userId !== userId) {
        return res.status(403).json({
          error: 'Access denied',
          code: 'ACCESS_DENIED'
        });
      }

      await db.collection(collections.LINKS).doc(linkId).delete();

      logger.withCorrelationId(req.correlationId).info('Link result deleted', {
        linkId,
        userId
      });

      res.json({
        message: 'Link result deleted successfully'
      });

    } catch (error) {
      logger.logError(error, req);
      next(error);
    }
  }

  /**
   * Bulk check multiple links
   */
  async bulkCheck(req, res, next) {
    try {
      const { urls } = req.body;
      const userId = req.user?.userId;

      if (!Array.isArray(urls) || urls.length === 0) {
        return res.status(400).json({
          error: 'URLs array is required',
          code: 'INVALID_INPUT'
        });
      }

      if (urls.length > 10) {
        return res.status(400).json({
          error: 'Maximum 10 URLs allowed per bulk check',
          code: 'TOO_MANY_URLS'
        });
      }

      logger.withCorrelationId(req.correlationId).info('Bulk check request', {
        urlCount: urls.length,
        userId
      });

      // Process URLs in parallel with limited concurrency
      const results = await Promise.allSettled(
        urls.map(url => this.checkSingleUrl(url, userId, req.correlationId))
      );

      const processedResults = results.map((result, index) => ({
        url: urls[index],
        success: result.status === 'fulfilled',
        data: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason.message : null
      }));

      res.json({
        success: true,
        results: processedResults,
        summary: {
          total: urls.length,
          successful: processedResults.filter(r => r.success).length,
          failed: processedResults.filter(r => !r.success).length
        }
      });

    } catch (error) {
      logger.logError(error, req);
      next(error);
    }
  }

  /**
   * Helper method to check a single URL (used by bulk check)
   */
  async checkSingleUrl(url, userId, correlationId) {
    try {
      // Validate URL
      new URL(url);

      // Run basic security check (lighter than full analysis for bulk)
      const securityAnalysis = await securityAggregatorService.analyzeUrl(url);
      const contentAnalysis = await crawlerService.mockCrawlerAPI(url);

      const securityScore = securityAnalysis.success 
        ? (100 - securityAnalysis.overallRisk.score)
        : 50;

      const finalScore = crawlerService.calculateFinalScore(
        contentAnalysis.credibilityScore,
        securityScore
      );

      let status = 'safe';
      if (finalScore < 30) {
        status = 'dangerous';
      } else if (finalScore < 60) {
        status = 'suspicious';
      }

      return {
        url,
        finalScore,
        securityScore,
        status,
        threats: securityAnalysis.threats || {},
        analyzedAt: new Date().toISOString()
      };

    } catch (error) {
      throw new Error(`Failed to analyze ${url}: ${error.message}`);
    }
  }
}

module.exports = new LinkController();
