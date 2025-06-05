import React, { useState, useEffect } from 'react';
import { 
  ShieldCheckIcon, 
  ExclamationTriangleIcon, 
  XCircleIcon,
  HandThumbUpIcon,
  HandThumbDownIcon
} from '@heroicons/react/24/outline';
import {
  ShieldCheckIcon as ShieldCheckSolid,
  ExclamationTriangleIcon as ExclamationTriangleSolid,
  XCircleIcon as XCircleSolid
} from '@heroicons/react/24/solid';
import communityAPI from '../../services/communityAPI';
import { useAuth } from '../../contexts/AuthContext';

const VoteComponent = ({ linkId, className = '' }) => {
  const { user } = useAuth();
  const [voteStats, setVoteStats] = useState({
    safe: 0,
    unsafe: 0,
    suspicious: 0,
    total: 0,
    trustLabel: 'unrated'
  });
  const [userVote, setUserVote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load vote data on component mount
  useEffect(() => {
    if (linkId) {
      loadVoteData();
    }
  }, [linkId]);

  const loadVoteData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load vote statistics
      const statsResponse = await communityAPI.getVoteStats(linkId);
      setVoteStats(statsResponse.summary);

      // Load user's vote if authenticated
      if (user && communityAPI.isAuthenticated()) {
        try {
          const userVoteResponse = await communityAPI.getUserVote(linkId);
          setUserVote(userVoteResponse.userVote);
        } catch (userVoteError) {
          // User hasn't voted yet, that's fine
          setUserVote(null);
        }
      }
    } catch (error) {
      console.error('Load vote data error:', error);
      setError('Không thể tải dữ liệu vote');
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
      setError(null);

      // If user already voted this type, remove vote
      if (userVote?.voteType === voteType) {
        await communityAPI.deleteVote(linkId);
        setUserVote(null);
      } else {
        // Submit new vote
        const response = await communityAPI.submitVote(linkId, voteType);
        setUserVote({ voteType, createdAt: new Date().toISOString() });
        setVoteStats(response.summary);
      }

      // Reload vote data to get updated stats
      await loadVoteData();
    } catch (error) {
      console.error('Vote error:', error);
      setError('Không thể gửi vote. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const getVoteIcon = (voteType, isActive) => {
    const iconClass = `w-5 h-5 ${isActive ? 'text-white' : 'text-gray-600'}`;
    
    switch (voteType) {
      case 'safe':
        return isActive ? 
          <ShieldCheckSolid className={iconClass} /> : 
          <ShieldCheckIcon className={iconClass} />;
      case 'suspicious':
        return isActive ? 
          <ExclamationTriangleSolid className={iconClass} /> : 
          <ExclamationTriangleIcon className={iconClass} />;
      case 'unsafe':
        return isActive ? 
          <XCircleSolid className={iconClass} /> : 
          <XCircleIcon className={iconClass} />;
      default:
        return null;
    }
  };

  const getVoteButtonClass = (voteType, isActive) => {
    const baseClass = "flex items-center space-x-2 px-3 py-2 rounded-lg border transition-all duration-200 hover:shadow-md";
    
    if (isActive) {
      switch (voteType) {
        case 'safe':
          return `${baseClass} bg-green-500 border-green-500 text-white hover:bg-green-600`;
        case 'suspicious':
          return `${baseClass} bg-yellow-500 border-yellow-500 text-white hover:bg-yellow-600`;
        case 'unsafe':
          return `${baseClass} bg-red-500 border-red-500 text-white hover:bg-red-600`;
        default:
          return `${baseClass} bg-gray-500 border-gray-500 text-white`;
      }
    } else {
      return `${baseClass} bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400`;
    }
  };

  const getTrustLabelClass = (trustLabel) => {
    const baseClass = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    
    switch (trustLabel) {
      case 'trusted':
        return `${baseClass} bg-green-100 text-green-800`;
      case 'likely-safe':
        return `${baseClass} bg-green-50 text-green-700`;
      case 'mixed-reviews':
        return `${baseClass} bg-yellow-100 text-yellow-800`;
      case 'suspicious':
        return `${baseClass} bg-orange-100 text-orange-800`;
      case 'likely-dangerous':
        return `${baseClass} bg-red-50 text-red-700`;
      case 'dangerous':
        return `${baseClass} bg-red-100 text-red-800`;
      default:
        return `${baseClass} bg-gray-100 text-gray-800`;
    }
  };

  if (loading && !voteStats.total) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-20 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      {/* Trust Label */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-900">Đánh giá cộng đồng</h3>
        <span className={getTrustLabelClass(voteStats.trustLabel)}>
          {communityAPI.getTrustLabelDisplay(voteStats.trustLabel)}
        </span>
      </div>

      {/* Vote Statistics */}
      <div className="grid grid-cols-3 gap-2 mb-4 text-center">
        <div className="flex flex-col items-center">
          <div className="flex items-center space-x-1 text-green-600">
            <ShieldCheckIcon className="w-4 h-4" />
            <span className="text-sm font-medium">{voteStats.safe}</span>
          </div>
          <span className="text-xs text-gray-500">An toàn</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="flex items-center space-x-1 text-yellow-600">
            <ExclamationTriangleIcon className="w-4 h-4" />
            <span className="text-sm font-medium">{voteStats.suspicious}</span>
          </div>
          <span className="text-xs text-gray-500">Đáng ngờ</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="flex items-center space-x-1 text-red-600">
            <XCircleIcon className="w-4 h-4" />
            <span className="text-sm font-medium">{voteStats.unsafe}</span>
          </div>
          <span className="text-xs text-gray-500">Nguy hiểm</span>
        </div>
      </div>

      {/* Vote Buttons */}
      {user ? (
        <div className="space-y-2">
          <p className="text-xs text-gray-600 text-center">
            {userVote ? 'Bạn đã vote:' : 'Bạn nghĩ link này như thế nào?'}
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleVote('safe')}
              disabled={loading}
              className={getVoteButtonClass('safe', userVote?.voteType === 'safe')}
            >
              {getVoteIcon('safe', userVote?.voteType === 'safe')}
              <span className="text-xs">An toàn</span>
            </button>
            <button
              onClick={() => handleVote('suspicious')}
              disabled={loading}
              className={getVoteButtonClass('suspicious', userVote?.voteType === 'suspicious')}
            >
              {getVoteIcon('suspicious', userVote?.voteType === 'suspicious')}
              <span className="text-xs">Đáng ngờ</span>
            </button>
            <button
              onClick={() => handleVote('unsafe')}
              disabled={loading}
              className={getVoteButtonClass('unsafe', userVote?.voteType === 'unsafe')}
            >
              {getVoteIcon('unsafe', userVote?.voteType === 'unsafe')}
              <span className="text-xs">Nguy hiểm</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">
            Đăng nhập để vote và bình luận
          </p>
          <button
            onClick={() => window.location.href = '/login'}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Đăng nhập ngay
          </button>
        </div>
      )}

      {/* Total Votes */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center justify-center space-x-2 text-gray-500">
          <div className="flex items-center space-x-1">
            <HandThumbUpIcon className="w-4 h-4" />
            <HandThumbDownIcon className="w-4 h-4" />
          </div>
          <span className="text-sm">
            {voteStats.total} {voteStats.total === 1 ? 'vote' : 'votes'}
          </span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
};

export default VoteComponent;
