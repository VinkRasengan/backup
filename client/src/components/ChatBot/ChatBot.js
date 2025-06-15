import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Minimize2, Plus } from 'lucide-react';
import PropTypes from 'prop-types';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import QuickReplies from './QuickReplies';
import { chatAPI } from '../../services/api';

const ChatBot = ({ embedded = false, onClose, isFloating = false }) => {
  console.log('🔄 [INIT] ChatBot component initialized - NEW VERSION', { embedded, isFloating });
  const [isOpen, setIsOpen] = useState(embedded);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: 'Xin chào! Tôi là trợ lý ảo của FactCheck. Tôi có thể giúp bạn hiểu về cách sử dụng nền tảng kiểm tra thông tin của chúng tôi. Bạn cần hỗ trợ gì?',
      isBot: true,
      timestamp: new Date()
    }
  ]);

  // Giới hạn số lượng messages hiển thị như Messenger (tối đa 20 tin nhắn)
  const MAX_MESSAGES = 20;
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Debug: Log messages state changes
  useEffect(() => {
    console.log('🔄 Messages state updated:', messages);
  }, [messages]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Memoized message processing
  const displayMessages = useMemo(() => {
    return messages.slice(-MAX_MESSAGES);
  }, [messages]);

  const handleSendMessage = useCallback(async (text) => {
    console.log('🚀 [HANDLER] handleSendMessage called with:', text);
    if (!text.trim()) return;

    // Hide quick replies after first user message
    setShowQuickReplies(false);

    // Add user message
    const userMessage = {
      id: Date.now(),
      text: text.trim(),
      isBot: false,
      timestamp: new Date()
    };

    console.log('📝 Adding user message:', userMessage);
    setMessages(prev => {
      const newMessages = [...prev, userMessage];
      console.log('📝 Updated messages with user message:', newMessages);
      return newMessages;
    });
    
    setIsTyping(true);

    // Simulate typing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      // Send message to Gemini API using chatAPI
      console.log('📤 Sending to Gemini chat:', text.trim());
      const response = await chatAPI.sendGeminiMessage(text.trim());

      console.log('✅ Gemini Response:', response);
      
      // Handle different response structures
      let responseContent;
      if (response.data?.response?.content) {
        responseContent = response.data.response.content;
      } else if (response.data?.data?.response?.content) {
        responseContent = response.data.data.response.content;
      } else if (response.data?.message) {
        responseContent = response.data.message;
      } else if (response.data?.content) {
        responseContent = response.data.content;
      } else if (response.data?.response) {
        responseContent = response.data.response;
      } else {
        // Fallback response
        responseContent = 'Cảm ơn bạn đã liên hệ! Hiện tại tôi đang xử lý yêu cầu của bạn.';
      }

      const botMessage = {
        id: Date.now() + 1,
        text: responseContent,
        isBot: true,
        timestamp: new Date()
      };

      console.log('✅ Bot message created:', botMessage);
      setMessages(prev => {
        const newMessages = [...prev, botMessage];
        console.log('✅ Messages updated with bot response:', newMessages);
        return newMessages;
      });
      
    } catch (error) {
      console.error('❌ API Error:', error);
      
      // Show more user-friendly error message
      const errorMessage = {
        id: Date.now() + 1,
        text: 'Xin lỗi, hiện tại tôi gặp sự cố kỹ thuật. Bạn có thể thử lại sau vài phút hoặc liên hệ với bộ phận hỗ trợ qua email support@factcheck.vn',
        isBot: true,
        timestamp: new Date()
      };

      console.log('❌ Adding error message:', errorMessage);
      setMessages(prev => {
        const newMessages = [...prev, errorMessage];
        console.log('❌ Messages updated with error:', newMessages);
        return newMessages;
      });
    } finally {
      setIsTyping(false);
    }
  }, []);

  const toggleChat = useCallback(() => {
    if (isFloating && onClose && isOpen) {
      onClose();
    } else {
      setIsOpen(!isOpen);
      setIsMinimized(false);
    }
  }, [isFloating, onClose, isOpen]);

  const minimizeChat = useCallback(() => {
    setIsMinimized(true);
  }, []);

  const maximizeChat = useCallback(() => {
    setIsMinimized(false);
  }, []);

  const handleQuickReply = useCallback((text) => {
    setShowQuickReplies(false); // Ẩn quick replies sau khi click
    handleSendMessage(text);
  }, [handleSendMessage]);

  // Create new chat conversation
  const handleNewChat = useCallback(() => {
    console.log('🆕 Creating new chat conversation');
    setMessages([
      {
        id: 1,
        text: 'Xin chào! Tôi là trợ lý ảo của FactCheck. Tôi có thể giúp bạn hiểu về cách sử dụng nền tảng kiểm tra thông tin của chúng tôi. Bạn cần hỗ trợ gì?',
        isBot: true,
        timestamp: new Date()
      }
    ]);
    setShowQuickReplies(true);
  }, []);

  // Calculate chat window classes - Better positioning and z-index
  const getChatWindowClasses = useCallback(() => {
    if (isMinimized) {
      return 'bottom-4 left-4 w-64 h-14 cursor-pointer';
    }

    // Improved responsive sizing with better positioning
    if (window.innerWidth < 640) { // Mobile
      return 'bottom-4 left-4 right-4 h-[450px] max-h-[70vh]';
    } else if (window.innerWidth < 1024) { // Tablet
      return 'bottom-4 left-4 w-80 h-[480px] max-h-[75vh]';
    } else { // Desktop
      return 'bottom-4 left-4 w-[380px] h-[520px] max-h-[80vh]';
    }
  }, [isMinimized]);

  // Embedded mode renders only the chat content
  if (embedded) {
    return (
      <div className="h-full flex flex-col bg-white dark:bg-gray-800 chat-container">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-3 flex items-center justify-between hardware-accelerated">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <MessageCircle size={16} />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Trợ lý FactCheck</h3>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <p className="text-xs opacity-90">Đang hoạt động</p>
              </div>
            </div>
          </div>

          {/* New Chat Button for embedded mode */}
          <button
            onClick={handleNewChat}
            className="p-1 hover:bg-white/20 rounded-full smooth-transition focus-optimized"
            title="Cuộc trò chuyện mới"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-optimized">
          {displayMessages.map((message) => (
            <div key={message.id} className="chat-message">
              <ChatMessage message={message} />
            </div>
          ))}

          {isTyping && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                <MessageCircle size={16} className="text-white" />
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-3 max-w-xs">
                <div className="flex space-x-1">
                  <motion.div
                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 1.2, delay: 0 }}
                    className="w-2 h-2 bg-blue-500 rounded-full"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 1.2, delay: 0.3 }}
                    className="w-2 h-2 bg-blue-500 rounded-full"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 1.2, delay: 0.6 }}
                    className="w-2 h-2 bg-blue-500 rounded-full"
                  />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Replies */}
        {showQuickReplies && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <QuickReplies onQuickReply={handleQuickReply} disabled={isTyping} />
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50/50 dark:bg-gray-800/50">
          <ChatInput onSendMessage={handleSendMessage} disabled={isTyping} />
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleChat}
            className="fixed bottom-4 left-4 z-chatbot w-14 h-14 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-full shadow-lg hover:shadow-xl smooth-transition flex items-center justify-center group gpu-optimized focus-optimized"
          >
            <MessageCircle size={24} className="group-hover:scale-110 smooth-transform" />

            {/* Notification dot */}
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center"
            >
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </motion.div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              x: 0
            }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={`fixed z-chatbot bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden ${getChatWindowClasses()}`}
            onClick={isMinimized ? maximizeChat : undefined}
            style={{ cursor: isMinimized ? 'pointer' : 'default' }}
          >
            {/* Header - luôn hiển thị ở trên cùng */}
            <div className={`bg-gradient-to-r from-blue-500 to-purple-600 text-white flex items-center justify-between flex-shrink-0 relative z-20 ${
              isMinimized ? 'p-3 rounded-2xl h-full' : 'p-3 rounded-t-2xl'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <MessageCircle size={16} />
                </div>
                {!isMinimized && (
                  <div>
                    <h3 className="font-semibold text-sm">Trợ lý FactCheck</h3>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <p className="text-xs opacity-90">Đang hoạt động</p>
                    </div>
                  </div>
                )}
                {isMinimized && (
                  <div className="text-xs font-medium">Chat</div>
                )}
              </div>

              {!isMinimized && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleNewChat}
                    className="p-1 hover:bg-white/20 rounded-full transition-colors"
                    title="Cuộc trò chuyện mới"
                  >
                    <Plus size={16} />
                  </button>
                  <button
                    onClick={minimizeChat}
                    className="p-1 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <Minimize2 size={16} />
                  </button>
                  <button
                    onClick={toggleChat}
                    className="p-1 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* Content - chỉ hiển thị khi không minimize */}
            {!isMinimized && (
              <div className="flex flex-col flex-1 min-h-0">
                {/* Messages Area - Messenger-like with limited history */}
                <div
                  className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent min-h-0"
                  style={{
                    maxHeight: showQuickReplies ? '280px' : '360px',
                    minHeight: '200px'
                  }}
                >
                  {/* Hiển thị tối đa 20 tin nhắn gần nhất */}
                  {displayMessages.map((message) => (
                    <ChatMessage key={message.id} message={message} />
                  ))}

                  {/* Hiển thị thông báo nếu có nhiều tin nhắn hơn */}
                  {messages.length > MAX_MESSAGES && (
                    <div className="text-center py-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                        Hiển thị {MAX_MESSAGES} tin nhắn gần nhất
                      </span>
                    </div>
                  )}

                  {isTyping && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <MessageCircle size={16} className="text-white" />
                      </div>
                      <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-3 max-w-xs">
                        <div className="flex space-x-1">
                          <motion.div
                            animate={{
                              scale: [1, 1.3, 1],
                              opacity: [0.5, 1, 0.5]
                            }}
                            transition={{
                              repeat: Infinity,
                              duration: 1.2,
                              delay: 0,
                              ease: "easeInOut"
                            }}
                            className="w-2 h-2 bg-blue-500 rounded-full"
                          />
                          <motion.div
                            animate={{
                              scale: [1, 1.3, 1],
                              opacity: [0.5, 1, 0.5]
                            }}
                            transition={{
                              repeat: Infinity,
                              duration: 1.2,
                              delay: 0.3,
                              ease: "easeInOut"
                            }}
                            className="w-2 h-2 bg-blue-500 rounded-full"
                          />
                          <motion.div
                            animate={{
                              scale: [1, 1.3, 1],
                              opacity: [0.5, 1, 0.5]
                            }}
                            transition={{
                              repeat: Infinity,
                              duration: 1.2,
                              delay: 0.6,
                              ease: "easeInOut"
                            }}
                            className="w-2 h-2 bg-blue-500 rounded-full"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Replies - Better positioning */}
                {showQuickReplies && (
                  <div className="flex-shrink-0 px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                    <QuickReplies onQuickReply={handleQuickReply} disabled={isTyping} />
                  </div>
                )}

                {/* Input Area - Enhanced design */}
                <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50/50 dark:bg-gray-800/50 rounded-b-2xl">
                  <ChatInput onSendMessage={handleSendMessage} disabled={isTyping} />
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

ChatBot.propTypes = {
  embedded: PropTypes.bool,
  onClose: PropTypes.func,
  isFloating: PropTypes.bool
};

export default ChatBot;
