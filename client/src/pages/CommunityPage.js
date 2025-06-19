import React, { useEffect, useState } from 'react';
import NavigationLayout from '../components/navigation/NavigationLayout';
import UnifiedPostCard from '../components/Community/UnifiedPostCard';
import { useAuth } from '../context/AuthContext';

const CommunityPage = () => {
  console.log('🎯 CommunityPage component rendering...');
  const { user } = useAuth();

  // Simple state management instead of complex hook
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handler functions for PostCard interactions
  const handleVote = async (postId, voteType) => {
    try {
      console.log(`🗳️ Voting ${voteType} on post ${postId}`);

      // Get user info
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user.uid && !user.id) {
        alert('Vui lòng đăng nhập để vote');
        return;
      }

      const response = await fetch('/api/posts/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('backendToken')}`
        },
        body: JSON.stringify({
          postId,
          voteType,
          userId: user.uid || user.id
        })
      });

      if (response.ok) {
        console.log('✅ Vote successful');
        fetchPosts(); // Refresh data after voting
      } else {
        console.error('❌ Vote failed:', response.status);
      }
    } catch (error) {
      console.error('❌ Error voting:', error);
    }
  };

  // Toggle comments section (just show/hide)
  const handleToggleComments = (postId) => {
    console.log(`💬 Toggling comments for post ${postId}`);
    // This is just for toggling comment visibility
    // The actual comment adding is handled by CommentsSection component
  };

  // Add comment function (called by CommentsSection)
  const handleAddComment = async (postId, commentText) => {
    try {
      console.log(`💬 Adding comment to post ${postId}:`, commentText);

      // Get user info
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user.uid && !user.id) {
        alert('Vui lòng đăng nhập để comment');
        return;
      }

      if (!commentText || !commentText.trim()) {
        alert('Vui lòng nhập nội dung comment');
        return;
      }

      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('backendToken')}`
        },
        body: JSON.stringify({
          postId,
          content: commentText.trim(),
          userId: user.uid || user.id,
          userEmail: user.email,
          displayName: user.displayName || user.name || user.email || 'Anonymous'
        })
      });

      if (response.ok) {
        console.log('✅ Comment successful');
        fetchPosts(); // Refresh data after commenting
        return true;
      } else {
        console.error('❌ Comment failed:', response.status);
        return false;
      }
    } catch (error) {
      console.error('❌ Error adding comment:', error);
      return false;
    }
  };

  const handleShare = (post) => {
    try {
      console.log('📤 Sharing post:', post.title);
      if (navigator.share) {
        navigator.share({
          title: post.title,
          text: post.content?.substring(0, 100) + '...',
          url: post.url || window.location.href
        });
      } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(post.url || window.location.href);
        alert('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('❌ Error sharing:', error);
    }
  };

  // Simple fetch function
  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('📡 Fetching posts...');
      console.log('🔍 Current URL:', window.location.href);
      console.log('🔍 Posts state:', posts?.length || 0);

      const response = await fetch('/api/community/posts?page=1&sort=newest&limit=10&newsOnly=false&includeNews=true');
      const data = await response.json();

      console.log('🌐 API response:', data);
      console.log('🌐 API success:', data?.success);
      console.log('🌐 API posts count:', data?.data?.posts?.length || 0);

      if (data.success && data.data && data.data.posts) {
        console.log('✅ Setting posts:', data.data.posts);
        setPosts(data.data.posts);
      } else {
        console.error('❌ Invalid API response structure:', data);
        setError('Invalid API response');
      }
    } catch (error) {
      console.error('❌ Fetch error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch posts on mount
  useEffect(() => {
    console.log('🚀 useEffect [] (mount) triggered');
    fetchPosts();
  }, []);

  console.log('🎯 CommunityPage rendering JSX...');
  console.log('📊 Current data:', { posts: posts.length, loading, error });

  return (
    <NavigationLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Community Page</h1>

        {/* Success Info */}
        <div className="bg-green-100 border border-green-400 text-green-700 p-4 text-sm mb-4 rounded">
          <p>✅ <strong>Community Page Working!</strong></p>
          <p>📡 API calls successful</p>
          <p>🔥 Firebase emulator connected</p>
          <p>🎯 Posts: {posts.length} | Loading: {loading ? 'true' : 'false'} | Error: {error || 'none'}</p>
          <p>👤 User: {user ? `${user.email} (${user.id || user.uid})` : 'Not logged in'}</p>
          {!user && (
            <p className="text-red-600 font-bold">⚠️ You need to login to vote on posts!</p>
          )}
        </div>

        {/* Posts */}
        <div>
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading posts...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded mb-4">
              <p><strong>Error:</strong> {error}</p>
            </div>
          )}

          {posts.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">
                Community Posts ({posts.length})
              </h2>
              <div className="space-y-6">
                {posts.map((post, index) => (
                  <UnifiedPostCard
                    key={post.id || index}
                    post={post}
                    onVote={handleVote}
                    onToggleComments={handleToggleComments}
                    onSave={handleShare}
                    layout="feed"
                  />
                ))}
              </div>
            </div>
          )}

          {!loading && posts.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                No posts yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Be the first to share something with the community!
              </p>
              <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors">
                Create Post
              </button>
            </div>
          )}
        </div>
      </div>
    </NavigationLayout>
  );
};

export default CommunityPage;
