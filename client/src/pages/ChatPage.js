import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  MessageCircle, 
  Shield, 
  Trash2, 
  Plus,
  Bot,
  User,
  Lightbulb,
  Clock
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { ChatInput } from '../components/ui/ChatInput';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { chatAPI } from '../services/api';
// import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// Debug function
const debugAPI = async () => {
  console.log('🔍 Debug API calls...');
  try {
    const starters = await chatAPI.getConversationStarters();
    console.log('✅ Starters:', starters.data);
  } catch (error) {
    console.error('❌ Starters error:', error.response?.data || error.message);
  }

  try {
    const conversations = await chatAPI.getConversations();
    console.log('✅ Conversations:', conversations.data);
  } catch (error) {
    console.error('❌ Conversations error:', error.response?.data || error.message);
  }
};

// Add to window for debugging
window.debugAPI = debugAPI;

const ChatPage = () => {
  // const { user } = useAuth(); // Unused for now
  const [debugInfo, setDebugInfo] = useState('');
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [conversationStarters, setConversationStarters] = useState([
    "Làm thế nào để nhận biết email lừa đảo?",
    "Cách tạo mật khẩu mạnh và an toàn?",
    "Dấu hiệu nhận biết website giả mạo?",
    "Cách kiểm tra link có an toàn không?"
  ]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversations and starters on mount
  useEffect(() => {
    // Make toast available globally for mock API notifications
    window.toast = toast;

    loadConversations();
    loadConversationStarters();
  }, []);

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Loading conversations...');
      const response = await chatAPI.getConversations();
      console.log('✅ Conversations loaded:', response.data);
      setConversations(response.data.conversations);
    } catch (error) {
      console.error('❌ Error loading conversations:', error);
      console.error('Error details:', error.response?.data || error.message);
      toast.error(`Không thể tải danh sách cuộc trò chuyện: ${error.response?.data?.error || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loadConversationStarters = async () => {
    try {
      const response = await chatAPI.getConversationStarters();
      if (response.data.starters && response.data.starters.length > 0) {
        setConversationStarters(response.data.starters);
      }
    } catch (error) {
      console.error('Error loading conversation starters:', error);
      // Keep default starters if API fails
    }
  };

  const loadConversation = async (conversationId) => {
    try {
      setIsLoading(true);
      const response = await chatAPI.getConversation(conversationId);
      setCurrentConversation(response.data.conversation);
      setMessages(response.data.messages);
    } catch (error) {
      console.error('Error loading conversation:', error);
      toast.error('Không thể tải cuộc trò chuyện');
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (messageText = newMessage) => {
    if (!messageText.trim()) return;

    try {
      setIsSending(true);
      console.log('📤 Sending message:', messageText);
      const response = await chatAPI.sendOpenAIMessage({
        message: messageText
      });
      console.log('✅ Message sent:', response.data);

      // Add user message immediately
      const userMessage = {
        role: 'user',
        content: messageText,
        createdAt: new Date().toISOString()
      };

      // Add AI response
      const aiMessage = {
        role: 'assistant',
        content: response.data.data.response.content,
        createdAt: response.data.data.response.createdAt
      };

      setMessages(prev => [...prev, userMessage, aiMessage]);

      // Create a simple conversation for UI purposes (no backend storage for public endpoint)
      if (!currentConversation) {
        const newConversation = {
          id: `temp-${Date.now()}`,
          title: messageText.substring(0, 50) + (messageText.length > 50 ? '...' : ''),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setCurrentConversation(newConversation);
      }

      setNewMessage('');

      // Focus back to input after sending
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);

      toast.success('Tin nhắn đã được gửi');

    } catch (error) {
      console.error('❌ Error sending message:', error);
      console.error('Error details:', error.response?.data || error.message);

      // Show appropriate error message based on error type
      let errorMessage = 'Không thể gửi tin nhắn';

      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = 'Lỗi kết nối mạng. Vui lòng kiểm tra internet và thử lại.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
      } else if (error.response?.status === 429) {
        errorMessage = 'Đã vượt quá giới hạn. Vui lòng thử lại sau ít phút.';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Lỗi máy chủ. Vui lòng thử lại sau.';
      }

      toast.error(errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  const startNewConversation = () => {
    setCurrentConversation(null);
    setMessages([]);
    setNewMessage('');
  };

  const deleteConversation = async (conversationId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa cuộc trò chuyện này?')) {
      return;
    }

    try {
      await chatAPI.deleteConversation(conversationId);
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      
      if (currentConversation?.id === conversationId) {
        startNewConversation();
      }
      
      toast.success('Đã xóa cuộc trò chuyện');
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast.error('Không thể xóa cuộc trò chuyện');
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto h-screen flex flex-col">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center py-4 px-4 md:px-6 flex-shrink-0 border-b border-gray-200/50 dark:border-gray-700/50"
        >
          <div className="mx-auto w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-2">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1">
            FactCheck AI
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base">
            Trợ lý bảo mật thông minh - Phân tích mối đe dọa & Kiểm tra độ tin cậy
          </p>



          {/* Debug Panel */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg border border-yellow-300 dark:border-yellow-700 max-w-md mx-auto">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">🔧 Debug</span>
                <button
                  onClick={async () => {
                    setDebugInfo('Testing...');
                    try {
                      const starters = await chatAPI.getConversationStarters();
                      const conversations = await chatAPI.getConversations();
                      setDebugInfo(`✅ API OK - Starters: ${starters.data.starters?.length}, Conversations: ${conversations.data.conversations?.length}`);
                    } catch (error) {
                      setDebugInfo(`❌ API Error: ${error.response?.data?.error || error.message}`);
                    }
                  }}
                  className="px-2 py-1 text-xs bg-yellow-200 dark:bg-yellow-800 rounded hover:bg-yellow-300 dark:hover:bg-yellow-700"
                >
                  Test API
                </button>
              </div>
              {debugInfo && (
                <p className="text-xs text-yellow-700 dark:text-yellow-300 font-mono break-all">{debugInfo}</p>
              )}
            </div>
          )}
        </motion.div>

        {/* Main Content Area */}
        <div className="flex-1 min-h-0 p-4 md:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-full">
            {/* Conversations Sidebar */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:col-span-1 h-full"
            >
              <Card className="h-full shadow-lg border border-gray-200/50 dark:border-gray-700/50 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
              <CardHeader className="py-4 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    Cuộc trò chuyện
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={startNewConversation}
                    className="p-2 h-8 w-8"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto px-4 pb-4">
                <div className="space-y-2">
                  {conversations.map((conversation) => (
                    <motion.div
                      key={conversation.id}
                      whileHover={{ scale: 1.01 }}
                      className={`p-3 rounded-xl cursor-pointer transition-all duration-200 group ${
                        currentConversation?.id === conversation.id
                          ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 shadow-sm'
                          : 'bg-gray-50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/50 border border-transparent hover:border-gray-200 dark:hover:border-gray-600'
                      }`}
                      onClick={() => loadConversation(conversation.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {conversation.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(conversation.updatedAt)}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteConversation(conversation.id);
                          }}
                        >
                          <Trash2 className="w-3 h-3 text-red-500" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                  
                  {conversations.length === 0 && !isLoading && (
                    <div className="text-center py-8">
                      <MessageCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        Chưa có cuộc trò chuyện nào
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

            {/* Chat Area */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="lg:col-span-3 h-full"
            >
              <Card className="h-full shadow-lg border border-gray-200/50 dark:border-gray-700/50 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm flex flex-col">
                {/* Chat Header */}
                <CardHeader className="py-3 px-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Bot className="w-5 h-5 text-blue-500" />
                    {currentConversation ? currentConversation.title : 'Cuộc trò chuyện mới'}
                  </CardTitle>
                </CardHeader>

                {/* Messages Area - Fixed height calculation */}
                <CardContent className="flex-1 overflow-y-auto p-4 min-h-0">
                {messages.length === 0 && !currentConversation && (
                  <div className="h-full flex flex-col items-center justify-center">
                    <Bot className="w-12 h-12 text-blue-500 mb-3" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      Chào mừng đến với FactCheck AI! 🛡️
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-center mb-4 max-w-md text-sm">
                      Tôi là chuyên gia bảo mật AI, sẵn sàng giúp bạn phân tích mối đe dọa và kiểm tra độ tin cậy.
                    </p>
                    
                    {/* Conversation Starters */}
                    <div className="w-full max-w-xl">
                      <div className="flex items-center gap-2 mb-3">
                        <Lightbulb className="w-4 h-4 text-yellow-500" />
                        <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                          Câu hỏi gợi ý:
                        </span>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {conversationStarters.slice(0, 4).map((starter, index) => (
                          <motion.button
                            key={`starter-${index}`}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            className="p-2.5 text-left bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700 transition-colors"
                            onClick={() => sendMessage(starter)}
                          >
                            <span className="text-xs text-blue-800 dark:text-blue-200">
                              {starter}
                            </span>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Messages */}
                <div className="space-y-4">
                  <AnimatePresence>
                    {messages.map((message, index) => (
                      <motion.div
                        key={`message-${index}-${message.createdAt}`}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.3 }}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex items-start gap-3 max-w-[80%] ${
                          message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                        }`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
                            message.role === 'user'
                              ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                              : 'bg-gradient-to-r from-purple-500 to-blue-500'
                          }`}>
                            {message.role === 'user' ? (
                              <User className="w-4 h-4 text-white" />
                            ) : (
                              <Bot className="w-4 h-4 text-white" />
                            )}
                          </div>
                          <div className={`rounded-2xl px-4 py-3 shadow-sm ${
                            message.role === 'user'
                              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-md'
                              : 'bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-md border border-gray-200 dark:border-gray-600'
                          }`}>
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                            <p className={`text-xs mt-2 ${
                              message.role === 'user'
                                ? 'text-blue-100'
                                : 'text-gray-500 dark:text-gray-400'
                            }`}>
                              {formatTime(message.createdAt)}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
                <div ref={messagesEndRef} />
              </CardContent>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 bg-white/50 dark:bg-gray-800/50">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage();
                  }}
                  className="flex gap-3 items-start"
                >
                  <div className="flex-1">
                    <ChatInput
                      ref={inputRef}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Hỏi về bảo mật, phishing, malware..."
                      className="w-full h-11 text-sm"
                      disabled={isSending}
                      maxLength={500}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      autoComplete="off"
                      spellCheck="false"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                      💡 Hỏi về bảo mật, kiểm tra link, phân tích mối đe dọa
                    </p>
                  </div>
                  <Button
                    type="submit"
                    loading={isSending}
                    disabled={!newMessage.trim() || isSending}
                    className="px-4 py-2 h-11 flex-shrink-0 text-sm bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    {!isSending && <Send className="w-4 h-4" />}
                  </Button>
                </form>
              </div>
            </Card>
          </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
