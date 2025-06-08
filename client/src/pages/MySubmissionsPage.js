import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { auth } from '../config/firebase';
import { toast } from 'react-hot-toast';
import { 
  ArrowLeft, 
  Trash2, 
  Eye, 
  Calendar,
  Globe,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';

const MySubmissionsPage = () => {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMySubmissions = useCallback(async () => {
    try {
      if (!user) return;

      const firebaseUser = auth.currentUser;
      if (!firebaseUser) return;

      const token = await firebaseUser.getIdToken();
      const response = await fetch('/api/community/my-submissions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSubmissions(data.submissions || []);
      } else {
        console.error('Failed to fetch submissions');
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast.error('Không thể tải danh sách bài viết');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMySubmissions();
  }, [fetchMySubmissions]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMySubmissions();
  };

  const handleDelete = async (submissionId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài viết này?')) return;

    try {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) return;

      const token = await firebaseUser.getIdToken();
      const response = await fetch(`/api/community/submissions/${submissionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('Đã xóa bài viết thành công');
        setSubmissions(prev => prev.filter(s => s.id !== submissionId));
      } else {
        toast.error('Không thể xóa bài viết');
      }
    } catch (error) {
      console.error('Error deleting submission:', error);
      toast.error('Có lỗi xảy ra khi xóa bài viết');
    }
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'safe':
        return {
          text: 'An toàn',
          bgColor: 'bg-green-100 dark:bg-green-900/30',
          textColor: 'text-green-800 dark:text-green-200',
          icon: CheckCircle
        };
      case 'warning':
        return {
          text: 'Đáng ngờ',
          bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
          textColor: 'text-yellow-800 dark:text-yellow-200',
          icon: AlertTriangle
        };
      case 'dangerous':
        return {
          text: 'Nguy hiểm',
          bgColor: 'bg-red-100 dark:bg-red-900/30',
          textColor: 'text-red-800 dark:text-red-200',
          icon: XCircle
        };
      default:
        return {
          text: 'Không xác định',
          bgColor: 'bg-gray-100 dark:bg-gray-900/30',
          textColor: 'text-gray-800 dark:text-gray-200',
          icon: AlertTriangle
        };
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <Link
              to="/dashboard"
              className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} transition-colors`}
            >
              <ArrowLeft className={`w-5 h-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
            </Link>
            <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Bài viết đã gửi
            </h1>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} transition-colors`}
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''} ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
            </button>
          </div>
          <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Quản lý các bài viết bạn đã gửi đến cộng đồng
          </p>
        </motion.div>

        {/* Submissions List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {submissions.length > 0 ? (
            <div className="space-y-6">
              {submissions.map((submission) => {
                const statusInfo = getStatusInfo(submission.status);
                const StatusIcon = statusInfo.icon;
                
                return (
                  <div
                    key={submission.id}
                    className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {submission.title}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(submission.createdAt).toLocaleDateString('vi-VN')}
                          </div>
                          <div className="flex items-center gap-1">
                            <Globe className="w-4 h-4" />
                            {new URL(submission.url).hostname}
                          </div>
                        </div>
                        {submission.description && (
                          <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-3`}>
                            {submission.description}
                          </p>
                        )}

                        {/* Screenshot/Image */}
                        {(submission.imageUrl || submission.screenshot) && (
                          <div className="mb-3">
                            <img
                              src={submission.imageUrl || submission.screenshot}
                              alt={submission.title}
                              className="w-full max-w-sm h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                      </div>
                      
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bgColor} ${statusInfo.textColor}`}>
                        <StatusIcon className="w-4 h-4" />
                        {statusInfo.text}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">
                          {submission.credibilityScore}/100
                        </div>
                        <div className="text-xs text-gray-500">Tin cậy</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">
                          {submission.securityScore}/100
                        </div>
                        <div className="text-xs text-gray-500">Bảo mật</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-purple-600">
                          {(submission.votes?.safe || 0) + (submission.votes?.unsafe || 0) + (submission.votes?.suspicious || 0)}
                        </div>
                        <div className="text-xs text-gray-500">Lượt vote</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-orange-600">
                          {submission.commentsCount || 0}
                        </div>
                        <div className="text-xs text-gray-500">Bình luận</div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                      <a
                        href={submission.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        <Eye className="w-4 h-4" />
                        Xem bài viết gốc
                      </a>
                      
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/community/post/${submission.id}`}
                          className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} transition-colors`}
                        >
                          <MessageSquare className="w-4 h-4" />
                          Xem trong cộng đồng
                        </Link>
                        <button
                          onClick={() => handleDelete(submission.id)}
                          className="flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-12 text-center`}>
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Chưa có bài viết nào
              </h3>
              <p className={`text-gray-500 mb-6`}>
                Bạn chưa gửi bài viết nào đến cộng đồng
              </p>
              <Link
                to="/submit"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Gửi bài viết đầu tiên
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default MySubmissionsPage;
