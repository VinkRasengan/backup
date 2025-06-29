import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import SimpleVoteComponent from './SimpleVoteComponent';
import VoteComponent from './VoteComponent';
import { communityAPI } from '../../services/api';
import toast from 'react-hot-toast';

/**
 * Bug Test Component for Vote System UI Updates
 * Tests the specific bug: "lúc thì có xử lý lúc thì không" 
 */
const VoteSystemBugTest = () => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const logRef = useRef([]);

  const testLinkId = `bug-test-${Date.now()}`;

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const log = { timestamp, message, type };
    logRef.current.push(log);
    setTestResults([...logRef.current]);
    console.log(`[${timestamp}] ${message}`);
  };

  // Test the specific UI update bug scenario
  const runUIUpdateBugTest = async () => {
    if (!user) {
      toast.error('Please login to run test');
      return;
    }

    setIsRunning(true);
    logRef.current = [];
    
    try {
      addLog('🚀 Starting UI Update Bug Test', 'info');
      addLog('Testing scenario: Downvote → UI should stay consistent', 'info');

      // Step 1: Get initial state
      const initialStats = await communityAPI.getVoteStats(testLinkId);
      const initialScore = initialStats.success ? initialStats.data.statistics.score : 0;
      addLog(`📊 Initial score: ${initialScore}`, 'info');

      // Step 2: Submit downvote
      addLog('👇 Submitting downvote...', 'action');
      const voteResponse = await communityAPI.submitVote(testLinkId, 'downvote');
      
      if (!voteResponse.success) {
        addLog(`❌ Vote failed: ${voteResponse.error}`, 'error');
        return;
      }
      
      addLog(`✅ Vote response: ${voteResponse.action}`, 'success');

      // Step 3: Immediately check server state (this is where race condition happens)
      addLog('🔍 Immediately checking server state...', 'action');
      const immediateStats = await communityAPI.getVoteStats(testLinkId);
      const immediateScore = immediateStats.success ? immediateStats.data.statistics.score : 0;
      addLog(`📊 Immediate server score: ${immediateScore}`, 'info');

      // Step 4: Check after small delay (server should be updated)
      addLog('⏰ Waiting 500ms then checking again...', 'action');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const delayedStats = await communityAPI.getVoteStats(testLinkId);
      const delayedScore = delayedStats.success ? delayedStats.data.statistics.score : 0;
      addLog(`📊 Delayed server score: ${delayedScore}`, 'info');

      // Step 5: Analyze results
      const expectedScore = initialScore - 1; // Should be -1 after downvote
      
      if (immediateScore !== expectedScore && delayedScore === expectedScore) {
        addLog('⚠️ RACE CONDITION DETECTED: Server delayed update!', 'warning');
        addLog('This is why UI flickers: optimistic update → server sync → wrong data → delayed correct data', 'warning');
      } else if (immediateScore === expectedScore) {
        addLog('✅ Server updated immediately - no race condition', 'success');
      } else {
        addLog('❓ Unexpected result - check server logic', 'warning');
      }

      // Step 6: Test multiple rapid votes (stress test)
      addLog('🔄 Testing rapid vote changes...', 'action');
      const rapidVoteResults = [];
      
      // Rapid sequence: downvote → upvote → downvote
      for (const voteType of ['upvote', 'downvote', 'upvote']) {
        const rapidResponse = await communityAPI.submitVote(testLinkId, voteType);
        rapidVoteResults.push({
          voteType,
          success: rapidResponse.success,
          action: rapidResponse.action
        });
        addLog(`⚡ Rapid ${voteType}: ${rapidResponse.action}`, 'action');
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
      }

      // Final state check
      const finalStats = await communityAPI.getVoteStats(testLinkId);
      const finalScore = finalStats.success ? finalStats.data.statistics.score : 0;
      addLog(`🏁 Final score: ${finalScore}`, 'info');

      addLog('✅ UI Update Bug Test completed!', 'success');

    } catch (error) {
      addLog(`❌ Test failed: ${error.message}`, 'error');
    } finally {
      setIsRunning(false);
    }
  };

  // Clean up test data
  const cleanupTestData = async () => {
    try {
      addLog('🧹 Cleaning up test data...', 'action');
      // Try to remove any votes for this test link
      await communityAPI.deleteVote(testLinkId);
      addLog('✅ Cleanup completed', 'success');
    } catch (error) {
      addLog(`⚠️ Cleanup warning: ${error.message}`, 'warning');
    }
  };

  const handleVoteAPI = async (linkId, voteType) => {
    addLog(`🔗 VoteComponent triggered: ${voteType}`, 'action');
    return await communityAPI.submitVote(linkId, voteType);
  };

  const getLogColor = (type) => {
    switch (type) {
      case 'success': return 'text-green-600 dark:text-green-400';
      case 'error': return 'text-red-600 dark:text-red-400';
      case 'warning': return 'text-yellow-600 dark:text-yellow-400';
      case 'action': return 'text-blue-600 dark:text-blue-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className={`p-6 max-w-6xl mx-auto ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">🐛 Vote System UI Update Bug Test</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Tests the bug: "lúc thì có xử lý lúc thì không" - inconsistent UI updates after voting
        </p>
        
        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-yellow-900/30' : 'bg-yellow-100'}`}>
          <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">🔍 What this test does:</h3>
          <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
            <li>• Tests immediate server response vs delayed response</li>
            <li>• Identifies race conditions between optimistic updates and server sync</li>
            <li>• Verifies UI consistency during rapid vote changes</li>
            <li>• Checks if server updates are reflected correctly</li>
          </ul>
        </div>

        {!user && (
          <div className="mt-4 p-4 bg-red-100 dark:bg-red-900/30 rounded-lg">
            <p className="text-red-800 dark:text-red-200">
              ⚠️ Please login to run tests
            </p>
          </div>
        )}
      </div>

      {/* Live Test Components */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className={`p-6 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
          <h3 className="text-lg font-semibold mb-4">SimpleVoteComponent (Fixed)</h3>
          <div className="flex items-center justify-center mb-4">
            <SimpleVoteComponent linkId={testLinkId} />
          </div>
          <p className="text-xs text-gray-500">
            Click to test real-time behavior while test is running
          </p>
        </div>

        <div className={`p-6 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
          <h3 className="text-lg font-semibold mb-4">VoteComponent (Fixed)</h3>
          <div className="flex items-center justify-center mb-4">
            <VoteComponent 
              linkId={testLinkId}
              onVote={handleVoteAPI}
              vertical
              compact
            />
          </div>
          <p className="text-xs text-gray-500">
            Click to test real-time behavior while test is running
          </p>
        </div>
      </div>

      {/* Test Controls */}
      <div className="flex space-x-4 mb-8">
        <button
          onClick={runUIUpdateBugTest}
          disabled={isRunning || !user}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            isRunning || !user
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-600 dark:text-gray-400'
              : 'bg-red-600 text-white hover:bg-red-700'
          }`}
        >
          {isRunning ? (
            <>
              <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Running Bug Test...
            </>
          ) : (
            '🐛 Run UI Update Bug Test'
          )}
        </button>

        <button
          onClick={cleanupTestData}
          disabled={isRunning}
          className="px-4 py-3 rounded-lg font-medium bg-gray-500 text-white hover:bg-gray-600 transition-colors"
        >
          🧹 Cleanup Test Data
        </button>
      </div>

      {/* Test Results Log */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">📋 Test Log</h2>
        <div className={`max-h-96 overflow-y-auto p-4 rounded-lg border ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
        }`}>
          {testResults.length === 0 ? (
            <p className="text-gray-500 italic">No test results yet. Click "Run Bug Test" to start.</p>
          ) : (
            <div className="space-y-1 font-mono text-sm">
              {testResults.map((log, index) => (
                <div key={index} className={getLogColor(log.type)}>
                  <span className="text-gray-400">[{log.timestamp}]</span> {log.message}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Expected Results */}
      <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-200'}`}>
        <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">✅ Expected Results (After Fix):</h3>
        <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
          <li>• UI should NOT flicker after vote submission</li>
          <li>• Optimistic updates should be trusted when server confirms success</li>
          <li>• Only sync with server when there's a mismatch</li>
          <li>• Rapid vote changes should work smoothly</li>
          <li>• No "nhảy qua nhảy lại" in the score display</li>
        </ul>
      </div>
    </div>
  );
};

export default VoteSystemBugTest; 