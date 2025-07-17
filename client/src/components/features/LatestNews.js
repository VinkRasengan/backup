import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Newspaper,
  ExternalLink,
  Clock,
  Globe,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { gsap, ScrollTrigger } from '../../utils/gsap';

// Get API base URL (same logic as api.js)
const getApiBaseUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  if (process.env.NODE_ENV === 'production') {
    return '/api';
  }

  const apiBaseUrl = process.env.REACT_APP_API_URL || "http://localhost:8080";
    return `${apiBaseUrl}/api`;
};

const LatestNews = () => {
  const { isDarkMode } = useTheme();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const fetchLatestNews = async () => {
      // Load mock data immediately for instant display
      console.log('🚀 Loading latest news immediately...');

      const mockData = [
        {
          title: 'Công nghệ AI mới giúp phát hiện deepfake chính xác hơn 95%',
          description: 'Các nhà nghiên cứu đã phát triển một hệ thống AI có thể phát hiện video deepfake với độ chính xác cao, giúp chống lại thông tin sai lệch trên mạng.',
          url: 'https://example.com/ai-deepfake-detection',
          urlToImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400',
          publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          source: { name: 'TechCrunch' }
        },
        {
          title: 'Cảnh báo về chiến dịch lừa đảo qua email mới nhắm vào người dùng Việt Nam',
          description: 'Các chuyên gia bảo mật đã phát hiện một chiến dịch lừa đảo tinh vi targeting người dùng tại Việt Nam thông qua email giả mạo các tổ chức tài chính.',
          url: 'https://example.com/vietnam-email-scam',
          urlToImage: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400',
          publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          source: { name: 'CyberNews' }
        },
        {
          title: 'Facebook ra mắt công cụ kiểm chứng thông tin mới cho thị trường Đông Nam Á',
          description: 'Meta đã công bố sẽ triển khai công cụ fact-checking mới nhằm chống lại thông tin sai lệch và tin giả trên các nền tảng mạng xã hội.',
          url: 'https://example.com/facebook-fact-check-sea',
          urlToImage: 'https://images.unsplash.com/photo-1611262588024-d12430b98920?w=400',
          publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          source: { name: 'Reuters' }
        },
        {
          title: 'Nghiên cứu mới: 73% người dùng mạng xã hội không kiểm tra nguồn tin trước khi chia sẻ',
          description: 'Một nghiên cứu gần đây cho thấy phần lớn người dùng mạng xã hội có thói quen chia sẻ thông tin mà không kiểm chứng độ tin cậy của nguồn.',
          url: 'https://example.com/social-media-misinformation-study',
          urlToImage: 'https://images.unsplash.com/photo-1611605698335-8b1569810432?w=400',
          publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
          source: { name: 'BBC' }
        }
      ];

      setNews(mockData);
      setLoading(false);
      setError(null);

      // Try to fetch real data in background (optional)
      try {
        const token = localStorage.getItem('token') ||
                     localStorage.getItem('authToken') ||
                     localStorage.getItem('backendToken');

        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`${getApiBaseUrl()}/news/latest?source=newsapi&pageSize=5`, { headers });

        if (response.ok) {
          const data = await response.json();
          const articles = data.data?.newsapi?.articles || data.data?.articles || [];
          if (articles.length > 0) {
            console.log('✅ Updated with real news articles');
            setNews(articles.slice(0, 4));
          }
        }
      } catch (error) {
        console.log('ℹ️ Using mock data (API not available)');
      }
    };

    fetchLatestNews();
  }, []);

  // Optimized lightweight animation
  useEffect(() => {
    if (!containerRef.current || loading || news.length === 0) return;

    const container = containerRef.current;
    const newsItems = container.querySelectorAll('[data-news]');

    // Set content visible immediately - no lag
    gsap.set(container, { opacity: 1 });
    gsap.set(newsItems, { opacity: 1, x: 0, scale: 1 });

    // Lightweight ScrollTrigger with minimal animation
    const st = ScrollTrigger.create({
      trigger: container,
      start: "top 95%",
      once: true, // Only run once for performance
      onEnter: () => {
        // Simple fade-in only
        gsap.fromTo(newsItems,
          { opacity: 0.7 },
          {
            opacity: 1,
            duration: 0.3,
            ease: "none",
            stagger: 0.05
          }
        );
      }
    });

    return () => {
      st.kill();
    };
  }, [loading, news]);

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'Vừa xong';
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    return `${days} ngày trước`;
  };
  const refreshNews = async () => {
    setLoading(true);
    // Add a small delay for better UX
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const renderNewsContent = () => {
    if (error) {
      return (
        <div className="text-center py-8">
          <Globe className={`w-12 h-12 mx-auto mb-4 ${
            isDarkMode ? 'text-gray-600' : 'text-gray-400'
          }`} />
          <p className={`mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {error}
          </p>
          <button
            onClick={refreshNews}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isDarkMode
                ? 'bg-blue-900/30 text-blue-300 hover:bg-blue-900/50'
                : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
            }`}
          >
            Thử lại
          </button>
        </div>
      );
    }

    if (news.length === 0) {
      return (
        <div className="text-center py-8">
          <Newspaper className={`w-12 h-12 mx-auto mb-4 ${
            isDarkMode ? 'text-gray-600' : 'text-gray-400'
          }`} />
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Không có tin tức mới
          </p>
        </div>
      );
    }

    return news.map((article, index) => (
      <motion.div
        key={article.url || index}
        data-news
        initial={{ opacity: 1, x: 0 }}
        animate={{ opacity: 1, x: 0 }}
        className={`group flex space-x-4 p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
          isDarkMode
            ? 'border-gray-700 hover:border-blue-500/50 hover:bg-gray-700/50'
            : 'border-gray-100 hover:border-blue-200 hover:bg-blue-50/50'
        }`}
        onClick={() => window.open(article.url, '_blank', 'noopener,noreferrer')}
        whileHover={{ y: -2 }}
      >
        {/* Article Image */}
        {article.urlToImage && (
          <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
            <img
              src={article.urlToImage}
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Article Content */}
        <div className="flex-1 min-w-0">
          <h4 className={`font-semibold text-sm mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            {article.title}
          </h4>
          
          <p className={`text-xs mb-2 line-clamp-2 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {article.description}
          </p>

          {/* Article Meta */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-xs">
              <div className="flex items-center space-x-1">
                <Globe className="w-3 h-3" />
                <span className="text-gray-500 dark:text-gray-500">
                  {article.source?.name || 'News Source'}
                </span>
              </div>
              
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span className="text-gray-500 dark:text-gray-500">
                  {formatTime(article.publishedAt)}
                </span>
              </div>
            </div>

            <ExternalLink className={`w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity ${
              isDarkMode ? 'text-blue-400' : 'text-blue-600'
            }`} />
          </div>
        </div>
      </motion.div>
    ));
  };

  if (loading) {
    return (
      <div className={`rounded-2xl shadow-sm border ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      } p-6`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-48 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex space-x-4">
                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 1, y: 0 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl shadow-sm border hover:shadow-lg transition-all duration-300 ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      } p-6`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
            <Newspaper className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Tin tức mới nhất
            </h3>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Cập nhật về an ninh mạng và kiểm chứng
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <motion.button
            onClick={refreshNews}
            className={`p-2 rounded-full transition-colors ${
              isDarkMode 
                ? 'hover:bg-gray-700 text-gray-400' 
                : 'hover:bg-gray-100 text-gray-600'
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </motion.button>

          <motion.button
            onClick={() => window.location.href = '/news'}
            className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              isDarkMode 
                ? 'bg-blue-900/30 text-blue-300 hover:bg-blue-900/50' 
                : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span>Xem tất cả</span>
            <ChevronRight size={14} />
          </motion.button>
        </div>
      </div>

      {/* News List */}
      <div className="space-y-4">
        {renderNewsContent()}
      </div>

      {/* Footer CTA */}
      {news.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <motion.button
            onClick={() => window.location.href = '/news'}
            className={`w-full py-3 rounded-xl font-medium transition-colors ${
              isDarkMode
                ? 'bg-blue-900/30 text-blue-300 hover:bg-blue-900/50'
                : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Xem thêm tin tức về bảo mật
          </motion.button>
        </div>
      )}
    </motion.div>
  );
};

export default LatestNews;
