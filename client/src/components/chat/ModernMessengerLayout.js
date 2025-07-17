import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  MoreHorizontal,
  Check,
  CheckCheck,
  Clock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import EmojiPicker from './EmojiPicker';
import ReactMarkdown from 'react-markdown';
import './MessengerLayout.css';
import './ChatTheme.css';

const ModernMessengerLayout = () => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const [selectedChat, setSelectedChat] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [userTyping, setUserTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showChatInfo, setShowChatInfo] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

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
      status: 'active',
      isTyping: false,
      lastSeen: new Date()
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
      status: 'away',
      lastSeen: new Date(Date.now() - 1800000)
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
      members: 156,
      lastSeen: new Date()
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
      status: 'offline',
      lastSeen: new Date(Date.now() - 86400000)
    }
  ]);

  // Handle mobile responsive - Enhanced for better desktop support
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1025);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1025;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarCollapsed(false);
        if (selectedChat) {
          setSidebarOpen(false);
        }
      } else {
        // Desktop mode - always show sidebar, better defaults
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

  // Send message function - moved before useEffect to avoid initialization error
  const handleSendMessage = useCallback(async () => {
    if (!message.trim()) return;

    const newMessage = {
      id: Date.now().toString(),
      text: message.trim(),
      sender: 'user',
      timestamp: new Date(),
      reactions: [],
      status: 'sending',
      isRead: false
    };

    setChatHistory(prev => [...prev, newMessage]);
    setMessage('');
    setUserTyping(false);

    // Update message status to sent
    setTimeout(() => {
      setChatHistory(prev =>
        prev.map(msg =>
          msg.id === newMessage.id
            ? { ...msg, status: 'sent' }
            : msg
        )
      );
    }, 500);

    // Send to AI if it's FactCheck AI or support
    if (selectedChat.type === 'ai' || selectedChat.type === 'support') {
      setIsTyping(true);

      try {
        // Use correct API endpoint through Gateway
        const apiBaseUrl = process.env.REACT_APP_API_URL || "http://localhost:8080";
        const response = await fetch(`${apiBaseUrl}/api/chat/gemini`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ message: message.trim() })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        let responseContent = '';
        let isExpandable = false;
        let fullContent = '';

        // Ưu tiên lấy từ data.data.response.content nếu có {full, short}
        if (
          data.data?.response?.content &&
          typeof data.data.response.content === 'object' &&
          typeof data.data.response.content.short === 'string' &&
          typeof data.data.response.content.full === 'string'
        ) {
          responseContent = data.data.response.content.short;
          fullContent = data.data.response.content.full;
          isExpandable = fullContent !== responseContent;
        }
        // Nếu không có, fallback sang data.data.message (cũng có thể là {full, short})
        else if (
          data.data?.message &&
          typeof data.data.message === 'object' &&
          typeof data.data.message.short === 'string' &&
          typeof data.data.message.full === 'string'
        ) {
          responseContent = data.data.message.short;
          fullContent = data.data.message.full;
          isExpandable = fullContent !== responseContent;
        }
        // Nếu không, fallback các trường hợp cũ
        else if (typeof data.data?.response === 'string') {
          responseContent = data.data.response;
        } else if (data.data?.response?.content && typeof data.data.response.content === 'string') {
          responseContent = data.data.response.content;
        } else if (typeof data.data?.message === 'string') {
          responseContent = data.data.message;
        } else if (typeof data.message === 'string') {
          responseContent = data.message;
        } else {
          responseContent = 'Cảm ơn bạn đã liên hệ! Hiện tại tôi đang xử lý yêu cầu của bạn.';
        }

        const botResponse = {
          id: (Date.now() + 1).toString(),
          text: typeof responseContent === 'string' ? responseContent : JSON.stringify(responseContent),
          sender: 'bot',
          timestamp: new Date(),
          reactions: [],
          status: 'sent',
          isRead: false,
          isExpandable,
          fullContent: typeof fullContent === 'string' ? fullContent : ''
        };

        setChatHistory(prev => [...prev, botResponse]);

        // Mark user message as read
        setTimeout(() => {
          setChatHistory(prev =>
            prev.map(msg =>
              msg.id === newMessage.id
                ? { ...msg, status: 'read', isRead: true }
                : msg
            )
          );
        }, 1000);

      } catch (error) {
        console.error('Chat API Error:', error);

        // Enhanced error handling with retry suggestion
        let errorText = 'Xin lỗi, hiện tại tôi gặp sự cố kỹ thuật. ';

        if (error.message?.includes('network') || error.message?.includes('fetch')) {
          errorText += 'Vui lòng kiểm tra kết nối mạng và thử lại.';
        } else if (error.message?.includes('timeout')) {
          errorText += 'Yêu cầu đã hết thời gian chờ. Vui lòng thử lại.';
        } else if (error.status === 429) {
          errorText += 'Quá nhiều yêu cầu. Vui lòng chờ một chút rồi thử lại.';
        } else if (error.status >= 500) {
          errorText += 'Máy chủ đang bảo trì. Vui lòng thử lại sau vài phút.';
        } else {
          errorText += `Lỗi: ${error.message || 'Không xác định'}. Vui lòng thử lại sau vài phút hoặc liên hệ với bộ phận hỗ trợ qua email support@factcheck.vn`;
        }

        const errorMessage = {
          id: (Date.now() + 1).toString(),
          text: errorText,
          sender: 'bot',
          timestamp: new Date(),
          reactions: [],
          status: 'sent',
          isRead: false
        };

        setChatHistory(prev => [...prev, errorMessage]);
      } finally {
        setIsTyping(false);
      }
    }
  }, [message, selectedChat]);

  // Enhanced keyboard shortcuts for desktop
  useEffect(() => {
    const handleKeyboard = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'k':
            e.preventDefault();
            document.querySelector('.messenger-search-input')?.focus();
            break;
          case 'Enter':
            e.preventDefault();
            handleSendMessage();
            break;
          case 'f':
            e.preventDefault();
            setShowChatInfo(!showChatInfo);
            break;
          default:
            break;
        }
      }
      if (e.key === 'Escape') {
        setShowEmojiPicker(false);
        setShowChatInfo(false);
      }
    };

    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [showChatInfo, handleSendMessage]);

  // Load chat history with message limit
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
              reactions: [],
              status: 'sent',
              isRead: true
            },
            {
              id: '2',
              text: '🔍 Kiểm tra độ tin cậy của link và website\n🛡️ Phát hiện email và tin nhắn lừa đảo\n📰 Xác minh thông tin và tin tức\n💡 Tư vấn về an toàn mạng\n\nHãy gửi cho tôi link hoặc câu hỏi bạn muốn kiểm tra!',
              sender: 'bot',
              timestamp: new Date(Date.now() - 1700000),
              reactions: [],
              status: 'sent',
              isRead: true
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
              reactions: [],
              status: 'sent',
              isRead: true
            },
            {
              id: '2',
              text: '• Khắc phục sự cố kỹ thuật\n• Hướng dẫn sử dụng tính năng\n• Báo cáo lỗi\n• Góp ý cải thiện\n\nVui lòng mô tả vấn đề bạn gặp phải.',
              sender: 'bot',
              timestamp: new Date(Date.now() - 3500000),
              reactions: [],
              status: 'sent',
              isRead: false
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
              reactions: [],
              status: 'sent',
              isRead: true
            },
            {
              id: '2',
              text: 'Đây là nơi mọi người chia sẻ kinh nghiệm, thảo luận về an toàn mạng và hỗ trợ lẫn nhau.',
              sender: 'bot',
              timestamp: new Date(Date.now() - 7100000),
              reactions: [],
              status: 'sent',
              isRead: true
            },
            {
              id: '3',
              text: 'Cảm ơn mọi người đã hỗ trợ! Tôi đã học được nhiều điều mới.',
              sender: 'user',
              timestamp: new Date(Date.now() - 3600000),
              reactions: [],
              status: 'read',
              isRead: true
            }
          ];
          break;

        case 'expert':
          mockHistory = [
            {
              id: '1',
              text: 'Chào bạn! Tôi là chuyên gia bảo mật của FactCheck.',
              sender: 'bot',
              timestamp: new Date(Date.now() - 86400000),
              reactions: [],
              status: 'sent',
              isRead: true
            },
            {
              id: '2',
              text: 'Tài liệu bạn yêu cầu đã được gửi. Kiểm tra email nhé!',
              sender: 'bot',
              timestamp: new Date(Date.now() - 86300000),
              reactions: [],
              status: 'sent',
              isRead: false
            }
          ];
          break;

        default:
          mockHistory = [];
      }

      setChatHistory(mockHistory);
    }
  }, [selectedChat]);

  // Enhanced message display with performance optimization
  const MAX_MESSAGES = 20; // Limit messages like ChatBot.js
  const displayMessages = useMemo(() => {
    return chatHistory.slice(-MAX_MESSAGES);
  }, [chatHistory]);

  // Enhanced typing detection
  const handleTyping = () => {
    if (!userTyping) {
      setUserTyping(true);
      // Simulate sending typing status to other users
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setUserTyping(false);
    }, 2000);
  };



  const handleMessageReaction = (messageId, emoji) => {
    setChatHistory(prev =>
      prev.map(msg => {
        if (msg.id === messageId) {
          const existingReaction = msg.reactions?.find(r => r.emoji === emoji);
          let newReactions = [...(msg.reactions || [])];

          if (existingReaction) {
            newReactions = newReactions.map(r =>
              r.emoji === emoji
                ? { ...r, count: r.count + 1 }
                : r
            );
          } else {
            newReactions.push({ emoji, count: 1 });
          }

          return { ...msg, reactions: newReactions };
        }
        return msg;
      })
    );
  };

  const formatTime = (date) => {
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'Vừa xong';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} phút`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} giờ`;
    return date.toLocaleDateString('vi-VN');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-400';
      case 'away':
        return 'bg-yellow-400';
      case 'offline':
        return 'bg-gray-400';
      default:
        return 'bg-gray-400';
    }
  };

  const getMessageStatusIcon = (status) => {
    switch (status) {
      case 'sending':
        return <Clock size={12} className="text-gray-400" />;
      case 'sent':
        return <Check size={12} className="text-gray-400" />;
      case 'read':
        return <CheckCheck size={12} className="text-blue-500" />;
      default:
        return null;
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className={`messenger-layout ${isDarkMode ? 'dark' : ''}`}
      data-theme={isDarkMode ? 'dark' : 'light'}
      style={{ height: '100%' }}
    >
      {/* Main Chat Container */}
      <div className="messenger-content" style={{ height: '100%' }}>
        {/* Mobile Overlay */}
        {sidebarOpen && isMobile && (
          <button
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            onKeyDown={(e) => e.key === 'Escape' && setSidebarOpen(false)}
            aria-label="Đóng menu"
          />
        )}

        {/* Enhanced Sidebar - Conversations List */}
        <div className={`messenger-sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${sidebarOpen ? 'open' : ''}`}>
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              {!sidebarCollapsed && (
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    Đoạn chat
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {conversations.length} cuộc trò chuyện
                  </p>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all duration-200"
                  title={sidebarCollapsed ? "Mở rộng" : "Thu gọn"}
                >
                  {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                </button>
                {!sidebarCollapsed && (
                  <>
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all duration-200">
                      <UserPlus size={20} className="text-gray-600 dark:text-gray-400" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all duration-200">
                      <Settings size={20} className="text-gray-600 dark:text-gray-400" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Enhanced Search */}
            {!sidebarCollapsed && (
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm đoạn chat... (Ctrl+K)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="messenger-search-input w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-700 border-0 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white placeholder-gray-500 transition-all duration-200"
                />
              </div>
            )}
          </div>

          {/* Filter Tabs */}
          {!sidebarCollapsed && (
            <div className="p-2 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <button className="px-3 py-1.5 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full text-sm font-medium transition-all duration-200">
                  Tất cả
                </button>
                <button className="px-3 py-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-sm transition-all duration-200">
                  Chưa đọc ({conversations.filter(c => c.unread > 0).length})
                </button>
                <button className="px-3 py-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-sm transition-all duration-200">
                  Online ({conversations.filter(c => c.online).length})
                </button>
              </div>
            </div>
          )}

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.map((conversation) => (
              <motion.div
                key={conversation.id}
                onClick={() => setSelectedChat(conversation)}
                className={`${sidebarCollapsed ? 'p-3' : 'p-4'} cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 ${selectedChat?.id === conversation.id ? 'bg-blue-50 dark:bg-blue-900/20 border-r-3 border-blue-500' : ''
                  }`}
                whileHover={{ x: sidebarCollapsed ? 0 : 2 }}
                transition={{ duration: 0.2 }}
                title={sidebarCollapsed ? conversation.name : ''}
              >
                {sidebarCollapsed ? (
                  /* Collapsed view */
                  <div className="flex justify-center">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-lg font-semibold shadow-md">
                        {conversation.avatar}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${getStatusColor(conversation.status)} border-2 border-white dark:border-gray-800 rounded-full`}></div>
                      {conversation.unread > 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse">
                          {conversation.unread > 9 ? '9+' : conversation.unread}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Expanded view */
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-lg font-semibold shadow-md">
                        {conversation.avatar}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${getStatusColor(conversation.status)} border-2 border-white dark:border-gray-800 rounded-full transition-all duration-200`}></div>
                      {conversation.isTyping && (
                        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                          <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                            Đang nhập...
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate text-base">
                          {conversation.name}
                        </h3>
                        <div className="flex items-center space-x-1">
                          {conversation.unread > 0 && (
                            <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full font-bold min-w-[20px] text-center animate-pulse">
                              {conversation.unread > 9 ? '9+' : conversation.unread}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate flex-1">
                          {conversation.isTyping ? (
                            <span className="text-blue-500 italic">Đang nhập...</span>
                          ) : conversation.lastMessage}
                        </p>
                        <span className="text-xs text-gray-500 dark:text-gray-500 ml-2">
                          {formatTime(conversation.timestamp)}
                        </span>
                      </div>
                      {conversation.type === 'group' && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {conversation.members} thành viên • Hoạt động {formatTime(conversation.lastSeen)}
                        </p>
                      )}
                      {conversation.status === 'offline' && conversation.type !== 'group' && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          Hoạt động {formatTime(conversation.lastSeen)}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Enhanced Main Chat Area */}
        <div className="messenger-chat-area">
          {selectedChat ? (
            <>
              {/* Enhanced Chat Header */}
              <div className="flex-shrink-0 h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm pl-4 py-2 pr-[130px]">
                <div className="flex items-center justify-between h-full">
                  <div className="flex items-center space-x-3">
                    {isMobile && (
                      <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all duration-200"
                      >
                        <ArrowLeft size={20} />
                      </button>
                    )}
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold shadow-md">
                        {selectedChat.avatar}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-3 h-3 ${getStatusColor(selectedChat.status)} border-2 border-white dark:border-gray-800 rounded-full`}></div>
                    </div>
                    <div>
                      <h2 className="font-semibold text-gray-900 dark:text-white text-base">
                        {selectedChat.name}
                      </h2>
                      <div className="flex items-center space-x-1">
                        {selectedChat.online && selectedChat.status === 'active' ? (
                          <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                            Đang hoạt động
                          </p>
                        ) : selectedChat.type === 'group' ? (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {selectedChat.members} thành viên
                          </p>
                        ) : (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Hoạt động {formatTime(selectedChat.lastSeen)}
                          </p>
                        )}
                        {isTyping && (
                          <span className="text-xs text-blue-500 italic animate-pulse">
                            • Đang nhập...
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all duration-200" title="Gọi điện">
                      <Phone size={18} className="text-gray-600 dark:text-gray-400" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all duration-200" title="Video call">
                      <Video size={18} className="text-gray-600 dark:text-gray-400" />
                    </button>
                    <button
                      onClick={() => setShowChatInfo(!showChatInfo)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all duration-200"
                      title="Thông tin cuộc trò chuyện (Ctrl+F)"
                    >
                      <Info size={18} className="text-gray-600 dark:text-gray-400" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all duration-200" title="Tùy chọn khác">
                      <MoreHorizontal size={18} className="text-gray-600 dark:text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Messages Area - Messenger Bubble Style */}
              <div className="messenger-messages-area px-0">
                <div className="messenger-bubble-container mx-0 w-[100%] px-0 max-w-full">
                  {/* Message limit notification */}
                  {chatHistory.length > MAX_MESSAGES && (
                    <div className="text-center py-2 mb-4">
                      <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                        Hiển thị {MAX_MESSAGES} tin nhắn gần nhất (Tổng: {chatHistory.length})
                      </span>
                    </div>
                  )}

                  <AnimatePresence>
                    {displayMessages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`message-container ${msg.sender}`}
                        style={{
                          display: 'flex',
                          flexDirection: 'row',
                          alignItems: 'flex-end',
                          justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                          marginBottom: '12px',
                          width: '100%',
                          paddingRight: msg.sender === 'user' ? 0 : undefined,
                          paddingLeft: msg.sender === 'user' ? undefined : 0
                        }}
                      >

                        {/* Avatar bot chỉ render 1 lần bên trái */}
                        {msg.sender === 'bot' && (
                          <div className="message-avatar" style={{ marginRight: 8 }}>
                            🤖
                          </div>
                        )}


                        <div className="message-content" style={{ width: 'auto', display: 'flex', flexDirection: 'column', alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                          <div className="relative group">
                            <div
                              className={`message-bubble ${msg.sender}`}
                              style={{
                                marginLeft: msg.sender === 'user' ? 'auto' : '',
                                marginRight: msg.sender === 'user' ? '0' : '',
                                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                                maxWidth: msg.sender === 'user' ? '700px' : '70%',
                                minWidth: '120px',
                                width: 'auto',
                                wordWrap: 'break-word',
                                wordBreak: 'break-word',
                                overflowWrap: 'break-word',
                                whiteSpace: 'pre-wrap',
                                hyphens: 'auto',
                                WebkitHyphens: 'auto',
                                lineHeight: '1.5',
                                boxSizing: 'border-box',
                                background: msg.sender === 'user' ? '#269af2' : '',
                                color: msg.sender === 'user' ? '#fff' : ''
                              }}
                            >
                              <div
                                style={{
                                  wordSpacing: 'normal',
                                  letterSpacing: 'normal',
                                  textAlign: 'left'
                                }}
                              >
                                {/* Show short, and expand to full if needed */}
                                {msg.isExpandable ? (
                                  <ExpandableMessage
                                    short={typeof msg.text === 'string' ? msg.text : ''} // Ensure string
                                    full={typeof msg.fullContent === 'string' ? msg.fullContent : ''} // Ensure string
                                  />
                                ) : (
                                  typeof msg.text === 'string' ? msg.text : '' // Ensure string here too
                                )}
                              </div>
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
                            {msg.sender === 'user' && (
                              <span className="ml-1">
                                {getMessageStatusIcon(msg.status)}
                              </span>
                            )}
                          </div>
                        </div>
                        {/* Avatar user chỉ render 1 lần bên phải */}
                        {msg.sender === 'user' && (
                          <div className="message-avatar" style={{ marginLeft: 8, marginRight: 0 }}>
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
              </div>

              {/* Message Input - Messenger Style */}
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
                  aria-label="Đính kèm file"
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
                  aria-label="Đính kèm hình ảnh"
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    } else {
                      handleTyping();
                    }
                  }}
                  placeholder="Aa"
                  className="messenger-input-box"
                  rows={1}
                />

                {/* Emoji button */}
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="messenger-attachment-button"
                  title="Emoji"
                  aria-label="Chọn emoji"
                >
                  <Smile size={18} />
                </button>

                {/* Send button or Voice button */}
                {message.trim() ? (
                  <button
                    onClick={handleSendMessage}
                    className="messenger-send-button"
                    title="Gửi"
                    aria-label="Gửi tin nhắn"
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
                    className={`messenger-send-button transition-all duration-200 ${isRecording
                      ? 'bg-red-500 hover:bg-red-600 scale-110 animate-pulse'
                      : 'bg-gray-400 hover:bg-gray-500'
                      }`}
                    title={isRecording ? "Đang ghi âm... (thả để gửi)" : "Giữ để ghi âm"}
                    aria-label={isRecording ? "Đang ghi âm tin nhắn" : "Giữ để ghi âm tin nhắn"}
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

function ExpandableMessage({ short, full }) {
  const [expanded, setExpanded] = useState(false);

  // Clean up excessive newlines: replace 3+ \n with just 1
  const cleanText = (text) =>
    typeof text === 'string'
      ? text
        // Xóa các dòng chỉ có khoảng trắng hoặc chỉ có \n
        .replace(/^\s*[\r\n]/gm, '')
        // Thay thế 3+ dấu xuống dòng liên tiếp thành 2
        .replace(/\n{2,}/g, '\n\n')
        // Loại bỏ khoảng trắng đầu/cuối
        .trim()
      : '';

  return (
    <>
      {expanded ? (
        <>
          <ReactMarkdown>{cleanText(full)}</ReactMarkdown>
          <button
            className="ml-2 text-blue-500 underline text-xs"
            onClick={() => setExpanded(false)}
            style={{ cursor: 'pointer' }}
          >
            Thu gọn
          </button>
        </>
      ) : (
        <>
          <ReactMarkdown>{cleanText(short)}</ReactMarkdown>
          <button
            className="ml-2 text-blue-500 underline text-xs"
            onClick={() => setExpanded(true)}
            style={{ cursor: 'pointer' }}
          >
            Xem đầy đủ
          </button>
        </>
      )}
    </>
  );
}

export default ModernMessengerLayout;
