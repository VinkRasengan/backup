import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import toast from 'react-hot-toast';
import { communityAPI } from '../../services/api';

// Simplified Vote Component with state persistence
const VoteComponentSimplified = ({ linkId, className = '' }) => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  
  // Simplified state - just what we need
  const [voteData, setVoteData] = useState({
    userVote: null, // 'upvote' | 'downvote' | null
    score: 0,
    upvotes: 0,
    downvotes: 0,
    loading: false,
    voting: false
  });

  // Local storage key for vote persistence
  const getStorageKey = (linkId, userId) => `vote_${linkId}_${userId || 'anonymous'}`;
  
  // Load vote data with persistence
  useEffect(() => {
    const loadVoteData = async () => {
      if (!linkId) return;
      
      setVoteData(prev => ({ ...prev, loading: true }));
      
      try {
        // 1. Try to load from localStorage first (instant feedback)
        const userId = user?.id || user?.uid;
        if (userId) {
          const cachedVote = localStorage.getItem(getStorageKey(linkId, userId));
          if (cachedVote) {
            const parsed = JSON.parse(cachedVote);
            setVoteData(prev => ({ 
              ...prev, 
              userVote: parsed.userVote,
              // Keep other data loading from API
            }));
          }
        }

        // 2. Load fresh data from API  
        const [statsResponse, userVoteResponse] = await Promise.all([
          communityAPI.getVoteStats(linkId),
          user ? communityAPI.getUserVote(linkId) : Promise.resolve({ success: true, data: null })
        ]);
        
        if (statsResponse.success) {
          const stats = statsResponse.data.statistics || statsResponse.data || {};
          const userVoteData = userVoteResponse.success ? userVoteResponse.data : null;
          const userVoteType = userVoteData?.voteType || null;
          
          const newVoteData = {
            userVote: userVoteType,
            score: stats.score || 0,
            upvotes: stats.upvotes || 0,
            downvotes: stats.downvotes || 0,
            loading: false,
            voting: false
          };
          
          setVoteData(newVoteData);
          
          // 3. Update localStorage cache
          if (userId) {
            localStorage.setItem(getStorageKey(linkId, userId), JSON.stringify({
              userVote: userVoteType,
              lastUpdated: Date.now()
            }));
          }
        }
        
      } catch (error) {
        console.error('Load vote data error:', error);
        setVoteData(prev => ({ ...prev, loading: false }));
      }
    };

    loadVoteData();
  }, [linkId, user]);

  // Simplified vote handler
  const handleVote = async (voteType) => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để vote');
      return;
    }

    if (voteData.voting) return;

    // Calculate new state
    const currentVote = voteData.userVote;
    const newVote = currentVote === voteType ? null : voteType; // Toggle if same, otherwise set new
    
    // Calculate score change
    let scoreChange = 0;
    if (currentVote === null && newVote === 'upvote') scoreChange = 1;
    else if (currentVote === null && newVote === 'downvote') scoreChange = -1;
    else if (currentVote === 'upvote' && newVote === null) scoreChange = -1;
    else if (currentVote === 'downvote' && newVote === null) scoreChange = 1;
    else if (currentVote === 'upvote' && newVote === 'downvote') scoreChange = -2;
    else if (currentVote === 'downvote' && newVote === 'upvote') scoreChange = 2;

    // Optimistic update
    const optimisticData = {
      ...voteData,
      userVote: newVote,
      score: voteData.score + scoreChange,
      voting: true
    };
    setVoteData(optimisticData);

    try {
      // Call API
      const response = await communityAPI.submitVote(linkId, voteType);
      
      if (response.success) {
        // Update localStorage immediately
        const userId = user?.id || user?.uid;
        if (userId) {
          localStorage.setItem(getStorageKey(linkId, userId), JSON.stringify({
            userVote: newVote,
            lastUpdated: Date.now()
          }));
        }
        
        // Show success message
        toast.success(newVote ? `Đã ${newVote}!` : 'Đã hủy vote!');
        
        // Set voting to false immediately - trust the backend state
        setVoteData(prev => ({ ...prev, voting: false }));
      } else {
        throw new Error(response.error || 'Vote failed');
      }
      
    } catch (error) {
      console.error('Vote error:', error);
      toast.error('Không thể vote. Vui lòng thử lại.');
      
      // Revert optimistic update
      setVoteData(voteData);
    }
  };

  if (voteData.loading) {
    return (
      <div className="flex flex-col items-center space-y-1 animate-pulse">
        <div className="w-8 h-6 bg-gray-200 rounded"></div>
        <div className="w-6 h-4 bg-gray-200 rounded"></div>
        <div className="w-8 h-6 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center space-y-1 ${className}`}>
      {/* Upvote Button */}
      <button
        onClick={() => handleVote('upvote')}
        disabled={voteData.voting || !user}
        className={`p-2 rounded transition-colors ${
          voteData.userVote === 'upvote'
            ? 'text-orange-600 bg-orange-100 dark:bg-orange-900/30'
            : isDarkMode
            ? 'text-gray-400 hover:text-orange-500'
            : 'text-gray-500 hover:text-orange-500'
        } ${!user ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
        title={!user ? 'Đăng nhập để vote' : 'Upvote'}
      >
        <ChevronUp className={`w-5 h-5 ${voteData.userVote === 'upvote' ? 'fill-current' : ''}`} />
      </button>

      {/* Vote Score */}
      <div className={`text-sm font-bold px-2 py-1 rounded ${
        voteData.score > 0
          ? 'text-orange-600 bg-orange-50 dark:bg-orange-900/20'
          : voteData.score < 0
          ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20'
          : isDarkMode ? 'text-gray-300' : 'text-gray-700'
      }`}>
        {voteData.score || 0}
      </div>

      {/* Downvote Button */}
      <button
        onClick={() => handleVote('downvote')}
        disabled={voteData.voting || !user}
        className={`p-2 rounded transition-colors ${
          voteData.userVote === 'downvote'
            ? 'text-blue-600 bg-blue-100 dark:bg-blue-900/30'
            : isDarkMode
            ? 'text-gray-400 hover:text-blue-500'
            : 'text-gray-500 hover:text-blue-500'
        } ${!user ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
        title={!user ? 'Đăng nhập để vote' : 'Downvote'}
      >
        <ChevronDown className={`w-5 h-5 ${voteData.userVote === 'downvote' ? 'fill-current' : ''}`} />
      </button>

      {/* Loading overlay */}
      {voteData.voting && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-800/80 rounded">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};

// PropTypes validation
VoteComponentSimplified.propTypes = {
  linkId: PropTypes.string.isRequired,
  className: PropTypes.string
};

VoteComponentSimplified.defaultProps = {
  className: ''
};

export default VoteComponentSimplified; 