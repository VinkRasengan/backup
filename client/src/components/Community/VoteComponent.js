import React, { useState, useCallback } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const VoteComponent = ({ 
  linkId, 
  postData, 
  compact = false, 
  vertical = false,
  onVote 
}) => {
  const { isDarkMode } = useTheme();
  const [userVote, setUserVote] = useState(null); // null, 'up', 'down'
  const [voteCount, setVoteCount] = useState(
    (postData?.voteStats?.upvotes || 0) - (postData?.voteStats?.downvotes || 0)
  );

  const handleVote = useCallback(async (voteType) => {
    try {
      // If clicking the same vote type, remove vote
      const newVote = userVote === voteType ? null : voteType;
      
      // Calculate new vote count
      let newCount = voteCount;
      if (userVote === 'up' && newVote === null) newCount--;
      else if (userVote === 'down' && newVote === null) newCount++;
      else if (userVote === null && newVote === 'up') newCount++;
      else if (userVote === null && newVote === 'down') newCount--;
      else if (userVote === 'up' && newVote === 'down') newCount -= 2;
      else if (userVote === 'down' && newVote === 'up') newCount += 2;

      setUserVote(newVote);
      setVoteCount(newCount);

      // Call parent vote handler if provided
      if (onVote) {
        onVote(linkId, voteType);
      }

      // TODO: Make API call to update vote on server
    } catch (error) {
      console.error('Error voting:', error);
      // Revert on error
      setUserVote(userVote);
      setVoteCount(voteCount);
    }
  }, [linkId, userVote, voteCount, onVote]);

  const formatVoteCount = (count) => {
    if (count === 0) return '•';
    if (Math.abs(count) >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  if (compact && vertical) {
    // Reddit-style vertical voting bar
    return (
      <div className="flex flex-col items-center space-y-1">
        <button
          onClick={() => handleVote('up')}
          className={`p-1 rounded-sm transition-colors duration-200 ${
            userVote === 'up'
              ? 'text-orange-500 bg-orange-100 dark:bg-orange-900/30'
              : 'text-gray-400 hover:text-orange-500 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <ChevronUp size={16} className="stroke-2" />
        </button>
        
        <div className={`text-xs font-bold px-1 ${
          userVote === 'up' 
            ? 'text-orange-500' 
            : userVote === 'down' 
              ? 'text-blue-500' 
              : isDarkMode 
                ? 'text-gray-300' 
                : 'text-gray-600'
        }`}>
          {formatVoteCount(voteCount)}
        </div>
        
        <button
          onClick={() => handleVote('down')}
          className={`p-1 rounded-sm transition-colors duration-200 ${
            userVote === 'down'
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
          onClick={() => handleVote('up')}
          className={`p-1 rounded-sm transition-colors duration-200 ${
            userVote === 'up'
              ? 'text-orange-500 bg-orange-100 dark:bg-orange-900/30'
              : 'text-gray-400 hover:text-orange-500 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <ChevronUp size={14} />
        </button>
        
        <div className={`text-xs font-medium px-1 ${
          userVote === 'up' 
            ? 'text-orange-500' 
            : userVote === 'down' 
              ? 'text-blue-500' 
              : isDarkMode 
                ? 'text-gray-300' 
                : 'text-gray-600'
        }`}>
          {formatVoteCount(voteCount)}
        </div>
        
        <button
          onClick={() => handleVote('down')}
          className={`p-1 rounded-sm transition-colors duration-200 ${
            userVote === 'down'
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
        onClick={() => handleVote('up')}
        className={`p-2 rounded-full transition-colors duration-200 ${
          userVote === 'up'
            ? 'text-orange-500 bg-orange-100 dark:bg-orange-900/30'
            : 'text-gray-400 hover:text-orange-500 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
      >
        <ChevronUp size={20} />
      </button>
      
      <div className={`text-sm font-bold ${
        userVote === 'up' 
          ? 'text-orange-500' 
          : userVote === 'down' 
            ? 'text-blue-500' 
            : isDarkMode 
              ? 'text-gray-300' 
              : 'text-gray-600'
      }`}>
        {formatVoteCount(voteCount)}
      </div>
      
      <button
        onClick={() => handleVote('down')}
        className={`p-2 rounded-full transition-colors duration-200 ${
          userVote === 'down'
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
