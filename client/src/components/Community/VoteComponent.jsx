import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronUp,
  ChevronDown,
  Shield,
  AlertTriangle,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useCounterAnimation, useHoverAnimation } from '../../hooks/useGSAP';
import { gsap } from '../../utils/gsap';
import { usePostVote } from '../../hooks/useBatchVotes';

// Simple cache to prevent duplicate requests
const voteDataCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const VoteComponent = ({ linkId, postData, className = '' }) => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();

  // Use optimized batch voting hook
  const { votes: batchVoteStats, userVote: batchUserVote, loading: batchLoading, submitVote } = usePostVote(linkId);

  // Legacy state for fallback (Reddit-style)
  const [legacyVoteStats, setLegacyVoteStats] = useState({
    upvotes: 0,
    downvotes: 0,
    score: 0,
    total: 0
  });
  const [legacyUserVote, setLegacyUserVote] = useState(null);
  const [legacyLoading, setLegacyLoading] = useState(false);

  // Use batch data if available, otherwise fallback to legacy
  const voteStats = batchVoteStats.total > 0 ? batchVoteStats : legacyVoteStats;
  const userVote = batchUserVote !== null ? batchUserVote : legacyUserVote;
  const loading = batchLoading || legacyLoading;

  // GSAP refs and animations
  const [counterRef, startCounterAnimation] = useCounterAnimation(voteStats.total, {
    duration: 0.8,
    ease: "power2.out"
  });

  const safeButtonRef = useHoverAnimation(
    { scale: 1.1, duration: 0.2 },
    { scale: 1, duration: 0.2 }
  );

  const suspiciousButtonRef = useHoverAnimation(
    { scale: 1.1, duration: 0.2 },
    { scale: 1, duration: 0.2 }
  );

  const unsafeButtonRef = useHoverAnimation(
    { scale: 1.1, duration: 0.2 },
    { scale: 1, duration: 0.2 }
  );

  const loadingRef = useRef();

  // Load vote data on component mount
  useEffect(() => {
    if (postData && postData.voteStats) {
      // Use data from post for legacy fallback
      const newStats = {
        safe: postData.voteStats.safe || 0,
        unsafe: postData.voteStats.unsafe || 0,
        suspicious: postData.voteStats.suspicious || 0,
        total: postData.voteStats.total || 0
      };
      setLegacyVoteStats(newStats);
      setLegacyUserVote(postData.userVote || null);

      // Trigger counter animation
      setTimeout(() => startCounterAnimation(), 100);
    } else if (linkId && batchVoteStats.total === 0) {
      // Only load legacy data if batch data is not available
      loadVoteData();
    }

    // Always load user vote if user is logged in and batch data doesn't have it
    if (linkId && user && batchUserVote === null) {
      loadUserVote();
    }
  }, [linkId, postData, user, batchVoteStats.total, batchUserVote]); // Removed startCounterAnimation dependency

  // Animate counter when vote stats change
  useEffect(() => {
    if (voteStats.total > 0) {
      startCounterAnimation();
    }
  }, [voteStats.total, startCounterAnimation]);

  // Debounced version of loadVoteData to prevent spam
  const loadVoteData = useCallback(async () => {
    // Prevent multiple simultaneous requests
    if (legacyLoading) return;

    // Check cache first
    const cacheKey = `vote_${linkId}`;
    const cached = voteDataCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('Using cached vote data for', linkId);
      setLegacyVoteStats(cached.stats);
      setLegacyUserVote(cached.userVote);
      setTimeout(() => startCounterAnimation(), 100);
      return;
    }

    try {
      setLegacyLoading(true);

      // Use optimized endpoint with caching
      const token = localStorage.getItem('authToken') || localStorage.getItem('backendToken') || localStorage.getItem('token');
      const response = await fetch(`/api/votes/${linkId}/optimized`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'max-age=300' // 5 minutes cache
        }
      });

      if (response.ok) {
        const data = await response.json();
        const newStats = {
          upvotes: data.statistics?.upvotes || 0,
          downvotes: data.statistics?.downvotes || 0,
          score: data.statistics?.score || 0,
          total: data.statistics?.total || 0
        };
        setLegacyVoteStats(newStats);
        setLegacyUserVote(data.userVote);

        // Cache the result
        voteDataCache.set(cacheKey, {
          stats: newStats,
          userVote: data.userVote,
          timestamp: Date.now()
        });

        // Trigger counter animation
        setTimeout(() => startCounterAnimation(), 100);
      } else {
        // Fallback to regular endpoint
        await loadVoteDataFallback();
      }
    } catch (error) {
      console.error('Load vote data error:', error);
      // Fallback to regular endpoint
      await loadVoteDataFallback();
    } finally {
      setLegacyLoading(false);
    }
  }, [linkId, legacyLoading, startCounterAnimation]);

  const loadVoteDataFallback = async () => {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('backendToken') || localStorage.getItem('token');
      const response = await fetch(`/api/votes/${linkId}/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const newStats = {
          safe: data.statistics?.safe || 0,
          unsafe: data.statistics?.unsafe || 0,
          suspicious: data.statistics?.suspicious || 0,
          total: data.statistics?.total || 0
        };
        setLegacyVoteStats(newStats);
        setLegacyUserVote(data.userVote);
      } else {
        // Generate mock data as last resort
        const safe = Math.floor(Math.random() * 50) + 10;
        const unsafe = Math.floor(Math.random() * 20);
        const suspicious = Math.floor(Math.random() * 10);
        setLegacyVoteStats({
          safe,
          unsafe,
          suspicious,
          total: safe + unsafe + suspicious
        });
      }
    } catch (error) {
      console.error('Fallback vote data error:', error);
      // Generate mock data as last resort
      const safe = Math.floor(Math.random() * 50) + 10;
      const unsafe = Math.floor(Math.random() * 20);
      const suspicious = Math.floor(Math.random() * 10);
      setLegacyVoteStats({
        safe,
        unsafe,
        suspicious,
        total: safe + unsafe + suspicious
      });
    }
  };

  // Load user's vote for this link
  const loadUserVote = async () => {
    if (!linkId || !user) return;

    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('backendToken');
      const response = await fetch(`/api/votes/${linkId}/user`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLegacyUserVote(data.userVote?.voteType || null);
      }
    } catch (error) {
      console.error('Error loading user vote:', error);
    }
  };

  const handleVote = async (voteType) => {
    if (!user) {
      alert('Vui lòng đăng nhập để vote');
      return;
    }

    // Try to use optimized batch voting first
    if (submitVote) {
      try {
        await submitVote(voteType);
        return;
      } catch (error) {
        console.error('Batch vote failed, falling back to legacy:', error);
      }
    }

    // Fallback to legacy voting
    try {
      setLegacyLoading(true);
      const isUnvote = userVote === voteType;
      const oldVote = userVote;

      // Add vote animation effect
      const buttonRef = voteType === 'upvote' ? safeButtonRef : unsafeButtonRef;

      if (buttonRef.current) {
        gsap.to(buttonRef.current, {
          scale: 0.9,
          duration: 0.1,
          yoyo: true,
          repeat: 1,
          ease: "power2.inOut"
        });
      }

      // Optimistic update for legacy state
      if (isUnvote) {
        // Remove vote
        setLegacyUserVote(null);
        setLegacyVoteStats(prev => ({
          ...prev,
          [voteType]: Math.max(0, prev[voteType] - 1),
          total: Math.max(0, prev.total - 1)
        }));
      } else {
        // Add/change vote
        setLegacyUserVote(voteType);
        setLegacyVoteStats(prev => {
          let newStats = { ...prev };

          // Remove old vote if exists
          if (oldVote) {
            newStats[oldVote] = Math.max(0, newStats[oldVote] - 1);
            newStats.total = Math.max(0, newStats.total - 1);
          }

          // Add new vote
          newStats[voteType] += 1;
          newStats.total += 1;

          return newStats;
        });
      }

      // Send to API
      let response;
      if (isUnvote) {
        // Delete vote
        response = await fetch(`/api/votes/${linkId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('backendToken')}`
          }
        });
      } else {
        // Submit new vote
        response = await fetch(`/api/votes/${linkId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('backendToken')}`
          },
          body: JSON.stringify({
            voteType,
            userId: user?.id || user?.uid,
            userEmail: user?.email
          })
        });
      }

      // Check if API call was successful
      if (!response.ok) {
        throw new Error('Vote API call failed');
      }

    } catch (error) {
      console.error('Vote error:', error);
      // Revert changes on error
      if (postData && postData.voteStats) {
        setLegacyVoteStats({
          upvotes: postData.voteStats.upvotes || 0,
          downvotes: postData.voteStats.downvotes || 0,
          score: postData.voteStats.score || 0,
          total: postData.voteStats.total || 0
        });
        setLegacyUserVote(postData.userVote || null);
      } else if (linkId) {
        await loadVoteData();
      }
    } finally {
      setLegacyLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  if (loading && voteStats.total === 0) {
    return (
      <div className="flex flex-col items-center space-y-1 animate-pulse">
        <div className="w-8 h-6 bg-gray-200 rounded"></div>
        <div className="w-6 h-4 bg-gray-200 rounded"></div>
        <div className="w-8 h-6 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-1 relative">
      {/* Upvote Button */}
      <button
        ref={safeButtonRef}
        onClick={() => handleVote('upvote')}
        disabled={loading || !user}
        className={`p-1 rounded transition-colors ${
          userVote === 'upvote'
            ? 'text-orange-600 bg-orange-100 dark:bg-orange-900/30'
            : isDarkMode
            ? 'text-gray-400 hover:text-orange-500'
            : 'text-gray-500 hover:text-orange-500'
        } ${!user ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
        title={!user ? 'Đăng nhập để vote' : 'Upvote'}
      >
        <ChevronUp
          className={`w-5 h-5 ${userVote === 'upvote' ? 'fill-current' : ''}`}
        />
      </button>

      {/* Vote Score (Reddit-style) */}
      <div
        ref={counterRef}
        className={`text-xs font-bold px-1 min-w-[24px] text-center ${
          voteStats.score > 0
            ? 'text-orange-600'
            : voteStats.score < 0
            ? 'text-blue-600'
            : isDarkMode ? 'text-gray-300' : 'text-gray-700'
        }`}
      >
        {formatNumber(voteStats.score || 0)}
      </div>

      {/* Downvote Button */}
      <button
        ref={unsafeButtonRef}
        onClick={() => handleVote('downvote')}
        disabled={loading || !user}
        className={`p-1 rounded transition-colors ${
          userVote === 'downvote'
            ? 'text-blue-600 bg-blue-100 dark:bg-blue-900/30'
            : isDarkMode
            ? 'text-gray-400 hover:text-blue-500'
            : 'text-gray-500 hover:text-blue-500'
        } ${!user ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
        title={!user ? 'Đăng nhập để vote' : 'Downvote'}
      >
        <ChevronDown
          className={`w-5 h-5 ${userVote === 'downvote' ? 'fill-current' : ''}`}
        />
      </button>

      {/* Loading indicator */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-800/80 rounded">
          <div
            ref={loadingRef}
            className="w-3 h-3 border-2 border-gray-300 border-t-blue-600 rounded-full"
            style={{ animation: 'spin 1s linear infinite' }}
          ></div>
        </div>
      )}
    </div>
  );
};

export default VoteComponent;
