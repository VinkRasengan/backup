import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import communityAPI from '../services/communityAPI';

const TestIntegrationPage = () => {
  const { user } = useAuth();
  const [testResults, setTestResults] = useState({});
  const [loading, setLoading] = useState(false);

  const testVoting = async () => {
    setLoading(true);
    try {
      const testPostId = 'test-integration-post-' + Date.now();
      
      // Test upvote
      const voteResult = await communityAPI.submitVote(
        testPostId, 
        'upvote',
        user?.uid || 'test-user',
        user?.email || 'test@example.com'
      );
      
      // Test getting vote stats
      const statsResult = await communityAPI.getVoteStats(testPostId);
      
      setTestResults(prev => ({
        ...prev,
        voting: {
          success: true,
          voteResult,
          statsResult,
          message: 'Voting functionality works!'
        }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        voting: {
          success: false,
          error: error.message,
          message: 'Voting functionality failed!'
        }
      }));
    } finally {
      setLoading(false);
    }
  };

  const testCommenting = async () => {
    setLoading(true);
    try {
      const testPostId = 'test-integration-post-' + Date.now();
      
      // Test adding comment
      const commentResult = await communityAPI.addComment(
        testPostId,
        'This is a test comment from the integration test',
        user?.uid || 'test-user',
        user?.email || 'test@example.com',
        user?.displayName || 'Test User'
      );
      
      // Test getting comments
      const commentsResult = await communityAPI.getComments(testPostId);
      
      setTestResults(prev => ({
        ...prev,
        commenting: {
          success: true,
          commentResult,
          commentsResult,
          message: 'Commenting functionality works!'
        }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        commenting: {
          success: false,
          error: error.message,
          message: 'Commenting functionality failed!'
        }
      }));
    } finally {
      setLoading(false);
    }
  };

  const testAPIConnection = async () => {
    setLoading(true);
    try {
      // Test basic API connection
      const response = await fetch('http://localhost:8080/health');
      const healthData = await response.json();
      
      setTestResults(prev => ({
        ...prev,
        apiConnection: {
          success: response.ok,
          healthData,
          message: response.ok ? 'API Gateway connection works!' : 'API Gateway connection failed!'
        }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        apiConnection: {
          success: false,
          error: error.message,
          message: 'API Gateway connection failed!'
        }
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Integration Test Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <button
          onClick={testAPIConnection}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg disabled:opacity-50"
        >
          Test API Connection
        </button>
        
        <button
          onClick={testVoting}
          disabled={loading}
          className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg disabled:opacity-50"
        >
          Test Voting
        </button>
        
        <button
          onClick={testCommenting}
          disabled={loading}
          className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg disabled:opacity-50"
        >
          Test Commenting
        </button>
      </div>

      {loading && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2">Testing...</p>
        </div>
      )}

      <div className="space-y-6">
        {Object.entries(testResults).map(([testName, result]) => (
          <div key={testName} className="border rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4 capitalize">{testName} Test</h3>
            
            <div className={`p-4 rounded-lg mb-4 ${
              result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              <p className="font-medium">{result.message}</p>
              {result.error && <p className="text-sm mt-2">Error: {result.error}</p>}
            </div>
            
            {result.success && (
              <div className="bg-gray-100 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Test Results:</h4>
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 p-6 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">User Info</h3>
        <pre className="text-sm">
          {JSON.stringify({
            authenticated: !!user,
            uid: user?.uid,
            email: user?.email,
            displayName: user?.displayName
          }, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default TestIntegrationPage;
