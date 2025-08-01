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
      className={`flex items-start gap-2.5 mb-4 ${isBot ? '' : 'flex-row-reverse'}`}
    >
      {/* Avatar */}
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
        isBot
          ? 'bg-gradient-to-r from-blue-500 to-purple-600'
          : 'bg-gradient-to-r from-gray-400 to-gray-500 dark:from-gray-500 dark:to-gray-600'
      }`}>
        {isBot ? (
          <MessageCircle size={14} className="text-white" />
        ) : (
          <User size={14} className="text-white" />
        )}
      </div>

      {/* Message Bubble - Enhanced with better word wrapping */}
      <div className={`max-w-[85%] min-w-0 ${isBot ? '' : 'text-right'}`}>
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className={`rounded-2xl px-4 py-3 shadow-sm relative ${
            isBot
              ? 'bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600 rounded-bl-md'
              : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-br-md'
          }`}
          style={{
            // Enhanced word wrapping like Messenger
            wordWrap: 'break-word',
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            hyphens: 'auto',
            whiteSpace: 'pre-wrap'
          }}
        >
          <p 
            className="text-sm leading-relaxed m-0"
            style={{
              // Ensure text flows naturally without forcing line breaks
              wordSpacing: 'normal',
              letterSpacing: 'normal',
              lineHeight: '1.5'
            }}
          >
            {text}
          </p>
        </motion.div>

        {/* Timestamp */}
        <p className={`text-xs text-gray-500 dark:text-gray-400 mt-1.5 px-1 ${
          isBot ? 'text-left' : 'text-right'
        }`}>
          {formatTime(timestamp)}
        </p>
      </div>
    </motion.div>
  );
};

export default ChatMessage;
