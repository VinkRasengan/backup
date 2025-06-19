import React, { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

const VoteComponent = ({ linkId, postData, compact = false, onVote }) => {
  const [voteState, setVoteState] = useState({
    userVote: null, // 'up', 'down', or null
    upvotes: postData?.voteStats?.safe || postData?.upvotes || 0,
    downvotes: postData?.voteStats?.unsafe || postData?.downvotes || 0,
    score: postData?.voteScore || 0
  });

  // Calculate total score
  const totalScore = voteState.upvotes - voteState.downvotes;

  const handleVote = async (voteType) => {
    const newVote = voteState.userVote === voteType ? null : voteType;
    
    // Optimistic update
    let newUpvotes = voteState.upvotes;
    let newDownvotes = voteState.downvotes;

    // Remove previous vote
    if (voteState.userVote === 'up') newUpvotes--;
    if (voteState.userVote === 'down') newDownvotes--;

    // Add new vote
    if (newVote === 'up') newUpvotes++;
    if (newVote === 'down') newDownvotes++;

    setVoteState({
      ...voteState,
      userVote: newVote,
      upvotes: newUpvotes,
      downvotes: newDownvotes,
      score: newUpvotes - newDownvotes
    });

    // Call parent callback
    if (onVote) {
      onVote(linkId, voteType);
    }

    // TODO: Make API call to backend
    try {
      const response = await fetch(`/api/community/votes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId: linkId,
          voteType: newVote
        })
      });

      if (!response.ok) {
        // Revert on error
        setVoteState(voteState);
      }
    } catch (error) {
      console.error('Vote error:', error);
      // Revert on error
      setVoteState(voteState);
    }
  };

  if (compact) {
    // Reddit-style vertical compact voting
    return (
      <div className="flex flex-col items-center space-y-1">
        <button
          onClick={() => handleVote('up')}
          className={`p-1 rounded transition-colors ${
            voteState.userVote === 'up'
              ? 'text-orange-500 bg-orange-100 dark:bg-orange-900/30'
              : 'text-gray-400 hover:text-orange-500 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <ChevronUp size={16} />
        </button>
        
        <span className={`text-xs font-medium ${
          totalScore > 0 ? 'text-orange-500' : 
          totalScore < 0 ? 'text-blue-500' : 
          'text-gray-500 dark:text-gray-400'
        }`}>
          {totalScore > 0 ? `+${totalScore}` : totalScore}
        </span>
        
        <button
          onClick={() => handleVote('down')}
          className={`p-1 rounded transition-colors ${
            voteState.userVote === 'down'
              ? 'text-blue-500 bg-blue-100 dark:bg-blue-900/30'
              : 'text-gray-400 hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <ChevronDown size={16} />
        </button>
      </div>
    );
  }

  // Regular horizontal voting
  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => handleVote('up')}
        className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
          voteState.userVote === 'up'
            ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
            : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
        }`}
      >
        <ChevronUp size={16} />
        <span>{voteState.upvotes}</span>
      </button>

      <span className={`text-sm font-medium ${
        totalScore > 0 ? 'text-orange-500' : 
        totalScore < 0 ? 'text-blue-500' : 
        'text-gray-500 dark:text-gray-400'
      }`}>
        {totalScore > 0 ? `+${totalScore}` : totalScore}
      </span>

      <button
        onClick={() => handleVote('down')}
        className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
          voteState.userVote === 'down'
            ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
            : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
        }`}
      >
        <ChevronDown size={16} />
        <span>{voteState.downvotes}</span>
      </button>
    </div>
  );
};

export default VoteComponent;
