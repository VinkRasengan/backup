import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import communityAPI from '../../services/communityAPI';

const VoteTest = () => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const [testLinkId] = useState('link1'); // Test with existing link
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const testVote = async (voteType) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('🧪 Testing vote:', { linkId: testLinkId, voteType, user: !!user });
      
      const response = await communityAPI.submitVote(testLinkId, voteType);
      console.log('✅ Vote response:', response);
      
      setResult({
        success: true,
        message: 'Vote submitted successfully!',
        data: response
      });
    } catch (err) {
      console.error('❌ Vote error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const testGetStats = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('🧪 Testing get stats for linkId:', testLinkId);
      
      const response = await communityAPI.getVoteStats(testLinkId);
      console.log('✅ Stats response:', response);
      
      setResult({
        success: true,
        message: 'Stats fetched successfully!',
        data: response
      });
    } catch (err) {
      console.error('❌ Stats error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`p-6 rounded-lg border ${
      isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      <h3 className={`text-lg font-semibold mb-4 ${
        isDarkMode ? 'text-white' : 'text-gray-900'
      }`}>
        Vote API Test
      </h3>

      <div className="space-y-4">
        <div>
          <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Test Link ID: {testLinkId}
          </p>
          <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            User: {user ? user.email : 'Not logged in'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => testVote('safe')}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            Vote Safe
          </button>
          <button
            onClick={() => testVote('suspicious')}
            disabled={loading}
            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
          >
            Vote Suspicious
          </button>
          <button
            onClick={() => testVote('unsafe')}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
          >
            Vote Unsafe
          </button>
          <button
            onClick={testGetStats}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Get Stats
          </button>
        </div>

        {loading && (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Loading...</span>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            <strong>Error:</strong> {error}
          </div>
        )}

        {result && (
          <div className={`p-3 rounded border ${
            result.success 
              ? 'bg-green-100 border-green-400 text-green-700'
              : 'bg-red-100 border-red-400 text-red-700'
          }`}>
            <strong>{result.message}</strong>
            {result.data && (
              <pre className="mt-2 text-xs overflow-auto">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VoteTest;
