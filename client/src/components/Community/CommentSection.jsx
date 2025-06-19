import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { MessageCircle, Send, MoreHorizontal, Heart, Reply } from 'lucide-react';

const CommentSection = ({ postId, initialCommentCount = 0 }) => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [pagination, setPagination] = useState({
    total: initialCommentCount,
    limit: 10,
    offset: 0,
    hasMore: false
  });

  // Load comments
  const loadComments = async (offset = 0, append = false) => {
    if (!postId) return;
    
    try {
      setLoading(true);
      
      const response = await fetch(
        `http://localhost:8080/api/comments/${postId}?limit=${pagination.limit}&offset=${offset}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('backendToken')}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load comments');
      }

      const data = await response.json();
      
      if (data.success) {
        if (append) {
          setComments(prev => [...prev, ...data.data.comments]);
        } else {
          setComments(data.data.comments);
        }
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error('Load comments error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Submit new comment
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim() || !user || submitting) return;
    
    try {
      setSubmitting(true);
      
      const response = await fetch('http://localhost:8080/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('backendToken')}`
        },
        body: JSON.stringify({
          postId,
          content: newComment.trim(),
          userId: user.uid || user.id,
          userEmail: user.email,
          displayName: user.displayName || user.email?.split('@')[0] || 'Anonymous'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit comment');
      }

      const data = await response.json();
      
      if (data.success) {
        // Add new comment to the top (Facebook style)
        setComments(prev => [data.comment, ...prev]);
        setNewComment('');
        setPagination(prev => ({
          ...prev,
          total: prev.total + 1
        }));
      }
    } catch (error) {
      console.error('Submit comment error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Load more comments
  const handleLoadMore = () => {
    if (pagination.hasMore && !loading) {
      loadComments(pagination.offset + pagination.limit, true);
    }
  };

  // Toggle comments visibility
  const toggleComments = () => {
    setShowComments(!showComments);
    if (!showComments && comments.length === 0) {
      loadComments();
    }
  };

  // Format time ago
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
      {/* Comment Toggle Button */}
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
          {pagination.total > 0 
            ? `${pagination.total} bình luận` 
            : 'Bình luận'
          }
        </span>
      </button>

      {showComments && (
        <div className="space-y-4">
          {/* Comment Input */}
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

          {/* Comments List */}
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
                        {comment.author?.displayName || comment.author?.email || 'Anonymous'}
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

              {/* Load More Button */}
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

          {/* No comments message */}
          {!loading && comments.length === 0 && (
            <div className={`text-center py-4 text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Chưa có bình luận nào. Hãy là người đầu tiên bình luận!
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CommentSection;
