import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { MessageCircle, Send, ChevronDown, User, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { communityAPI } from '../../services/api';
import toast from 'react-hot-toast';

const CommentSection = ({ 
  postId, 
  initialCommentCount = 0, 
  previewMode = false, // New prop to control preview vs full mode
  onToggleFullComments = null 
}) => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    total: initialCommentCount,
    limit: previewMode ? 2 : 10, // Preview shows only 2 comments
    offset: 0,
    hasMore: false
  });

  useEffect(() => {
    if (!postId) return;
    loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId, previewMode]); // Add previewMode as dependency

  const loadComments = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔍 Loading comments for postId:', postId, 'Preview mode:', previewMode);
      const limit = previewMode ? 2 : 10;
      const response = await communityAPI.getComments(postId, 1, limit, 'newest');
      console.log('📝 Comments API response:', response);

      if (response && response.success) {
        const rawComments = response.data?.comments || [];
        const pagination = response.data?.pagination || {};

        // Transform comments to ensure author data is properly formatted
        const transformedComments = rawComments.map(comment => {
          // If comment already has proper author object, use it
          if (comment.author && comment.author.displayName && comment.author.displayName !== 'Anonymous User') {
            return comment;
          }

          // Otherwise, create author object from available data
          const author = {
            uid: comment.author?.uid || comment.userId || 'anonymous',
            email: comment.author?.email || comment.userEmail || null,
            displayName: comment.author?.displayName ||
                        comment.userEmail?.split('@')[0] ||
                        comment.user_name ||
                        'Anonymous'
          };

          return { ...comment, author };
        });

        setComments(transformedComments);
        setPagination({
          total: pagination.total || transformedComments.length || 0,
          limit: pagination.limit || 10,
          offset: pagination.offset || 0,
          hasMore: pagination.hasMore || false
        });

        console.log('✅ Comments loaded:', transformedComments.length, 'Total:', pagination.total);
        console.log('🔍 First comment author:', transformedComments[0]?.author);
      } else {
        console.warn('⚠️ Comments API response not successful:', response);
        setComments([]);
        setPagination(prev => ({ ...prev, total: 0, hasMore: false }));
      }
    } catch (error) {
      console.error('❌ Load comments error:', error);
      setError('Không thể tải bình luận. Vui lòng thử lại.');
      setComments([]);
      setPagination(prev => ({ ...prev, total: 0, hasMore: false }));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();

    if (!newComment.trim() || !user || submitting) return;

    const commentContent = newComment.trim();
    setNewComment('');
    setSubmitting(true);
    setError(null);

    try {
      console.log('🔍 Submitting comment with user data:', {
        postId,
        user: {
          id: user.id,
          uid: user.uid,
          email: user.email,
          displayName: user.displayName
        }
      });

      const response = await communityAPI.addComment(
        postId,
        commentContent,
        user.id || user.uid,
        user.email,
        user.displayName
      );

      if (response && response.success) {
        toast.success('Bình luận đã được thêm!');
        // Reload comments to show the new comment
        await loadComments();
      } else {
        throw new Error('Failed to add comment');
      }
    } catch (error) {
      console.error('Submit comment error:', error);
      setNewComment(commentContent);
      setError('Không thể gửi bình luận. Vui lòng thử lại.');
      toast.error('Không thể gửi bình luận. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLoadMore = async () => {
    if (!pagination.hasMore || loading) return;

    setLoading(true);
    try {
      const nextPage = Math.floor(pagination.offset / pagination.limit) + 2; // Calculate next page
      const response = await communityAPI.getComments(postId, nextPage, pagination.limit, 'newest');

      if (response && response.success) {
        const rawNewComments = response.data?.comments || [];
        const newPagination = response.data?.pagination || {};

        // Transform new comments to ensure author data is properly formatted
        const transformedNewComments = rawNewComments.map(comment => {
          // If comment already has proper author object, use it
          if (comment.author && comment.author.displayName && comment.author.displayName !== 'Anonymous User') {
            return comment;
          }

          // Otherwise, create author object from available data
          const author = {
            uid: comment.author?.uid || comment.userId || 'anonymous',
            email: comment.author?.email || comment.userEmail || null,
            displayName: comment.author?.displayName ||
                        comment.userEmail?.split('@')[0] ||
                        comment.user_name ||
                        'Anonymous'
          };

          return { ...comment, author };
        });

        setComments(prev => [...prev, ...transformedNewComments]);
        setPagination(prev => ({
          ...prev,
          offset: newPagination.offset || prev.offset + transformedNewComments.length,
          hasMore: newPagination.hasMore || false
        }));
      }
    } catch (error) {
      console.error('Error loading more comments:', error);
      setError('Không thể tải thêm bình luận. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'vừa xong';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
    
    return date.toLocaleDateString('vi-VN');
  };

  // Comment Item Component
  const CommentItem = ({ comment }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex space-x-3"
    >
      <div className="flex-shrink-0">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          isDarkMode ? 'bg-gray-600' : 'bg-gray-200'
        }`}>
          <User size={16} className={isDarkMode ? 'text-gray-300' : 'text-gray-600'} />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className={`inline-block px-3 py-2 rounded-2xl max-w-full ${
          isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
        }`}>
          <div className="text-sm font-medium mb-1">
            <span className={isDarkMode ? 'text-gray-200' : 'text-gray-800'}>
              {comment.author?.displayName || comment.author?.email?.split('@')[0] || 'Anonymous'}
            </span>
          </div>
          <div className={`text-sm leading-relaxed ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            {comment.content}
          </div>
        </div>
        
        <div className="flex items-center space-x-4 mt-1 ml-3">
          <span className={`text-xs ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            {formatTimeAgo(comment.createdAt)}
          </span>
          
          {!previewMode && (
            <>
              <button className={`flex items-center space-x-1 text-xs transition-colors ${
                isDarkMode ? 'text-gray-400 hover:text-red-400' : 'text-gray-500 hover:text-red-500'
              }`}>
                <Heart size={12} />
                <span>{comment.likes || 0}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );

  // Preview Mode Render
  if (previewMode) {
    return (
      <div className={`border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} pt-3`}>
        {/* Comment Stats */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={onToggleFullComments}
            className={`flex items-center space-x-2 text-sm font-medium transition-colors ${
              isDarkMode ? 'text-gray-300 hover:text-blue-400' : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            <MessageCircle size={16} />
            <span>{pagination.total} bình luận</span>
          </button>

          <button
            onClick={() => setShowCommentForm(!showCommentForm)}
            className={`text-sm px-4 py-1.5 rounded-full font-medium transition-all duration-200 ${
              showCommentForm
                ? 'bg-blue-600 text-white'
                : isDarkMode
                  ? 'text-blue-400 hover:bg-blue-900/20 hover:text-blue-300'
                  : 'text-blue-600 hover:bg-blue-50 hover:text-blue-700'
            }`}
          >
            {showCommentForm ? 'Hủy' : 'Bình luận'}
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className={`flex items-center justify-center py-4 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            <div className="w-4 h-4 border border-gray-400 border-t-transparent rounded-full animate-spin mr-2"></div>
            <span className="text-sm">Đang tải bình luận...</span>
          </div>
        )}

        {/* Preview Comments */}
        <AnimatePresence>
          {!loading && comments.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2 mb-3"
            >
              {comments.map((comment) => (
                <CommentItem key={comment.id} comment={comment} />
              ))}

              {/* Show more comments button */}
              {pagination.total > 2 && (
                <button
                  onClick={onToggleFullComments}
                  className={`flex items-center space-x-1 text-sm ml-11 ${
                    isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
                  } transition-colors`}
                >
                  <ChevronDown size={14} />
                  <span>Xem thêm {pagination.total - 2} bình luận</span>
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {!loading && comments.length === 0 && pagination.total === 0 && (
          <div className={`text-center py-4 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            <p className="text-sm">Chưa có bình luận nào. Hãy là người đầu tiên bình luận!</p>
          </div>
        )}

        {/* Quick Comment Form */}
        <AnimatePresence>
          {showCommentForm && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleSubmitComment}
              className="flex space-x-3 mt-3"
            >
              <div className="flex-shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isDarkMode ? 'bg-gray-600' : 'bg-gray-200'
                }`}>
                  <User size={16} className={isDarkMode ? 'text-gray-300' : 'text-gray-600'} />
                </div>
              </div>
              <div className="flex-1 flex space-x-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Viết bình luận..."
                  className={`flex-1 px-4 py-2 rounded-full text-sm border transition-colors ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:bg-gray-600'
                      : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:bg-white'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                  disabled={submitting}
                />
                <button
                  type="submit"
                  disabled={submitting || !newComment.trim()}
                  className={`p-2 rounded-full transition-all duration-200 ${
                    submitting || !newComment.trim()
                      ? isDarkMode
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 active:scale-95'
                  }`}
                >
                  <Send size={14} />
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Full Mode Render (original functionality)
  return (
    <div className="space-y-4">
      {user && (
        <form onSubmit={handleSubmitComment} className="flex space-x-3">
          <div className="flex-shrink-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
            }`}>
              <span className="text-sm font-medium">
                {user.displayName?.[0] || user.email?.[0] || 'U'}
              </span>
            </div>
          </div>
          <div className="flex-1 flex space-x-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Viết bình luận..."
              className={`flex-1 px-3 py-2 rounded-full border text-sm ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-gray-100 border-gray-300 text-gray-900 placeholder-gray-500'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              disabled={submitting}
            />
            <button
              type="submit"
              disabled={!newComment.trim() || submitting}
              className={`p-2 rounded-full transition-colors ${
                newComment.trim() && !submitting
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : isDarkMode
                  ? 'bg-gray-600 text-gray-400'
                  : 'bg-gray-300 text-gray-500'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {loading && comments.length === 0 ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex space-x-3 animate-pulse">
              <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                <div className="h-3 bg-gray-300 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}

          {pagination.hasMore && (
            <button
              onClick={handleLoadMore}
              disabled={loading}
              className={`w-full py-2 text-sm font-medium rounded-lg transition-colors ${
                isDarkMode
                  ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {loading ? 'Đang tải...' : 'Xem thêm bình luận'}
            </button>
          )}
        </div>
      )}

      {!loading && comments.length === 0 && !error && (
        <div className={`text-center py-4 text-sm ${
          isDarkMode ? 'text-gray-400' : 'text-gray-500'
        }`}>
          Chưa có bình luận nào. Hãy là người đầu tiên bình luận!
        </div>
      )}

      {error && (
        <div className={`text-center py-4 text-sm ${
          isDarkMode ? 'text-red-400' : 'text-red-600'
        }`}>
          <p>{error}</p>
          <button
            onClick={async () => {
              setError(null);
              await loadComments();
            }}
            className={`mt-2 px-3 py-1 text-xs rounded-full transition-colors ${
              isDarkMode
                ? 'bg-red-900/20 text-red-400 hover:bg-red-900/30'
                : 'bg-red-50 text-red-600 hover:bg-red-100'
            }`}
          >
            Thử lại
          </button>
        </div>
      )}
    </div>
  );
};

export default CommentSection;
