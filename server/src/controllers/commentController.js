// Use production config based on environment
const firebaseConfig = process.env.NODE_ENV === 'production'
  ? require('../config/firebase-production')
  : require('../config/firebase-emulator');

const { db, collections, admin } = firebaseConfig;

class CommentController {
  // Add a comment to a link
  async addComment(req, res, next) {
    try {
      const { linkId } = req.params;
      const { content } = req.body;
      const userId = req.user.userId;

      // Validate content
      if (!content || content.trim().length === 0) {
        return res.status(400).json({
          error: 'Comment content is required',
          code: 'CONTENT_REQUIRED'
        });
      }

      if (content.trim().length > 1000) {
        return res.status(400).json({
          error: 'Comment content must be less than 1000 characters',
          code: 'CONTENT_TOO_LONG'
        });
      }

      // Check if link exists
      const linkDoc = await db.collection(collections.LINKS).doc(linkId).get();
      if (!linkDoc.exists) {
        return res.status(404).json({
          error: 'Link not found',
          code: 'LINK_NOT_FOUND'
        });
      }

      // Get user data for comment display
      const userDoc = await db.collection(collections.USERS).doc(userId).get();
      const userData = userDoc.data();

      // Create comment
      const commentData = {
        linkId,
        userId,
        content: content.trim(),
        author: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          avatar: userData.profile?.avatar || null
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isEdited: false
      };

      const commentRef = await db.collection(collections.COMMENTS).add(commentData);

      // Update link comment count
      await db.collection(collections.LINKS).doc(linkId).update({
        'communityStats.totalComments': admin.firestore.FieldValue.increment(1),
        'communityStats.lastCommentAt': new Date().toISOString()
      });

      res.status(201).json({
        message: 'Comment added successfully',
        comment: {
          id: commentRef.id,
          ...commentData
        }
      });

    } catch (error) {
      next(error);
    }
  }

  // Get comments for a link with pagination
  async getComments(req, res, next) {
    try {
      const { linkId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const sortBy = req.query.sortBy || 'newest'; // newest, oldest

      // Check if link exists
      const linkDoc = await db.collection(collections.LINKS).doc(linkId).get();
      if (!linkDoc.exists) {
        return res.status(404).json({
          error: 'Link not found',
          code: 'LINK_NOT_FOUND'
        });
      }

      // Build query
      let query = db.collection(collections.COMMENTS)
        .where('linkId', '==', linkId);

      // Apply sorting
      if (sortBy === 'oldest') {
        query = query.orderBy('createdAt', 'asc');
      } else {
        query = query.orderBy('createdAt', 'desc');
      }

      // Get total count
      const totalSnapshot = await query.get();
      const totalComments = totalSnapshot.size;

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.offset(offset).limit(limit);

      const commentsSnapshot = await query.get();
      const comments = commentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const totalPages = Math.ceil(totalComments / limit);

      res.json({
        comments,
        pagination: {
          currentPage: page,
          totalPages,
          totalComments,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      });

    } catch (error) {
      next(error);
    }
  }

  // Update a comment
  async updateComment(req, res, next) {
    try {
      const { commentId } = req.params;
      const { content } = req.body;
      const userId = req.user.userId;

      // Validate content
      if (!content || content.trim().length === 0) {
        return res.status(400).json({
          error: 'Comment content is required',
          code: 'CONTENT_REQUIRED'
        });
      }

      if (content.trim().length > 1000) {
        return res.status(400).json({
          error: 'Comment content must be less than 1000 characters',
          code: 'CONTENT_TOO_LONG'
        });
      }

      // Get comment
      const commentDoc = await db.collection(collections.COMMENTS).doc(commentId).get();
      if (!commentDoc.exists) {
        return res.status(404).json({
          error: 'Comment not found',
          code: 'COMMENT_NOT_FOUND'
        });
      }

      const commentData = commentDoc.data();

      // Check if user owns the comment
      if (commentData.userId !== userId) {
        return res.status(403).json({
          error: 'You can only edit your own comments',
          code: 'UNAUTHORIZED'
        });
      }

      // Update comment
      const updateData = {
        content: content.trim(),
        updatedAt: new Date().toISOString(),
        isEdited: true
      };

      await db.collection(collections.COMMENTS).doc(commentId).update(updateData);

      res.json({
        message: 'Comment updated successfully',
        comment: {
          id: commentId,
          ...commentData,
          ...updateData
        }
      });

    } catch (error) {
      next(error);
    }
  }

  // Delete a comment
  async deleteComment(req, res, next) {
    try {
      const { commentId } = req.params;
      const userId = req.user.userId;

      // Get comment
      const commentDoc = await db.collection(collections.COMMENTS).doc(commentId).get();
      if (!commentDoc.exists) {
        return res.status(404).json({
          error: 'Comment not found',
          code: 'COMMENT_NOT_FOUND'
        });
      }

      const commentData = commentDoc.data();

      // Check if user owns the comment or is admin
      const userDoc = await db.collection(collections.USERS).doc(userId).get();
      const userData = userDoc.data();
      const isAdmin = userData.role === 'admin';

      if (commentData.userId !== userId && !isAdmin) {
        return res.status(403).json({
          error: 'You can only delete your own comments',
          code: 'UNAUTHORIZED'
        });
      }

      const batch = db.batch();

      // Delete comment
      batch.delete(commentDoc.ref);

      // Update link comment count
      const linkRef = db.collection(collections.LINKS).doc(commentData.linkId);
      batch.update(linkRef, {
        'communityStats.totalComments': admin.firestore.FieldValue.increment(-1)
      });

      await batch.commit();

      res.json({
        message: 'Comment deleted successfully'
      });

    } catch (error) {
      next(error);
    }
  }

  // Get user's comments with pagination
  async getUserComments(req, res, next) {
    try {
      const userId = req.user.userId;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      // Build query
      let query = db.collection(collections.COMMENTS)
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc');

      // Get total count
      const totalSnapshot = await query.get();
      const totalComments = totalSnapshot.size;

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.offset(offset).limit(limit);

      const commentsSnapshot = await query.get();
      const comments = commentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const totalPages = Math.ceil(totalComments / limit);

      res.json({
        comments,
        pagination: {
          currentPage: page,
          totalPages,
          totalComments,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CommentController();
