import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Globe,
  Lock,
  Eye,
  Zap,
  TrendingUp,
  Users,
  Clock,
  Search,
  RefreshCw
} from 'lucide-react';
import NavigationLayout from '../components/navigation/NavigationLayout';
import { useAuth } from '../context/AuthContext';
import { cn } from '../utils/cn';

const SecurityPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [securityStats, setSecurityStats] = useState({
    threatsBlocked: 1247,
    urlsScanned: 8934,
    safeUrls: 7687,
    maliciousUrls: 1247,
    loading: false
  });

  const securityTabs = [
    { id: 'overview', label: 'Tổng quan', icon: Shield },
    { id: 'threats', label: 'Mối đe dọa', icon: AlertTriangle },
    { id: 'analysis', label: 'Phân tích', icon: Search },
    { id: 'reports', label: 'Báo cáo', icon: TrendingUp }
  ];

  const threatCategories = [
    {
      id: 'phishing',
      name: 'Lừa đảo (Phishing)',
      count: 456,
      severity: 'high',
      color: 'red',
      description: 'Các trang web giả mạo để đánh cắp thông tin'
    },
    {
      id: 'malware',
      name: 'Phần mềm độc hại',
      count: 234,
      severity: 'high',
      color: 'red',
      description: 'Trang web chứa virus hoặc malware'
    },
    {
      id: 'scam',
      name: 'Lừa đảo tài chính',
      count: 345,
      severity: 'medium',
      color: 'orange',
      description: 'Các trang web lừa đảo tiền bạc'
    },
    {
      id: 'suspicious',
      name: 'Đáng ngờ',
      count: 212,
      severity: 'low',
      color: 'yellow',
      description: 'Các trang web có dấu hiệu bất thường'
    }
  ];

  const recentThreats = [
    {
      id: 1,
      url: 'fake-bank-login.com',
      type: 'Phishing',
      severity: 'high',
      detectedAt: '2 giờ trước',
      status: 'blocked'
    },
    {
      id: 2,
      url: 'malicious-download.net',
      type: 'Malware',
      severity: 'high',
      detectedAt: '4 giờ trước',
      status: 'blocked'
    },
    {
      id: 3,
      url: 'fake-crypto-exchange.org',
      type: 'Scam',
      severity: 'medium',
      detectedAt: '6 giờ trước',
      status: 'blocked'
    }
  ];

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-100 dark:bg-red-900/30';
      case 'medium': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30';
      case 'low': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30';
    }
  };

  return (
    <NavigationLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Shield className="w-6 h-6 text-red-600" />
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    Bảo mật
                  </h1>
                </div>

                {/* Tabs */}
                <div className="hidden md:flex space-x-1 ml-8">
                  {securityTabs.map((tab) => (
                    <motion.button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center space-x-2',
                        activeTab === tab.id
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                          : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                      )}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <tab.icon size={16} />
                      <span>{tab.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <motion.button
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <RefreshCw size={16} />
                  <span>Cập nhật</span>
                </motion.button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Mối đe dọa chặn
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {securityStats.threatsBlocked.toLocaleString()}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                      <Shield className="w-6 h-6 text-red-600" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-green-600">+12%</span>
                    <span className="text-gray-500 ml-1">so với tháng trước</span>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        URL đã quét
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {securityStats.urlsScanned.toLocaleString()}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <Globe className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-green-600">+8%</span>
                    <span className="text-gray-500 ml-1">so với tuần trước</span>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        URL an toàn
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {securityStats.safeUrls.toLocaleString()}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm">
                    <span className="text-green-600">86%</span>
                    <span className="text-gray-500 ml-1">tỷ lệ an toàn</span>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        URL độc hại
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {securityStats.maliciousUrls.toLocaleString()}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                      <XCircle className="w-6 h-6 text-red-600" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm">
                    <span className="text-red-600">14%</span>
                    <span className="text-gray-500 ml-1">tỷ lệ nguy hiểm</span>
                  </div>
                </motion.div>
              </div>

              {/* Threat Categories */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                >
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Loại mối đe dọa
                  </h3>
                  <div className="space-y-4">
                    {threatCategories.map((category) => (
                      <div key={category.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                        <div className="flex items-center space-x-3">
                          <div className={cn(
                            'w-3 h-3 rounded-full',
                            category.color === 'red' && 'bg-red-500',
                            category.color === 'orange' && 'bg-orange-500',
                            category.color === 'yellow' && 'bg-yellow-500'
                          )} />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {category.name}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {category.description}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {category.count}
                          </p>
                          <span className={cn(
                            'text-xs px-2 py-1 rounded-full',
                            getSeverityColor(category.severity)
                          )}>
                            {category.severity === 'high' ? 'Cao' :
                             category.severity === 'medium' ? 'Trung bình' : 'Thấp'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                >
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Mối đe dọa gần đây
                  </h3>
                  <div className="space-y-4">
                    {recentThreats.map((threat) => (
                      <div key={threat.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-red-500 rounded-full" />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white text-sm">
                              {threat.url}
                            </p>
                            <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                              <span>{threat.type}</span>
                              <span>•</span>
                              <span>{threat.detectedAt}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={cn(
                            'text-xs px-2 py-1 rounded-full',
                            getSeverityColor(threat.severity)
                          )}>
                            {threat.severity === 'high' ? 'Cao' : 'Trung bình'}
                          </span>
                          <XCircle className="w-4 h-4 text-red-500" />
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>
          )}

          {activeTab === 'threats' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Chi tiết mối đe dọa
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Tính năng phân tích chi tiết mối đe dọa đang được phát triển...
              </p>
            </div>
          )}

          {activeTab === 'analysis' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Công cụ phân tích
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Công cụ phân tích bảo mật nâng cao đang được phát triển...
              </p>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Báo cáo bảo mật
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Hệ thống báo cáo bảo mật chi tiết đang được phát triển...
              </p>
            </div>
          )}
        </div>
      </div>
    </NavigationLayout>
  );
};

export default SecurityPage;
