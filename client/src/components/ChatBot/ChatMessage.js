import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, User } from 'lucide-react';

const ChatMessage = ({ message }) => {
  const { text, isBot, timestamp } = message;

  const formatTime = (date) => {
    return new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex items-start gap-3 ${isBot ? '' : 'flex-row-reverse'}`}
    >
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        isBot 
          ? 'bg-gradient-to-r from-blue-500 to-purple-600' 
          : 'bg-gray-300 dark:bg-gray-600'
      }`}>
        {isBot ? (
          <MessageCircle size={16} className="text-white" />
        ) : (
          <User size={16} className="text-gray-600 dark:text-gray-300" />
        )}
      </div>

      {/* Message Bubble */}
      <div className={`max-w-xs ${isBot ? '' : 'text-right'}`}>
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className={`rounded-2xl px-4 py-3 ${
            isBot
              ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
              : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
          }`}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{text}</p>
        </motion.div>
        
        {/* Timestamp */}
        <p className={`text-xs text-gray-500 dark:text-gray-400 mt-1 ${
          isBot ? 'text-left' : 'text-right'
        }`}>
          {formatTime(timestamp)}
        </p>
      </div>
    </motion.div>
  );
};

export default ChatMessage;
