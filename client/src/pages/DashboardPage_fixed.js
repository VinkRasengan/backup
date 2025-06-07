import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, BarChart3, Clock, TrendingUp, RefreshCw } from 'lucide-react';
import EmailVerificationBanner from '../components/EmailVerificationBanner';
import { useAuth } from '../context/AuthContext';

// Helper function to get credibility score styling
const getCredibilityScoreClasses = (score) => {
  if (score >= 80) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
  if (score >= 60) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
  if (score >= 40) return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
  return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
};

const DashboardPage = () => {
  const { user: authUser } = useAuth();
  const location = useLocation();
  const [showVerificationBanner, setShowVerificationBanner] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch real dashboard data
  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Add cache-busting parameter to ensure fresh data
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/users/dashboard?_t=${timestamp}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          // Disable caching
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setDashboardData(data);
      
      if (isRefresh) {
        console.log('✅ Dashboard data refreshed successfully');
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error);

      // Fallback to basic user data if API fails
      setDashboardData({
        data: {
          user: {
            firstName: authUser?.firstName || 'User',
            lastName: authUser?.lastName || '',
            email: authUser?.email || ''
          },
          stats: {
            totalLinksChecked: 0,
            linksThisWeek: 0,
            averageCredibilityScore: 0
          },
          recentLinks: []
        }
      });

      console.warn('Dashboard API failed, using fallback data:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [authUser]);

  // Manual refresh function
  const handleManualRefresh = () => {
    fetchDashboardData(true);
  };

  // Fetch real dashboard data on mount
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Auto-refresh when navigating to dashboard (e.g., after checking a link)
  useEffect(() => {
    // Check if user came from CheckLinkPage or if there's a refresh flag
    const shouldRefresh = location.state?.refreshDashboard || 
                         document.referrer.includes('/check');
    
    if (shouldRefresh && dashboardData) {
      console.log('🔄 Auto-refreshing dashboard data...');
      fetchDashboardData();
    }
  }, [location, dashboardData, fetchDashboardData]);

  const { user, stats, recentLinks } = dashboardData?.data || {};

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      {showVerificationBanner && (
        <EmailVerificationBanner
          onDismiss={() => setShowVerificationBanner(false)}
        />
      )}

      {/* Dashboard Header with Refresh Button */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Chào mừng trở lại, {user?.firstName}!
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Tổng quan hoạt động kiểm tra thông tin của bạn
          </p>
        </div>
        <button
          onClick={handleManualRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw 
            size={16} 
            className={refreshing ? 'animate-spin' : ''} 
          />
          {refreshing ? 'Đang tải...' : 'Làm mới'}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Search size={24} />
          </div>
          <div className="flex-1">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats?.totalLinksChecked || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Tổng Link Đã Kiểm Tra
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center text-yellow-600 dark:text-yellow-400">
            <Clock size={24} />
          </div>
          <div className="flex-1">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats?.linksThisWeek || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Tuần Này
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center text-green-600 dark:text-green-400">
            <TrendingUp size={24} />
          </div>
          <div className="flex-1">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats?.averageCredibilityScore || 0}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Điểm Tin Cậy Trung Bình
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Links Card */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Kiểm Tra Link Gần Đây
            </h2>
            {refreshing && (
              <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <RefreshCw size={14} className="animate-spin" />
                Đang cập nhật...
              </div>
            )}
          </div>
          <div className="p-6">
            {recentLinks && recentLinks.length > 0 ? (
              <div className="space-y-4">
                {recentLinks.map((link) => (
                  <div key={link.id} className="flex justify-between items-center py-4 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white mb-1 break-all">
                        {link.metadata?.title || link.url}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-4">
                        <span>{new Date(link.checkedAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{link.metadata?.domain}</span>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getCredibilityScoreClasses(link.credibilityScore)}`}>
                      {link.credibilityScore}%
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                <p className="mb-4">Chưa có link nào được kiểm tra.</p>
                <Link
                  to="/check"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Kiểm Tra Link Đầu Tiên
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Thao Tác Nhanh
          </h2>

          <div className="space-y-4">
            <Link
              to="/check"
              className="flex items-center gap-3 p-4 border-2 border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all group"
            >
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors">
                <Search size={20} />
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white mb-1">
                  Kiểm Tra Link Mới
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Xác minh bài viết tin tức hoặc nguồn thông tin
                </div>
              </div>
            </Link>

            <Link
              to="/profile"
              className="flex items-center gap-3 p-4 border-2 border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all group"
            >
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors">
                <BarChart3 size={20} />
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white mb-1">
                  Xem Hồ Sơ
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Cập nhật cài đặt tài khoản
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
