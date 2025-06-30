/**
 * Community utility functions for handling posts, comments, and voting
 */

import toast from 'react-hot-toast';
import { isValidUrl as validateUrl } from './urlUtils';

export const formatNumber = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

export const formatDate = (date) => {
  if (!date) return 'Unknown date';
  
  const postDate = new Date(date);
  const now = new Date();
  const diffTime = Math.abs(now - postDate);
  const diffMinutes = Math.floor(diffTime / (1000 * 60));
  const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffMinutes < 60) {
    return `${diffMinutes} minutes ago`;
  }
  if (diffHours < 24) {
    return `${diffHours} hours ago`;
  }
  if (diffDays === 1) {
    return 'Yesterday';
  }
  if (diffDays < 7) {
    return `${diffDays} days ago`;
  }
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  }
  
  return postDate.toLocaleDateString();
};

export const getTrustScoreColor = (score) => {
  if (score >= 90) return 'text-green-700 bg-green-100 border-green-200';
  if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
  if (score >= 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  if (score >= 60) return 'text-orange-600 bg-orange-50 border-orange-200';
  return 'text-red-600 bg-red-50 border-red-200';
};

export const getVerificationLevel = (verified, trustScore) => {
  if (verified && trustScore >= 90) {
    return {
      level: 'verified',
      label: 'Verified',
      color: 'text-green-600',
      icon: 'CheckCircle'
    };
  }
  if (trustScore >= 80) {
    return {
      level: 'trusted',
      label: 'Trusted',
      color: 'text-blue-600',
      icon: 'Shield'
    };
  }
  if (trustScore >= 60) {
    return {
      level: 'caution',
      label: 'Caution',
      color: 'text-yellow-600',
      icon: 'AlertTriangle'
    };
  }
  return {
    level: 'unverified',
    label: 'Unverified',
    color: 'text-red-600',
    icon: 'AlertCircle'
  };
};

export const calculateVoteScore = (voteStats) => {
  if (!voteStats) return 0;
  const { safe = 0, unsafe = 0, suspicious = 0 } = voteStats;
  const total = safe + unsafe + suspicious;
  if (total === 0) return 0;
  
  // Weight: safe = +1, suspicious = 0, unsafe = -1
  const score = (safe - unsafe) / total * 100;
  return Math.round(score);
};

export const getVotePercentages = (voteStats) => {
  if (!voteStats) return { safe: 0, unsafe: 0, suspicious: 0 };
  
  const { safe = 0, unsafe = 0, suspicious = 0 } = voteStats;
  const total = safe + unsafe + suspicious;
  
  if (total === 0) return { safe: 0, unsafe: 0, suspicious: 0 };
  
  return {
    safe: Math.round((safe / total) * 100),
    unsafe: Math.round((unsafe / total) * 100),
    suspicious: Math.round((suspicious / total) * 100)
  };
};

export const truncateText = (text, maxLength = 300) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  
  // Find the last space before maxLength to avoid cutting words
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > maxLength * 0.8) {
    return truncated.substring(0, lastSpace) + '...';
  }
  
  return truncated + '...';
};

export const extractDomain = (url) => {
  if (!url) return '';
  try {
    const domain = new URL(url).hostname;
    return domain.replace('www.', '');
  } catch {
    return '';
  }
};

export const generateAvatarUrl = (name, size = 40) => {
  const initials = name
    ?.split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2) || '??';
  
  // Generate a consistent color based on name
  const colors = [
    'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
    'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
  ];
  
  const colorIndex = name ? name.charCodeAt(0) % colors.length : 0;
  
  return {
    initials,
    colorClass: colors[colorIndex],
    size
  };
};

export const sharePost = async (post) => {
  const shareData = {
    title: post.title || 'Check out this post',
    text: truncateText(post.content, 100),
    url: post.url || window.location.href
  };
  
  try {
    if (navigator.share && navigator.canShare(shareData)) {
      await navigator.share(shareData);
      return { success: true, method: 'native' };
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(shareData.url);
      return { success: true, method: 'clipboard' };
    }
  } catch (error) {
    console.error('Error sharing:', error);
    return { success: false, error };
  }
};

export const validatePostData = (post) => {
  const errors = [];
  
  if (!post.title || post.title.trim().length < 5) {
    errors.push('Title must be at least 5 characters long');
  }
  
  if (!post.content || post.content.trim().length < 10) {
    errors.push('Content must be at least 10 characters long');
  }
  
  if (post.url && !isValidUrl(post.url)) {
    errors.push('Please provide a valid URL');
  }
  
  if (post.tags && post.tags.length > 10) {
    errors.push('Maximum 10 tags allowed');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const isValidUrl = validateUrl;

export const sortPosts = (posts, sortBy = 'newest') => {
  const sortedPosts = [...posts];
  
  switch (sortBy) {
    case 'newest':
      return sortedPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    case 'oldest':
      return sortedPosts.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    case 'trending':
      return sortedPosts.sort((a, b) => {
        const scoreA = (a.voteScore || 0) + (a.commentCount || 0) * 2 + (a.viewCount || 0) * 0.1;
        const scoreB = (b.voteScore || 0) + (b.commentCount || 0) * 2 + (b.viewCount || 0) * 0.1;
        return scoreB - scoreA;
      });
    case 'most_voted':
      return sortedPosts.sort((a, b) => (b.voteStats?.total || 0) - (a.voteStats?.total || 0));
    case 'most_commented':
      return sortedPosts.sort((a, b) => (b.commentCount || 0) - (a.commentCount || 0));
    case 'trust_score':
      return sortedPosts.sort((a, b) => (b.trustScore || 0) - (a.trustScore || 0));
    default:
      return sortedPosts;
  }
};

export const filterPosts = (posts, filters = {}) => {
  let filteredPosts = [...posts];
  
  // Filter by category
  if (filters.category && filters.category !== 'all') {
    filteredPosts = filteredPosts.filter(post => 
      post.category?.toLowerCase() === filters.category.toLowerCase()
    );
  }
  
  // Filter by verification status
  if (filters.verified !== undefined) {
    filteredPosts = filteredPosts.filter(post => post.verified === filters.verified);
  }
  
  // Filter by trust score range
  if (filters.minTrustScore !== undefined) {
    filteredPosts = filteredPosts.filter(post => 
      (post.trustScore || 0) >= filters.minTrustScore
    );
  }
  
  // Filter by search term
  if (filters.search) {
    const searchTerm = filters.search.toLowerCase();
    filteredPosts = filteredPosts.filter(post =>
      post.title?.toLowerCase().includes(searchTerm) ||
      post.content?.toLowerCase().includes(searchTerm) ||
      post.tags?.some(tag => tag.toLowerCase().includes(searchTerm)) ||
      post.author?.displayName?.toLowerCase().includes(searchTerm)
    );
  }
  
  return filteredPosts;
};
