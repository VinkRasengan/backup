import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Minimize2 } from 'lucide-react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import QuickReplies from './QuickReplies';
import { chatbotService } from '../../services/chatbotService';

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
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
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (text) => {
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

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      // Get bot response
      const botResponse = await chatbotService.getResponse(text.trim());
      
      setTimeout(() => {
        const botMessage = {
          id: Date.now() + 1,
          text: botResponse,
          isBot: true,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, botMessage]);
        setIsTyping(false);
      }, 1000 + Math.random() * 1000); // Random delay 1-2 seconds
    } catch (error) {
      console.error('Error getting bot response:', error);
      setIsTyping(false);
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    setIsMinimized(false);
  };

  const minimizeChat = () => {
    setIsMinimized(true);
  };

  const maximizeChat = () => {
    setIsMinimized(false);
  };

  const handleQuickReply = (text) => {
    handleSendMessage(text);
  };

  // Calculate chat window classes
  const getChatWindowClasses = () => {
    if (isMinimized) {
      return 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-20 h-16 cursor-pointer';
    }

    const hasQuickReplies = showQuickReplies && messages.length === 1;
    // Tăng kích thước để hiển thị đầy đủ tất cả components
    const height = hasQuickReplies ? 'h-[min(650px,calc(100vh-2rem))]' : 'h-[min(520px,calc(100vh-2rem))]';

    return `bottom-4 right-4 w-96 max-w-[calc(100vw-2rem)] ${height} sm:w-96 sm:bottom-6 sm:right-6`;
  };

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
            className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
          >
            <MessageCircle size={24} className="group-hover:scale-110 transition-transform" />
            
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
              scale: isMinimized ? 0.3 : 1, 
              y: isMinimized ? 100 : 0,
              x: isMinimized ? 100 : 0
            }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={`fixed z-50 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden ${getChatWindowClasses()}`}
            onClick={isMinimized ? maximizeChat : undefined}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 flex items-center justify-between">
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
              </div>
              
              {!isMinimized && (
                <div className="flex items-center gap-2">
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

            {!isMinimized && (
              <div className="flex flex-col h-full overflow-hidden">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent min-h-0">
                  {messages.map((message) => (
                    <ChatMessage key={message.id} message={message} />
                  ))}

                  {isTyping && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <MessageCircle size={16} className="text-white" />
                      </div>
                      <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-3 max-w-xs">
                        <div className="flex space-x-1">
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 0.8, delay: 0 }}
                            className="w-2 h-2 bg-gray-400 rounded-full"
                          />
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }}
                            className="w-2 h-2 bg-gray-400 rounded-full"
                          />
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }}
                            className="w-2 h-2 bg-gray-400 rounded-full"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Replies */}
                {showQuickReplies && messages.length === 1 && (
                  <div className="flex-shrink-0">
                    <QuickReplies onQuickReply={handleQuickReply} disabled={isTyping} />
                  </div>
                )}

                {/* Input */}
                <div className="border-t border-gray-200 dark:border-gray-700 p-3 flex-shrink-0 bg-white dark:bg-gray-800">
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

export default ChatBot;
