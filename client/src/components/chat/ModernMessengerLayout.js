import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Phone,
  Video,
  Info,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Smile,
  Paperclip,
  Send,
  Image,
  Mic,
  Settings,
  UserPlus
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ModernMessengerLayout = () => {
  const { user } = useAuth();
  const [selectedChat, setSelectedChat] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Enhanced mock conversations with more realistic data
  const [conversations] = useState([
    {
      id: 'factcheck-ai',
      name: 'FactCheck AI',
      avatar: '🤖',
      lastMessage: 'Xin chào! Tôi có thể giúp bạn kiểm tra thông tin.',
      timestamp: new Date(),
      unread: 0,
      online: true,
      type: 'ai',
      status: 'active'
    },
    {
      id: 'support',
      name: 'Hỗ trợ kỹ thuật',
      avatar: '🛠️',
      lastMessage: 'Cảm ơn bạn đã liên hệ với chúng tôi.',
      timestamp: new Date(Date.now() - 3600000),
      unread: 2,
      online: false,
      type: 'support',
      status: 'away'
    },
    {
      id: 'community',
      name: 'Nhóm Cộng đồng',
      avatar: '👥',
      lastMessage: 'Nguyễn Văn A: Cảm ơn mọi người đã hỗ trợ!',
      timestamp: new Date(Date.now() - 7200000),
      unread: 5,
      online: true,
      type: 'group',
      status: 'active',
      members: 156
    },
    {
      id: 'expert',
      name: 'Chuyên gia Bảo mật',
      avatar: '🔒',
      lastMessage: 'Tài liệu bạn yêu cầu đã được gửi.',
      timestamp: new Date(Date.now() - 86400000),
      unread: 0,
      online: false,
      type: 'expert',
      status: 'offline'
    }
  ]);

  // Load chat history
  useEffect(() => {
    if (selectedChat) {
      const mockHistory = selectedChat.id === 'factcheck-ai' ? [
        {
          id: '1',
          text: 'Xin chào! Tôi là trợ lý ảo FactCheck. Tôi có thể giúp bạn:',
          sender: 'bot',
          timestamp: new Date(Date.now() - 1800000),
          reactions: []
        },
        {
          id: '2',
          text: '🔍 Kiểm tra độ tin cậy của link và website\n🛡️ Phát hiện email và tin nhắn lừa đảo\n📰 Xác minh thông tin và tin tức\n💡 Tư vấn về an toàn mạng\n\nHãy gửi cho tôi link hoặc câu hỏi bạn muốn kiểm tra!',
          sender: 'bot',
          timestamp: new Date(Date.now() - 1700000),
          reactions: []
        }
      ] : [
        {
          id: '1',
          text: 'Xin chào! Tôi có thể giúp bạn kiểm tra thông tin gì hôm nay?',
          sender: 'bot',
          timestamp: new Date(Date.now() - 1800000),
          reactions: []
        }
      ];
      setChatHistory(mockHistory);
    }
  }, [selectedChat]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Auto-select FactCheck AI on first load
  useEffect(() => {
    if (conversations.length > 0 && !selectedChat) {
      setSelectedChat(conversations[0]);
    }
  }, [conversations, selectedChat]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const newMessage = {
      id: Date.now().toString(),
      text: message.trim(),
      sender: 'user',
      timestamp: new Date(),
      reactions: []
    };

    setChatHistory(prev => [...prev, newMessage]);
    setMessage('');
    setIsTyping(true);

    try {
      // Use Gemini API
      const response = await fetch('/api/chat/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('backendToken')}`
        },
        body: JSON.stringify({
          message: message.trim()
        })
      });

      if (response.ok) {
        const data = await response.json();
        let responseText = data.data?.response?.content || data.data?.message || data.message || 'Tôi đã nhận được tin nhắn của bạn. Cảm ơn bạn!';

        const botResponse = {
          id: (Date.now() + 1).toString(),
          text: responseText,
          sender: 'bot',
          timestamp: new Date(),
          reactions: []
        };

        setChatHistory(prev => [...prev, botResponse]);
      } else {
        throw new Error('API request failed');
      }
    } catch (error) {
      console.error('Chat Error:', error);
      const errorResponse = {
        id: (Date.now() + 1).toString(),
        text: 'Xin lỗi, hiện tại tôi gặp sự cố kỹ thuật. Hãy thử lại sau vài phút.',
        sender: 'bot',
        timestamp: new Date(),
        reactions: []
      };
      setChatHistory(prev => [...prev, errorResponse]);
    }

    setIsTyping(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date) => {
    return new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatMessageTime = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days} ngày`;
    if (hours > 0) return `${hours} giờ`;
    if (minutes > 0) return `${minutes} phút`;
    return 'Vừa xong';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full bg-white dark:bg-gray-900 flex overflow-hidden relative">
      {/* Removed duplicate hamburger menu - using NavigationLayout's menu instead */}

      {/* Sidebar - Conversations List */}
      <motion.div
        initial={false}
        animate={{
          width: sidebarOpen ? (sidebarCollapsed ? 80 : 360) : 0,
          opacity: sidebarOpen ? 1 : 0
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden"
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            {!sidebarCollapsed && (
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Chat
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {user?.displayName || user?.email || 'Người dùng'}
                </p>
              </div>
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
                <>
                  <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                    <UserPlus size={20} className="text-gray-600 dark:text-gray-400" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                    <Settings size={20} className="text-gray-600 dark:text-gray-400" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Search */}
          {!sidebarCollapsed && (
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm đoạn chat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-700 border-0 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white placeholder-gray-500"
              />
            </div>
          )}
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {!sidebarCollapsed && (
            <div className="p-2">
              <div className="flex items-center space-x-2 mb-2">
                <button className="px-3 py-1.5 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full text-sm font-medium">
                  Tất cả
                </button>
                <button className="px-3 py-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-sm">
                  Chưa đọc
                </button>
                <button className="px-3 py-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-sm">
                  Lưu trữ
                </button>
              </div>
            </div>
          )}

          {filteredConversations.map((conversation) => (
            <motion.div
              key={conversation.id}
              onClick={() => setSelectedChat(conversation)}
              className={`${sidebarCollapsed ? 'p-3' : 'p-4'} cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                selectedChat?.id === conversation.id ? 'bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-500' : ''
              }`}
              whileHover={{ x: sidebarCollapsed ? 0 : 2 }}
              transition={{ duration: 0.2 }}
              title={sidebarCollapsed ? conversation.name : ''}
            >
              {sidebarCollapsed ? (
                /* Collapsed view */
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-lg font-semibold">
                      {conversation.avatar}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${getStatusColor(conversation.status)} border-2 border-white dark:border-gray-800 rounded-full`}></div>
                    {conversation.unread > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                        {conversation.unread > 9 ? '9+' : conversation.unread}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Expanded view */
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-lg font-semibold">
                      {conversation.avatar}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${getStatusColor(conversation.status)} border-2 border-white dark:border-gray-800 rounded-full`}></div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate text-base">
                        {conversation.name}
                      </h3>
                      <div className="flex items-center space-x-1">
                        {conversation.unread > 0 && (
                          <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full font-bold min-w-[20px] text-center">
                            {conversation.unread > 9 ? '9+' : conversation.unread}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate flex-1">
                        {conversation.lastMessage}
                      </p>
                      <span className="text-xs text-gray-500 dark:text-gray-500 ml-2">
                        {formatTime(conversation.timestamp)}
                      </span>
                    </div>
                    {conversation.type === 'group' && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {conversation.members} thành viên
                      </p>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setSelectedChat(null)}
                    className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                  >
                    <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
                  </button>

                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {selectedChat.avatar}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 ${getStatusColor(selectedChat.status)} border-2 border-white dark:border-gray-800 rounded-full`}></div>
                  </div>

                  <div>
                    <h2 className="font-semibold text-gray-900 dark:text-white">
                      {selectedChat.name}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedChat.online ? 'Đang hoạt động' : `Hoạt động ${formatMessageTime(selectedChat.timestamp)} trước`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                    <Phone size={18} className="text-gray-600 dark:text-gray-400" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                    <Video size={18} className="text-gray-600 dark:text-gray-400" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                    <Info size={18} className="text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
              <AnimatePresence>
                {chatHistory.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xs lg:max-w-md ${msg.sender === 'user' ? 'ml-auto' : 'mr-auto'}`}>
                      {msg.sender === 'bot' && (
                        <div className="flex items-center space-x-2 mb-1">
                          <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs">
                            🤖
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {selectedChat.name}
                          </span>
                        </div>
                      )}
                      <div
                        className={`rounded-2xl px-4 py-2 ${
                          msg.sender === 'user'
                            ? 'bg-blue-500 text-white'
                            : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                      </div>
                      <div className={`text-xs text-gray-500 mt-1 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                        {formatTime(msg.timestamp)}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="max-w-xs lg:max-w-md">
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-end space-x-3">
                <div className="flex-1 relative">
                  <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-2">
                    <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors">
                      <Paperclip size={18} className="text-gray-600 dark:text-gray-400" />
                    </button>
                    <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors">
                      <Image size={18} className="text-gray-600 dark:text-gray-400" />
                    </button>
                    <textarea
                      ref={inputRef}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Nhập tin nhắn..."
                      className="flex-1 bg-transparent border-0 outline-none resize-none text-gray-900 dark:text-white placeholder-gray-500 max-h-32"
                      rows={1}
                      style={{ minHeight: '24px' }}
                    />
                    <button
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
                    >
                      <Smile size={18} className="text-gray-600 dark:text-gray-400" />
                    </button>
                  </div>
                </div>

                {message.trim() ? (
                  <button
                    onClick={handleSendMessage}
                    className="p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors"
                  >
                    <Send size={18} />
                  </button>
                ) : (
                  <button
                    onMouseDown={() => setIsRecording(true)}
                    onMouseUp={() => setIsRecording(false)}
                    className={`p-3 transition-colors rounded-full ${
                      isRecording 
                        ? 'bg-red-500 hover:bg-red-600 text-white' 
                        : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <Mic size={18} />
                  </button>
                )}
              </div>
            </div>
          </>
        ) : (
          /* Welcome Screen */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-6xl mx-auto mb-6">
                💬
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                Chào mừng đến với FactCheck Chat
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Chọn một cuộc trò chuyện từ danh sách bên trái để bắt đầu nhắn tin với AI hoặc nhóm hỗ trợ
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="text-2xl mb-2">🤖</div>
                  <div className="font-semibold text-gray-900 dark:text-white">AI Assistant</div>
                  <div className="text-gray-600 dark:text-gray-400">Kiểm tra thông tin tự động</div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                  <div className="text-2xl mb-2">👥</div>
                  <div className="font-semibold text-gray-900 dark:text-white">Cộng đồng</div>
                  <div className="text-gray-600 dark:text-gray-400">Thảo luận với mọi người</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModernMessengerLayout;
