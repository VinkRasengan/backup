import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile, Paperclip } from 'lucide-react';
import { motion } from 'framer-motion';

const ChatInput = ({ onSendMessage, disabled = false }) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef(null);

  // Auto-resize textarea like Messenger
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to auto to get correct scrollHeight
      textarea.style.height = 'auto';
      
      // Calculate new height based on content (max 120px like Messenger)
      const newHeight = Math.min(textarea.scrollHeight, 120);
      textarea.style.height = `${newHeight}px`;
    }
  }, [message]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="flex items-end gap-2 p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Attachment Button */}
      <button
        type="button"
        className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors flex-shrink-0"
        title="Đính kèm file"
        aria-label="Đính kèm file"
      >
        <Paperclip size={18} />
      </button>

      {/* Auto-resizing Textarea */}
      <textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyPress}
        placeholder="Nhập tin nhắn..."
        disabled={disabled}
        className="flex-1 min-h-[40px] max-h-[120px] px-3 py-2 text-sm bg-transparent border-0 outline-none resize-none placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-gray-100"
        aria-label="Nhập tin nhắn của bạn"
        style={{
          lineHeight: '1.5',
          fontFamily: 'inherit',
          wordWrap: 'break-word',
          overflowWrap: 'break-word'
        }}
        rows={1}
      />

      {/* Emoji Button */}
      <button
        type="button"
        className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors flex-shrink-0"
        title="Emoji"
        aria-label="Chọn emoji"
      >
        <Smile size={18} />
      </button>

      {/* Send Button */}
      <motion.button
        type="submit"
        disabled={!message.trim() || disabled}
        className={`p-2 rounded-lg transition-all duration-200 flex-shrink-0 ${
          message.trim() && !disabled
            ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-sm hover:shadow-md'
            : 'bg-gray-200 dark:bg-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed'
        }`}
        whileHover={message.trim() && !disabled ? { scale: 1.05 } : {}}
        whileTap={message.trim() && !disabled ? { scale: 0.95 } : {}}
        title="Gửi tin nhắn"
        aria-label="Gửi tin nhắn"
      >
        <Send size={16} />
      </motion.button>
    </motion.form>
  );
};

export default ChatInput;
