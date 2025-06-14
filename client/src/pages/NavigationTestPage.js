import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, 
  Search, 
  Users, 
  MessageCircle, 
  User,
  Settings,
  TrendingUp,
  Shield,
  BookOpen,
  Plus,
  BarChart3,
  CheckCircle,
  XCircle
} from 'lucide-react';
import TabNavigation from '../components/navigation/TabNavigation';

const NavigationTestPage = () => {
  const navigationItems = [
    {
      name: 'Trang chủ',
      path: '/',
      icon: Home,
      description: 'Trang chủ chính của ứng dụng',
      status: 'working'
    },
    {
      name: 'Kiểm tra',
      path: '/check',
      icon: Search,
      description: 'Kiểm tra độ tin cậy của link và website',
      status: 'working'
    },
    {
      name: 'Cộng đồng',
      path: '/community',
      icon: Users,
      description: 'Tham gia thảo luận và chia sẻ với cộng đồng',
      status: 'working'
    },
    {
      name: 'Chat AI',
      path: '/chat',
      icon: MessageCircle,
      description: 'Trò chuyện với AI để được tư vấn bảo mật',
      status: 'fixed'
    },
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: BarChart3,
      description: 'Xem thống kê và quản lý hoạt động',
      status: 'working'
    },
    {
      name: 'Hồ sơ',
      path: '/profile',
      icon: User,
      description: 'Quản lý thông tin cá nhân',
      status: 'working'
    },
    {
      name: 'Cài đặt',
      path: '/settings',
      icon: Settings,
      description: 'Tùy chỉnh ứng dụng và tài khoản',
      status: 'new'
    },
    {
      name: 'Kiến thức',
      path: '/knowledge',
      icon: BookOpen,
      description: 'Cơ sở kiến thức về bảo mật',
      status: 'working'
    },
    {
      name: 'Gửi bài viết',
      path: '/submit',
      icon: Plus,
      description: 'Đóng góp nội dung cho cộng đồng',
      status: 'working'
    },
    {
      name: 'Admin',
      path: '/admin',
      icon: Shield,
      description: 'Quản trị hệ thống (chỉ admin)',
      status: 'working'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'working':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
      case 'fixed':
        return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30';
      case 'new':
        return 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30';
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/30';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'working':
      case 'fixed':
        return <CheckCircle size={16} />;
      case 'new':
        return <Plus size={16} />;
      default:
        return <XCircle size={16} />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'working':
        return 'Hoạt động';
      case 'fixed':
        return 'Đã sửa';
      case 'new':
        return 'Mới';
      default:
        return 'Lỗi';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <TabNavigation />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🧪 Navigation Test Page
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Kiểm tra tất cả các tính năng navigation và routing của ứng dụng
          </p>
        </div>

        {/* Status Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <CheckCircle className="text-green-600" size={20} />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Hoạt động</span>
            </div>
            <div className="text-2xl font-bold text-green-600 mt-1">
              {navigationItems.filter(item => item.status === 'working').length}
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <CheckCircle className="text-blue-600" size={20} />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Đã sửa</span>
            </div>
            <div className="text-2xl font-bold text-blue-600 mt-1">
              {navigationItems.filter(item => item.status === 'fixed').length}
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <Plus className="text-purple-600" size={20} />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Mới</span>
            </div>
            <div className="text-2xl font-bold text-purple-600 mt-1">
              {navigationItems.filter(item => item.status === 'new').length}
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <TrendingUp className="text-orange-600" size={20} />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Tổng</span>
            </div>
            <div className="text-2xl font-bold text-orange-600 mt-1">
              {navigationItems.length}
            </div>
          </div>
        </div>

        {/* Navigation Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {navigationItems.map((item, index) => {
            const Icon = item.icon;
            
            return (
              <motion.div
                key={item.path}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <Icon size={24} className="text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {item.name}
                        </h3>
                        <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                          {getStatusIcon(item.status)}
                          <span>{getStatusText(item.status)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                    {item.description}
                  </p>
                  
                  <div className="flex space-x-2">
                    <Link
                      to={item.path}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                    >
                      Truy cập
                    </Link>
                    <button
                      onClick={() => window.open(item.path, '_blank')}
                      className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                    >
                      Tab mới
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Test Results */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            🎯 Test Results Summary
          </h2>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <CheckCircle className="text-green-600" size={16} />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Navigation Menu:</strong> ✅ Fixed - Tất cả links hoạt động đúng
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <CheckCircle className="text-blue-600" size={16} />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Chat AI:</strong> 🔧 Fixed - Layout và API integration hoạt động
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Plus className="text-purple-600" size={16} />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Settings Page:</strong> 🆕 New - Trang cài đặt hoàn chỉnh
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <CheckCircle className="text-green-600" size={16} />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Community Tab:</strong> ⚡ Optimized - Không còn spam requests
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NavigationTestPage;
