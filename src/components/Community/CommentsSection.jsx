import React, { useState, useEffect } from 'react';
import { 
  ChatBubbleLeftIcon,
  PencilIcon,
  TrashIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import communityAPI from '../../services/communityAPI';
import { useAuth } from '../../contexts/AuthContext';

const CommentsSection = ({ linkId, className = '' }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingComment, setEditingComment] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalComments: 0,
    hasNextPage: false
  });

  // Load comments on component mount
  useEffect(() => {
    if (linkId) {
      loadComments();
    }
  }, [linkId]);

  const loadComments = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const response = await communityAPI.getComments(linkId, page, 10, 'newest');
      setComments(response.comments);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Load comments error:', error);
      setError('Không thể tải bình luận');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!user) {
      alert('Vui lòng đăng nhập để bình luận');
      return;
    }

    if (!newComment.trim()) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await communityAPI.addComment(linkId, newComment.trim());
      setNewComment('');
      
      // Reload comments to show the new one
      await loadComments(1);
    } catch (error) {
      console.error('Submit comment error:', error);
      setError('Không thể gửi bình luận. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditComment = async (commentId) => {
    if (!editContent.trim()) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await communityAPI.updateComment(commentId, editContent.trim());
      setEditingComment(null);
      setEditContent('');
      
      // Reload comments to show the updated one
      await loadComments(pagination.currentPage);
    } catch (error) {
      console.error('Edit comment error:', error);
      setError('Không thể cập nhật bình luận. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Bạn có chắc muốn xóa bình luận này?')) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await communityAPI.deleteComment(commentId);
      
      // Reload comments
      await loadComments(pagination.currentPage);
    } catch (error) {
      console.error('Delete comment error:', error);
      setError('Không thể xóa bình luận. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const startEditing = (comment) => {
    setEditingComment(comment.id);
    setEditContent(comment.content);
  };

  const cancelEditing = () => {
    setEditingComment(null);
    setEditContent('');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Vừa xong';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} giờ trước`;
    } else if (diffInHours < 24 * 7) {
      return `${Math.floor(diffInHours / 24)} ngày trước`;
    } else {
      return date.toLocaleDateString('vi-VN');
    }
  };

  const getUserDisplayName = (author) => {
    if (author.firstName || author.lastName) {
      return `${author.firstName} ${author.lastName}`.trim();
    }
    return 'Người dùng ẩn danh';
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <ChatBubbleLeftIcon className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900">
            Bình luận ({pagination.totalComments})
          </h3>
        </div>
      </div>

      {/* Comment Form */}
      {user ? (
        <div className="p-4 border-b border-gray-200">
          <form onSubmit={handleSubmitComment}>
            <div className="flex space-x-3">
              <div className="flex-shrink-0">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <UserCircleIcon className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Viết bình luận của bạn..."
                  rows={3}
                  maxLength={1000}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  disabled={submitting}
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-500">
                    {newComment.length}/1000 ký tự
                  </span>
                  <button
                    type="submit"
                    disabled={!newComment.trim() || submitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    {submitting ? 'Đang gửi...' : 'Gửi bình luận'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      ) : (
        <div className="p-4 border-b border-gray-200 text-center">
          <p className="text-gray-600 mb-2">Đăng nhập để bình luận</p>
          <button
            onClick={() => window.location.href = '/login'}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Đăng nhập ngay
          </button>
        </div>
      )}

      {/* Comments List */}
      <div className="divide-y divide-gray-200">
        {loading && comments.length === 0 ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Đang tải bình luận...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <ChatBubbleLeftIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>Chưa có bình luận nào</p>
            <p className="text-sm">Hãy là người đầu tiên bình luận!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="p-4">
              <div className="flex space-x-3">
                <div className="flex-shrink-0">
                  {comment.author.avatar ? (
                    <img
                      src={comment.author.avatar}
                      alt={getUserDisplayName(comment.author)}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <UserCircleIcon className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">
                      {getUserDisplayName(comment.author)}
                    </span>
                    <span className="text-sm text-gray-500">
                      {formatDate(comment.createdAt)}
                    </span>
                    {comment.isEdited && (
                      <span className="text-xs text-gray-400">(đã chỉnh sửa)</span>
                    )}
                  </div>
                  
                  {editingComment === comment.id ? (
                    <div className="mt-2">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={3}
                        maxLength={1000}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        disabled={submitting}
                      />
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">
                          {editContent.length}/1000 ký tự
                        </span>
                        <div className="space-x-2">
                          <button
                            onClick={cancelEditing}
                            disabled={submitting}
                            className="px-3 py-1 text-gray-600 hover:text-gray-800 text-sm"
                          >
                            Hủy
                          </button>
                          <button
                            onClick={() => handleEditComment(comment.id)}
                            disabled={!editContent.trim() || submitting}
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
                          >
                            {submitting ? 'Đang lưu...' : 'Lưu'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-1">
                      <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                      
                      {/* Comment Actions */}
                      {user && user.uid === comment.userId && (
                        <div className="flex items-center space-x-4 mt-2">
                          <button
                            onClick={() => startEditing(comment)}
                            className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 text-sm"
                          >
                            <PencilIcon className="w-4 h-4" />
                            <span>Chỉnh sửa</span>
                          </button>
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="flex items-center space-x-1 text-red-500 hover:text-red-700 text-sm"
                          >
                            <TrashIcon className="w-4 h-4" />
                            <span>Xóa</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <button
              onClick={() => loadComments(pagination.currentPage - 1)}
              disabled={!pagination.hasPrevPage || loading}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Trang trước
            </button>
            <span className="text-sm text-gray-700">
              Trang {pagination.currentPage} / {pagination.totalPages}
            </span>
            <button
              onClick={() => loadComments(pagination.currentPage + 1)}
              disabled={!pagination.hasNextPage || loading}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Trang sau
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border-t border-red-200">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
};

export default CommentsSection;
