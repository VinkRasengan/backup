import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Shield, Globe, Clock } from 'lucide-react';

const ThreatAlertWidget = ({ maxAlerts = 5 }) => {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    // Mock threat alerts
    const mockAlerts = [
      {
        id: 1,
        type: 'phishing',
        title: 'Email lừa đảo từ "Ngân hàng VCB"',
        description: 'Phát hiện email giả mạo yêu cầu cập nhật thông tin tài khoản',
        severity: 'high',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        url: 'vcb-security-update.fake-site.com'
      },
      {
        id: 2,
        type: 'malware',
        title: 'Website chứa mã độc',
        description: 'Trang web download-free-software.com chứa trojan',
        severity: 'critical',
        timestamp: new Date(Date.now() - 45 * 60 * 1000),
        url: 'download-free-software.com'
      },
      {
        id: 3,
        type: 'scam',
        title: 'Lừa đảo trúng thưởng',
        description: 'Tin nhắn SMS thông báo trúng thưởng 500 triệu',
        severity: 'medium',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        url: 'sms://+84901234567'
      },
      {
        id: 4,
        type: 'fake-news',
        title: 'Tin tức giả về COVID-19',
        description: 'Bài viết lan truyền thông tin sai về vaccine',
        severity: 'medium',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
        url: 'fake-health-news.com'
      }
    ];

    setAlerts(mockAlerts.slice(0, maxAlerts));
  }, [maxAlerts]);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      case 'high': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'low': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'phishing': return <AlertTriangle className="w-4 h-4" />;
      case 'malware': return <Shield className="w-4 h-4" />;
      case 'scam': return <AlertTriangle className="w-4 h-4" />;
      case 'fake-news': return <Globe className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (hours > 0) return `${hours} giờ trước`;
    return `${minutes} phút trước`;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Cảnh báo mối đe dọa
        </h3>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-gray-500 dark:text-gray-400">Live</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3">
        <AnimatePresence>
          {alerts.map((alert, index) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-700 rounded-lg p-3 border-l-4 border-l-red-500 shadow-sm"
            >
              <div className="flex items-start space-x-3">
                <div className={`p-1.5 rounded-full ${getSeverityColor(alert.severity)}`}>
                  {getTypeIcon(alert.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {alert.title}
                    </h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${getSeverityColor(alert.severity)}`}>
                      {alert.severity}
                    </span>
                  </div>
                  
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    {alert.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-500 truncate">
                      {alert.url}
                    </span>
                    <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{formatTime(alert.timestamp)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {alerts.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-center">
          <div>
            <Shield className="w-12 h-12 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Không có mối đe dọa nào được phát hiện
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThreatAlertWidget;
