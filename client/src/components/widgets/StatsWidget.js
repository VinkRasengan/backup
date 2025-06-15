import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Eye } from 'lucide-react';

const StatsWidget = ({ title = "Thống kê hôm nay" }) => {
  const [stats, setStats] = useState({
    checked: 0,
    threats: 0,
    safe: 0,
    views: 0
  });

  useEffect(() => {
    // Simulate loading stats
    const interval = setInterval(() => {
      setStats({
        checked: Math.floor(Math.random() * 1000) + 500,
        threats: Math.floor(Math.random() * 50) + 10,
        safe: Math.floor(Math.random() * 800) + 400,
        views: Math.floor(Math.random() * 5000) + 2000
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {title}
      </h3>
      
      <div className="grid grid-cols-2 gap-4 h-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Đã kiểm tra</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats.checked.toLocaleString()}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Mối đe dọa</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {stats.threats.toLocaleString()}
              </p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">An toàn</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.safe.toLocaleString()}
              </p>
            </div>
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">✓</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Lượt xem</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {stats.views.toLocaleString()}
              </p>
            </div>
            <Eye className="w-8 h-8 text-purple-500" />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default StatsWidget;
