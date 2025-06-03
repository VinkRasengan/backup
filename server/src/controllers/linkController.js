const { db, collections } = require('../config/firebase-emulator');
const crawlerService = require('../services/crawlerService');

class LinkController {
  // Check a new link
  async checkLink(req, res, next) {
    try {
      const { url } = req.body;
      const userId = req.user.userId;

      // Validate URL format
      try {
        new URL(url);
      } catch (error) {
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
          return res.json({
            message: 'Link was recently checked',
            result: {
              id: recentCheck.docs[0].id,
              ...lastCheck
            }
          });
        }
      }

      // Use crawler service to check the link
      const crawlerResult = await crawlerService.checkLink(url);

      // Save result to database
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

      res.json({
        message: 'Link checked successfully',
        result: {
          id: linkRef.id,
          ...linkData
        }
      });

    } catch (error) {
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
}

module.exports = new LinkController();
