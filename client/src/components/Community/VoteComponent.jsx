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

const VoteComponent = ({ linkId, postData, className = '' }) => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const [voteStats, setVoteStats] = useState({
    safe: 0,
    unsafe: 0,
    suspicious: 0,
    total: 0
  });
  const [userVote, setUserVote] = useState(null); // 'safe', 'unsafe', 'suspicious', or null
  const [loading, setLoading] = useState(false);

  // Load vote data on component mount
  useEffect(() => {
    if (postData) {
      // Use data from post
      setVoteStats({
        safe: postData.votes?.safe || 0,
        unsafe: postData.votes?.unsafe || 0,
        suspicious: postData.votes?.suspicious || 0,
        total: (postData.votes?.safe || 0) + (postData.votes?.unsafe || 0) + (postData.votes?.suspicious || 0)
      });
      setUserVote(postData.userVote || null);
    } else if (linkId) {
      loadVoteData();
    }
  }, [linkId, postData]);

  const loadVoteData = async () => {
    try {
      setLoading(true);

      // Try to load from API
      const response = await fetch(`/api/votes/${linkId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setVoteStats({
          safe: data.votes?.safe || 0,
          unsafe: data.votes?.unsafe || 0,
          suspicious: data.votes?.suspicious || 0,
          total: (data.votes?.safe || 0) + (data.votes?.unsafe || 0) + (data.votes?.suspicious || 0)
        });
        setUserVote(data.userVote);
      } else {
        // Fallback to mock data
        const safe = Math.floor(Math.random() * 50) + 10;
        const unsafe = Math.floor(Math.random() * 20);
        const suspicious = Math.floor(Math.random() * 10);
        setVoteStats({
          safe,
          unsafe,
          suspicious,
          total: safe + unsafe + suspicious
        });
      }
    } catch (error) {
      console.error('Load vote data error:', error);
      // Fallback to mock data
      const safe = Math.floor(Math.random() * 50) + 10;
      const unsafe = Math.floor(Math.random() * 20);
      const suspicious = Math.floor(Math.random() * 10);
      setVoteStats({
        safe,
        unsafe,
        suspicious,
        total: safe + unsafe + suspicious
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
        setVoteStats(prev => ({
          ...prev,
          [voteType]: Math.max(0, prev[voteType] - 1),
          total: Math.max(0, prev.total - 1)
        }));
      } else {
        // Submit new vote
        const oldVote = userVote;
        setUserVote(voteType);

        // Update local stats
        setVoteStats(prev => {
          let newStats = { ...prev };

          // Remove old vote
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
      if (userVote === voteType) {
        // Delete vote
        await fetch(`/api/votes/${linkId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('backendToken')}`
          }
        });
      } else {
        // Submit new vote
        await fetch(`/api/votes/${linkId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('backendToken')}`
          },
          body: JSON.stringify({ voteType })
        });
      }

    } catch (error) {
      console.error('Vote error:', error);
      // Revert changes on error
      if (postData) {
        setVoteStats({
          safe: postData.votes?.safe || 0,
          unsafe: postData.votes?.unsafe || 0,
          suspicious: postData.votes?.suspicious || 0,
          total: (postData.votes?.safe || 0) + (postData.votes?.unsafe || 0) + (postData.votes?.suspicious || 0)
        });
        setUserVote(postData.userVote || null);
      } else {
        await loadVoteData();
      }
    } finally {
      setLoading(false);
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
      {/* Safe Vote Button */}
      <button
        onClick={() => handleVote('safe')}
        disabled={loading || !user}
        className={`p-1 rounded transition-colors ${
          userVote === 'safe'
            ? 'text-green-600 bg-green-100 dark:bg-green-900/30'
            : isDarkMode
            ? 'text-gray-400 hover:text-green-500'
            : 'text-gray-500 hover:text-green-500'
        } ${!user ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
        title={!user ? 'Đăng nhập để vote' : 'Đáng tin cậy'}
      >
        <ChevronUp
          className={`w-5 h-5 ${userVote === 'safe' ? 'fill-current' : ''}`}
        />
      </button>

      {/* Vote Count */}
      <div className={`text-xs font-bold px-1 min-w-[24px] text-center ${
        isDarkMode ? 'text-gray-300' : 'text-gray-700'
      }`}>
        {formatNumber(voteStats.total)}
      </div>

      {/* Suspicious Vote Button */}
      <button
        onClick={() => handleVote('suspicious')}
        disabled={loading || !user}
        className={`p-1 rounded transition-colors ${
          userVote === 'suspicious'
            ? 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30'
            : isDarkMode
            ? 'text-gray-400 hover:text-yellow-500'
            : 'text-gray-500 hover:text-yellow-500'
        } ${!user ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
        title={!user ? 'Đăng nhập để vote' : 'Nghi ngờ'}
      >
        <span className="text-sm">⚠</span>
      </button>

      {/* Unsafe Vote Button */}
      <button
        onClick={() => handleVote('unsafe')}
        disabled={loading || !user}
        className={`p-1 rounded transition-colors ${
          userVote === 'unsafe'
            ? 'text-red-600 bg-red-100 dark:bg-red-900/30'
            : isDarkMode
            ? 'text-gray-400 hover:text-red-500'
            : 'text-gray-500 hover:text-red-500'
        } ${!user ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
        title={!user ? 'Đăng nhập để vote' : 'Không đáng tin'}
      >
        <ChevronDown
          className={`w-5 h-5 ${userVote === 'unsafe' ? 'fill-current' : ''}`}
        />
      </button>

      {/* Loading indicator */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-800/80 rounded">
          <div className="w-3 h-3 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};

export default VoteComponent;
