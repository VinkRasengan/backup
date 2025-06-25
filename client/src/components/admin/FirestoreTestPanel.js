import React, { useState } from 'react';
import { Database, Play, CheckCircle, AlertCircle, Loader, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import firestoreService from '../../services/firestoreService';

const FirestoreTestPanel = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleTestConnection = async () => {
    setLoading(true);
    setError(null);
    try {
      // Test connection by trying to read from Firestore
      const testResult = await firestoreService.testConnection();
      setResults({
        type: 'connection',
        success: testResult.success,
        message: testResult.success ? 'Kết nối Firestore thành công!' : 'Lỗi kết nối Firestore'
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Seeding functionality removed - use real data from microservices
      setResults({
        type: 'seed',
        success: false,
        message: 'Seeding functionality has been removed. Use real data from microservices instead.',
        details: { note: 'Mock data seeding is no longer available in production.' }
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleValidationTest = async () => {
    setLoading(true);
    setError(null);
    try {
      // Test with clean data
      const testData = {
        title: 'Test validation',
        description: 'Testing data validation',
        url: 'https://example.com',
        status: 'safe',
        finalScore: 85
      };

      const postId = await firestoreService.createPost(testData, user.uid);

      setResults({
        type: 'validation',
        success: true,
        message: `Validation test thành công! Post ID: ${postId}`,
        details: { postId, testData }
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="p-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <div className="flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <span className="text-yellow-800 dark:text-yellow-200">
            Vui lòng đăng nhập để sử dụng Firestore Test Panel
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Database className="w-8 h-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Firestore Test Panel
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-300">
          Test kết nối và seed mock data vào Firestore
        </p>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={handleTestConnection}
          disabled={loading}
          className="flex items-center justify-center space-x-2 p-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
        >
          {loading ? (
            <Loader className="w-5 h-5 animate-spin" />
          ) : (
            <Play className="w-5 h-5" />
          )}
          <span>Test Kết Nối</span>
        </button>

        <button
          onClick={handleValidationTest}
          disabled={loading}
          className="flex items-center justify-center space-x-2 p-4 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg transition-colors"
        >
          {loading ? (
            <Loader className="w-5 h-5 animate-spin" />
          ) : (
            <CheckCircle className="w-5 h-5" />
          )}
          <span>Test Validation</span>
        </button>

        <button
          onClick={handleSeedData}
          disabled={loading}
          className="flex items-center justify-center space-x-2 p-4 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors"
        >
          {loading ? (
            <Loader className="w-5 h-5 animate-spin" />
          ) : (
            <Database className="w-5 h-5" />
          )}
          <span>Seed Mock Data</span>
        </button>
      </div>

      {/* Results */}
      {results && (
        <div className={`p-4 rounded-lg border ${
          results.success 
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
        }`}>
          <div className="flex items-center space-x-2 mb-2">
            {results.success ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
            <span className={`font-semibold ${
              results.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
            }`}>
              {results.success ? 'Thành công!' : 'Thất bại!'}
            </span>
          </div>
          <p className={`${
            results.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
          }`}>
            {results.message}
          </p>
          
          {results.details && (
            <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded border">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Chi tiết:</h4>
              <pre className="text-sm text-gray-600 dark:text-gray-300 overflow-x-auto">
                {JSON.stringify(results.details, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="font-semibold text-red-800 dark:text-red-200">Lỗi:</span>
          </div>
          <p className="text-red-700 dark:text-red-300 mt-1">{error}</p>
        </div>
      )}

      {/* Instructions */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Hướng dẫn:</h3>
        <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
          <li>1. <strong>Test Kết Nối:</strong> Kiểm tra xem có thể kết nối với Firestore không</li>
          <li>2. <strong>Test Validation:</strong> Kiểm tra data validation và clean functions</li>
          <li>3. <strong>Seed Mock Data:</strong> Tạo dữ liệu mẫu để test các tính năng</li>
          <li>4. Sau khi seed data, hãy kiểm tra Community và Check Link pages</li>
          <li>5. Data sẽ xuất hiện trong Navigation sidebar stats</li>
        </ul>
      </div>

      {/* Warning */}
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <div className="flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <span className="font-semibold text-yellow-800 dark:text-yellow-200">Lưu ý:</span>
        </div>
        <p className="text-yellow-700 dark:text-yellow-300 mt-1">
          Chỉ sử dụng trong môi trường development. Không seed data trên production.
        </p>
      </div>

      {/* Current User Info */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Thông tin người dùng:</h3>
        <div className="text-sm text-blue-700 dark:text-blue-300">
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>UID:</strong> {user.uid}</p>
          <p><strong>Verified:</strong> {user.emailVerified ? 'Có' : 'Không'}</p>
        </div>
      </div>
    </div>
  );
};

export default FirestoreTestPanel;
