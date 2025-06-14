import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  CheckCircle, 
  XCircle,
  Loader,
  Menu,
  Settings,
  Plus,
  Maximize2
} from 'lucide-react';
import TabNavigation from '../components/navigation/TabNavigation';

const MessengerTestPage = () => {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState({});

  const testMessages = [
    'Xin chào! Tôi muốn tìm hiểu về bảo mật mạng',
    'Làm thế nào để nhận biết email lừa đảo?',
    'Cách tạo mật khẩu mạnh và an toàn?',
    'Kiểm tra tính an toàn của website như thế nào?',
    'Bảo vệ thông tin cá nhân trên mạng xã hội'
  ];

  const handleSendMessage = async (testMessage = null) => {
    const messageToSend = testMessage || message.trim();
    if (!messageToSend) return;

    setLoading(true);
    
    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      text: messageToSend,
      sender: 'user',
      timestamp: new Date()
    };
    setChatHistory(prev => [...prev, userMessage]);

    try {
      console.log('🤖 Testing Gemini AI with message:', messageToSend);
      
      const response = await fetch('/api/chat/openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('backendToken')}`
        },
        body: JSON.stringify({ 
          message: messageToSend,
          provider: 'gemini'
        })
      });

      console.log('📡 Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Gemini Response:', data);
        
        const botResponse = {
          id: (Date.now() + 1).toString(),
          text: data.data?.response?.content || data.data?.message || 'Phản hồi từ Gemini AI',
          sender: 'bot',
          timestamp: new Date(),
          provider: data.data?.response?.source || 'gemini'
        };

        setChatHistory(prev => [...prev, botResponse]);
        
        // Update test results
        setTestResults(prev => ({
          ...prev,
          [messageToSend]: {
            success: true,
            provider: data.data?.response?.source,
            responseTime: Date.now() - userMessage.timestamp.getTime()
          }
        }));
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'API request failed');
      }
    } catch (error) {
      console.error('❌ Chat Error:', error);
      
      const errorResponse = {
        id: (Date.now() + 1).toString(),
        text: `❌ Lỗi: ${error.message}`,
        sender: 'bot',
        timestamp: new Date(),
        error: true
      };

      setChatHistory(prev => [...prev, errorResponse]);
      
      // Update test results
      setTestResults(prev => ({
        ...prev,
        [messageToSend]: {
          success: false,
          error: error.message
        }
      }));
    } finally {
      setLoading(false);
      setMessage('');
    }
  };

  const runAllTests = async () => {
    for (const testMsg of testMessages) {
      await handleSendMessage(testMsg);
      // Wait 2 seconds between tests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  };

  const formatTime = (date) => {
    return new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <TabNavigation />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🧪 Messenger & Gemini AI Test
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Test giao diện Messenger-style và tích hợp Gemini AI
          </p>
        </div>

        {/* Test Features Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <MessageCircle className="text-blue-600" size={20} />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Messenger UI</span>
            </div>
            <div className="text-2xl font-bold text-blue-600 mt-1">✅</div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <Bot className="text-green-600" size={20} />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Gemini AI</span>
            </div>
            <div className="text-2xl font-bold text-green-600 mt-1">🤖</div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <Menu className="text-purple-600" size={20} />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Sticky Menu</span>
            </div>
            <div className="text-2xl font-bold text-purple-600 mt-1">📌</div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <Settings className="text-orange-600" size={20} />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Navigation</span>
            </div>
            <div className="text-2xl font-bold text-orange-600 mt-1">🧭</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chat Interface */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                <MessageCircle size={20} />
                <span>Chat với Gemini AI</span>
              </h2>
            </div>
            
            {/* Messages */}
            <div className="h-96 overflow-y-auto p-4 space-y-4">
              {chatHistory.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-start space-x-3 ${msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    msg.sender === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : msg.error 
                        ? 'bg-red-600 text-white'
                        : 'bg-green-600 text-white'
                  }`}>
                    {msg.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white'
                      : msg.error
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {formatTime(msg.timestamp)} {msg.provider && `• ${msg.provider}`}
                    </p>
                  </div>
                </motion.div>
              ))}
              
              {loading && (
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                    <Loader className="animate-spin text-white" size={16} />
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Gemini AI đang suy nghĩ...</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={loading || !message.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Test Controls & Results */}
          <div className="space-y-6">
            {/* Quick Tests */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Tests</h3>
              
              <div className="space-y-2 mb-4">
                {testMessages.map((testMsg, index) => (
                  <button
                    key={index}
                    onClick={() => handleSendMessage(testMsg)}
                    disabled={loading}
                    className="w-full text-left px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {testMsg}
                  </button>
                ))}
              </div>
              
              <button
                onClick={runAllTests}
                disabled={loading}
                className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg transition-colors"
              >
                {loading ? 'Đang test...' : 'Chạy tất cả tests'}
              </button>
            </div>

            {/* Test Results */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Test Results</h3>
              
              <div className="space-y-2">
                {Object.entries(testResults).map(([msg, result]) => (
                  <div key={msg} className="flex items-start space-x-2 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    {result.success ? (
                      <CheckCircle className="text-green-600 mt-0.5" size={16} />
                    ) : (
                      <XCircle className="text-red-600 mt-0.5" size={16} />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{msg}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {result.success 
                          ? `✅ ${result.provider} • ${result.responseTime}ms`
                          : `❌ ${result.error}`
                        }
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sticky Elements Demo */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Sticky Elements</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                  <span className="text-sm text-blue-800 dark:text-blue-400">Menu Button</span>
                  <Menu className="text-blue-600" size={16} />
                </div>
                
                <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded">
                  <span className="text-sm text-green-800 dark:text-green-400">Quick Chat</span>
                  <MessageCircle className="text-green-600" size={16} />
                </div>
                
                <div className="flex items-center justify-between p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                  <span className="text-sm text-purple-800 dark:text-purple-400">+ Widget</span>
                  <Plus className="text-purple-600" size={16} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessengerTestPage;
