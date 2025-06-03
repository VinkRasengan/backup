import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, BarChart3, Clock, TrendingUp } from 'lucide-react';
import EmailVerificationBanner from '../components/EmailVerificationBanner';

// Helper function to get credibility score styling
const getCredibilityScoreClasses = (score) => {
  if (score >= 80) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
  if (score >= 60) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
  if (score >= 40) return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
  return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
};

const DashboardPage = () => {
  const [showVerificationBanner, setShowVerificationBanner] = useState(true);

  // Mock data for demo purposes
  const dashboardData = {
    data: {
      user: {
        firstName: 'Demo User'
      },
      stats: {
        totalLinksChecked: 15,
        linksThisWeek: 3,
        averageCredibilityScore: 78
      },
      recentLinks: [
        {
          id: '1',
          url: 'https://example.com/news1',
          metadata: {
            title: 'Sample News Article 1',
            domain: 'example.com'
          },
          credibilityScore: 85,
          checkedAt: new Date().toISOString()
        },
        {
          id: '2',
          url: 'https://example.com/news2',
          metadata: {
            title: 'Sample News Article 2',
            domain: 'example.com'
          },
          credibilityScore: 72,
          checkedAt: new Date(Date.now() - 86400000).toISOString()
        }
      ]
    }
  };

  const { user, stats, recentLinks } = dashboardData?.data || {};

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      {showVerificationBanner && (
        <EmailVerificationBanner
          onDismiss={() => setShowVerificationBanner(false)}
        />
      )}

      {/* Dashboard Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Chào mừng trở lại, {user?.firstName}!
        </h1>
        <p className="text-gray-600 dark:text-gray-300 text-lg">
          Tổng quan hoạt động kiểm tra thông tin của bạn
        </p>
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
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Kiểm Tra Link Gần Đây
            </h2>
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
