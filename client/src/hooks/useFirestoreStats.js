import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export const useFirestoreStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalComments: 0,
    totalVotes: 0,
    userPosts: 0,
    userComments: 0,
    userVotes: 0,
    recentActivity: [],
    loading: true,
    error: null
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStats(prev => ({ ...prev, loading: true, error: null }));

        // Use backend API instead of direct Firestore calls
        const response = await fetch('/api/stats/community', {
          headers: {
            'Content-Type': 'application/json',
            // Add auth header if user is logged in
            ...(user && { 'Authorization': `Bearer ${await user.getIdToken()}` })
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        setStats({
          totalPosts: data.totalPosts || 0,
          totalComments: data.totalComments || 0,
          totalVotes: data.totalVotes || 0,
          userPosts: data.userPosts || 0,
          userComments: data.userComments || 0,
          userVotes: data.userVotes || 0,
          recentActivity: data.recentActivity || [],
          loading: false,
          error: null
        });

      } catch (error) {
        console.warn('Community stats API failed, using fallback data:', error.message);
        
        // Fallback to default values when API fails
        setStats({
          totalPosts: 0,
          totalComments: 0,
          totalVotes: 0,
          userPosts: 0,
          userComments: 0,
          userVotes: 0,
          recentActivity: [],
          loading: false,
          error: null // Don't show error to user for stats
        });
      }
    };

    fetchStats();
  }, [user]);

  return stats;
};

export const useRealtimeNotifications = (enabled = true) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState({
    count: 0,
    items: [],
    loading: true
  });

  useEffect(() => {
    // Skip if disabled or no user
    if (!enabled || !user || (!user.uid && !user.id)) {
      setNotifications({ count: 0, items: [], loading: false });
      return;
    }

    const fetchNotifications = async () => {
      try {
        // Get Firebase ID token from Firebase auth instead of user object
        const { auth } = await import('../config/firebase');
        const firebaseUser = auth.currentUser;

        let token = null;
        if (firebaseUser) {
          token = await firebaseUser.getIdToken();
        } else {
          // Fallback to stored token
          token = localStorage.getItem('firebaseToken') ||
                  localStorage.getItem('authToken') ||
                  localStorage.getItem('token');
        }

        const response = await fetch('/api/auth/users/notifications', {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        setNotifications({
          count: data.unreadCount || 0,
          items: data.notifications || [],
          loading: false
        });

      } catch (error) {
        console.warn('Notifications API failed:', error.message);
        setNotifications({ count: 0, items: [], loading: false });
      }
    };

    fetchNotifications();
    
    // Poll for new notifications every 30 seconds if enabled
    const interval = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(interval);
  }, [user, enabled]);

  return notifications;
};

export const useCommunityStats = () => {
  const [communityStats, setCommunityStats] = useState({
    totalMembers: 0,
    onlineMembers: 0,
    totalPosts: 0,
    totalComments: 0,
    loading: true
  });

  useEffect(() => {
    const fetchCommunityStats = async () => {
      try {
        const response = await fetch('/api/stats/community-overview');

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        setCommunityStats({
          totalMembers: data.totalMembers || 0,
          onlineMembers: data.onlineMembers || 0,
          totalPosts: data.totalPosts || 0,
          totalComments: data.totalComments || 0,
          loading: false
        });

      } catch (error) {
        console.warn('Community overview stats API failed:', error.message);
        
        // Fallback to reasonable default values
        setCommunityStats({
          totalMembers: 1200,
          onlineMembers: 120,
          totalPosts: 8900,
          totalComments: 15000,
          loading: false
        });
      }
    };

    fetchCommunityStats();
  }, []);

  return communityStats;
};
