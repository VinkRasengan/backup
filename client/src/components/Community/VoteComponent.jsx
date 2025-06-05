import React, { useState, useEffect } from 'react';
import {
  ChevronUp,
  ChevronDown,
  Shield,
  AlertTriangle,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const VoteComponent = ({ linkId, className = '' }) => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const [voteStats, setVoteStats] = useState({
    upvotes: 0,
    downvotes: 0,
    score: 0
  });
  const [userVote, setUserVote] = useState(null); // 'up', 'down', or null
  const [loading, setLoading] = useState(false);

  // Load vote data on component mount
  useEffect(() => {
    if (linkId) {
      loadVoteData();
    }
  }, [linkId]);

  const loadVoteData = async () => {
    try {
      setLoading(true);

      // Mock data for now - replace with actual API call
      const response = await fetch(`/api/votes/${linkId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setVoteStats(data.stats);
        setUserVote(data.userVote);
      } else {
        // Fallback to mock data
        setVoteStats({
          upvotes: Math.floor(Math.random() * 100),
          downvotes: Math.floor(Math.random() * 20),
          score: Math.floor(Math.random() * 80)
        });
      }
    } catch (error) {
      console.error('Load vote data error:', error);
      // Fallback to mock data
      setVoteStats({
        upvotes: Math.floor(Math.random() * 100),
        downvotes: Math.floor(Math.random() * 20),
        score: Math.floor(Math.random() * 80)
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (voteType) => {
    if (!user) {
      alert('Vui lòng đăng nhập để vote');
      return;
    }

    try {
      setLoading(true);

      // If user already voted this type, remove vote
      if (userVote === voteType) {
        setUserVote(null);
        // Update local stats
        if (voteType === 'up') {
          setVoteStats(prev => ({
            ...prev,
            upvotes: prev.upvotes - 1,
            score: prev.score - 1
          }));
        } else {
          setVoteStats(prev => ({
            ...prev,
            downvotes: prev.downvotes - 1,
            score: prev.score + 1
          }));
        }
      } else {
        // Submit new vote
        const oldVote = userVote;
        setUserVote(voteType);

        // Update local stats
        setVoteStats(prev => {
          let newStats = { ...prev };

          // Remove old vote
          if (oldVote === 'up') {
            newStats.upvotes -= 1;
            newStats.score -= 1;
          } else if (oldVote === 'down') {
            newStats.downvotes -= 1;
            newStats.score += 1;
          }

          // Add new vote
          if (voteType === 'up') {
            newStats.upvotes += 1;
            newStats.score += 1;
          } else {
            newStats.downvotes += 1;
            newStats.score -= 1;
          }

          return newStats;
        });
      }

      // TODO: Send to API
      // await fetch(`/api/votes/${linkId}`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${localStorage.getItem('token')}`
      //   },
      //   body: JSON.stringify({ voteType: userVote === voteType ? null : voteType })
      // });

    } catch (error) {
      console.error('Vote error:', error);
      // Revert changes on error
      await loadVoteData();
    } finally {
      setLoading(false);
    }
  };

  const formatScore = (score) => {
    if (score >= 1000) {
      return `${(score / 1000).toFixed(1)}k`;
    }
    return score.toString();
  };

  if (loading && voteStats.score === 0) {
    return (
      <div className="flex flex-col items-center space-y-2 animate-pulse">
        <div className="w-6 h-6 bg-gray-200 rounded"></div>
        <div className="w-8 h-4 bg-gray-200 rounded"></div>
        <div className="w-6 h-6 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-1">
      {/* Upvote Button */}
      <button
        onClick={() => handleVote('up')}
        disabled={loading || !user}
        className={`p-1 rounded transition-colors ${
          userVote === 'up'
            ? 'text-orange-500 hover:text-orange-600'
            : isDarkMode
            ? 'text-gray-400 hover:text-orange-500'
            : 'text-gray-500 hover:text-orange-500'
        } ${!user ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
        title={!user ? 'Đăng nhập để vote' : 'Upvote'}
      >
        <ChevronUp
          className={`w-6 h-6 ${userVote === 'up' ? 'fill-current' : ''}`}
        />
      </button>

      {/* Score */}
      <div className={`text-sm font-bold px-1 ${
        voteStats.score > 0
          ? 'text-orange-500'
          : voteStats.score < 0
          ? 'text-blue-500'
          : isDarkMode
          ? 'text-gray-300'
          : 'text-gray-700'
      }`}>
        {formatScore(voteStats.score)}
      </div>

      {/* Downvote Button */}
      <button
        onClick={() => handleVote('down')}
        disabled={loading || !user}
        className={`p-1 rounded transition-colors ${
          userVote === 'down'
            ? 'text-blue-500 hover:text-blue-600'
            : isDarkMode
            ? 'text-gray-400 hover:text-blue-500'
            : 'text-gray-500 hover:text-blue-500'
        } ${!user ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
        title={!user ? 'Đăng nhập để vote' : 'Downvote'}
      >
        <ChevronDown
          className={`w-6 h-6 ${userVote === 'down' ? 'fill-current' : ''}`}
        />
      </button>

      {/* Loading indicator */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};

export default VoteComponent;
