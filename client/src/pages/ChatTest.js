import React, { useState } from 'react';
import { chatAPI } from '../services/api';

const ChatTest = () => {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const testWidgetChat = async () => {
    if (!message.trim()) return;
    
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      console.log('🧪 Testing widget chat with message:', message);
      const result = await chatAPI.sendWidgetMessage({
        message: message.trim()
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Chat API Test
        </h1>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Widget Chat Test</h2>
          
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter test message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && testWidgetChat()}
            />
            <button
              onClick={testWidgetChat}
              disabled={loading || !message.trim()}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Testing...' : 'Test Widget'}
            </button>
          </div>

          {/* Response Display */}
          {response && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-green-600 mb-2">✅ Success Response:</h3>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <pre className="text-sm text-green-800 whitespace-pre-wrap">
                  {JSON.stringify(response, null, 2)}
                </pre>
              </div>
              
              {response.response && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">Bot Response:</h4>
                  <p className="text-blue-700">{response.response.content}</p>
                  <p className="text-xs text-blue-500 mt-2">
                    Source: {response.response.source} | 
                    Time: {new Date(response.response.createdAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-red-600 mb-2">❌ Error Response:</h3>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <pre className="text-sm text-red-800 whitespace-pre-wrap">
                  {JSON.stringify(error, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Quick Test Buttons */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Tests</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              'hello',
              'xin chào',
              'email lừa đảo',
              'mật khẩu an toàn',
              'website',
              'tin giả',
              'bảo mật',
              'giúp đỡ'
            ].map((testMsg) => (
              <button
                key={testMsg}
                onClick={() => {
                  setMessage(testMsg);
                  setTimeout(() => testWidgetChat(), 100);
                }}
                disabled={loading}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm disabled:opacity-50"
              >
                {testMsg}
              </button>
            ))}
          </div>
        </div>

        {/* API Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">API Information</h2>
          <div className="space-y-2 text-sm">
            <p><strong>Endpoint:</strong> POST /api/chat/widget</p>
            <p><strong>Base URL:</strong> http://localhost:5000</p>
            <p><strong>Expected Response:</strong> JSON with data.response.content</p>
            <p><strong>Purpose:</strong> Test widget chat functionality</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatTest;
