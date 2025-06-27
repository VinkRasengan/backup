import React from 'react';
import { motion } from 'framer-motion';

const QuickReplies = ({ onQuickReply, disabled = false }) => {
  const quickReplies = [
    "Cách kiểm tra link an toàn?",
    "Nhận biết email lừa đảo",
    "Tips bảo mật mật khẩu",
    "Sử dụng FactCheck platform",
    "Phân biệt tin thật và fake news"
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-wrap gap-2"
    >
      <div className="w-full text-xs text-gray-500 dark:text-gray-400 mb-2">
        Gợi ý câu hỏi:
      </div>
      {quickReplies.map((reply, index) => (
        <motion.button
          key={index}
          onClick={() => onQuickReply(reply)}
          disabled={disabled}
          whileHover={{ scale: disabled ? 1 : 1.02 }}
          whileTap={{ scale: disabled ? 1 : 0.98 }}
          className="px-3 py-1.5 text-sm bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {reply}
        </motion.button>
      ))}
    </motion.div>
  );
};

export default QuickReplies;
