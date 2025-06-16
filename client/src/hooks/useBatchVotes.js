import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const useBatchVotes = () => {
    const [votesData, setVotesData] = useState({});
    const [userVotesData, setUserVotesData] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { user } = useAuth();

    // Cache to avoid duplicate requests
    const [requestedPostIds, setRequestedPostIds] = useState(new Set());

    const fetchBatchVotes = useCallback(async (postIds) => {
        if (!postIds || postIds.length === 0) return;

        // Filter out already requested posts
        const newPostIds = postIds.filter(id => !requestedPostIds.has(id));
        if (newPostIds.length === 0) return;

        setLoading(true);
        setError(null);

        try {
            console.log('🚀 Fetching batch votes for', newPostIds.length, 'posts');

            // Split into chunks of 10 (Firestore 'in' query limit)
            const chunks = [];
            for (let i = 0; i < newPostIds.length; i += 10) {
                chunks.push(newPostIds.slice(i, i + 10));
            }

            const promises = chunks.map(async (chunk) => {
                const response = await fetch(`${API_BASE_URL}/community/votes/batch`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ postIds: chunk }),
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                return response.json();
            });

            const results = await Promise.all(promises);
            
            // Merge all results
            const newVotesData = {};
            results.forEach(result => {
                if (result.success) {
                    Object.assign(newVotesData, result.data);
                }
            });

            setVotesData(prev => ({ ...prev, ...newVotesData }));
            setRequestedPostIds(prev => new Set([...prev, ...newPostIds]));

            // Fetch user votes if authenticated
            if (user) {
                await fetchBatchUserVotes(newPostIds);
            }

        } catch (err) {
            console.error('Error fetching batch votes:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [requestedPostIds, user]);

    const fetchBatchUserVotes = useCallback(async (postIds) => {
        if (!user || !postIds || postIds.length === 0) return;

        try {
            console.log('🚀 Fetching batch user votes for', postIds.length, 'posts');

            // Split into chunks of 10
            const chunks = [];
            for (let i = 0; i < postIds.length; i += 10) {
                chunks.push(postIds.slice(i, i + 10));
            }

            const promises = chunks.map(async (chunk) => {
                const response = await fetch(`${API_BASE_URL}/community/votes/batch/user`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${user.token}`,
                    },
                    body: JSON.stringify({ postIds: chunk }),
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                return response.json();
            });

            const results = await Promise.all(promises);
            
            // Merge all results
            const newUserVotesData = {};
            results.forEach(result => {
                if (result.success) {
                    Object.assign(newUserVotesData, result.data);
                }
            });

            setUserVotesData(prev => ({ ...prev, ...newUserVotesData }));

        } catch (err) {
            console.error('Error fetching batch user votes:', err);
        }
    }, [user]);

    // Get votes for a specific post
    const getVotesForPost = useCallback((postId) => {
        return votesData[postId] || { safe: 0, unsafe: 0, suspicious: 0, total: 0 };
    }, [votesData]);

    // Get user vote for a specific post
    const getUserVoteForPost = useCallback((postId) => {
        return userVotesData[postId] || null;
    }, [userVotesData]);

    // Clear cache (useful for refreshing data)
    const clearCache = useCallback(() => {
        setVotesData({});
        setUserVotesData({});
        setRequestedPostIds(new Set());
    }, []);

    // Preload votes for posts that are about to be visible
    const preloadVotes = useCallback((postIds) => {
        const newIds = postIds.filter(id => !requestedPostIds.has(id));
        if (newIds.length > 0) {
            fetchBatchVotes(newIds);
        }
    }, [fetchBatchVotes, requestedPostIds]);

    return {
        votesData,
        userVotesData,
        loading,
        error,
        fetchBatchVotes,
        getVotesForPost,
        getUserVoteForPost,
        clearCache,
        preloadVotes,
    };
};

// Hook for individual post vote management
export const usePostVote = (postId) => {
    const { getVotesForPost, getUserVoteForPost, fetchBatchVotes } = useBatchVotes();
    const [localLoading, setLocalLoading] = useState(false);

    // Ensure votes are loaded for this post
    useEffect(() => {
        if (postId) {
            fetchBatchVotes([postId]);
        }
    }, [postId, fetchBatchVotes]);

    const votes = getVotesForPost(postId);
    const userVote = getUserVoteForPost(postId);

    const submitVote = useCallback(async (voteType) => {
        if (!postId) return;

        setLocalLoading(true);
        try {
            // Get auth token
            const token = localStorage.getItem('authToken') ||
                         localStorage.getItem('backendToken') ||
                         localStorage.getItem('token');

            const response = await fetch(`http://localhost:8080/api/votes/${postId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify({ voteType }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Refresh votes after successful vote
            await fetchBatchVotes([postId]);
        } catch (error) {
            console.error('Error submitting vote:', error);
            throw error;
        } finally {
            setLocalLoading(false);
        }
    }, [postId, fetchBatchVotes]);

    return {
        votes,
        userVote,
        loading: localLoading,
        submitVote,
    };
};

export default useBatchVotes;
