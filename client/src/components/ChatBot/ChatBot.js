import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Minimize2 } from 'lucide-react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import QuickReplies from './QuickReplies';
import { chatAPI } from '../../services/api';

const ChatBot = () => {
  console.log('🔄 [INIT] ChatBot component initialized - NEW VERSION');
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

  // Giới hạn số lượng messages hiển thị như Messenger (tối đa 20 tin nhắn)
  const MAX_MESSAGES = 20;
  const displayMessages = messages.slice(-MAX_MESSAGES);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Debug: Log messages state changes
  React.useEffect(() => {
    console.log('🔄 Messages state updated:', messages);
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (text) => {
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

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    // Simulate typing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      // Send message to widget endpoint using chatAPI
      console.log('📤 Sending to widget chat:', text.trim());
      const response = await chatAPI.sendWidgetMessage({ message: text.trim() });

      console.log('✅ Widget Response:', response);
      console.log('✅ Response data:', response.data);
      console.log('✅ Response content:', response.data?.response?.content);
      console.log('🔍 Full response structure:', JSON.stringify(response, null, 2));

      // Validate response structure - axios wraps response in data
      const responseContent = response.data?.data?.response?.content;
      if (!responseContent) {
        console.error('❌ Invalid response structure. Expected: response.data.data.response.content');
        console.error('❌ Actual structure:', {
          hasData: !!response.data,
          hasDataData: !!response.data?.data,
          hasResponse: !!response.data?.data?.response,
          hasContent: !!response.data?.data?.response?.content,
          dataKeys: response.data ? Object.keys(response.data) : 'no data',
          dataDataKeys: response.data?.data ? Object.keys(response.data.data) : 'no data.data',
          responseKeys: response.data?.data?.response ? Object.keys(response.data.data.response) : 'no response'
        });
        throw new Error(`Invalid response structure from server. Got: ${JSON.stringify(response.data)}`);
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
        console.log('✅ Messages updated:', newMessages);
        return newMessages;
      });
      setIsTyping(false);
    } catch (error) {
      console.error('❌ API Error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });

      // Show error message to user
      const errorMessage = {
        id: Date.now() + 1,
        text: '⚠️ Xin lỗi, hiện tại tôi không thể kết nối được với server. Vui lòng thử lại sau hoặc liên hệ quản trị viên.',
        isBot: true,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
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
    setShowQuickReplies(false); // Ẩn quick replies sau khi click
    handleSendMessage(text);
  };

  // Calculate chat window classes - Better positioning and z-index
  const getChatWindowClasses = () => {
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
  };

  // Check if we're on a page where we should adjust positioning
  const shouldAdjustPosition = () => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname;
    return path === '/chat' || path.startsWith('/chat');
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
            className="fixed bottom-4 left-4 z-chatbot w-14 h-14 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
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
                  {messages.slice(-MAX_MESSAGES).map((message) => (
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

export default ChatBot;
