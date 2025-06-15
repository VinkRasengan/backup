import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  MoreHorizontal,
  Phone,
  Video,
  Info,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Menu
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import ChatMessage from '../ChatBot/ChatMessage';
import ChatInput from '../ChatBot/ChatInput';

const MessengerLayout = () => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const [selectedChat, setSelectedChat] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const messagesEndRef = useRef(null);

  // Mock chat conversations for demonstration
  const [conversations] = useState([
    {
      id: 'factcheck-ai',
      name: 'FactCheck AI',
      avatar: '🤖',
      lastMessage: 'Xin chào! Tôi có thể giúp bạn kiểm tra thông tin.',
      timestamp: new Date(),
      unread: 0,
      online: true
    },
    {
      id: 'support',
      name: 'Hỗ trợ kỹ thuật',
      avatar: '🛠️',
      lastMessage: 'Cảm ơn bạn đã liên hệ với chúng tôi.',
      timestamp: new Date(Date.now() - 3600000),
      unread: 2,
      online: false
    }
  ]);

  // Load chat history when selecting a conversation
  useEffect(() => {
    if (selectedChat) {
      // Enhanced welcome message for FactCheck AI
      const mockHistory = selectedChat.id === 'factcheck-ai' ? [
        {
          id: '1',
          text: 'Xin chào! Tôi là trợ lý ảo FactCheck. Tôi có thể giúp bạn:',
          sender: 'bot',
          timestamp: new Date(Date.now() - 1800000)
        },
        {
          id: '2',
          text: '🔍 Kiểm tra độ tin cậy của link và website\n🛡️ Phát hiện email lừa đảo và phishing\n📰 Xác minh thông tin và tin tức\n💡 Tư vấn về an toàn mạng\n\nHãy gửi cho tôi link hoặc câu hỏi bạn muốn kiểm tra!',
          sender: 'bot',
          timestamp: new Date(Date.now() - 1700000)
        }
      ] : [
        {
          id: '1',
          text: 'Xin chào! Tôi có thể giúp bạn kiểm tra thông tin gì hôm nay?',
          sender: 'bot',
          timestamp: new Date(Date.now() - 1800000)
        },
        {
          id: '2',
          text: 'Chào bạn! Tôi muốn kiểm tra một đường link.',
          sender: 'user',
          timestamp: new Date(Date.now() - 1700000)
        }
      ];
      setChatHistory(mockHistory);
    }
  }, [selectedChat]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSendMessage = async (message) => {
    if (!message.trim()) return;

    const newMessage = {
      id: Date.now().toString(),
      text: message.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setChatHistory(prev => [...prev, newMessage]);
    setIsTyping(true);

    try {
      console.log('🤖 Sending message to Gemini AI:', message.trim());

      // Use Gemini API directly via backend with enhanced token handling
      const token = localStorage.getItem('token') ||
                   localStorage.getItem('authToken') ||
                   localStorage.getItem('backendToken') ||
                   localStorage.getItem('firebaseToken');

      const response = await fetch('/api/chat/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: message.trim()
        })
      });

      console.log('📡 API Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Gemini Response:', data);

        let responseText;
        if (data.data?.response?.content) {
          responseText = data.data.response.content;
        } else if (data.data?.message) {
          responseText = data.data.message;
        } else if (data.message) {
          responseText = data.message;
        } else {
          responseText = 'Tôi đã nhận được tin nhắn của bạn. Cảm ơn bạn đã liên hệ!';
        }

        const botResponse = {
          id: (Date.now() + 1).toString(),
          text: responseText,
          sender: 'bot',
          timestamp: new Date()
        };

        setChatHistory(prev => [...prev, botResponse]);
      } else {
        const errorData = await response.json();
        console.error('❌ API Error:', errorData);
        throw new Error(errorData.message || 'API request failed');
      }
    } catch (error) {
      console.error('❌ Chat Error:', error);

      // Show user-friendly error message
      const errorResponse = {
        id: (Date.now() + 1).toString(),
        text: 'Xin lỗi, hiện tại tôi gặp sự cố kỹ thuật. Hãy thử lại sau vài phút. Gemini AI đang được cấu hình...',
        sender: 'bot',
        timestamp: new Date()
      };

      setChatHistory(prev => [...prev, errorResponse]);
    }

    setIsTyping(false);
  };

  const formatTime = (date) => {
    return new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Auto-select FactCheck AI on first load
  useEffect(() => {
    if (conversations.length > 0 && !selectedChat) {
      setSelectedChat(conversations[0]); // Auto-select FactCheck AI
    }
  }, [conversations, selectedChat]);

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full bg-white dark:bg-gray-900 flex overflow-hidden relative">
      {/* Sidebar Toggle Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-2 left-2 z-50 w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg flex items-center justify-center transition-colors"
        title={sidebarOpen ? "Ẩn sidebar" : "Hiện sidebar"}
      >
        <Menu size={16} />
      </button>

      {/* Messenger Sidebar - Chat List */}
      <motion.div
        initial={false}
        animate={{
          width: sidebarOpen ? (sidebarCollapsed ? 60 : 320) : 0,
          opacity: sidebarOpen ? 1 : 0
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden"
      >
        {/* Sidebar Header */}
        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            {!sidebarCollapsed && (
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                Đoạn chat
              </h1>
            )}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                title={sidebarCollapsed ? "Mở rộng" : "Thu gọn"}
              >
                {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
              </button>
              {!sidebarCollapsed && (
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                  <MoreHorizontal size={20} className="text-gray-600 dark:text-gray-400" />
                </button>
              )}
            </div>
          </div>

          {/* Search - only show when not collapsed */}
          {!sidebarCollapsed && (
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm đoạn chat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
              />
            </div>
          )}
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map((conversation) => (
            <motion.div
              key={conversation.id}
              onClick={() => setSelectedChat(conversation)}
              className={`${sidebarCollapsed ? 'p-2' : 'p-3'} cursor-pointer border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                selectedChat?.id === conversation.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
              whileHover={{ x: sidebarCollapsed ? 0 : 4 }}
              transition={{ duration: 0.2 }}
              title={sidebarCollapsed ? conversation.name : ''}
            >
              {sidebarCollapsed ? (
                /* Collapsed view - only avatar */
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-lg">
                      {conversation.avatar}
                    </div>
                    {conversation.online && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
                    )}
                    {conversation.unread > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {conversation.unread}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Expanded view - full info */
                <div className="flex items-center space-x-2.5">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm">
                      {conversation.avatar}
                    </div>
                    {conversation.online && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-sm text-gray-900 dark:text-white truncate">
                        {conversation.name}
                      </h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatTime(conversation.timestamp)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        {conversation.lastMessage}
                      </p>
                      {conversation.unread > 0 && (
                        <span className="ml-2 px-1.5 py-0.5 bg-blue-500 text-white text-xs rounded-full min-w-[18px] text-center">
                          {conversation.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <button
                    onClick={() => setSelectedChat(null)}
                    className="lg:hidden p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                  >
                    <ArrowLeft size={18} className="text-gray-600 dark:text-gray-400" />
                  </button>

                  <div className="relative">
                    <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm">
                      {selectedChat.avatar}
                    </div>
                    {selectedChat.online && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
                    )}
                  </div>

                  <div>
                    <h2 className="font-semibold text-sm text-gray-900 dark:text-white">
                      {selectedChat.name}
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {selectedChat.online ? 'Đang hoạt động' : 'Không hoạt động'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                    <Phone size={16} className="text-gray-600 dark:text-gray-400" />
                  </button>
                  <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                    <Video size={16} className="text-gray-600 dark:text-gray-400" />
                  </button>
                  <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                    <Info size={16} className="text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-3 bg-gray-50 dark:bg-gray-800 space-y-2">
              <AnimatePresence>
                {chatHistory.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChatMessage
                      message={{
                        text: message.text,
                        isBot: message.sender === 'bot',
                        timestamp: message.timestamp
                      }}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
              <ChatInput onSendMessage={handleSendMessage} />
            </div>
          </>
        ) : (
          /* Welcome Screen */
          <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-800">
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-4xl mx-auto mb-4">
                💬
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                Chọn một đoạn chat
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Chọn một cuộc trò chuyện từ danh sách bên trái để bắt đầu nhắn tin
              </p>
            </div>
          </div>
        )}
        </div>
    </div>
  );
};

export default MessengerLayout;
