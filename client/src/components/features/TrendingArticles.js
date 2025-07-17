import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  MessageCircle,
  ThumbsUp,
  ExternalLink,
  Clock,
  Flame
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { gsap } from '../../utils/gsap';
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

const TrendingArticles = () => {
  console.log('🔥 TrendingArticles component rendered');
  const { isDarkMode } = useTheme();
  const [trendingArticles, setTrendingArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const cardRef = useRef(null);

  useEffect(() => {
    console.log('🔥 TrendingArticles useEffect triggered');
    loadTrendingArticles();
  }, []);

  // GSAP ScrollTrigger animation
  useEffect(() => {
    if (!cardRef.current || loading || trendingArticles.length === 0) return;

    console.log('🎬 TrendingArticles: Setting up ScrollTrigger animations...');

    const card = cardRef.current;
    const articles = card.querySelectorAll('[data-article]');

    // Set initial state - content visible but positioned for animation
    gsap.set(card, { opacity: 1 });
    gsap.set(articles, { opacity: 1, y: 20, scale: 0.98 });

    // ScrollTrigger animation
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: card,
        start: "top 90%",
        end: "bottom 20%",
        toggleActions: "play none none reverse"
      }
    });

    // Animate card container
    tl.to(card, {
      y: 0,
      duration: 0.6,
      ease: "power2.out"
    })
    // Then animate articles with stagger
    .to(articles, {
      y: 0,
      scale: 1,
      duration: 0.5,
      ease: "power2.out",
      stagger: 0.1
    }, "-=0.3");

    return () => {
      tl.kill();
    };
  }, [loading, trendingArticles]);

  const loadTrendingArticles = async () => {
    try {
      // Load mock data immediately for better UX
      console.log('🚀 Loading trending articles immediately...');

    // Set mock data first for instant display
    const mockData = [
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
      },
      {
        id: 4,
        title: 'Cảnh báo: Trang web giả mạo Shopee đang lừa đảo người dùng',
        url: 'https://fake-shopee.com',
        credibilityScore: 12,
        voteCount: 67,
        commentCount: 28,
        engagementScore: 156,
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        author: { firstName: 'Phạm', lastName: 'Thị D' }
      },
      {
        id: 5,
        title: 'Hướng dẫn kiểm tra độ tin cậy của nguồn tin trực tuyến',
        url: 'https://factcheck-guide.com',
        credibilityScore: 92,
        voteCount: 89,
        commentCount: 45,
        engagementScore: 203,
        createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        author: { firstName: 'Hoàng', lastName: 'Văn E' }
      }
    ];

    setTrendingArticles(mockData);
    setLoading(false);

    // Try to fetch real data in background
    try {
      console.log('🔄 Fetching real trending data from API...');
      const response = await fetch(`${getApiBaseUrl()}/community/links?sort=trending&limit=5`, {
        headers: {
          'Cache-Control': 'max-age=60',
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 API Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('📊 API Response data:', data);

        if (data.success && data.data && data.data.links && data.data.links.length > 0) {
          console.log('✅ Updated with real trending articles:', data.data.links.length);

          // Transform API data to match our format
          const transformedPosts = data.data.links.map(link => ({
            id: link.id,
            title: link.title,
            url: link.url,
            credibilityScore: link.trustScore || 50,
            voteCount: link.voteStats?.total || 0,
            commentCount: link.commentsCount || 0,
            engagementScore: (link.voteStats?.total || 0) * (link.trustScore || 50) / 10,
            createdAt: link.createdAt,
            author: link.author || { firstName: 'Unknown', lastName: 'User' }
          }));

          setTrendingArticles(transformedPosts);
        } else {
          console.log('⚠️ API returned no links, keeping mock data');
        }
      } else {
        console.log('⚠️ API request failed:', response.status, response.statusText);
      }
    } catch (error) {
      console.log('ℹ️ API not available, using mock data:', error.message);
    }
    } catch (error) {
      console.error('🚨 Error in loadTrendingArticles:', error);
      setLoading(false);
    }
  };

  const getRankBadgeStyle = (index) => {
    if (index === 0) return 'bg-yellow-500 text-white';
    if (index === 1) return 'bg-gray-400 text-white';
    if (index === 2) return 'bg-orange-600 text-white';
    return 'bg-gray-300 text-gray-700';
  };

  const getCredibilityColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-300';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-300';
    if (score >= 40) return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-300';
    return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-300';
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
    <div ref={cardRef} className="h-full">
      {/* Modern Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center mr-3">
              <Flame className="w-5 h-5 text-white" />
            </div>
            Bài viết thịnh hành
          </h3>
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Những bài viết được quan tâm nhất
        </p>
      </div>

      <div className="px-6 pb-6">
        {trendingArticles.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              Chưa có bài viết thịnh hành
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {trendingArticles.map((article, index) => (
              <motion.div
                key={article.id}
                data-article
                initial={{ opacity: 1, y: 0 }}
                animate={{ opacity: 1, y: 0 }}
                className="group cursor-pointer"
                onClick={() => window.open(article.url, '_blank')}
              >
                <div className={`p-4 rounded-2xl border transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${
                  isDarkMode
                    ? 'border-gray-700 hover:border-gray-600 hover:bg-gray-700/30'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}>
                    <div className="flex items-start space-x-3">
                      {/* Rank Badge */}
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${getRankBadgeStyle(index)}`}>
                        {index + 1}
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Title */}
                        <h4 className={`font-semibold text-sm leading-5 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2 ${
                          isDarkMode ? 'text-gray-200' : 'text-gray-900'
                        }`}>
                          {article.title}
                        </h4>

                        {/* Credibility Score */}
                        <div className="mb-2">
                          <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getCredibilityColor(article.credibilityScore)}`}>
                            {article.credibilityScore}%
                          </span>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center space-x-3 text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <ThumbsUp size={12} />
                            <span>{article.voteCount}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MessageCircle size={12} />
                            <span>{article.commentCount}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock size={12} />
                            <span>{formatTimeAgo(article.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      {/* External Link Icon */}
                      <div className="flex-shrink-0">
                        <ExternalLink size={16} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                      </div>
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
              className={`w-full text-center text-sm font-semibold py-3 px-4 rounded-xl transition-all duration-300 hover:scale-105 ${
                isDarkMode
                  ? 'text-blue-400 hover:bg-blue-900/20 border border-blue-400/20 hover:border-blue-400/40'
                  : 'text-blue-600 hover:bg-blue-50 border border-blue-200 hover:border-blue-300'
              }`}
            >
              Xem tất cả →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrendingArticles;
