import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  onSnapshot,
  orderBy,
  limit 
} from 'firebase/firestore';
import { db } from '../config/firebase';
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

        // Get total posts
        const postsQuery = query(collection(db, 'links'));
        const postsSnapshot = await getDocs(postsQuery);
        const totalPosts = postsSnapshot.size;

        // Get total comments
        const commentsQuery = query(collection(db, 'comments'));
        const commentsSnapshot = await getDocs(commentsQuery);
        const totalComments = commentsSnapshot.size;

        // Get total votes
        const votesQuery = query(collection(db, 'votes'));
        const votesSnapshot = await getDocs(votesQuery);
        const totalVotes = votesSnapshot.size;

        let userPosts = 0;
        let userComments = 0;
        let userVotes = 0;

        // Get user-specific stats if logged in
        if (user && (user.uid || user.id)) {
          const userId = user.uid || user.id;
          
          // User posts
          const userPostsQuery = query(
            collection(db, 'links'),
            where('userId', '==', userId)
          );
          const userPostsSnapshot = await getDocs(userPostsQuery);
          userPosts = userPostsSnapshot.size;

          // User comments
          const userCommentsQuery = query(
            collection(db, 'comments'),
            where('userId', '==', userId)
          );
          const userCommentsSnapshot = await getDocs(userCommentsQuery);
          userComments = userCommentsSnapshot.size;

          // User votes
          const userVotesQuery = query(
            collection(db, 'votes'),
            where('userId', '==', userId)
          );
          const userVotesSnapshot = await getDocs(userVotesQuery);
          userVotes = userVotesSnapshot.size;
        }

        // Get recent activity (last 5 posts)
        const recentQuery = query(
          collection(db, 'links'),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        const recentSnapshot = await getDocs(recentQuery);
        const recentActivity = [];
        recentSnapshot.forEach((doc) => {
          recentActivity.push({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() || new Date()
          });
        });

        setStats({
          totalPosts,
          totalComments,
          totalVotes,
          userPosts,
          userComments,
          userVotes,
          recentActivity,
          loading: false,
          error: null
        });

      } catch (error) {
        // Silently handle permission errors for stats
        if (error.code === 'permission-denied' || error.message.includes('Missing or insufficient permissions')) {
          console.warn('Firestore stats disabled due to permissions');
          setStats({
            totalLinks: 0,
            totalComments: 0,
            totalUsers: 0,
            loading: false,
            error: null
          });
        } else {
          console.error('Error fetching Firestore stats:', error);
          setStats(prev => ({
            ...prev,
            loading: false,
            error: error.message
          }));
        }
      }
    };

    fetchStats();
  }, [user]);

  return stats;
};

export const useRealtimeNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState({
    count: 0,
    items: [],
    loading: true
  });

  useEffect(() => {
    if (!user || (!user.uid && !user.id)) {
      setNotifications({ count: 0, items: [], loading: false });
      return;
    }

    const userId = user.uid || user.id;

    // Listen for new comments on user's posts
    const userPostsQuery = query(
      collection(db, 'links'),
      where('userId', '==', userId)
    );

    const unsubscribe = onSnapshot(userPostsQuery, async (snapshot) => {
      try {
        const userPostIds = [];
        snapshot.forEach((doc) => {
          userPostIds.push(doc.id);
        });

        if (userPostIds.length === 0) {
          setNotifications({ count: 0, items: [], loading: false });
          return;
        }

        // Get recent comments on user's posts
        const commentsQuery = query(
          collection(db, 'comments'),
          where('linkId', 'in', userPostIds.slice(0, 10)), // Firestore 'in' limit is 10
          orderBy('createdAt', 'desc'),
          limit(10)
        );

        const commentsSnapshot = await getDocs(commentsQuery);
        const items = [];
        let unreadCount = 0;

        commentsSnapshot.forEach((doc) => {
          const data = doc.data();
          // Only count comments from other users
          if (data.userId !== userId) {
            items.push({
              id: doc.id,
              type: 'comment',
              message: `${data.userEmail} đã bình luận về bài viết của bạn`,
              linkId: data.linkId,
              createdAt: data.createdAt?.toDate?.() || new Date(),
              read: false // In a real app, you'd track read status
            });
            unreadCount++;
          }
        });

        setNotifications({
          count: Math.min(unreadCount, 99), // Cap at 99
          items: items.slice(0, 5), // Show only 5 most recent
          loading: false
        });

      } catch (error) {
        // Silently handle permission/index errors for notifications
        if (error.code === 'permission-denied' || error.message.includes('requires an index') || error.message.includes('Missing or insufficient permissions')) {
          console.warn('Notifications disabled due to permissions or missing index');
        } else {
          console.error('Error fetching notifications:', error);
        }
        setNotifications({ count: 0, items: [], loading: false });
      }
    });

    return () => unsubscribe();
  }, [user]);

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
        // Get total posts
        const postsQuery = query(collection(db, 'links'));
        const postsSnapshot = await getDocs(postsQuery);
        const totalPosts = postsSnapshot.size;

        // Get total comments
        const commentsQuery = query(collection(db, 'comments'));
        const commentsSnapshot = await getDocs(commentsQuery);
        const totalComments = commentsSnapshot.size;

        // Get unique users (approximate member count)
        const usersSet = new Set();
        postsSnapshot.forEach((doc) => {
          const userId = doc.data().userId;
          if (userId) usersSet.add(userId);
        });
        commentsSnapshot.forEach((doc) => {
          const userId = doc.data().userId;
          if (userId) usersSet.add(userId);
        });

        const totalMembers = usersSet.size;
        const onlineMembers = Math.floor(totalMembers * 0.1); // Simulate 10% online

        setCommunityStats({
          totalMembers,
          onlineMembers,
          totalPosts,
          totalComments,
          loading: false
        });

      } catch (error) {
        console.error('Error fetching community stats:', error);
        setCommunityStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchCommunityStats();
  }, []);

  return communityStats;
};
