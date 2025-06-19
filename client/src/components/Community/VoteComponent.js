import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import voteService from '../../services/voteService';

const VoteComponent = ({ linkId, postData, compact = false, onVote }) => {
  const [voteState, setVoteState] = useState({
    userVote: null, // 'upvote', 'downvote', or null
    upvotes: postData?.voteStats?.safe || postData?.upvotes || 0,
    downvotes: postData?.voteStats?.unsafe || postData?.downvotes || 0,
    score: postData?.voteScore || 0,
    loading: false
  });

  // Load user's previous vote on component mount
  useEffect(() => {
    const userVote = voteService.getUserVoteForPost(linkId);
    if (userVote) {
      setVoteState(prev => ({
        ...prev,
        userVote: userVote.type
      }));
    }
  }, [linkId]);

  // Calculate total score
  const totalScore = voteState.upvotes - voteState.downvotes;

  const handleVote = async (voteType) => {
    // Prevent voting if already loading
    if (voteState.loading) return;

    // Check if user is trying to vote the same way again
    const newVote = voteState.userVote === voteType ? null : voteType;

    // Store original state for potential revert
    const originalState = { ...voteState };

    // Optimistic update
    let newUpvotes = voteState.upvotes;
    let newDownvotes = voteState.downvotes;

    // Remove previous vote
    if (voteState.userVote === 'upvote') newUpvotes--;
    if (voteState.userVote === 'downvote') newDownvotes--;

    // Add new vote
    if (newVote === 'upvote') newUpvotes++;
    if (newVote === 'downvote') newDownvotes++;

    // Update state optimistically
    setVoteState({
      ...voteState,
      userVote: newVote,
      upvotes: newUpvotes,
      downvotes: newDownvotes,
      score: newUpvotes - newDownvotes,
      loading: true
    });

    // Call parent callback
    if (onVote) {
      onVote(linkId, voteType);
    }

    try {
      // Use voteService to submit vote
      const result = await voteService.submitVote(linkId, newVote);

      if (result.success) {
        console.log('✅ Vote submitted successfully:', result);
        // Update with server response if available
        if (result.data) {
          setVoteState(prev => ({
            ...prev,
            upvotes: result.data.upvotes || prev.upvotes,
            downvotes: result.data.downvotes || prev.downvotes,
            score: result.data.score || prev.score,
            loading: false
          }));
        } else {
          setVoteState(prev => ({ ...prev, loading: false }));
        }
      } else {
        console.error('❌ Vote submission failed:', result.error);
        // Revert to original state on error
        setVoteState({ ...originalState, loading: false });
      }
    } catch (error) {
      console.error('❌ Vote error:', error);
      // Revert to original state on error
      setVoteState({ ...originalState, loading: false });
    }
  };

  if (compact) {
    // Reddit-style vertical compact voting
    return (
      <div className="flex flex-col items-center space-y-1">
        <button
          onClick={() => handleVote('upvote')}
          disabled={voteState.loading}
          className={`p-1 rounded transition-colors ${
            voteState.userVote === 'upvote'
              ? 'text-orange-500 bg-orange-100 dark:bg-orange-900/30'
              : 'text-gray-400 hover:text-orange-500 hover:bg-gray-100 dark:hover:bg-gray-700'
          } ${voteState.loading ? 'opacity-50 cursor-not-allowed' : ''}`}
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
          onClick={() => handleVote('downvote')}
          disabled={voteState.loading}
          className={`p-1 rounded transition-colors ${
            voteState.userVote === 'downvote'
              ? 'text-blue-500 bg-blue-100 dark:bg-blue-900/30'
              : 'text-gray-400 hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-700'
          } ${voteState.loading ? 'opacity-50 cursor-not-allowed' : ''}`}
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
        onClick={() => handleVote('upvote')}
        disabled={voteState.loading}
        className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
          voteState.userVote === 'upvote'
            ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
            : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
        } ${voteState.loading ? 'opacity-50 cursor-not-allowed' : ''}`}
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
        onClick={() => handleVote('downvote')}
        disabled={voteState.loading}
        className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
          voteState.userVote === 'downvote'
            ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
            : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
        } ${voteState.loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <ChevronDown size={16} />
        <span>{voteState.downvotes}</span>
      </button>
    </div>
  );
};

export default VoteComponent;
