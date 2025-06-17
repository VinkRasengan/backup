import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  UserPlus,
  Menu,
  Home
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import EmojiPicker from './EmojiPicker';
import './MessengerLayout.css';
import './ChatTheme.css';

const ModernMessengerLayout = () => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [selectedChat, setSelectedChat] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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
  // Handle mobile responsive
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1025);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1025;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarCollapsed(false); // Don't auto-collapse on mobile
        if (selectedChat) {
          setSidebarOpen(false); // Hide sidebar when chat is selected on mobile
        }
      } else {
        // Desktop mode - always show sidebar
        setSidebarOpen(true);
        setSidebarCollapsed(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, [selectedChat]);
  // Auto-select FactCheck AI on load
  useEffect(() => {
    if (conversations.length > 0 && !selectedChat) {
      const factcheckAI = conversations.find(conv => conv.id === 'factcheck-ai');
      if (factcheckAI) {
        setSelectedChat(factcheckAI);
      }
    }
  }, [conversations, selectedChat]);



  // Load chat history
  useEffect(() => {
    if (selectedChat) {
      let mockHistory = [];

      switch (selectedChat.id) {
        case 'factcheck-ai':
          mockHistory = [
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
          ];
          break;

        case 'support':
          mockHistory = [
            {
              id: '1',
              text: 'Xin chào! Đây là đội ngũ hỗ trợ kỹ thuật FactCheck. Chúng tôi có thể giúp bạn:',
              sender: 'bot',
              timestamp: new Date(Date.now() - 3600000),
              reactions: []
            },
            {
              id: '2',
              text: '• Khắc phục sự cố kỹ thuật\n• Hướng dẫn sử dụng tính năng\n• Báo cáo lỗi\n• Góp ý cải thiện\n\nVui lòng mô tả vấn đề bạn gặp phải.',
              sender: 'bot',
              timestamp: new Date(Date.now() - 3500000),
              reactions: []
            }
          ];
          break;

        case 'community':
          mockHistory = [
            {
              id: '1',
              text: 'Chào mừng đến với nhóm cộng đồng FactCheck! 👋',
              sender: 'bot',
              timestamp: new Date(Date.now() - 7200000),
              reactions: []
            },
            {
              id: '2',
              text: 'Đây là nơi mọi người chia sẻ kinh nghiệm, thảo luận về an toàn mạng và hỗ trợ lẫn nhau.',
              sender: 'bot',
              timestamp: new Date(Date.now() - 7100000),
              reactions: []
            },
            {
              id: '3',
              text: 'Cảm ơn mọi người đã hỗ trợ! Tôi đã học được nhiều điều mới.',
              sender: 'user',
              timestamp: new Date(Date.now() - 3600000),
              reactions: []
            }
          ];
          break;

        case 'expert':
          mockHistory = [
            {
              id: '1',
              text: 'Xin chào! Tôi là chuyên gia bảo mật của FactCheck.',
              sender: 'bot',
              timestamp: new Date(Date.now() - 86400000),
              reactions: []
            },
            {
              id: '2',
              text: 'Tài liệu về "Phòng chống tấn công phishing" đã được gửi đến email của bạn.',
              sender: 'bot',
              timestamp: new Date(Date.now() - 86300000),
              reactions: []
            }
          ];
          break;

        default:
          mockHistory = [
            {
              id: '1',
              text: 'Xin chào! Tôi có thể giúp bạn kiểm tra thông tin gì hôm nay?',
              sender: 'bot',
              timestamp: new Date(Date.now() - 1800000),
              reactions: []
            }
          ];
      }

      setChatHistory(mockHistory);
    }
  }, [selectedChat]);
  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

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

  const handleMessageReaction = (messageId, emoji) => {
    setChatHistory(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const existingReaction = msg.reactions.find(r => r.emoji === emoji);
        if (existingReaction) {
          // Remove reaction if already exists
          return {
            ...msg,
            reactions: msg.reactions.filter(r => r.emoji !== emoji)
          };
        } else {
          // Add new reaction
          return {
            ...msg,
            reactions: [...msg.reactions, { emoji, count: 1, users: ['current-user'] }]
          };
        }
      }
      return msg;
    }));
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
    <div
      className={`chat-fullscreen messenger-layout ${isDarkMode ? 'dark' : ''}`}
      data-theme={isDarkMode ? 'dark' : 'light'}
    >
      {/* Chat Navigation Header */}
      <div className="messenger-header bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/')}
            className="btn btn-ghost p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            title="Về trang chủ"
          >
            <Home size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="btn btn-ghost p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            title="Menu"
          >
            <Menu size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
          <h1 className="heading-2 text-lg font-semibold text-gray-900 dark:text-white">
            FactCheck Chat
          </h1>
        </div>
        <div className="flex items-center space-x-2">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {user?.displayName || user?.email || 'Người dùng'}
          </div>
          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
            {user?.displayName?.charAt(0) || user?.email?.charAt(0) || '?'}
          </div>
        </div>
      </div>

      {/* Main Chat Container */}
      <div className="messenger-content">
        {/* Mobile Overlay */}
        {sidebarOpen && isMobile && (
          <button
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            onKeyDown={(e) => e.key === 'Escape' && setSidebarOpen(false)}
            aria-label="Đóng menu"
          />
        )}

        {/* Sidebar - Conversations List */}
        <div className={`messenger-sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${sidebarOpen ? 'open' : ''}`}>
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
        </div>

        {/* Main Chat Area */}
        <div className="messenger-chat-area">
        {selectedChat ? (
          <>
            {/* Chat Header - Compact */}
            <div className="flex-shrink-0 h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm px-4 py-2">
              <div className="flex items-center justify-between h-full">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setSelectedChat(null)}
                    className="lg:hidden p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                  >
                    <ArrowLeft size={18} className="text-gray-600 dark:text-gray-400" />
                  </button>

                  <div className="relative">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {selectedChat.avatar}
                    </div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 ${getStatusColor(selectedChat.status)} border-2 border-white dark:border-gray-800 rounded-full`}></div>
                  </div>

                  <div>
                    <h2 className="font-semibold text-gray-900 dark:text-white text-sm">
                      {selectedChat.name}
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {selectedChat.online ? 'Đang hoạt động' : `Hoạt động ${formatMessageTime(selectedChat.timestamp)} trước`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                    <Phone size={16} className="text-gray-600 dark:text-gray-400" />
                  </button>
                  <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                    <Video size={16} className="text-gray-600 dark:text-gray-400" />
                  </button>
                  <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                    <Info size={16} className="text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              </div>
            </div>            {/* Messages Area - Messenger Bubble Style */}
            <div className="messenger-messages-area">
              <div className="messenger-bubble-container">
                <AnimatePresence>
                  {chatHistory.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`message-container ${msg.sender}`}
                    >
                      {msg.sender === 'bot' && (
                        <div className="message-avatar">
                          🤖
                        </div>
                      )}

                      <div className="message-content">
                        <div className="relative group">
                          <div
                            className={`message-bubble ${msg.sender}`}
                            onDoubleClick={() => handleMessageReaction(msg.id, '❤️')}
                          >
                            {msg.text}
                          </div>

                          {/* Quick Reaction Bar */}
                          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-2 py-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-1 z-10">
                            {['❤️', '👍', '😂', '😮', '😢', '😡'].map((emoji) => (
                              <button
                                key={emoji}
                                onClick={() => handleMessageReaction(msg.id, emoji)}
                                className="text-lg hover:scale-125 transition-transform duration-150"
                                title={`React with ${emoji}`}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Message Reactions */}
                        {msg.reactions && msg.reactions.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1 px-2">
                            {msg.reactions.map((reaction, reactionIndex) => (
                              <button
                                key={`${msg.id}-${reaction.emoji}-${reactionIndex}`}
                                onClick={() => handleMessageReaction(msg.id, reaction.emoji)}
                                className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full px-2 py-0.5 text-xs transition-colors"
                              >
                                <span>{reaction.emoji}</span>
                                <span className="text-gray-600 dark:text-gray-400">{reaction.count}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        <div className="message-timestamp">
                          {formatTime(msg.timestamp)}
                        </div>
                      </div>

                      {msg.sender === 'user' && (
                        <div className="message-avatar">
                          {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>

                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="typing-indicator"
                  >
                    <div className="message-avatar">
                      🤖
                    </div>
                    <div className="typing-dots">
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>            {/* Message Input - Messenger Style */}
            <div className="messenger-input-container">
              {/* Emoji Picker */}
              <EmojiPicker
                isOpen={showEmojiPicker}
                onEmojiSelect={(emoji) => setMessage(prev => prev + emoji)}
                onClose={() => setShowEmojiPicker(false)}
              />
              
              {/* Attachment buttons */}
              <button
                className="messenger-attachment-button"
                title="Đính kèm file"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.pdf,.doc,.docx,.txt,.zip,.rar';
                  input.onchange = (e) => {
                    const file = e.target.files[0];
                    if (file) {
                      console.log('File selected:', file.name);
                      // TODO: Handle file upload
                    }
                  };
                  input.click();
                }}
              >
                <Paperclip size={18} />
              </button>

              <button
                className="messenger-attachment-button"
                title="Đính kèm hình ảnh"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = (e) => {
                    const file = e.target.files[0];
                    if (file) {
                      console.log('Image selected:', file.name);
                      // TODO: Handle image upload
                    }
                  };
                  input.click();
                }}
              >
                <Image size={18} />
              </button>
              
              {/* Input box */}
              <textarea
                ref={inputRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Aa"
                className="messenger-input-box"
                rows={1}
              />
              
              {/* Emoji button */}
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="messenger-attachment-button"
                title="Emoji"
              >
                <Smile size={18} />
              </button>
              
              {/* Send button or Voice button */}
              {message.trim() ? (
                <button
                  onClick={handleSendMessage}
                  className="messenger-send-button"
                  title="Gửi"
                >
                  <Send size={16} />
                </button>
              ) : (
                <button
                  onMouseDown={() => {
                    setIsRecording(true);
                    console.log('Started recording...');
                    // TODO: Start voice recording
                  }}
                  onMouseUp={() => {
                    setIsRecording(false);
                    console.log('Stopped recording...');
                    // TODO: Stop voice recording and process
                  }}
                  onMouseLeave={() => {
                    if (isRecording) {
                      setIsRecording(false);
                      console.log('Recording cancelled...');
                    }
                  }}
                  className={`messenger-send-button transition-all duration-200 ${
                    isRecording
                      ? 'bg-red-500 hover:bg-red-600 scale-110 animate-pulse'
                      : 'bg-gray-400 hover:bg-gray-500'
                  }`}
                  title={isRecording ? "Đang ghi âm... (thả để gửi)" : "Giữ để ghi âm"}
                >
                  <Mic size={16} />
                </button>
              )}
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
    </div>
  );
};

export default ModernMessengerLayout;
