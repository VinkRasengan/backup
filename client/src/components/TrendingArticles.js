import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  MessageCircle,
  ThumbsUp,
  Eye,
  ExternalLink,
  Clock,
  Flame
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';

const TrendingArticles = () => {
  const { isDarkMode } = useTheme();
  const [trendingArticles, setTrendingArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrendingArticles();
  }, []);

  const loadTrendingArticles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/community/posts?sort=trending&limit=5');
      if (response.ok) {
        const data = await response.json();
        setTrendingArticles(data.data.posts);
      }
    } catch (error) {
      console.error('Error loading trending articles:', error);
      // Fallback to mock data
      setTrendingArticles([
        {
          id: 1,
          title: 'Phát hiện tin giả về vaccine COVID-19 lan truyền trên mạng xã hội',
          url: 'https://example.com/covid-vaccine-fake-news',
          credibilityScore: 25,
          voteCount: 45,
          commentCount: 23,
          engagementScore: 91,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          author: { firstName: 'Nguyễn', lastName: 'Văn A' }
        },
        {
          id: 2,
          title: 'Cách nhận biết website lừa đảo trong mùa mua sắm online',
          url: 'https://example.com/online-shopping-scam',
          credibilityScore: 85,
          voteCount: 38,
          commentCount: 15,
          engagementScore: 68,
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          author: { firstName: 'Trần', lastName: 'Thị B' }
        },
        {
          id: 3,
          title: 'Thông tin sai lệch về biến đổi khí hậu được chia sẻ rộng rãi',
          url: 'https://example.com/climate-change-misinformation',
          credibilityScore: 15,
          voteCount: 52,
          commentCount: 31,
          engagementScore: 114,
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          author: { firstName: 'Lê', lastName: 'Văn C' }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getCredibilityColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-300';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-300';
    if (score >= 40) return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-300';
    return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-300';
  };

  const getCredibilityLabel = (score) => {
    if (score >= 80) return 'Đáng tin cậy';
    if (score >= 60) return 'Cần thận trọng';
    if (score >= 40) return 'Nghi ngờ';
    return 'Không đáng tin';
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Vừa xong';
    if (diffInHours < 24) return `${diffInHours} giờ trước`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} ngày trước`;
  };

  if (loading) {
    return (
      <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <CardHeader>
          <CardTitle className={`flex items-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            <Flame className="w-5 h-5 mr-2 text-orange-500" />
            Bài viết thịnh hành
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
                <div className="flex space-x-4">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <CardHeader>
        <CardTitle className={`flex items-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          <Flame className="w-5 h-5 mr-2 text-orange-500" />
          Bài viết thịnh hành
        </CardTitle>
      </CardHeader>
      <CardContent>
        {trendingArticles.length === 0 ? (
          <div className="text-center py-8">
            <TrendingUp className={`w-12 h-12 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Chưa có bài viết thịnh hành
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {trendingArticles.map((article, index) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-lg border ${
                  isDarkMode ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-200 hover:bg-gray-50'
                } transition-colors cursor-pointer group`}
                onClick={() => window.open(article.url, '_blank')}
              >
                {/* Ranking Badge */}
                <div className="flex items-start space-x-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 ? 'bg-yellow-500 text-white' :
                    index === 1 ? 'bg-gray-400 text-white' :
                    index === 2 ? 'bg-orange-600 text-white' :
                    'bg-gray-300 text-gray-700'
                  }`}>
                    {index + 1}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    {/* Title */}
                    <h4 className={`font-medium text-sm leading-5 mb-2 group-hover:text-blue-600 transition-colors ${
                      isDarkMode ? 'text-gray-200' : 'text-gray-900'
                    }`}>
                      {article.title}
                    </h4>
                    
                    {/* Credibility Score */}
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCredibilityColor(article.credibilityScore)}`}>
                        {article.credibilityScore}% - {getCredibilityLabel(article.credibilityScore)}
                      </span>
                    </div>
                    
                    {/* Stats */}
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <ThumbsUp size={12} />
                        <span>{article.voteCount}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MessageCircle size={12} />
                        <span>{article.commentCount}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <TrendingUp size={12} />
                        <span>{Math.round(article.engagementScore)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock size={12} />
                        <span>{formatTimeAgo(article.createdAt)}</span>
                      </div>
                    </div>
                    
                    {/* Author */}
                    {article.author && (
                      <div className="mt-2 text-xs text-gray-400">
                        Bởi {article.author.firstName} {article.author.lastName}
                      </div>
                    )}
                  </div>
                  
                  {/* External Link Icon */}
                  <div className="flex-shrink-0">
                    <ExternalLink size={16} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
        
        {/* View All Link */}
        {trendingArticles.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => window.location.href = '/community?sort=trending'}
              className={`w-full text-center text-sm font-medium py-2 px-4 rounded-lg transition-colors ${
                isDarkMode 
                  ? 'text-blue-400 hover:bg-blue-900/20' 
                  : 'text-blue-600 hover:bg-blue-50'
              }`}
            >
              Xem tất cả bài viết thịnh hành →
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TrendingArticles;
