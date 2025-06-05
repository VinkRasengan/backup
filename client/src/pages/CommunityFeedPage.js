import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  TrendingUp, 
  Clock, 
  Filter, 
  Plus,
  Search,
  Eye,
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import VoteComponent from '../components/Community/VoteComponent';
import CommentsSection from '../components/Community/CommentsSection';
import ReportModal from '../components/Community/ReportModal';

const CommunityFeedPage = () => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('trending'); // trending, newest, most_voted
  const [filterBy, setFilterBy] = useState('all'); // all, safe, unsafe, suspicious
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [showComments, setShowComments] = useState({});
  const [showReportModal, setShowReportModal] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadArticles();
  }, [sortBy, filterBy, searchQuery]);

  const loadArticles = async (pageNum = 1) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/links/community-feed?page=${pageNum}&sort=${sortBy}&filter=${filterBy}&search=${searchQuery}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (pageNum === 1) {
          setArticles(data.articles);
        } else {
          setArticles(prev => [...prev, ...data.articles]);
        }
        setHasMore(data.hasMore);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Error loading articles:', error);
      toast.error('Không thể tải danh sách bài viết');
    } finally {
      setLoading(false);
    }
  };

  const toggleComments = (articleId) => {
    setShowComments(prev => ({
      ...prev,
      [articleId]: !prev[articleId]
    }));
  };

  const getCredibilityColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getCredibilityLabel = (score) => {
    if (score >= 80) return 'Đáng tin cậy';
    if (score >= 60) return 'Cần thận trọng';
    if (score >= 40) return 'Nghi ngờ';
    return 'Không đáng tin';
  };

  const ArticleCard = ({ article }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} 
        border rounded-lg p-6 mb-4 hover:shadow-lg transition-all duration-200`}
    >
      {/* Article Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {article.title || 'Untitled Article'}
          </h3>
          <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
            <span>Đăng bởi {article.author?.firstName} {article.author?.lastName}</span>
            <span>•</span>
            <span>{new Date(article.createdAt).toLocaleDateString('vi-VN')}</span>
            <span>•</span>
            <div className="flex items-center space-x-1">
              <Eye size={14} />
              <span>{article.viewCount || 0} lượt xem</span>
            </div>
          </div>
          
          {/* URL */}
          <div className="flex items-center space-x-2 mb-3">
            <ExternalLink size={16} className="text-blue-500" />
            <a 
              href={article.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600 truncate max-w-md"
            >
              {article.url}
            </a>
          </div>

          {/* Description */}
          {article.description && (
            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-3`}>
              {article.description}
            </p>
          )}
        </div>

        {/* Credibility Score */}
        {article.credibilityScore && (
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getCredibilityColor(article.credibilityScore)}`}>
            {article.credibilityScore}% - {getCredibilityLabel(article.credibilityScore)}
          </div>
        )}
      </div>

      {/* Voting and Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <VoteComponent linkId={article.id} />
          
          <button
            onClick={() => toggleComments(article.id)}
            className={`flex items-center space-x-1 px-3 py-1 rounded-md transition-colors
              ${isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
          >
            <MessageCircle size={16} />
            <span>{article.commentCount || 0}</span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowReportModal(article.id)}
            className={`flex items-center space-x-1 px-3 py-1 rounded-md transition-colors text-red-500 hover:bg-red-50`}
          >
            <AlertTriangle size={16} />
            <span>Báo cáo</span>
          </button>
        </div>
      </div>

      {/* Comments Section */}
      <AnimatePresence>
        {showComments[article.id] && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 border-t pt-4"
          >
            <CommentsSection linkId={article.id} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Cộng đồng kiểm tin
            </h1>
            <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mt-2`}>
              Cùng nhau xác minh và đánh giá độ tin cậy của thông tin
            </p>
          </div>
          
          <button
            onClick={() => window.location.href = '/submit'}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={20} />
            <span>Thêm bài viết</span>
          </button>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="flex-1 relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm bài viết..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            />
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={`px-4 py-2 rounded-lg border ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-700 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          >
            <option value="trending">🔥 Thịnh hành</option>
            <option value="newest">🕒 Mới nhất</option>
            <option value="most_voted">👍 Nhiều vote nhất</option>
          </select>

          {/* Filter */}
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
            className={`px-4 py-2 rounded-lg border ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-700 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          >
            <option value="all">Tất cả</option>
            <option value="safe">✅ Đáng tin cậy</option>
            <option value="suspicious">⚠️ Nghi ngờ</option>
            <option value="unsafe">❌ Không đáng tin</option>
          </select>
        </div>

        {/* Articles Feed */}
        <div className="space-y-4">
          {loading && articles.length === 0 ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className={`mt-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Đang tải bài viết...
              </p>
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-12">
              <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Chưa có bài viết nào. Hãy là người đầu tiên chia sẻ!
              </p>
            </div>
          ) : (
            articles.map(article => (
              <ArticleCard key={article.id} article={article} />
            ))
          )}
        </div>

        {/* Load More */}
        {hasMore && articles.length > 0 && (
          <div className="text-center mt-8">
            <button
              onClick={() => loadArticles(page + 1)}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg transition-colors"
            >
              {loading ? 'Đang tải...' : 'Tải thêm'}
            </button>
          </div>
        )}
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <ReportModal
          linkId={showReportModal}
          onClose={() => setShowReportModal(null)}
        />
      )}
    </div>
  );
};

export default CommunityFeedPage;
