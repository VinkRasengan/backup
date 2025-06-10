// Use production config based on environment
const firebaseConfig = process.env.NODE_ENV === 'production'
  ? require('../config/firebase-production')
  : require('../config/firebase-emulator');

const { db, collections } = firebaseConfig;
const crawlerService = require('../services/crawlerService');
const securityAggregatorService = require('../services/securityAggregatorService');
const screenshotService = require('../services/screenshotService');
const geminiService = require('../services/geminiService');

// Helper function to generate enhanced summary
function generateEnhancedSummary(contentAnalysis, securityData, geminiData) {
  let summary = contentAnalysis.summary;

  // Add Gemini AI analysis first
  if (geminiData.success && geminiData.analysis) {
    summary += '\n\n🤖 **Phân tích AI từ FactCheck:**\n';
    summary += geminiData.analysis;
  }

  // Add security aggregator summary
  if (securityData.success && securityData.summary) {
    summary += '\n\n🔒 **Phân tích bảo mật tổng hợp:**\n';
    summary += securityData.summary;
  }

  // Add risk factors if any
  if (securityData.success && securityData.riskFactors && securityData.riskFactors.length > 0) {
    summary += '\n\n⚠️ **Cảnh báo bảo mật:**\n';
    securityData.riskFactors.forEach(factor => {
      summary += `• ${factor}\n`;
    });
  }

  // Add recommendations
  if (securityData.success && securityData.recommendations && securityData.recommendations.length > 0) {
    summary += '\n\n💡 **Khuyến nghị:**\n';
    securityData.recommendations.forEach(rec => {
      summary += `• ${rec}\n`;
    });
  }

  return summary;
}

class LinkController {
  // Check a new link
  async checkLink(req, res, next) {
    try {
      const { url } = req.body;
      console.log('🔍 Checking link:', { url });

      // Check if user is authenticated
      if (!req.user || !req.user.userId) {
        console.log('❌ Authentication required');
        return res.status(401).json({
          error: 'Authentication required',
          code: 'AUTH_REQUIRED',
          message: 'You must be logged in to check links'
        });
      }

      const userId = req.user.userId;
      console.log('👤 User ID:', userId);

      // Validate URL format
      try {
        new URL(url);
      } catch (error) {
        console.log('❌ Invalid URL format:', url);
        return res.status(400).json({
          error: 'Invalid URL format',
          code: 'INVALID_URL'
        });
      }

      // Check if link was already checked recently by this user
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
          console.log('ℹ️ Link was recently checked:', { url, lastCheckTime });
          return res.json({
            message: 'Link was recently checked',
            result: {
              id: recentCheck.docs[0].id,
              ...lastCheck
            }
          });
        }
      }      console.log('🔄 Using enhanced security aggregator and services');
      
      // Run comprehensive analysis with new security aggregator
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

      // Get basic content analysis (mock for now)
      const contentAnalysis = await crawlerService.mockCrawlerAPI(url);

      // Calculate combined security score from aggregated results
      const securityScore = securityData.success 
        ? (100 - securityData.overallRisk.score) // Convert risk score to security score
        : 50;

      // Calculate final score combining credibility and security
      const finalScore = crawlerService.calculateFinalScore(
        contentAnalysis.credibilityScore,
        securityScore
      );

      // Generate thirdPartyResults for frontend compatibility
      const thirdPartyResults = crawlerService.generateThirdPartyResults(
        { 
          success: securityData.success && securityData.results.virusTotal,
          securityScore: securityData.results.virusTotal?.securityScore || securityScore 
        },
        { 
          success: securityData.success && securityData.results.scamAdviser,
          trustScore: securityData.results.scamAdviser?.trustScore || 50 
        }
      );

      // Create comprehensive result object
      const crawlerResult = {
        url: url,
        status: 'completed',
        credibilityScore: contentAnalysis.credibilityScore,
        securityScore: securityScore,
        finalScore: finalScore,
        sources: contentAnalysis.sources,
        summary: generateEnhancedSummary(contentAnalysis, securityData, geminiData),
        checkedAt: new Date().toISOString(),
        screenshot: screenshotData.screenshotUrl,
        metadata: {
          title: contentAnalysis.title,
          domain: contentAnalysis.domain,
          publishDate: contentAnalysis.publishDate,
          author: contentAnalysis.author
        },
        aiAnalysis: geminiData.success ? {
          analysis: geminiData.analysis,
          credibilityScore: geminiData.credibilityScore,
          riskLevel: geminiData.riskLevel,
          analyzedAt: geminiData.analyzedAt,
          model: geminiData.model
        } : {
          error: geminiData.error || 'AI analysis not available'
        },
        security: {
          // Aggregated security results
          overallRisk: securityData.success ? securityData.overallRisk : null,
          riskFactors: securityData.success ? securityData.riskFactors : [],
          recommendations: securityData.success ? securityData.recommendations : [],
          
          // Individual service results for backward compatibility
          virusTotal: securityData.success && securityData.results.virusTotal ? {
            securityScore: securityData.results.virusTotal.securityScore,
            threats: securityData.results.virusTotal.threats,
            urlAnalysis: securityData.results.virusTotal.urlAnalysis,
            domainAnalysis: securityData.results.virusTotal.domainAnalysis,
            analyzedAt: securityData.results.virusTotal.analyzedAt
          } : {
            error: securityData.errors?.virusTotal || 'VirusTotal analysis not available'
          },
          scamAdviser: securityData.success && securityData.results.scamAdviser ? {
            trustScore: securityData.results.scamAdviser.trustScore,
            riskLevel: securityData.results.scamAdviser.riskLevel,
            riskFactors: securityData.results.scamAdviser.riskFactors,
            details: securityData.results.scamAdviser.details,
            analyzedAt: securityData.results.scamAdviser.analyzedAt
          } : {
            error: securityData.errors?.scamAdviser || 'ScamAdviser analysis not available'
          },
          combinedScore: securityScore,
          
          // New aggregated security data
          aggregatedResults: securityData.success ? {
            servicesChecked: securityData.servicesChecked,
            servicesSucceeded: securityData.servicesSucceeded,
            servicesFailed: securityData.servicesFailed,
            analysisTime: securityData.analysisTime,
            summary: securityData.summary
          } : null
        },
        screenshotInfo: {
          success: screenshotData.success,
          url: screenshotData.screenshotUrl,
          fallback: screenshotData.fallback || false,
          takenAt: screenshotData.takenAt || new Date().toISOString(),
          error: screenshotData.error || null
        },
        thirdPartyResults: thirdPartyResults
      };

      console.log('✅ Enhanced security analysis completed:', {
        securityScore,
        servicesChecked: securityData.servicesChecked || 0,
        riskFactors: securityData.riskFactors?.length || 0
      });

      // Save result to database
      const linkData = {
        userId,
        url,
        ...crawlerResult,
        checkedAt: new Date().toISOString()
      };

      console.log('💾 Saving link data to database:', linkData);
      const linkRef = await db.collection(collections.LINKS).add(linkData);
      console.log('✅ Link saved with ID:', linkRef.id);

      // Update user stats
      console.log('📊 Updating user stats');
      await db.collection(collections.USERS).doc(userId).update({
        'stats.linksChecked': db.FieldValue.increment(1),
        updatedAt: new Date().toISOString()
      });
      console.log('✅ User stats updated');

      res.json({
        message: 'Link checked successfully',
        result: {
          id: linkRef.id,
          ...linkData
        }
      });

    } catch (error) {
      console.error('❌ Error in checkLink:', error);
      next(error);
    }
  }

  // Get link check history for user
  async getHistory(req, res, next) {
    try {
      const userId = req.user.userId;
      const { page = 1, limit = 20 } = req.query;

      const offset = (page - 1) * limit;

      // Get user's link history
      let query = db.collection(collections.LINKS)
        .where('userId', '==', userId)
        .orderBy('checkedAt', 'desc')
        .limit(parseInt(limit));

      if (offset > 0) {
        // For pagination, we'd need to implement cursor-based pagination
        // This is a simplified version
        const previousQuery = await db.collection(collections.LINKS)
          .where('userId', '==', userId)
          .orderBy('checkedAt', 'desc')
          .limit(offset)
          .get();

        if (!previousQuery.empty) {
          const lastDoc = previousQuery.docs[previousQuery.docs.length - 1];
          query = query.startAfter(lastDoc);
        }
      }

      const historyQuery = await query.get();

      const history = historyQuery.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Get total count for pagination
      const totalQuery = await db.collection(collections.LINKS)
        .where('userId', '==', userId)
        .get();

      const totalCount = totalQuery.size;
      const totalPages = Math.ceil(totalCount / limit);

      res.json({
        history,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      });

    } catch (error) {
      next(error);
    }
  }

  // Get specific link check result
  async getLinkResult(req, res, next) {
    try {
      const { linkId } = req.params;
      const userId = req.user.userId;

      const linkDoc = await db.collection(collections.LINKS).doc(linkId).get();

      if (!linkDoc.exists) {
        return res.status(404).json({
          error: 'Link check result not found',
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
        result: {
          id: linkId,
          ...linkData
        }
      });

    } catch (error) {
      next(error);
    }
  }

  // Delete link check result
  async deleteLinkResult(req, res, next) {
    try {
      const { linkId } = req.params;
      const userId = req.user.userId;

      const linkDoc = await db.collection(collections.LINKS).doc(linkId).get();

      if (!linkDoc.exists) {
        return res.status(404).json({
          error: 'Link check result not found',
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

      // Delete the link check result
      await linkDoc.ref.delete();

      // Update user stats
      await db.collection(collections.USERS).doc(userId).update({
        'stats.linksChecked': db.FieldValue.increment(-1),
        updatedAt: new Date().toISOString()
      });

      res.json({
        message: 'Link check result deleted successfully'
      });

    } catch (error) {
      next(error);
    }
  }

  // Get community feed with voting and comment stats
  async getCommunityFeed(req, res, next) {
    try {
      const {
        page = 1,
        limit = 20,
        sort = 'trending',
        filter = 'all',
        search = ''
      } = req.query;

      const offset = (page - 1) * limit;
      const database = require('../config/database');

      if (database.isConnected) {
        // PostgreSQL implementation
        let baseQuery = `
          SELECT
            l.*,
            u.first_name as author_first_name,
            u.last_name as author_last_name,
            u.email as author_email,
            COUNT(DISTINCT v.id) as vote_count,
            COUNT(DISTINCT c.id) as comment_count,
            COUNT(DISTINCT r.id) as report_count,
            COUNT(CASE WHEN v.vote_type = 'safe' THEN 1 END) as safe_votes,
            COUNT(CASE WHEN v.vote_type = 'unsafe' THEN 1 END) as unsafe_votes,
            COUNT(CASE WHEN v.vote_type = 'suspicious' THEN 1 END) as suspicious_votes
          FROM links l
          LEFT JOIN users u ON l.user_id = u.id
          LEFT JOIN votes v ON l.id = v.link_id
          LEFT JOIN comments c ON l.id = c.link_id
          LEFT JOIN reports r ON l.id = r.link_id
        `;

        let whereConditions = [];
        let queryParams = [];
        let paramIndex = 1;

        // Search filter
        if (search.trim()) {
          whereConditions.push(`(l.title ILIKE $${paramIndex} OR l.description ILIKE $${paramIndex} OR l.url ILIKE $${paramIndex})`);
          queryParams.push(`%${search.trim()}%`);
          paramIndex++;
        }

        // Status filter
        if (filter !== 'all') {
          if (filter === 'safe') {
            whereConditions.push(`l.is_safe = true`);
          } else if (filter === 'unsafe') {
            whereConditions.push(`l.is_safe = false`);
          } else if (filter === 'suspicious') {
            whereConditions.push(`l.security_score < 70 AND l.security_score >= 40`);
          }
        }

        if (whereConditions.length > 0) {
          baseQuery += ` WHERE ${whereConditions.join(' AND ')}`;
        }

        baseQuery += ` GROUP BY l.id, u.first_name, u.last_name, u.email`;

        // Sorting
        let orderBy = '';
        switch (sort) {
          case 'trending':
            orderBy = ` ORDER BY (COUNT(DISTINCT v.id) + COUNT(DISTINCT c.id) * 2) DESC, l.created_at DESC`;
            break;
          case 'newest':
            orderBy = ` ORDER BY l.created_at DESC`;
            break;
          case 'most_voted':
            orderBy = ` ORDER BY COUNT(DISTINCT v.id) DESC, l.created_at DESC`;
            break;
          default:
            orderBy = ` ORDER BY l.created_at DESC`;
        }

        baseQuery += orderBy;
        baseQuery += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        queryParams.push(parseInt(limit), offset);

        const result = await database.pool.query(baseQuery, queryParams);

        // Get total count for pagination
        let countQuery = `
          SELECT COUNT(DISTINCT l.id) as total
          FROM links l
          LEFT JOIN users u ON l.user_id = u.id
        `;

        if (whereConditions.length > 0) {
          countQuery += ` WHERE ${whereConditions.join(' AND ')}`;
        }

        const countResult = await database.pool.query(countQuery, queryParams.slice(0, -2));
        const totalCount = parseInt(countResult.rows[0].total);

        const articles = result.rows.map(row => ({
          id: row.id,
          url: row.url,
          title: row.title,
          description: row.description,
          credibilityScore: row.security_score,
          createdAt: row.created_at,
          author: {
            firstName: row.author_first_name,
            lastName: row.author_last_name,
            email: row.author_email
          },
          voteCount: parseInt(row.vote_count) || 0,
          commentCount: parseInt(row.comment_count) || 0,
          reportCount: parseInt(row.report_count) || 0,
          voteStats: {
            safe: parseInt(row.safe_votes) || 0,
            unsafe: parseInt(row.unsafe_votes) || 0,
            suspicious: parseInt(row.suspicious_votes) || 0
          }
        }));

        res.json({
          articles,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalCount / limit),
            totalCount,
            hasMore: offset + articles.length < totalCount
          }
        });

      } else {
        // In-memory fallback
        const links = Array.from(global.inMemoryDB?.links?.values() || []);
        const users = Array.from(global.inMemoryDB?.users?.values() || []);
        const votes = Array.from(global.inMemoryDB?.votes?.values() || []);
        const comments = Array.from(global.inMemoryDB?.comments?.values() || []);
        const reports = Array.from(global.inMemoryDB?.reports?.values() || []);

        let filteredLinks = links;

        // Apply search filter
        if (search.trim()) {
          const searchLower = search.toLowerCase();
          filteredLinks = filteredLinks.filter(link =>
            (link.title && link.title.toLowerCase().includes(searchLower)) ||
            (link.description && link.description.toLowerCase().includes(searchLower)) ||
            link.url.toLowerCase().includes(searchLower)
          );
        }

        // Apply status filter
        if (filter !== 'all') {
          filteredLinks = filteredLinks.filter(link => {
            if (filter === 'safe') return link.is_safe === true;
            if (filter === 'unsafe') return link.is_safe === false;
            if (filter === 'suspicious') return link.security_score < 70 && link.security_score >= 40;
            return true;
          });
        }

        // Add community stats
        const articlesWithStats = filteredLinks.map(link => {
          const linkVotes = votes.filter(v => v.linkId === link.id);
          const linkComments = comments.filter(c => c.linkId === link.id);
          const linkReports = reports.filter(r => r.linkId === link.id);
          const author = users.find(u => u.id === link.userId);

          return {
            ...link,
            author: author ? {
              firstName: author.firstName,
              lastName: author.lastName,
              email: author.email
            } : null,
            voteCount: linkVotes.length,
            commentCount: linkComments.length,
            reportCount: linkReports.length,
            voteStats: {
              safe: linkVotes.filter(v => v.voteType === 'safe').length,
              unsafe: linkVotes.filter(v => v.voteType === 'unsafe').length,
              suspicious: linkVotes.filter(v => v.voteType === 'suspicious').length
            }
          };
        });

        // Sort articles
        articlesWithStats.sort((a, b) => {
          switch (sort) {
            case 'trending':
              const scoreA = a.voteCount + (a.commentCount * 2);
              const scoreB = b.voteCount + (b.commentCount * 2);
              if (scoreA !== scoreB) return scoreB - scoreA;
              return new Date(b.createdAt) - new Date(a.createdAt);
            case 'newest':
              return new Date(b.createdAt) - new Date(a.createdAt);
            case 'most_voted':
              if (a.voteCount !== b.voteCount) return b.voteCount - a.voteCount;
              return new Date(b.createdAt) - new Date(a.createdAt);
            default:
              return new Date(b.createdAt) - new Date(a.createdAt);
          }
        });

        // Pagination
        const startIndex = offset;
        const endIndex = startIndex + parseInt(limit);
        const paginatedArticles = articlesWithStats.slice(startIndex, endIndex);

        res.json({
          articles: paginatedArticles,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(articlesWithStats.length / limit),
            totalCount: articlesWithStats.length,
            hasMore: endIndex < articlesWithStats.length
          }
        });
      }

    } catch (error) {
      next(error);
    }
  }

  // Submit article to community
  async submitToCommunity(req, res, next) {
    try {
      console.log('🚀 submitToCommunity called');
      console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
      console.log('👤 User:', req.user);
      console.log('🔍 Request body keys:', Object.keys(req.body));
      console.log('🔍 checkResult type:', typeof req.body.checkResult);
      console.log('🔍 checkResult value:', req.body.checkResult);

      const {
        url,
        title,
        description,
        category,
        checkResult,
        credibilityScore,
        securityScore,
        status
      } = req.body;
      const userId = req.user.userId;

      // Use Firestore for community submissions
      const firebaseDb = require('../config/firebase-database');
      const db = firebaseDb.getDb();

      // Extract metadata from URL if title not provided
      let finalTitle = title;
      if (!finalTitle) {
        try {
          const domain = new URL(url).hostname;
          finalTitle = `Bài viết từ ${domain}`;
        } catch (e) {
          finalTitle = 'Bài viết không có tiêu đề';
        }
      }      // Save to Firestore links collection
      const threats = checkResult.security?.threats || {};
      const analysisResult = {
        category,
        checkResult,
        credibilityScore: credibilityScore || checkResult.credibilityScore || checkResult.finalScore,
        securityScore: securityScore || checkResult.securityScore,
        status: status || checkResult.status,
        submittedAt: new Date().toISOString()
      };

      const submissionData = {
        userId,
        url,
        title: finalTitle,
        description: description || null,
        category,
        credibilityScore: analysisResult.credibilityScore,
        securityScore: analysisResult.securityScore,
        status: analysisResult.status,
        threats,
        analysisResult,
        checkResult,
        screenshot: checkResult.screenshot || null,
        imageUrl: checkResult.screenshot || null, // For compatibility
        metadata: checkResult.metadata || {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        votes: { safe: 0, unsafe: 0, suspicious: 0 },
        commentsCount: 0,
        isPublished: true
      };

      console.log('💾 Saving community submission to Firestore:', submissionData);

      const submissionRef = await db.collection('links').add(submissionData);
      const submissionId = submissionRef.id;

      console.log('✅ Community submission saved with ID:', submissionId);

      res.status(201).json({
        message: 'Article submitted to community successfully',
        link: {
          id: submissionId,
          url: submissionData.url,
          title: submissionData.title,
          description: submissionData.description,
          category: submissionData.category,
          credibilityScore: submissionData.credibilityScore,
          securityScore: submissionData.securityScore,
          status: submissionData.status,
          createdAt: submissionData.createdAt
        }
      });


    } catch (error) {
      next(error);
    }
  }

  // Get trending articles
  async getTrendingArticles(req, res, next) {
    try {
      const { limit = 10 } = req.query;
      const database = require('../config/database');

      if (database.isConnected) {
        // PostgreSQL implementation - get articles with high engagement in last 7 days
        const query = `
          SELECT
            l.*,
            u.first_name as author_first_name,
            u.last_name as author_last_name,
            COUNT(DISTINCT v.id) as vote_count,
            COUNT(DISTINCT c.id) as comment_count,
            COUNT(DISTINCT r.id) as report_count,
            (COUNT(DISTINCT v.id) * 1.0 + COUNT(DISTINCT c.id) * 2.0) as engagement_score
          FROM links l
          LEFT JOIN users u ON l.user_id = u.id
          LEFT JOIN votes v ON l.id = v.link_id
          LEFT JOIN comments c ON l.id = c.link_id
          LEFT JOIN reports r ON l.id = r.link_id
          WHERE l.created_at >= NOW() - INTERVAL '7 days'
          GROUP BY l.id, u.first_name, u.last_name
          ORDER BY engagement_score DESC, l.created_at DESC
          LIMIT $1
        `;

        const result = await database.pool.query(query, [parseInt(limit)]);

        const trendingArticles = result.rows.map(row => ({
          id: row.id,
          url: row.url,
          title: row.title,
          description: row.description,
          credibilityScore: row.security_score,
          createdAt: row.created_at,
          author: {
            firstName: row.author_first_name,
            lastName: row.author_last_name
          },
          voteCount: parseInt(row.vote_count) || 0,
          commentCount: parseInt(row.comment_count) || 0,
          reportCount: parseInt(row.report_count) || 0,
          engagementScore: parseFloat(row.engagement_score) || 0
        }));

        res.json({
          articles: trendingArticles,
          count: trendingArticles.length
        });

      } else {
        // In-memory fallback
        const links = Array.from(global.inMemoryDB?.links?.values() || []);
        const users = Array.from(global.inMemoryDB?.users?.values() || []);
        const votes = Array.from(global.inMemoryDB?.votes?.values() || []);
        const comments = Array.from(global.inMemoryDB?.comments?.values() || []);
        const reports = Array.from(global.inMemoryDB?.reports?.values() || []);

        // Filter articles from last 7 days
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const recentLinks = links.filter(link =>
          new Date(link.createdAt) >= sevenDaysAgo
        );

        // Calculate engagement scores
        const articlesWithEngagement = recentLinks.map(link => {
          const linkVotes = votes.filter(v => v.linkId === link.id);
          const linkComments = comments.filter(c => c.linkId === link.id);
          const linkReports = reports.filter(r => r.linkId === link.id);
          const author = users.find(u => u.id === link.userId);

          const engagementScore = linkVotes.length * 1.0 + linkComments.length * 2.0;

          return {
            id: link.id,
            url: link.url,
            title: link.title,
            description: link.description,
            credibilityScore: link.security_score,
            createdAt: link.createdAt,
            author: author ? {
              firstName: author.firstName,
              lastName: author.lastName
            } : null,
            voteCount: linkVotes.length,
            commentCount: linkComments.length,
            reportCount: linkReports.length,
            engagementScore
          };
        });

        // Sort by engagement score and limit
        articlesWithEngagement.sort((a, b) => {
          if (a.engagementScore !== b.engagementScore) {
            return b.engagementScore - a.engagementScore;
          }
          return new Date(b.createdAt) - new Date(a.createdAt);
        });

        const trendingArticles = articlesWithEngagement.slice(0, parseInt(limit));

        res.json({
          articles: trendingArticles,
          count: trendingArticles.length
        });
      }    } catch (error) {
      next(error);
    }
  }
}

module.exports = new LinkController();
