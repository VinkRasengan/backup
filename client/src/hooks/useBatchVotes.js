import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";

export const useBatchVotes = () => {
    const [votesData, setVotesData] = useState({});
    const [userVotesData, setUserVotesData] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { user } = useAuth();

    // Cache to avoid duplicate requests
    const [requestedPostIds, setRequestedPostIds] = useState(new Set());

    const fetchBatchVotes = useCallback(async (postIds, forceRefresh = false) => {
        if (!postIds || postIds.length === 0) return;

        // Filter out already requested posts (unless force refresh)
        const newPostIds = forceRefresh ? postIds : postIds.filter(id => !requestedPostIds.has(id));
        if (newPostIds.length === 0) {
            console.log('🔄 No new posts to fetch', { forceRefresh, requestedCount: postIds.length });
            return;
        }

        setLoading(true);
        setError(null);

        try {
            console.log('🚀 Fetching batch votes for', newPostIds.length, 'posts', { forceRefresh });

            // Split into chunks of 10 (Firestore 'in' query limit)
            const chunks = [];
            for (let i = 0; i < newPostIds.length; i += 10) {
                chunks.push(newPostIds.slice(i, i + 10));
            }

            const promises = chunks.map(async (chunk) => {
                const url = `${API_BASE_URL}/api/votes/batch/stats`;
                console.log('🔍 Batch stats URL:', url);
                console.log('🔍 API_BASE_URL:', API_BASE_URL);

                // Add timeout to prevent hanging
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

                try {
                    const response = await fetch(url, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ postIds: chunk }),
                        signal: controller.signal
                    });

                    clearTimeout(timeoutId);

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    return response.json();
                } catch (error) {
                    clearTimeout(timeoutId);
                    if (error.name === 'AbortError') {
                        throw new Error('Request timeout - server took too long to respond');
                    }
                    throw error;
                }
            });

            const results = await Promise.all(promises);
            
            // Merge all results
            const newVotesData = {};
            results.forEach(result => {
                if (result.success) {
                    Object.assign(newVotesData, result.data);
                }
            });

            console.log('📊 Updating votes data:', { newVotesData, forceRefresh });
            setVotesData(prev => ({ ...prev, ...newVotesData }));
            setRequestedPostIds(prev => new Set([...prev, ...newPostIds]));

            // Fetch user votes if authenticated
            if (user) {
                await fetchBatchUserVotes(newPostIds, forceRefresh);
            }

        } catch (err) {
            console.error('Error fetching batch votes:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [requestedPostIds, user]);    const fetchBatchUserVotes = useCallback(async (postIds, forceRefresh = false) => {
        if (!user || !postIds || postIds.length === 0) return;

        try {
            console.log('🚀 Fetching batch user votes for', postIds.length, 'posts');

            // Get auth token from localStorage (consistent with submitVote)
            const token = localStorage.getItem('authToken') ||
                         localStorage.getItem('backendToken') ||
                         localStorage.getItem('token');            if (!token) {
                console.log('❌ No auth token found');
                return;
            }

            console.log('🔑 Auth token info:', { hasToken: !!token, tokenLength: token?.length });

            // Split into chunks of 10
            const chunks = [];
            for (let i = 0; i < postIds.length; i += 10) {
                chunks.push(postIds.slice(i, i + 10));
            }            const promises = chunks.map(async (chunk) => {
                const url = `${API_BASE_URL}/api/votes/batch/user`;
                console.log('🔍 Batch user votes URL:', url);
                console.log('🔍 API_BASE_URL:', API_BASE_URL);
                console.log('🔑 Sending auth token:', token?.substring(0, 50) + '...');
                
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        postIds: chunk,
                        userId: user?.id || user?.uid // Fallback for when token verification fails
                    }),
                });

                console.log('📥 Batch user votes response:', { 
                    status: response.status, 
                    ok: response.ok,
                    statusText: response.statusText 
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('❌ Batch user votes error:', errorText);
                    throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
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

            console.log('👤 Updating user votes data:', { newUserVotesData });
            setUserVotesData(prev => ({ ...prev, ...newUserVotesData }));

        } catch (err) {
            console.error('Error fetching batch user votes:', err);
        }
    }, [user]);

    // Get votes for a specific post
    const getVotesForPost = useCallback((postId) => {
        return votesData[postId] || { total: 0, upvotes: 0, downvotes: 0, score: 0 };
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
        console.log('🗳️ useBatchVotes.submitVote called:', { postId, voteType });

        if (!postId) {
            console.log('❌ No linkId provided');
            return;
        }

        setLocalLoading(true);
        try {
            // Get auth token
            const token = localStorage.getItem('authToken') ||
                         localStorage.getItem('backendToken') ||
                         localStorage.getItem('token');

            // Get user info
            const user = JSON.parse(localStorage.getItem('user') || '{}');

            console.log('🔑 Auth info:', { hasToken: !!token, userId: user.uid || user.id, userEmail: user.email });

            const requestBody = {
                voteType,
                userId: user.uid || user.id,
                userEmail: user.email
            };            console.log('📤 Batch vote request:', {
                url: `${API_BASE_URL}/api/votes/${postId}`,
                body: requestBody
            });

            // Create AbortController for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

            // Use API Gateway for proper routing
            const response = await fetch(`${API_BASE_URL}/api/votes/${postId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify(requestBody),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            console.log('📥 Batch vote response:', { status: response.status, ok: response.ok });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Batch vote error response:', errorText);
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }

            const responseData = await response.json();
            console.log('✅ Batch vote success:', responseData);

            // Refresh votes after successful vote (force refresh to bypass cache)
            console.log('🔄 Refreshing votes...');
            await fetchBatchVotes([postId], true);

            console.log('✅ Vote process completed successfully');
        } catch (error) {
            if (error.name === 'AbortError') {
                console.error('❌ Batch vote request timed out after 10 seconds');
                throw new Error('Request timed out. Please try again.');
            }
            console.error('❌ Error submitting batch vote:', error);
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
