import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import SimpleVoteComponent from './SimpleVoteComponent';
import VoteComponent from './VoteComponent';
import { communityAPI } from '../../services/api';
import toast from 'react-hot-toast';

/**
 * Vote System Test Component
 * Tests all edge cases for vote functionality
 */
const VoteTest = () => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const [testResults, setTestResults] = useState([]);
  const [isRunningTests, setIsRunningTests] = useState(false);

  // Test scenarios with expected behaviors
  const testScenarios = [
    {
      name: 'Test 1: Upvote → Upvote (Should remove vote)',
      actions: ['upvote', 'upvote'],
      expectedResult: 'Vote removed, score back to 0'
    },
    {
      name: 'Test 2: Upvote → Downvote (Should change to downvote)',
      actions: ['upvote', 'downvote'],
      expectedResult: 'Score changes from +1 to -1 (difference of -2)'
    },
    {
      name: 'Test 3: Downvote → Upvote (Should change to upvote)',
      actions: ['downvote', 'upvote'],
      expectedResult: 'Score changes from -1 to +1 (difference of +2)'
    },
    {
      name: 'Test 4: No vote → Upvote → Downvote → Remove',
      actions: ['upvote', 'downvote', 'downvote'],
      expectedResult: 'Final score should be 0 (vote removed)'
    }
  ];

  // Mock link for testing
  const testLink = {
    id: 'test-link-' + Date.now(),
    title: 'Test Link for Vote System',
    voteStats: { upvotes: 0, downvotes: 0, total: 0, score: 0 }
  };

  const runTest = async (scenario) => {
    if (!user) {
      toast.error('Please login to run vote tests');
      return { success: false, error: 'Not authenticated' };
    }

    try {
      console.log(`🧪 Running test: ${scenario.name}`);
      const results = [];
      let currentScore = 0;

      for (let i = 0; i < scenario.actions.length; i++) {
        const action = scenario.actions[i];
        console.log(`  Step ${i + 1}: ${action}`);

        // Submit vote
        const response = await communityAPI.submitVote(testLink.id, action);
        
        if (response.success) {
          // Get updated stats
          const statsResponse = await communityAPI.getVoteStats(testLink.id);
          const newScore = statsResponse.success ? statsResponse.data.statistics.score : 0;
          
          results.push({
            step: i + 1,
            action,
            score: newScore,
            scoreChange: newScore - currentScore,
            response: response.action || 'unknown'
          });
          
          currentScore = newScore;
        } else {
          results.push({
            step: i + 1,
            action,
            error: response.error,
            failed: true
          });
        }

        // Small delay between actions
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      return { success: true, results, finalScore: currentScore };
    } catch (error) {
      console.error(`❌ Test failed:`, error);
      return { success: false, error: error.message };
    }
  };

  const runAllTests = async () => {
    if (!user) {
      toast.error('Please login to run tests');
      return;
    }

    setIsRunningTests(true);
    setTestResults([]);
    
    try {
      console.log('🚀 Starting vote system tests...');
      
      for (const scenario of testScenarios) {
        const result = await runTest(scenario);
        setTestResults(prev => [...prev, { scenario, result }]);
        
        // Delay between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      toast.success('All tests completed!');
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      toast.error('Test suite failed: ' + error.message);
    } finally {
      setIsRunningTests(false);
    }
  };

  const handleVoteAPI = async (linkId, voteType) => {
    // This function is called by VoteComponent's onVote prop
    return await communityAPI.submitVote(linkId, voteType);
  };

  return (
    <div className={`p-6 max-w-4xl mx-auto ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">🧪 Vote System Test Suite</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Comprehensive testing for vote functionality edge cases
        </p>
        
        {!user && (
          <div className="mt-4 p-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
            <p className="text-yellow-800 dark:text-yellow-200">
              ⚠️ Please login to run vote tests
            </p>
          </div>
        )}
      </div>

      {/* Test Components */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className={`p-6 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
          <h3 className="text-lg font-semibold mb-4">SimpleVoteComponent</h3>
          <div className="flex items-center justify-center">
            <SimpleVoteComponent linkId={testLink.id} />
          </div>
        </div>

        <div className={`p-6 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
          <h3 className="text-lg font-semibold mb-4">VoteComponent</h3>
          <div className="flex items-center justify-center">
            <VoteComponent 
              linkId={testLink.id} 
              postData={testLink}
              onVote={handleVoteAPI}
              vertical
              compact
            />
          </div>
        </div>
      </div>

      {/* Test Controls */}
      <div className="mb-8">
        <button
          onClick={runAllTests}
          disabled={isRunningTests || !user}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            isRunningTests || !user
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-600 dark:text-gray-400'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isRunningTests ? (
            <>
              <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Running Tests...
            </>
          ) : (
            '🚀 Run All Tests'
          )}
        </button>
      </div>

      {/* Test Scenarios */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">📋 Test Scenarios</h2>
        <div className="grid gap-4">
          {testScenarios.map((scenario, index) => (
            <div key={index} className={`p-4 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
              <h3 className="font-medium mb-2">{scenario.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Actions: {scenario.actions.join(' → ')}
              </p>
              <p className="text-sm text-green-600 dark:text-green-400">
                Expected: {scenario.expectedResult}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">📊 Test Results</h2>
          <div className="space-y-6">
            {testResults.map((test, index) => (
              <div key={index} className={`p-4 rounded-lg border ${
                test.result.success 
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                  : 'border-red-500 bg-red-50 dark:bg-red-900/20'
              }`}>
                <h3 className="font-medium mb-3">{test.scenario.name}</h3>
                
                {test.result.success ? (
                  <div>
                    <p className="text-sm text-green-600 dark:text-green-400 mb-2">
                      ✅ Final Score: {test.result.finalScore}
                    </p>
                    <div className="space-y-1">
                      {test.result.results.map((step, stepIndex) => (
                        <div key={stepIndex} className="text-xs font-mono">
                          Step {step.step}: {step.action} → 
                          {step.failed ? (
                            <span className="text-red-600"> ERROR: {step.error}</span>
                          ) : (
                            <span className="text-gray-600 dark:text-gray-400">
                              {' '}Score: {step.score} ({step.scoreChange >= 0 ? '+' : ''}{step.scoreChange}) 
                              [{step.response}]
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-red-600 dark:text-red-400">
                    ❌ {test.result.error}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VoteTest;
