import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { communityAPI } from '../services/api';
import toast from 'react-hot-toast';

/**
 * Optimized vote hook with state persistence and error handling
 * Solves the issues with complex vote logic and state loss on refresh
 */
export const useVoteOptimized = (linkId) => {
  const { user } = useAuth();
  const [voteState, setVoteState] = useState({
    userVote: null,
    score: 0,
    upvotes: 0,
    downvotes: 0,
    loading: false,
    voting: false,
    error: null
  });
  
  const abortControllerRef = useRef();
  const cacheTimeoutRef = useRef();

  // Cache management
  const getCacheKey = useCallback((linkId, userId) => {
    return `vote_${linkId}_${userId || 'anonymous'}`;
  }, []);

  const getCachedVote = useCallback((linkId, userId) => {
    try {
      const cached = localStorage.getItem(getCacheKey(linkId, userId));
      if (cached) {
        const data = JSON.parse(cached);
        // Cache expires after 5 minutes
        if (Date.now() - data.timestamp < 5 * 60 * 1000) {
          return data;
        }
        // Remove expired cache
        localStorage.removeItem(getCacheKey(linkId, userId));
      }
    } catch (error) {
      console.error('Error reading vote cache:', error);
    }
    return null;
  }, [getCacheKey]);

  const setCachedVote = useCallback((linkId, userId, voteData) => {
    try {
      const cacheData = {
        ...voteData,
        timestamp: Date.now()
      };
      localStorage.setItem(getCacheKey(linkId, userId), JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error saving vote cache:', error);
    }
  }, [getCacheKey]);

  // Load vote data with caching and error handling
  const loadVoteData = useCallback(async (forceRefresh = false) => {
    if (!linkId) return;

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    setVoteState(prev => ({ 
      ...prev, 
      loading: true, 
      error: null 
    }));

    try {
      const userId = user?.id || user?.uid;
      
      // 1. Load from cache first (if not forcing refresh)
      if (!forceRefresh && userId) {
        const cached = getCachedVote(linkId, userId);
        if (cached) {
          setVoteState(prev => ({
            ...prev,
            userVote: cached.userVote,
            score: cached.score,
            upvotes: cached.upvotes,
            downvotes: cached.downvotes,
            loading: false
          }));
          return cached;
        }
      }

      // 2. Fetch fresh data from API
      const requests = [
        communityAPI.getVoteStats(linkId),
        user ? communityAPI.getUserVote(linkId) : Promise.resolve({ success: true, data: null })
      ];

      const [statsResponse, userVoteResponse] = await Promise.all(requests);

      // Check if request was aborted
      if (signal.aborted) return;

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
          voting: false,
          error: null
        };

        setVoteState(newVoteData);

        // 3. Cache the result
        if (userId) {
          setCachedVote(linkId, userId, newVoteData);
        }

        return newVoteData;
      } else {
        throw new Error('Failed to load vote data');
      }

    } catch (error) {
      if (signal.aborted) return;
      
      console.error('Load vote data error:', error);
      setVoteState(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
      throw error;
    }
  }, [linkId, user, getCachedVote, setCachedVote]);

  // Submit vote with optimistic updates
  const submitVote = useCallback(async (voteType) => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để vote');
      return;
    }

    if (voteState.voting) return;

    const currentVote = voteState.userVote;
    const newVote = currentVote === voteType ? null : voteType;
    
    // Calculate optimistic changes
    let scoreChange = 0;
    if (currentVote === null && newVote === 'upvote') scoreChange = 1;
    else if (currentVote === null && newVote === 'downvote') scoreChange = -1;
    else if (currentVote === 'upvote' && newVote === null) scoreChange = -1;
    else if (currentVote === 'downvote' && newVote === null) scoreChange = 1;
    else if (currentVote === 'upvote' && newVote === 'downvote') scoreChange = -2;
    else if (currentVote === 'downvote' && newVote === 'upvote') scoreChange = 2;

    // Store previous state for rollback
    const previousState = { ...voteState };

    // Optimistic update
    const optimisticState = {
      ...voteState,
      userVote: newVote,
      score: voteState.score + scoreChange,
      voting: true,
      error: null
    };
    setVoteState(optimisticState);

    try {
      const response = await communityAPI.submitVote(linkId, voteType);
      
      if (response.success) {
        // Update cache
        const userId = user?.id || user?.uid;
        if (userId) {
          setCachedVote(linkId, userId, {
            userVote: newVote,
            score: voteState.score + scoreChange,
            upvotes: voteState.upvotes,
            downvotes: voteState.downvotes
          });
        }

        // Show success feedback
        const message = newVote 
          ? `Đã ${voteType === 'upvote' ? 'upvote' : 'downvote'}!`
          : 'Đã hủy vote!';
        toast.success(message);

        // Set voting to false immediately - trust the backend and optimistic update
        setVoteState(prev => ({ ...prev, voting: false }));
        
      } else {
        throw new Error(response.error || 'Vote failed');
      }

    } catch (error) {
      console.error('Vote error:', error);
      toast.error('Không thể vote. Vui lòng thử lại.');
      
      // Rollback optimistic update
      setVoteState(previousState);
    }
  }, [linkId, user, voteState, setCachedVote, loadVoteData]);

  // Initialize data loading
  useEffect(() => {
    loadVoteData();
    
    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      clearTimeout(cacheTimeoutRef.current);
    };
  }, [loadVoteData]);

  // Cleanup refs on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      clearTimeout(cacheTimeoutRef.current);
    };
  }, []);

  return {
    // State
    userVote: voteState.userVote,
    score: voteState.score,
    upvotes: voteState.upvotes,
    downvotes: voteState.downvotes,
    loading: voteState.loading,
    voting: voteState.voting,
    error: voteState.error,
    
    // Actions
    submitVote,
    refreshVoteData: () => loadVoteData(true),
    
    // Computed
    hasVoted: voteState.userVote !== null,
    isUpvoted: voteState.userVote === 'upvote',
    isDownvoted: voteState.userVote === 'downvote'
  };
};

export default useVoteOptimized; 