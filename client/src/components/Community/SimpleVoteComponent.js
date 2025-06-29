import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import toast from 'react-hot-toast';
import { communityAPI } from '../../services/api';

/**
 * Simple Vote Component - All-in-one solution
 * Handles vote submission, state persistence, and UI updates
 */
const SimpleVoteComponent = ({ linkId, className = '' }) => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  
  // Simple state - just what we need
  const [state, setState] = useState({
    userVote: null,     // 'upvote' | 'downvote' | null
    score: 0,           // Current score
    loading: true,      // Loading initial data
    voting: false       // Currently submitting vote
  });

  // Load vote data from API
  const loadVoteData = async () => {
    if (!linkId) return;
    
    setState(prev => ({ ...prev, loading: true }));
    
    try {
      console.log('🔍 [SimpleVoteComponent] Loading vote data for linkId:', linkId);
      console.log('🔍 [SimpleVoteComponent] Current user:', user);
      
      // Load both stats and user vote in parallel
      const [statsResponse, userVoteResponse] = await Promise.all([
        communityAPI.getVoteStats(linkId),
        user ? communityAPI.getUserVote(linkId) : Promise.resolve({ success: true, data: null })
      ]);
      
      console.log('📊 [SimpleVoteComponent] Stats response:', statsResponse);
      console.log('👤 [SimpleVoteComponent] User vote response:', userVoteResponse);
      
      // Extract data
      const stats = statsResponse.success ? (statsResponse.data.statistics || statsResponse.data || {}) : {};
      const userVoteData = userVoteResponse.success ? userVoteResponse.data : null;
      
      console.log('📈 [SimpleVoteComponent] Extracted stats:', stats);
      console.log('✅ [SimpleVoteComponent] Extracted user vote:', userVoteData);
      
      setState({
        userVote: userVoteData?.voteType || null,
        score: stats.score || 0,
        loading: false,
        voting: false
      });
      
    } catch (error) {
      console.error('❌ [SimpleVoteComponent] Load vote data error:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  // Handle vote submission
  const handleVote = async (voteType) => {
    // Check auth
    if (!user) {
      toast.error('Vui lòng đăng nhập để vote');
      return;
    }

    // Prevent double submission
    if (state.voting) return;

    console.log('🗳️ [SimpleVoteComponent] Submitting vote:', { linkId, voteType, user: user.uid || user.id });

    // Calculate new state
    const currentVote = state.userVote;
    const newVote = currentVote === voteType ? null : voteType; // Toggle if same
    
    // Calculate score change for optimistic update
    let scoreChange = 0;
    if (currentVote === null && newVote === 'upvote') scoreChange = 1;
    else if (currentVote === null && newVote === 'downvote') scoreChange = -1;
    else if (currentVote === 'upvote' && newVote === null) scoreChange = -1;
    else if (currentVote === 'downvote' && newVote === null) scoreChange = 1;
    else if (currentVote === 'upvote' && newVote === 'downvote') scoreChange = -2;
    else if (currentVote === 'downvote' && newVote === 'upvote') scoreChange = 2;

    // Save current state for rollback
    const previousState = { ...state };

    // Optimistic update - show changes immediately
    setState({
      userVote: newVote,
      score: state.score + scoreChange,
      loading: false,
      voting: true
    });

    try {
      // Submit to backend
      const response = await communityAPI.submitVote(linkId, voteType);
      
      console.log('📡 [SimpleVoteComponent] Vote response:', response);
      
      if (response.success) {
        // Success - keep optimistic state and stop loading
        setState(prev => ({ ...prev, voting: false }));
        
        // Show success message
        const message = newVote 
          ? `Đã ${voteType === 'upvote' ? 'upvote' : 'downvote'}!`
          : 'Đã hủy vote!';
        toast.success(message);
        
        // Reload data to sync with server
        setTimeout(() => {
          loadVoteData();
        }, 500);
        
      } else {
        throw new Error(response.error || 'Vote failed');
      }
      
    } catch (error) {
      console.error('❌ [SimpleVoteComponent] Vote error:', error);
      toast.error('Không thể vote. Vui lòng thử lại.');
      
      // Revert to previous state on error
      setState(previousState);
    }
  };

  // Load data when component mounts or user changes
  useEffect(() => {
    loadVoteData();
  }, [linkId, user]);

  // Loading state
  if (state.loading) {
    return (
      <div className="flex flex-col items-center space-y-1 animate-pulse">
        <div className="w-8 h-6 bg-gray-200 rounded"></div>
        <div className="w-6 h-4 bg-gray-200 rounded"></div>
        <div className="w-8 h-6 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center space-y-1 relative ${className}`}>
      {/* Upvote Button */}
      <button
        onClick={() => handleVote('upvote')}
        disabled={state.voting || !user}
        className={`p-2 rounded transition-colors ${
          state.userVote === 'upvote'
            ? 'text-orange-600 bg-orange-100 dark:bg-orange-900/30'
            : isDarkMode
            ? 'text-gray-400 hover:text-orange-500'
            : 'text-gray-500 hover:text-orange-500'
        } ${!user ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${
          state.voting ? 'opacity-50' : ''
        }`}
        title={!user ? 'Đăng nhập để vote' : 'Upvote'}
      >
        <ChevronUp className={`w-5 h-5 ${state.userVote === 'upvote' ? 'fill-current' : ''}`} />
      </button>

      {/* Vote Score */}
      <div className={`text-sm font-bold px-2 py-1 rounded min-w-[32px] text-center ${
        state.score > 0
          ? 'text-orange-600 bg-orange-50 dark:bg-orange-900/20'
          : state.score < 0
          ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20'
          : isDarkMode ? 'text-gray-300 bg-gray-700' : 'text-gray-700 bg-gray-100'
      }`}>
        {state.score}
      </div>

      {/* Downvote Button */}
      <button
        onClick={() => handleVote('downvote')}
        disabled={state.voting || !user}
        className={`p-2 rounded transition-colors ${
          state.userVote === 'downvote'
            ? 'text-blue-600 bg-blue-100 dark:bg-blue-900/30'
            : isDarkMode
            ? 'text-gray-400 hover:text-blue-500'
            : 'text-gray-500 hover:text-blue-500'
        } ${!user ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${
          state.voting ? 'opacity-50' : ''
        }`}
        title={!user ? 'Đăng nhập để vote' : 'Downvote'}
      >
        <ChevronDown className={`w-5 h-5 ${state.userVote === 'downvote' ? 'fill-current' : ''}`} />
      </button>

      {/* Loading overlay */}
      {state.voting && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-800/80 rounded">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};

export default SimpleVoteComponent; 