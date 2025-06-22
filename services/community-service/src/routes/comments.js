const express = require('express');
const router = express.Router();
const { db, collections } = require('../config/firebase');
const Logger = require('../../shared/utils/logger');
const { getUserId, getUserEmail, getUserDisplayName } = require('../middleware/auth');

const logger = new Logger('community-service');

// Get comments for a link (Facebook-style with pagination)
router.get('/:linkId', async (req, res) => {
  try {
    const { linkId } = req.params;
    const { limit = 10, offset = 0, loadMore = false } = req.query;

    logger.info('Get comments request', { linkId, limit, offset, loadMore });

    // Get comments for the link (workaround for missing composite index)
    const snapshot = await db.collection(collections.COMMENTS)
      .where('linkId', '==', linkId)
      .get();

    // Sort and paginate in memory (temporary workaround)
    const allComments = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt);
        const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt);
        return bTime - aTime; // desc order
      });

    // Apply pagination
    const startIndex = parseInt(offset);
    const endIndex = startIndex + parseInt(limit);
    const paginatedComments = allComments.slice(startIndex, endIndex);

    const comments = paginatedComments.map(data => {
      return {
        id: data.id,
        linkId: data.linkId,
        content: data.content,
        author: {
          uid: data.author?.uid || data.userId,
          email: data.author?.email || data.userEmail,
          displayName: data.author?.displayName || 'Anonymous User',
          photoURL: data.author?.photoURL || null
        },
        voteScore: data.voteScore || 0,
        replyCount: data.replyCount || 0,
        parentId: data.parentId || null,
        status: data.status || 'active',
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
      };
    });

    // Use already fetched data for total count
    const total = allComments.length;
    const hasMore = (parseInt(offset) + parseInt(limit)) < total;

    res.json({
      success: true,
      data: {
        comments,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore
        }
      }
    });

  } catch (error) {
    logger.error('Get comments error', { error: error.message, linkId: req.params.linkId });
    res.status(500).json({
      success: false,
      error: 'Failed to get comments'
    });
  }
});

// Create a new comment (Facebook-style)
router.post('/', async (req, res) => {
  try {
    const { linkId, content, parentId } = req.body;

    // Get user info from auth middleware or request body
    const userId = getUserId(req);
    const userEmail = getUserEmail(req);
    const displayName = getUserDisplayName(req);

    logger.info('Create comment request', { linkId, userId, parentId });

    // Validate required fields
    if (!linkId || !content || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: linkId, content, userId'
      });
    }

    // Create comment object with enhanced fields
    const newComment = {
      linkId,
      content: content.trim(),
      author: {
        uid: userId,
        email: userEmail || null,
        displayName: displayName,
        photoURL: null
      },
      parentId: parentId || null, // For replies
      voteStats: {
        upvotes: 0,
        downvotes: 0,
        total: 0,
        score: 0
      },
      voteScore: 0,
      replyCount: 0,
      status: 'active',
      isEdited: false,
      editHistory: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add comment to Firestore
    const commentRef = await db.collection(collections.COMMENTS).add(newComment);

    // Update link comment count
    await updateLinkCommentCount(linkId);

    // If this is a reply, update parent comment reply count
    if (parentId) {
      await updateCommentReplyCount(parentId);
    }

    logger.info('Comment created', { commentId: commentRef.id, linkId, userId });

    // Return created comment
    const createdComment = {
      id: commentRef.id,
      ...newComment,
      createdAt: newComment.createdAt.toISOString(),
      updatedAt: newComment.updatedAt.toISOString()
    };

    res.json({
      success: true,
      message: 'Comment added successfully',
      comment: createdComment
    });

  } catch (error) {
    logger.error('Create comment error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to create comment'
    });
  }
});

// Helper function to update link comment count
async function updateLinkCommentCount(linkId) {
  try {
    const commentsSnapshot = await db.collection(collections.COMMENTS)
      .where('linkId', '==', linkId)
      .where('status', '==', 'active')
      .get();

    const commentCount = commentsSnapshot.size;

    // Update link
    const linkRef = db.collection(collections.POSTS).doc(linkId);
    const linkDoc = await linkRef.get();

    if (linkDoc.exists) {
      await linkRef.update({ commentCount });
    }

    logger.info('Link comment count updated', { linkId, commentCount });
    return commentCount;
  } catch (error) {
    logger.error('Update link comment count error', { error: error.message, linkId });
    throw error;
  }
}

// Helper function to update comment reply count
async function updateCommentReplyCount(commentId) {
  try {
    const repliesSnapshot = await db.collection(collections.COMMENTS)
      .where('parentId', '==', commentId)
      .where('status', '==', 'active')
      .get();

    const replyCount = repliesSnapshot.size;

    // Update parent comment
    await db.collection(collections.COMMENTS).doc(commentId).update({ replyCount });

    logger.info('Comment reply count updated', { commentId, replyCount });
    return replyCount;
  } catch (error) {
    logger.error('Update comment reply count error', { error: error.message, commentId });
    throw error;
  }
}

// Get replies for a comment (Facebook-style nested comments)
router.get('/:commentId/replies', async (req, res) => {
  try {
    const { commentId } = req.params;
    const { limit = 5, offset = 0 } = req.query;

    logger.info('Get replies request', { commentId, limit, offset });

    // Get replies for the comment
    let query = db.collection(collections.COMMENTS)
      .where('parentId', '==', commentId)
      .where('status', '==', 'active')
      .orderBy('createdAt', 'asc'); // Replies show oldest first (Facebook style)

    // Apply pagination
    if (offset > 0) {
      query = query.offset(parseInt(offset));
    }

    query = query.limit(parseInt(limit));

    const snapshot = await query.get();

    const replies = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        linkId: data.linkId,
        content: data.content,
        author: {
          uid: data.author?.uid || data.userId,
          email: data.author?.email || data.userEmail,
          displayName: data.author?.displayName || 'Anonymous User',
          photoURL: data.author?.photoURL || null
        },
        voteScore: data.voteScore || 0,
        parentId: data.parentId,
        status: data.status || 'active',
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
      };
    });

    // Get total count for pagination
    const totalSnapshot = await db.collection(collections.COMMENTS)
      .where('parentId', '==', commentId)
      .where('status', '==', 'active')
      .get();

    const total = totalSnapshot.size;
    const hasMore = (parseInt(offset) + parseInt(limit)) < total;

    res.json({
      success: true,
      data: {
        replies,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore
        }
      }
    });

  } catch (error) {
    logger.error('Get replies error', { error: error.message, commentId: req.params.commentId });
    res.status(500).json({
      success: false,
      error: 'Failed to get replies'
    });
  }
});

// Update a comment
router.put('/:commentId', async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content, userId } = req.body;

    logger.info('Update comment request', { commentId, userId });

    // Validate required fields
    if (!content || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: content, userId'
      });
    }

    // Get existing comment
    const commentDoc = await db.collection(collections.COMMENTS).doc(commentId).get();

    if (!commentDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found'
      });
    }

    const commentData = commentDoc.data();

    // Check if user owns the comment
    if (commentData.author?.uid !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to edit this comment'
      });
    }

    // Update comment
    await commentDoc.ref.update({
      content: content.trim(),
      updatedAt: new Date()
    });

    logger.info('Comment updated', { commentId, userId });

    res.json({
      success: true,
      message: 'Comment updated successfully'
    });

  } catch (error) {
    logger.error('Update comment error', { error: error.message, commentId: req.params.commentId });
    res.status(500).json({
      success: false,
      error: 'Failed to update comment'
    });
  }
});

// Delete a comment
router.delete('/:commentId', async (req, res) => {
  try {
    const { commentId } = req.params;
    const { userId } = req.body;

    logger.info('Delete comment request', { commentId, userId });

    // Validate required fields
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: userId'
      });
    }

    // Get existing comment
    const commentDoc = await db.collection(collections.COMMENTS).doc(commentId).get();

    if (!commentDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found'
      });
    }

    const commentData = commentDoc.data();

    // Check if user owns the comment
    if (commentData.author?.uid !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this comment'
      });
    }

    // Soft delete comment (mark as deleted)
    await commentDoc.ref.update({
      status: 'deleted',
      content: '[Comment deleted]',
      updatedAt: new Date()
    });

    // Update link comment count
    await updateLinkCommentCount(commentData.linkId);

    // If this comment has a parent, update parent reply count
    if (commentData.parentId) {
      await updateCommentReplyCount(commentData.parentId);
    }

    logger.info('Comment deleted', { commentId, userId });

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });

  } catch (error) {
    logger.error('Delete comment error', { error: error.message, commentId: req.params.commentId });
    res.status(500).json({
      success: false,
      error: 'Failed to delete comment'
    });
  }
});

// Vote on a comment (Reddit-style)
router.post('/:commentId/vote', async (req, res) => {
  try {
    const { commentId } = req.params;
    const { voteType, userId } = req.body; // 'upvote', 'downvote'

    logger.info('Comment vote request', { commentId, voteType, userId });

    // Validate required fields
    if (!commentId || !voteType || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: commentId, voteType, userId'
      });
    }

    // Validate vote type
    if (!['upvote', 'downvote'].includes(voteType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid vote type. Must be "upvote" or "downvote"'
      });
    }

    // Check if comment exists
    const commentRef = db.collection(collections.COMMENTS).doc(commentId);
    const commentDoc = await commentRef.get();

    if (!commentDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found'
      });
    }

    // Check if user already voted on this comment
    const existingVoteQuery = await db.collection(collections.COMMENT_VOTES)
      .where('commentId', '==', commentId)
      .where('userId', '==', userId)
      .get();

    let action = 'created';

    if (!existingVoteQuery.empty) {
      // User already voted
      const voteDoc = existingVoteQuery.docs[0];
      const existingVote = voteDoc.data();

      if (existingVote.voteType === voteType) {
        // Same vote type - remove vote (toggle off)
        await voteDoc.ref.delete();
        action = 'removed';
      } else {
        // Different vote type - update vote
        await voteDoc.ref.update({
          voteType,
          updatedAt: new Date()
        });
        action = 'updated';
      }
    } else {
      // Create new vote
      await db.collection(collections.COMMENT_VOTES).add({
        commentId,
        userId,
        voteType,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Update comment vote statistics
    const votesSnapshot = await db.collection(collections.COMMENT_VOTES)
      .where('commentId', '==', commentId)
      .get();

    const stats = {
      total: 0,
      upvotes: 0,
      downvotes: 0,
      score: 0
    };

    votesSnapshot.forEach((doc) => {
      const vote = doc.data();
      stats.total++;
      if (vote.voteType === 'upvote') {
        stats.upvotes++;
      } else if (vote.voteType === 'downvote') {
        stats.downvotes++;
      }
    });

    stats.score = stats.upvotes - stats.downvotes;

    // Update comment with new vote statistics
    await commentRef.update({
      voteStats: stats,
      voteScore: stats.score,
      updatedAt: new Date()
    });

    res.json({
      success: true,
      action,
      message: `Comment vote ${action} successfully`,
      data: {
        commentId,
        voteStats: stats
      }
    });

  } catch (error) {
    logger.error('Comment vote error', { error: error.message, commentId: req.params.commentId });
    res.status(500).json({
      success: false,
      error: 'Failed to vote on comment'
    });
  }
});

// Get comment vote statistics
router.get('/:commentId/votes', async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.query.userId;

    // Get vote statistics
    const votesSnapshot = await db.collection(collections.COMMENT_VOTES)
      .where('commentId', '==', commentId)
      .get();

    const stats = {
      total: 0,
      upvotes: 0,
      downvotes: 0,
      score: 0
    };

    votesSnapshot.forEach((doc) => {
      const vote = doc.data();
      stats.total++;
      if (vote.voteType === 'upvote') {
        stats.upvotes++;
      } else if (vote.voteType === 'downvote') {
        stats.downvotes++;
      }
    });

    stats.score = stats.upvotes - stats.downvotes;

    // Get user's vote if userId provided
    let userVote = null;
    if (userId) {
      const userVoteQuery = await db.collection(collections.COMMENT_VOTES)
        .where('commentId', '==', commentId)
        .where('userId', '==', userId)
        .get();

      if (!userVoteQuery.empty) {
        const voteData = userVoteQuery.docs[0].data();
        userVote = {
          voteType: voteData.voteType,
          createdAt: voteData.createdAt?.toDate?.()?.toISOString() || voteData.createdAt
        };
      }
    }

    res.json({
      success: true,
      data: {
        commentId,
        statistics: stats,
        userVote
      }
    });

  } catch (error) {
    logger.error('Get comment votes error', { error: error.message, commentId: req.params.commentId });
    res.status(500).json({
      success: false,
      error: 'Failed to get comment votes'
    });
  }
});

module.exports = router;
