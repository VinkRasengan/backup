import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { MessageCircle, Send } from 'lucide-react';
import { communityAPI } from '../../services/api';
import toast from 'react-hot-toast';

const CommentSection = ({ postId, initialCommentCount = 0 }) => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    total: initialCommentCount,
    limit: 10,
    offset: 0,
    hasMore: false
  });

  useEffect(() => {
    if (!postId) return;
    loadComments();
  }, [postId]);

  const loadComments = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔍 Loading comments for postId:', postId);
      const response = await communityAPI.getComments(postId, 1, 10, 'newest');
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

  const toggleComments = () => {
    setShowComments(!showComments);
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

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
      <button
        onClick={toggleComments}
        className={`flex items-center space-x-2 text-sm font-medium mb-3 transition-colors ${
          isDarkMode 
            ? 'text-gray-300 hover:text-white' 
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <MessageCircle className="w-4 h-4" />
        <span>
          {comments.length > 0 
            ? `${comments.length} bình luận` 
            : 'Bình luận'
          }
        </span>
      </button>

      {showComments && (
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
                <div key={comment.id} className="flex space-x-3">
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
                    }`}>
                      <span className="text-sm font-medium">
                        {comment.author?.displayName?.[0] || comment.author?.email?.[0] || 'U'}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className={`inline-block px-3 py-2 rounded-2xl ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                    }`}>
                      <div className="text-sm font-medium mb-1">
                        <span>{comment.author?.displayName || comment.author?.email || 'Anonymous'}</span>
                      </div>
                      <div className={`text-sm ${
                        isDarkMode ? 'text-gray-200' : 'text-gray-800'
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
                      <button className={`text-xs font-medium ${
                        isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                      }`}>
                        Thích
                      </button>
                      <button className={`text-xs font-medium ${
                        isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                      }`}>
                        Phản hồi
                      </button>
                    </div>
                  </div>
                </div>
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
      )}
    </div>
  );
};

export default CommentSection;
