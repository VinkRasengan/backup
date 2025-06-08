import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { communityAPI } from '../../services/api';
import { MessageCircle, ChevronDown, Send, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const CommentPreview = ({ linkId, onToggleFullComments }) => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
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
  }, [linkId]);

  const loadPreviewComments = async () => {
    try {
      setLoading(true);
      const response = await communityAPI.getComments(linkId, 1, 2, 'newest');
      
      if (response.data && response.data.success) {
        setComments(response.data.data.comments || []);
        setTotalComments(response.data.data.pagination?.totalComments || 0);
      }
    } catch (error) {
      console.error('Load preview comments error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Vui lòng đăng nhập để bình luận');
      return;
    }

    if (!newComment.trim()) {
      return;
    }

    try {
      setSubmitting(true);
      const response = await communityAPI.addComment(linkId, newComment.trim());
      
      if (response.data && response.data.success) {
        setNewComment('');
        setShowCommentForm(false);
        // Reload preview to show new comment
        await loadPreviewComments();
        toast.success('Đã thêm bình luận');
      }
    } catch (error) {
      console.error('Submit comment error:', error);
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
      className="flex space-x-3 py-2"
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
        }`}>
          <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {comment.user_name || comment.user_email || 'Người dùng'}
          </p>
          <p className={`text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
            {comment.content}
          </p>
        </div>
        <p className={`text-xs mt-1 ml-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {formatTimeAgo(comment.created_at)}
        </p>
      </div>
    </motion.div>
  );

  return (
    <div className={`border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} pt-3`}>
      {/* Comment Stats */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={onToggleFullComments}
          className={`flex items-center space-x-2 text-sm ${
            isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
          } transition-colors`}
        >
          <MessageCircle size={16} />
          <span>{totalComments} bình luận</span>
        </button>

        <button
          onClick={() => setShowCommentForm(!showCommentForm)}
          className={`text-sm px-3 py-1 rounded-full transition-colors ${
            isDarkMode 
              ? 'text-blue-400 hover:bg-blue-900/20' 
              : 'text-blue-600 hover:bg-blue-50'
          }`}
        >
          Bình luận
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
                className={`flex-1 px-3 py-2 rounded-full text-sm border ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                disabled={submitting}
              />
              <button
                type="submit"
                disabled={submitting || !newComment.trim()}
                className={`p-2 rounded-full transition-colors ${
                  submitting || !newComment.trim()
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
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
