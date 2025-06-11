import React from 'react';
import { motion } from 'framer-motion';

const QuickReplies = ({ onQuickReply, disabled = false }) => {
  const quickReplies = [
    {
      id: 1,
      text: 'Cách kiểm tra link an toàn?',
      icon: '🔍'
    },
    {
      id: 2,
      text: 'Phân tích bảo mật website',
      icon: '🛡️'
    },
    {
      id: 3,
      text: 'Cách nhận biết lừa đảo',
      icon: '⚠️'
    },
    {
      id: 4,
      text: 'Tính năng FactCheck AI',
      icon: '🤖'
    },
    {
      id: 5,
      text: 'Hướng dẫn sử dụng',
      icon: '📖'
    },
    {
      id: 6,
      text: 'Báo cáo link độc hại',
      icon: '🚨'
    }
  ];

  return (
    <div className="bg-gray-50/50 dark:bg-gray-800/50">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 font-medium px-1">Câu hỏi thường gặp:</p>
      <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
        {quickReplies.map((reply) => (
          <motion.button
            key={reply.id}
            whileHover={{ scale: disabled ? 1 : 1.02 }}
            whileTap={{ scale: disabled ? 1 : 0.98 }}
            onClick={() => !disabled && onQuickReply(reply.text)}
            disabled={disabled}
            className="flex items-center gap-2 p-3 text-xs bg-white dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-gray-600 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-left border border-gray-200 dark:border-gray-600 hover:border-blue-200 dark:hover:border-gray-500 shadow-sm hover:shadow-md"
          >
            <span className="text-sm flex-shrink-0">{reply.icon}</span>
            <span className="text-gray-700 dark:text-gray-300 truncate font-medium text-xs leading-tight">{reply.text}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default QuickReplies;
