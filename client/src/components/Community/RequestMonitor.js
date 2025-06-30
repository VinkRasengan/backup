import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Database, Clock, AlertCircle, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

/**
 * RequestMonitor - Component để monitor API requests và cache status
 * Giúp debug và tối ưu hóa performance
 */
const RequestMonitor = ({ dataManager, isVisible, onClose }) => {
  const { isDarkMode } = useTheme();
  const [stats, setStats] = useState({
    cacheSize: 0,
    activeRequests: 0,
    prefetchQueue: 0,
    cacheHitRate: 0
  });
  const [requestHistory, setRequestHistory] = useState([]);

  useEffect(() => {
    if (!isVisible || !dataManager) return;

    const updateStats = () => {
      const cacheStats = dataManager.getCacheStats();
      setStats({
        cacheSize: cacheStats.size,
        activeRequests: dataManager.activeRequests?.size || 0,
        prefetchQueue: cacheStats.prefetchQueue?.length || 0,
        cacheHitRate: calculateCacheHitRate()
      });
    };

    const calculateCacheHitRate = () => {
      // Simple cache hit rate calculation
      const totalRequests = requestHistory.length;
      const cacheHits = requestHistory.filter(req => req.fromCache).length;
      return totalRequests > 0 ? Math.round((cacheHits / totalRequests) * 100) : 0;
    };

    // Update stats every second
    const interval = setInterval(updateStats, 1000);
    updateStats(); // Initial update

    return () => clearInterval(interval);
  }, [isVisible, dataManager, requestHistory]);

  // Mock request history for demo
  useEffect(() => {
    if (isVisible) {
      setRequestHistory([
        { id: 1, url: '/api/community?page=1', time: Date.now() - 5000, fromCache: false },
        { id: 2, url: '/api/community?page=1', time: Date.now() - 3000, fromCache: true },
        { id: 3, url: '/api/community?page=2', time: Date.now() - 1000, fromCache: false },
      ]);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className={`fixed top-4 right-4 z-50 w-80 ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        } border rounded-lg shadow-lg`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-blue-500" />
            <h3 className={`font-semibold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Request Monitor
            </h3>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stats */}
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className={`p-3 rounded-lg ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
            }`}>
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4 text-green-500" />
                <span className={`text-sm ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Cache
                </span>
              </div>
              <p className={`text-lg font-semibold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {stats.cacheSize}
              </p>
            </div>

            <div className={`p-3 rounded-lg ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
            }`}>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-orange-500" />
                <span className={`text-sm ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Active
                </span>
              </div>
              <p className={`text-lg font-semibold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {stats.activeRequests}
              </p>
            </div>
          </div>

          <div className={`p-3 rounded-lg ${
            isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-sm ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Cache Hit Rate
              </span>
              <span className={`text-lg font-semibold ${
                stats.cacheHitRate > 70 ? 'text-green-500' : 
                stats.cacheHitRate > 40 ? 'text-orange-500' : 'text-red-500'
              }`}>
                {stats.cacheHitRate}%
              </span>
            </div>
          </div>

          {/* Recent Requests */}
          <div>
            <h4 className={`text-sm font-medium mb-2 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Recent Requests
            </h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {requestHistory.slice(-5).reverse().map((req) => (
                <div
                  key={req.id}
                  className={`flex items-center justify-between p-2 rounded text-xs ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                  }`}
                >
                  <span className={`truncate flex-1 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {req.url}
                  </span>
                  <span className={`ml-2 px-2 py-1 rounded ${
                    req.fromCache 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  }`}>
                    {req.fromCache ? 'Cache' : 'API'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Tips */}
          <div className={`p-3 rounded-lg border ${
            isDarkMode 
              ? 'bg-blue-900/20 border-blue-700 text-blue-200' 
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}>
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div className="text-xs">
                <p className="font-medium mb-1">Optimizations Applied:</p>
                <ul className="space-y-1">
                  <li>• Auto-refresh disabled</li>
                  <li>• Prefetch disabled</li>
                  <li>• 60min cache timeout</li>
                  <li>• 1s debounce delay</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default RequestMonitor;
