import React, { useState, useEffect, useRef } from 'react';
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
import toast from 'react-hot-toast';
import { communityAPI } from '../../services/api';

const VoteComponent = ({ linkId, postData, className = '' }) => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  
  // Simple state management (similar to CommentVoteButton)
  const [voteStats, setVoteStats] = useState({
    upvotes: 0,
    downvotes: 0,
    score: 0,
    total: 0
  });
  const [userVote, setUserVote] = useState(null); // 'upvote', 'downvote', or null
  const [isLoading, setIsLoading] = useState(false);
  const [isVoting, setIsVoting] = useState(false);

  // Debug user state
  console.log('🔍 VoteComponent render:', {
    linkId,
    hasUser: !!user,
    userEmail: user?.email,
    userId: user?.id || user?.uid,
    userVote,
    voteStats
  });

  // GSAP refs and animations
  const [counterRef, startCounterAnimation] = useCounterAnimation(voteStats.score || 0, {
    duration: 0.8,
    ease: "power2.out"
  });

  const upvoteButtonRef = useHoverAnimation(
    { scale: 1.1, duration: 0.2 },
    { scale: 1, duration: 0.2 }
  );

  const downvoteButtonRef = useHoverAnimation(
    { scale: 1.1, duration: 0.2 },
    { scale: 1, duration: 0.2 }
  );

  const loadingRef = useRef();

  // Load vote data from API (similar to CommentVoteButton)
  useEffect(() => {
    const loadVoteData = async () => {
      if (!linkId) return;

      try {
        setIsLoading(true);
        
        // Load vote statistics
        const statsResponse = await communityAPI.getVoteStats(linkId);
        console.log('� Vote stats response:', statsResponse);
        
        if (statsResponse.success) {
          const stats = statsResponse.data.statistics || statsResponse.data || {};
          setVoteStats({
            upvotes: stats.upvotes || 0,
            downvotes: stats.downvotes || 0,
            score: stats.score || 0,
            total: stats.total || 0
          });
        }

        // Load user vote if user is logged in
        if (user) {
          console.log('🔍 Loading user vote for linkId:', linkId);
          const userVoteResponse = await communityAPI.getUserVote(linkId);
          console.log('📥 User vote response:', userVoteResponse);
          
          if (userVoteResponse.success) {
            const userVoteData = userVoteResponse.data;
            const voteType = userVoteData?.voteType || null;
            console.log('🗳️ Setting user vote:', { userVoteData, voteType });
            setUserVote(voteType);
          }
        }
        
      } catch (error) {
        console.error('Load vote data error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadVoteData();
  }, [linkId, user]);

  // Animate counter when vote stats change
  useEffect(() => {
    if (voteStats.score !== undefined) {
      startCounterAnimation();
    }
  }, [voteStats.score, startCounterAnimation]);

  const handleVote = async (voteType) => {
    console.log('🗳️ VoteComponent.handleVote called:', { voteType, linkId, user: !!user });

    if (!user) {
      console.log('❌ No user logged in');
      toast.error('Vui lòng đăng nhập để vote');
      return;
    }

    if (isVoting) return;

    const previousUserVote = userVote;
    const previousVoteStats = { ...voteStats };

    console.log('📊 Current state before vote:', { 
      userVote, 
      voteStats, 
      requestedVoteType: voteType 
    });

    // Optimistic UI update (similar to CommentVoteButton)
    let newUserVote = userVote;
    let newScore = voteStats.score;

    // Calculate new vote state
    if (userVote === voteType) {
      // Remove vote (toggle off)
      newUserVote = null;
      newScore = voteType === 'upvote' ? voteStats.score - 1 : voteStats.score + 1;
    } else if (userVote === null) {
      // Add new vote
      newUserVote = voteType;
      newScore = voteType === 'upvote' ? voteStats.score + 1 : voteStats.score - 1;
    } else {
      // Change vote (upvote -> downvote or vice versa)
      newUserVote = voteType;
      newScore = voteType === 'upvote' ? voteStats.score + 2 : voteStats.score - 2;
    }

    console.log('🔮 Optimistic update:', { 
      newUserVote, 
      newScore, 
      previousUserVote, 
      previousScore: voteStats.score 
    });

    // Update UI immediately
    setUserVote(newUserVote);
    setVoteStats(prev => {
      let newUpvotes = prev.upvotes;
      let newDownvotes = prev.downvotes;
      
      // Calculate upvotes/downvotes based on vote change
      if (userVote === 'upvote' && newUserVote === null) {
        // Removing upvote
        newUpvotes = Math.max(0, prev.upvotes - 1);
      } else if (userVote === 'downvote' && newUserVote === null) {
        // Removing downvote
        newDownvotes = Math.max(0, prev.downvotes - 1);
      } else if (userVote === null && newUserVote === 'upvote') {
        // Adding upvote
        newUpvotes = prev.upvotes + 1;
      } else if (userVote === null && newUserVote === 'downvote') {
        // Adding downvote
        newDownvotes = prev.downvotes + 1;
      } else if (userVote === 'upvote' && newUserVote === 'downvote') {
        // Changing from upvote to downvote
        newUpvotes = Math.max(0, prev.upvotes - 1);
        newDownvotes = prev.downvotes + 1;
      } else if (userVote === 'downvote' && newUserVote === 'upvote') {
        // Changing from downvote to upvote
        newDownvotes = Math.max(0, prev.downvotes - 1);
        newUpvotes = prev.upvotes + 1;
      }
      
      return {
        ...prev,
        upvotes: newUpvotes,
        downvotes: newDownvotes,
        score: newScore,
        total: newUpvotes + newDownvotes
      };
    });
    setIsVoting(true);

    try {
      // Call API
      console.log('📡 Sending vote API request...');
      const response = await communityAPI.submitVote(
        linkId,
        voteType,
        user?.id || user?.uid,
        user?.email
      );

      console.log('📥 Vote API response:', response);
      if (!response.success) {
        console.error('❌ Vote API error:', response.error);
        throw new Error(`Vote failed: ${response.error}`);
      }

      // Show success feedback
      const action = response.action || response.data?.action;
      console.log('🔄 Vote action:', action);
      console.log('📊 Expected final state:', { 
        userVote: newUserVote, 
        score: newScore 
      });
      
      if (action === 'removed') {
        toast.success('Đã hủy vote!');
      } else if (action === 'updated') {
        toast.success(`Đã chuyển sang ${voteType === 'upvote' ? 'upvote' : 'downvote'}!`);
      } else {
        toast.success(`Đã ${voteType === 'upvote' ? 'upvote' : 'downvote'}!`);
      }

      // Reload data to get accurate stats from server
      setTimeout(async () => {
        try {
          console.log('🔄 Reloading vote data from server...');
          // Reload both stats and user vote to ensure consistency
          const [statsResponse, userVoteResponse] = await Promise.all([
            communityAPI.getVoteStats(linkId),
            user ? communityAPI.getUserVote(linkId) : Promise.resolve({ success: true, data: null })
          ]);
          
          console.log('📊 Reloaded stats response:', statsResponse);
          console.log('👤 Reloaded user vote response:', userVoteResponse);
          
          if (statsResponse.success) {
            const stats = statsResponse.data.statistics || statsResponse.data || {};
            const newStats = {
              upvotes: stats.upvotes || 0,
              downvotes: stats.downvotes || 0,
              score: stats.score || 0,
              total: stats.total || 0
            };
            console.log('📊 Setting new stats:', newStats);
            setVoteStats(newStats);
          }
          
          if (userVoteResponse.success && user) {
            const userVoteData = userVoteResponse.data;
            const voteType = userVoteData?.voteType || null;
            console.log('👤 Setting new user vote:', voteType);
            setUserVote(voteType);
          }
        } catch (error) {
          console.error('Failed to reload vote data:', error);
        }
      }, 100);

    } catch (error) {
      console.error('Vote error:', error);
      toast.error('Không thể vote. Vui lòng thử lại.');

      // Revert optimistic update
      setUserVote(previousUserVote);
      setVoteStats(previousVoteStats);
    } finally {
      setIsVoting(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  if (isLoading && voteStats.total === 0) {
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
        ref={upvoteButtonRef}
        onClick={() => {
          console.log('🔴 UPVOTE BUTTON CLICKED!', { linkId, user: !!user });
          handleVote('upvote');
        }}
        disabled={isVoting || !user}
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
        ref={downvoteButtonRef}
        onClick={() => {
          console.log('🔵 DOWNVOTE BUTTON CLICKED!', { linkId, user: !!user });
          handleVote('downvote');
        }}
        disabled={isVoting || !user}
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
      {isVoting && (
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
