import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { communityAPI } from '../../services/api';
import { MessageCircle, ChevronDown, Send, User, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import CommentVoteButton from './CommentVoteButton';
// Mock service disabled - using real API
// import '../../services/mockCommentsService';

const CommentPreview = ({ linkId, onToggleFullComments }) => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();

  // Debug user state
  console.log('🔍 CommentPreview - User state:', user);
  console.log('🔍 CommentPreview - LinkId:', linkId);
  const [comments, setComments] = useState([]);
  const [totalComments, setTotalComments] = useState(0);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);

  // Load preview comments (first 2 comments)
  useEffect(() => {
    if (linkId) {
      loadPreviewComments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkId]);

  const loadPreviewComments = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading comments for linkId:', linkId);
      const response = await communityAPI.getComments(linkId, 1, 2, 'newest');
      console.log('📝 Comments API response:', response);

      if (response.data && response.data.success) {
        const comments = response.data.data?.comments || [];
        const pagination = response.data.data?.pagination || {};

        setComments(comments);
        // Handle different response structures
        setTotalComments(
          pagination.totalComments ||
          pagination.total ||
          comments.length ||
          0
        );
        console.log('✅ Comments loaded:', comments.length, 'Total:', pagination.totalComments || pagination.total);
      } else {
        console.warn('⚠️ Comments API response not successful:', response.data);
        // Set empty state on failure
        setComments([]);
        setTotalComments(0);
      }
    } catch (error) {
      console.error('❌ Load preview comments error:', error);
      console.error('Error details:', error.response?.data || error.message);
      // Set empty state on error
      setComments([]);
      setTotalComments(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();

    if (!user) {
      console.log('❌ No user found, showing login prompt');
      toast.error('Vui lòng đăng nhập để bình luận');
      return;
    }

    if (!newComment.trim()) {
      console.log('❌ Empty comment, returning');
      return;
    }

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
      isOptimistic: true
    };

    // Optimistic UI update
    setComments(prev => [optimisticComment, ...prev.slice(0, 1)]); // Keep only 2 comments in preview
    setTotalComments(prev => prev + 1);
    setNewComment('');
    setShowCommentForm(false);
    setSubmitting(true);

    try {
      const response = await communityAPI.addComment(linkId, commentContent);

      if (response.data && response.data.success) {
        // Replace optimistic comment with real comment
        const newCommentData = response.data.comment;
        setComments(prev => prev.map(comment =>
          comment.id === tempId ? { ...newCommentData, isOptimistic: false } : comment
        ));

        // Also reload to ensure sync
        setTimeout(() => loadPreviewComments(), 1000);

        toast.success('Đã thêm bình luận');
      } else {
        throw new Error('Failed to submit comment');
      }
    } catch (error) {
      console.error('Submit comment error:', error);

      // Rollback optimistic update
      setComments(prev => prev.filter(comment => comment.id !== tempId));
      setTotalComments(prev => prev - 1);
      setNewComment(commentContent); // Restore comment text
      setShowCommentForm(true); // Reopen form

      toast.error('Không thể gửi bình luận. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'vừa xong';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
    return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
  };

  const CommentItem = ({ comment }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex space-x-3 py-2 ${comment.isOptimistic ? 'opacity-70' : ''}`}
    >
      <div className="flex-shrink-0">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          isDarkMode ? 'bg-gray-600' : 'bg-gray-200'
        }`}>
          <User size={16} className={isDarkMode ? 'text-gray-300' : 'text-gray-600'} />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className={`inline-block px-3 py-2 rounded-2xl ${
          isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
        } ${comment.isOptimistic ? 'border border-dashed border-gray-400' : ''}`}>
          <div className="flex items-center space-x-2">
            <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {comment.author?.displayName || comment.author?.email || comment.user_name || comment.user_email || 'Người dùng'}
            </p>
            {comment.isOptimistic && (
              <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            )}
          </div>
          <p className={`text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
            {comment.content}
          </p>
        </div>
        <div className="flex items-center justify-between mt-1 ml-3">
          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {comment.isOptimistic ? 'Đang gửi...' : formatTimeAgo(comment.createdAt || comment.created_at)}
          </p>
          {!comment.isOptimistic && (
            <div className="flex items-center space-x-2">
              <CommentVoteButton
                commentId={comment.id}
                initialVotes={comment.voteScore || 0}
                initialUserVote={null}
              />
              <button className={`flex items-center space-x-1 text-xs px-2 py-1 rounded-full transition-colors ${
                isDarkMode
                  ? 'text-gray-400 hover:text-red-400 hover:bg-red-900/20'
                  : 'text-gray-500 hover:text-red-600 hover:bg-red-50'
              }`}>
                <Heart size={12} />
                <span>{comment.likes || 0}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );

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
          <span>{totalComments} bình luận</span>
        </button>

        <button
          onClick={() => {
            console.log('🔍 Comment button clicked - User:', user);
            console.log('🔍 Comment button clicked - ShowForm:', showCommentForm);
            setShowCommentForm(!showCommentForm);
          }}
          className={`text-sm px-4 py-1.5 rounded-full font-medium transition-all duration-200 ${
            showCommentForm
              ? isDarkMode
                ? 'bg-blue-600 text-white'
                : 'bg-blue-600 text-white'
              : isDarkMode
                ? 'text-blue-400 hover:bg-blue-900/20 hover:text-blue-300'
                : 'text-blue-600 hover:bg-blue-50 hover:text-blue-700'
          }`}
        >
          {showCommentForm ? 'Hủy' : 'Bình luận'}
        </button>
      </div>

      {/* Preview Comments */}
      <AnimatePresence>
        {comments.length > 0 && (
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
            {totalComments > 2 && (
              <button
                onClick={onToggleFullComments}
                className={`flex items-center space-x-1 text-sm ml-11 ${
                  isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
                } transition-colors`}
              >
                <ChevronDown size={14} />
                <span>Xem thêm {totalComments - 2} bình luận</span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

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

      {loading && (
        <div className="flex justify-center py-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
};

export default CommentPreview;
