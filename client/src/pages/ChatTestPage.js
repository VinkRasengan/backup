import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Send, TestTube } from 'lucide-react';
import { chatAPI } from '../services/api';

const ChatTestPage = () => {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const testWidgetChat = async (testMessage = message) => {
    if (!testMessage.trim()) return;
    
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      console.log('🧪 Testing widget chat with message:', testMessage);
      const result = await chatAPI.sendWidgetMessage({
        message: testMessage.trim()
      });
      
      console.log('✅ Widget chat response:', result);
      setResponse(result.data);
    } catch (err) {
      console.error('❌ Widget chat error:', err);
      setError({
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
    } finally {
      setLoading(false);
    }
  };

  const quickTests = [
    'Xin chào',
    'Cách kiểm tra link an toàn?',
    'Email lừa đảo',
    'Mật khẩu an toàn',
    'Website độc hại',
    'Tin giả',
    'Bảo mật',
    'Giúp đỡ'
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <TestTube className="w-8 h-8 text-blue-500" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Chat Widget Test
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Test tính năng chat widget và quick replies
          </p>
        </motion.div>

        {/* Test Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6"
        >
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-blue-500" />
            Widget Chat Test
          </h2>
          
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Nhập tin nhắn test..."
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              onKeyPress={(e) => e.key === 'Enter' && testWidgetChat()}
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => testWidgetChat()}
              disabled={loading || !message.trim()}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {loading ? 'Testing...' : 'Test Widget'}
            </motion.button>
          </div>

          {/* Quick Test Buttons */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Quick Tests:</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {quickTests.map((testMsg) => (
                <motion.button
                  key={testMsg}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setMessage(testMsg);
                    setTimeout(() => testWidgetChat(testMsg), 100);
                  }}
                  disabled={loading}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm disabled:opacity-50 transition-colors"
                >
                  {testMsg}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Response Display */}
          {response && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4"
            >
              <h3 className="text-green-800 dark:text-green-400 font-semibold mb-2">✅ Response:</h3>
              <div className="space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Message:</strong> {response.message}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Source:</strong> {response.response?.source}
                </p>
                <div className="bg-white dark:bg-gray-800 rounded p-3 border">
                  <p className="text-gray-900 dark:text-white">{response.response?.content}</p>
                </div>
                <p className="text-xs text-gray-500">
                  Created: {new Date(response.response?.createdAt).toLocaleString()}
                </p>
              </div>
            </motion.div>
          )}

          {/* Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
            >
              <h3 className="text-red-800 dark:text-red-400 font-semibold mb-2">❌ Error:</h3>
              <div className="space-y-2">
                <p className="text-sm text-red-600 dark:text-red-400">
                  <strong>Message:</strong> {error.message}
                </p>
                {error.status && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    <strong>Status:</strong> {error.status}
                  </p>
                )}
                {error.response && (
                  <div className="bg-red-100 dark:bg-red-900/30 rounded p-3 border">
                    <pre className="text-xs text-red-800 dark:text-red-300 overflow-auto">
                      {JSON.stringify(error.response, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6"
        >
          <h3 className="text-blue-800 dark:text-blue-400 font-semibold mb-3">📋 Test Instructions:</h3>
          <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
            <li>• Nhập tin nhắn vào ô input và nhấn "Test Widget" hoặc Enter</li>
            <li>• Sử dụng các nút "Quick Tests" để test nhanh các câu hỏi thường gặp</li>
            <li>• Kiểm tra response từ server có đúng format không</li>
            <li>• Mở Developer Console (F12) để xem logs chi tiết</li>
            <li>• Test cả tiếng Việt và tiếng Anh</li>
          </ul>
        </motion.div>

        {/* Back to Home */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center mt-8"
        >
          <motion.a
            href="/"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            ← Về trang chủ
          </motion.a>
        </motion.div>
      </div>
    </div>
  );
};

export default ChatTestPage;
