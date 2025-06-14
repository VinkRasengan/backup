import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronUp, 
  ChevronDown, 
  AlertTriangle, 
  ExternalLink,
  Calendar,
  Filter,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import toast from 'react-hot-toast';

const UserVotedPosts = () => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'safe', 'unsafe', 'suspicious'
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (user) {
      loadVotedPosts();
    }
  }, [user, filter]);

  const loadVotedPosts = async (pageNum = 1) => {
    if (!user) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('authToken') || localStorage.getItem('backendToken');
      
      const params = new URLSearchParams({
        page: pageNum,
        limit: 10
      });
      
      if (filter !== 'all') {
        params.append('voteType', filter);
      }

      const response = await fetch(`/api/votes/user/voted-posts?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch voted posts');
      }

      const data = await response.json();
      
      if (pageNum === 1) {
        setPosts(data.data.posts);
      } else {
        setPosts(prev => [...prev, ...data.data.posts]);
      }
      
      setHasMore(data.data.pagination.page < data.data.pagination.totalPages);
      setPage(pageNum);

    } catch (error) {
      console.error('Error loading voted posts:', error);
      toast.error('Không thể tải danh sách bài viết đã vote');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      loadVotedPosts(page + 1);
    }
  };

  const getVoteIcon = (voteType) => {
    switch (voteType) {
      case 'safe':
        return <ChevronUp className="w-4 h-4 text-green-600" />;
      case 'unsafe':
        return <ChevronDown className="w-4 h-4 text-red-600" />;
      case 'suspicious':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getVoteLabel = (voteType) => {
    switch (voteType) {
      case 'safe':
        return 'Đáng tin cậy';
      case 'unsafe':
        return 'Không đáng tin';
      case 'suspicious':
        return 'Nghi ngờ';
      default:
        return '';
    }
  };

  const getVoteColor = (voteType) => {
    switch (voteType) {
      case 'safe':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'unsafe':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'suspicious':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const formatDate = (dateString) => {
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Vui lòng đăng nhập để xem các bài viết đã vote
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Bài viết đã vote
        </h1>
        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Danh sách các bài viết bạn đã bình chọn
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-1 mb-6 border-b border-gray-200 dark:border-gray-700">
        {[
          { value: 'all', label: 'Tất cả', icon: Filter },
          { value: 'safe', label: 'Đáng tin cậy', icon: ChevronUp },
          { value: 'unsafe', label: 'Không đáng tin', icon: ChevronDown },
          { value: 'suspicious', label: 'Nghi ngờ', icon: AlertTriangle }
        ].map((filterOption) => (
          <button
            key={filterOption.value}
            onClick={() => setFilter(filterOption.value)}
            className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              filter === filterOption.value
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <filterOption.icon className="w-4 h-4" />
            <span>{filterOption.label}</span>
          </button>
        ))}
      </div>

      {/* Refresh Button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => loadVotedPosts(1)}
          disabled={loading}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
            loading 
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300'
          }`}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Đang tải...' : 'Làm mới'}</span>
        </button>
      </div>

      {/* Posts List */}
      <div className="space-y-4">
        {loading && posts.length === 0 ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className={`mt-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Đang tải bài viết...
            </p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {filter === 'all' ? 'Bạn chưa vote bài viết nào' : `Bạn chưa vote "${getVoteLabel(filter)}" cho bài viết nào`}
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {posts.map((post) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
                  border rounded-lg p-4 hover:shadow-md transition-all duration-200`}
              >
                <div className="flex items-start space-x-4">
                  {/* Vote Badge */}
                  <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getVoteColor(post.userVote.voteType)}`}>
                    {getVoteIcon(post.userVote.voteType)}
                    <span>{getVoteLabel(post.userVote.voteType)}</span>
                  </div>

                  {/* Post Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {post.title}
                    </h3>
                    
                    {post.url && (
                      <a
                        href={post.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm mb-2"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span className="truncate">{post.url}</span>
                      </a>
                    )}

                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>Vote lúc: {formatDate(post.userVote.votedAt)}</span>
                      </div>
                      
                      {post.voteStats && (
                        <div className="flex items-center space-x-2">
                          <span className="text-green-600">↑{post.voteStats.safe}</span>
                          <span className="text-yellow-600">⚠{post.voteStats.suspicious}</span>
                          <span className="text-red-600">↓{post.voteStats.unsafe}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Load More */}
      {hasMore && posts.length > 0 && (
        <div className="text-center mt-8">
          <button
            onClick={loadMore}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg transition-colors"
          >
            {loading ? 'Đang tải...' : 'Tải thêm'}
          </button>
        </div>
      )}
    </div>
  );
};

export default UserVotedPosts;
