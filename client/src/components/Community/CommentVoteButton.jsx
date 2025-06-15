import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const CommentVoteButton = ({ commentId, initialVotes = 0, initialUserVote = null }) => {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const [votes, setVotes] = useState(initialVotes);
  const [userVote, setUserVote] = useState(initialUserVote); // 'up', 'down', or null
  const [isVoting, setIsVoting] = useState(false);

  // Mock vote data storage
  const getVoteKey = () => `comment_vote_${commentId}`;
  const getVoteCountKey = () => `comment_votes_${commentId}`;

  // Load saved vote data
  useEffect(() => {
    const savedVote = localStorage.getItem(getVoteKey());
    const savedVoteCount = localStorage.getItem(getVoteCountKey());
    
    if (savedVote) {
      setUserVote(savedVote === 'null' ? null : savedVote);
    }
    if (savedVoteCount) {
      setVotes(parseInt(savedVoteCount));
    }
  }, [commentId]);

  const handleVote = async (voteType) => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để vote');
      return;
    }

    if (isVoting) return;

    setIsVoting(true);

    try {
      let newVotes = votes;
      let newUserVote = userVote;

      // Calculate new vote state
      if (userVote === voteType) {
        // Remove vote
        newUserVote = null;
        newVotes = voteType === 'up' ? votes - 1 : votes + 1;
      } else if (userVote === null) {
        // Add new vote
        newUserVote = voteType;
        newVotes = voteType === 'up' ? votes + 1 : votes - 1;
      } else {
        // Change vote
        newUserVote = voteType;
        newVotes = voteType === 'up' ? votes + 2 : votes - 2;
      }

      // Update state
      setUserVote(newUserVote);
      setVotes(newVotes);

      // Save to localStorage (mock persistence)
      localStorage.setItem(getVoteKey(), newUserVote || 'null');
      localStorage.setItem(getVoteCountKey(), newVotes.toString());

      // Show feedback
      if (newUserVote === 'up') {
        toast.success('Đã upvote comment');
      } else if (newUserVote === 'down') {
        toast.success('Đã downvote comment');
      } else {
        toast.success('Đã hủy vote');
      }

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 200));

    } catch (error) {
      console.error('Vote error:', error);
      toast.error('Không thể vote. Vui lòng thử lại.');
      
      // Revert on error
      setUserVote(userVote);
      setVotes(votes);
    } finally {
      setIsVoting(false);
    }
  };

  const getVoteColor = (type) => {
    if (userVote === type) {
      return type === 'up' 
        ? 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400'
        : 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
    }
    return isDarkMode 
      ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' 
      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100';
  };

  return (
    <div className="flex items-center space-x-1">
      {/* Upvote Button */}
      <motion.button
        onClick={() => handleVote('up')}
        disabled={isVoting}
        className={`p-1 rounded-full transition-all duration-200 ${getVoteColor('up')} ${
          isVoting ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        title="Upvote comment"
      >
        <ChevronUp size={14} />
      </motion.button>

      {/* Vote Count */}
      <span className={`text-xs font-medium min-w-[20px] text-center ${
        votes > 0 
          ? 'text-green-600 dark:text-green-400' 
          : votes < 0 
            ? 'text-red-600 dark:text-red-400'
            : isDarkMode ? 'text-gray-400' : 'text-gray-600'
      }`}>
        {votes > 0 ? `+${votes}` : votes}
      </span>

      {/* Downvote Button */}
      <motion.button
        onClick={() => handleVote('down')}
        disabled={isVoting}
        className={`p-1 rounded-full transition-all duration-200 ${getVoteColor('down')} ${
          isVoting ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        title="Downvote comment"
      >
        <ChevronDown size={14} />
      </motion.button>
    </div>
  );
};

export default CommentVoteButton;
