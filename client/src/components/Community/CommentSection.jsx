import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { MessageCircle, Send } from 'lucide-react';
import firestoreService from '../../services/firestoreService';
import toast from 'react-hot-toast';

const CommentSection = ({ postId, initialCommentCount = 0 }) => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(true); // Show comments by default
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    total: initialCommentCount,
    limit: 10,
    offset: 0,
    hasMore: false
  });

  // Load comments on mount and set up real-time subscription
  useEffect(() => {
    if (!postId) return;

    let unsubscribe = null;

    // Set up real-time subscription for comments
    const setupRealtimeComments = () => {
      try {
        unsubscribe = firestoreService.subscribeToComments(postId, (comments) => {
          // Transform Firestore comments to match expected structure
          const transformedComments = comments.map(comment => ({
            ...comment,
            author: {
              uid: comment.userId,
              email: comment.userEmail,
              displayName: comment.userEmail?.split('@')[0] || 'Anonymous'
            }
          }));
          
          setComments(transformedComments);
          setPagination(prev => ({
            ...prev,
            total: transformedComments.length,
            hasMore: transformedComments.length >= prev.limit
          }));
          setLoading(false);
        });
      } catch (error) {
        console.error('Error setting up real-time comments:', error);
        
        // Check if it's a missing index error
        if (error.code === 'failed-precondition' && error.message.includes('requires an index')) {
          console.warn('Firestore index missing for comments query. Using fallback method.');
          setError('Đang thiết lập cơ sở dữ liệu. Vui lòng thử lại sau.');
        }
        
        // Fallback to manual loading without real-time
        loadCommentsManually();
      }
    };

    // Manual loading function (fallback when real-time fails)
    const loadCommentsManually = async () => {
      setLoading(true);
      try {
        const result = await firestoreService.getComments(postId, { limitCount: 10 });
        // Transform Firestore comments to match expected structure
        const transformedComments = result.comments.map(comment => ({
          ...comment,
          author: {
            uid: comment.userId,
            email: comment.userEmail,
            displayName: comment.userEmail?.split('@')[0] || 'Anonymous'
          }
        }));
        
        setComments(transformedComments);
        setPagination(prev => ({
          ...prev,
          total: transformedComments.length,
          hasMore: result.hasMore,
          lastDoc: result.lastDoc
        }));
      } catch (err) {
        console.error('Error loading comments:', err);
        if (err.code === 'failed-precondition' && err.message.includes('requires an index')) {
          setError('Cần thiết lập index cho Firestore. Vui lòng liên hệ admin để tạo index.');
        } else {
          setError('Không thể tải bình luận. Vui lòng thử lại.');
        }
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    setupRealtimeComments();

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [postId]);

  // Submit new comment with optimistic UI updates
  const handleSubmitComment = async (e) => {
    e.preventDefault();

    if (!newComment.trim() || !user || submitting) return;

    const commentContent = newComment.trim();
    const tempId = `temp_${Date.now()}`;

    // Create optimistic comment
    const optimisticComment = {
      id: tempId,
      content: commentContent,
      author: {
        uid: user.id || user.uid,
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0] || 'Anonymous'
      },
      createdAt: new Date().toISOString(),
      voteScore: 0,
      isOptimistic: true // Flag to identify optimistic updates
    };

    // Optimistic UI update
    setComments(prev => [optimisticComment, ...prev]);
    setNewComment('');
    setPagination(prev => ({
      ...prev,
      total: prev.total + 1
    }));
    setSubmitting(true);
    setError(null);

    try {
      // ✅ Use Firestore service directly
      const commentId = await firestoreService.addComment(
        postId,
        commentContent,
        user.id || user.uid,
        user.email
      );

      if (commentId) {
        // Replace optimistic comment with real comment
        const realComment = {
          id: commentId,
          content: commentContent,
          userId: user.id || user.uid,
          userEmail: user.email,
          linkId: postId,
          createdAt: new Date(),
          updatedAt: new Date(),
          author: {
            uid: user.id || user.uid,
            email: user.email,
            displayName: user.displayName || user.email?.split('@')[0] || 'Anonymous'
          },
          voteScore: 0,
          isOptimistic: false
        };

        setComments(prev => prev.map(comment =>
          comment.id === tempId ? realComment : comment
        ));
        
        toast.success('Bình luận đã được thêm!');
      } else {
        throw new Error('Failed to add comment');
      }
    } catch (error) {
      console.error('Submit comment error:', error);

      // Rollback optimistic update
      setComments(prev => prev.filter(comment => comment.id !== tempId));
      setPagination(prev => ({
        ...prev,
        total: prev.total - 1
      }));
      setNewComment(commentContent); // Restore comment text
      setError('Không thể gửi bình luận. Vui lòng thử lại.');
      toast.error('Không thể gửi bình luận. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  // Load more comments - now uses pagination with Firestore
  const handleLoadMore = async () => {
    if (!pagination.hasMore || loading || !pagination.lastDoc) return;

    setLoading(true);
    try {
      const result = await firestoreService.getComments(postId, {
        limitCount: pagination.limit,
        lastDoc: pagination.lastDoc
      });

      // Transform Firestore comments to match expected structure
      const transformedComments = result.comments.map(comment => ({
        ...comment,
        author: {
          uid: comment.userId,
          email: comment.userEmail,
          displayName: comment.userEmail?.split('@')[0] || 'Anonymous'
        }
      }));

      setComments(prev => [...prev, ...transformedComments]);
      setPagination(prev => ({
        ...prev,
        hasMore: result.hasMore,
        lastDoc: result.lastDoc,
        total: prev.total + transformedComments.length
      }));
    } catch (error) {
      console.error('Error loading more comments:', error);
      setError('Không thể tải thêm bình luận. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Toggle comments visibility
  const toggleComments = () => {
    setShowComments(!showComments);
    // Real-time subscription will handle loading automatically
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
                <div key={comment.id} className={`flex space-x-3 ${
                  comment.isOptimistic ? 'opacity-70' : ''
                }`}>
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
                    } ${comment.isOptimistic ? 'border border-dashed border-gray-400' : ''}`}>
                      <div className="text-sm font-medium mb-1 flex items-center space-x-2">
                        <span>{comment.author?.displayName || comment.author?.email || 'Anonymous'}</span>
                        {comment.isOptimistic && (
                          <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                        )}
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
                        {comment.isOptimistic ? 'Đang gửi...' : formatTimeAgo(comment.createdAt)}
                      </span>
                      {!comment.isOptimistic && (
                        <>
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
                        </>
                      )}
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
          {!loading && comments.length === 0 && !error && (
            <div className={`text-center py-4 text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Chưa có bình luận nào. Hãy là người đầu tiên bình luận!
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className={`text-center py-4 text-sm ${
              isDarkMode ? 'text-red-400' : 'text-red-600'
            }`}>
              <p>{error}</p>
              <button
                onClick={async () => {
                  setError(null);
                  setLoading(true);
                  try {
                    const result = await firestoreService.getComments(postId, { limitCount: 10 });
                    // Transform Firestore comments to match expected structure
                    const transformedComments = result.comments.map(comment => ({
                      ...comment,
                      author: {
                        uid: comment.userId,
                        email: comment.userEmail,
                        displayName: comment.userEmail?.split('@')[0] || 'Anonymous'
                      }
                    }));
                    
                    setComments(transformedComments);
                    setPagination(prev => ({
                      ...prev,
                      total: transformedComments.length,
                      hasMore: result.hasMore,
                      lastDoc: result.lastDoc
                    }));
                  } catch (error) {
                    console.error('Error retrying comments:', error);
                    setError('Vẫn không thể tải bình luận. Vui lòng thử lại sau.');
                  } finally {
                    setLoading(false);
                  }
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
