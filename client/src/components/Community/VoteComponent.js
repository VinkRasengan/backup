import React, { useState, useCallback, useEffect } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { communityAPI } from '../../services/api';

const VoteComponent = ({ 
  linkId, 
  postData, 
  compact = false, 
  vertical = false,
  onVote 
}) => {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const [userVote, setUserVote] = useState(null); // null, 'upvote', 'downvote' - FIXED to match backend
  const [voteCount, setVoteCount] = useState(
    (postData?.voteStats?.upvotes || 0) - (postData?.voteStats?.downvotes || 0)
  );
  const [loading, setLoading] = useState(true);
  const [isVoting, setIsVoting] = useState(false); // Track voting state

  // Load actual vote data from server - FIX for sync issue
  const loadVoteData = useCallback(async () => {
    if (!linkId) return;
    
    try {
      const [statsResponse, userVoteResponse] = await Promise.all([
        communityAPI.getVoteStats(linkId),
        user ? communityAPI.getUserVote(linkId) : Promise.resolve({ success: true, data: null })
      ]);
      
      if (statsResponse.success) {
        const stats = statsResponse.data?.statistics || statsResponse.data || {};
        const userVoteData = userVoteResponse.success ? userVoteResponse.data : null;
        
        // FIXED: Use backend vote types and sync with server
        setUserVote(userVoteData?.voteType || null); // 'upvote' | 'downvote' | null
        setVoteCount(stats.score || 0);
      }
    } catch (error) {
      console.error('VoteComponent load error:', error);
    } finally {
      setLoading(false);
    }
  }, [linkId, user]);

  useEffect(() => {
    loadVoteData();
  }, [loadVoteData]);
  
  const handleVote = useCallback(async (voteType) => {
    if (isVoting) return; // Prevent multiple simultaneous votes
    
    // Store old state for rollback (move outside try block)
    const oldUserVote = userVote;
    const oldVoteCount = voteCount;
    
    try {
      setIsVoting(true);
      
      // FIXED: Use consistent vote types with backend
      const backendVoteType = voteType; // Remove conversion, use direct 'upvote'/'downvote'
      
      // If clicking the same vote type, remove vote
      const newVote = userVote === backendVoteType ? null : backendVoteType;
      
      // Calculate new vote count - FIXED: use backend vote types
      let newCount = voteCount;
      if (userVote === 'upvote' && newVote === null) newCount--;
      else if (userVote === 'downvote' && newVote === null) newCount++;
      else if (userVote === null && newVote === 'upvote') newCount++;
      else if (userVote === null && newVote === 'downvote') newCount--;
      else if (userVote === 'upvote' && newVote === 'downvote') newCount -= 2;
      else if (userVote === 'downvote' && newVote === 'upvote') newCount += 2;

      // Update local state immediately for responsiveness (optimistic update)
      setUserVote(newVote);
      setVoteCount(newCount);

      // Call API via onVote or direct API call
      let apiResponse;
      if (onVote) {
        apiResponse = await onVote(linkId, backendVoteType);
      } else {
        // Direct API call if no onVote handler
        const { communityAPI } = await import('../../services/api');
        apiResponse = await communityAPI.submitVote(linkId, backendVoteType);
      }

      // FIXED: Remove setTimeout race condition, handle response immediately
      if (!apiResponse || !apiResponse.success) {
        throw new Error(apiResponse?.error || 'Vote failed');
      }

      // FIXED: Only sync if server response differs from optimistic update
      // Trust optimistic update for better UX
      if (apiResponse.action === 'removed' && newVote !== null) {
        // Server says removed but we expected a vote - sync to fix
        setTimeout(() => loadVoteData(), 1000);
      } else if (apiResponse.action !== 'removed' && newVote === null) {
        // Server says voted but we expected removal - sync to fix  
        setTimeout(() => loadVoteData(), 1000);
      }
      // Otherwise trust optimistic update to avoid UI flicker
      
    } catch (error) {
      console.error('Error voting:', error);
      // FIXED: Rollback using captured state variables
      setUserVote(oldUserVote);
      setVoteCount(oldVoteCount);
    } finally {
      setIsVoting(false);
    }
  }, [linkId, userVote, voteCount, onVote, loadVoteData, isVoting]);

  const formatVoteCount = (count) => {
    if (count === 0) return '•';
    if (Math.abs(count) >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center space-y-1 animate-pulse">
        <div className="w-8 h-6 bg-gray-200 rounded"></div>
        <div className="w-6 h-4 bg-gray-200 rounded"></div>
        <div className="w-8 h-6 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (compact && vertical) {
    // Reddit-style vertical voting bar
    return (
      <div className="flex flex-col items-center space-y-1">
        <button
          onClick={() => handleVote('upvote')}
          disabled={isVoting}
          className={`p-1 rounded-sm transition-colors duration-200 ${
            isVoting ? 'opacity-50 cursor-not-allowed' : ''
          } ${
            userVote === 'upvote'
              ? 'text-orange-500 bg-orange-100 dark:bg-orange-900/30'
              : 'text-gray-400 hover:text-orange-500 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <ChevronUp size={16} className="stroke-2" />
        </button>
        
        <div className={`text-xs font-bold px-1 ${
          userVote === 'upvote' 
            ? 'text-orange-500' 
            : userVote === 'downvote' 
              ? 'text-blue-500' 
              : isDarkMode 
                ? 'text-gray-300' 
                : 'text-gray-600'
        }`}>
          {formatVoteCount(voteCount)}
        </div>
        
        <button
          onClick={() => handleVote('downvote')}
          disabled={isVoting}
          className={`p-1 rounded-sm transition-colors duration-200 ${
            isVoting ? 'opacity-50 cursor-not-allowed' : ''
          } ${
            userVote === 'downvote'
              ? 'text-blue-500 bg-blue-100 dark:bg-blue-900/30'
              : 'text-gray-400 hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <ChevronDown size={16} className="stroke-2" />
        </button>
      </div>
    );
  }

  if (compact) {
    // Horizontal compact voting
    return (
      <div className="flex items-center space-x-1">
        <button
          onClick={() => handleVote('upvote')}
          disabled={isVoting}
          className={`p-1 rounded-sm transition-colors duration-200 ${
            isVoting ? 'opacity-50 cursor-not-allowed' : ''
          } ${
            userVote === 'upvote'
              ? 'text-orange-500 bg-orange-100 dark:bg-orange-900/30'
              : 'text-gray-400 hover:text-orange-500 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <ChevronUp size={14} />
        </button>
        
        <div className={`text-xs font-medium px-1 ${
          userVote === 'upvote' 
            ? 'text-orange-500' 
            : userVote === 'downvote' 
              ? 'text-blue-500' 
              : isDarkMode 
                ? 'text-gray-300' 
                : 'text-gray-600'
        }`}>
          {formatVoteCount(voteCount)}
        </div>
        
        <button
          onClick={() => handleVote('downvote')}
          disabled={isVoting}
          className={`p-1 rounded-sm transition-colors duration-200 ${
            isVoting ? 'opacity-50 cursor-not-allowed' : ''
          } ${
            userVote === 'downvote'
              ? 'text-blue-500 bg-blue-100 dark:bg-blue-900/30'
              : 'text-gray-400 hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <ChevronDown size={14} />
        </button>
      </div>
    );
  }

  // Full-size voting component
  return (
    <div className={`flex flex-col items-center space-y-2 p-3 ${
      isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
    } rounded-lg`}>
      <button
        onClick={() => handleVote('upvote')}
        disabled={isVoting}
        className={`p-2 rounded-full transition-colors duration-200 ${
          isVoting ? 'opacity-50 cursor-not-allowed' : ''
        } ${
          userVote === 'upvote'
            ? 'text-orange-500 bg-orange-100 dark:bg-orange-900/30'
            : 'text-gray-400 hover:text-orange-500 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
      >
        <ChevronUp size={20} />
      </button>
      
      <div className={`text-sm font-bold ${
        userVote === 'upvote' 
          ? 'text-orange-500' 
          : userVote === 'downvote' 
            ? 'text-blue-500' 
            : isDarkMode 
              ? 'text-gray-300' 
              : 'text-gray-600'
      }`}>
        {formatVoteCount(voteCount)}
      </div>
      
      <button
        onClick={() => handleVote('downvote')}
        disabled={isVoting}
        className={`p-2 rounded-full transition-colors duration-200 ${
          isVoting ? 'opacity-50 cursor-not-allowed' : ''
        } ${
          userVote === 'downvote'
            ? 'text-blue-500 bg-blue-100 dark:bg-blue-900/30'
            : 'text-gray-400 hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
      >
        <ChevronDown size={20} />
      </button>
    </div>
  );
};

export default VoteComponent;
