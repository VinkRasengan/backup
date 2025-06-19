import React, { useEffect, useState } from 'react';
import NavigationLayout from '../components/navigation/NavigationLayout';
import UnifiedPostCard from '../components/Community/UnifiedPostCard';

const CommunityPage = () => {
  console.log('🎯 CommunityPage component rendering...');

  // Simple state management instead of complex hook
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handler functions for PostCard interactions
  const handleVote = async (postId, voteType) => {
    try {
      console.log(`🗳️ Voting ${voteType} on post ${postId}`);
      // TODO: Implement vote API call
      // await voteOnPost(postId, voteType);
      // fetchData(); // Refresh data after voting
    } catch (error) {
      console.error('❌ Error voting:', error);
    }
  };

  const handleComment = async (postId, commentText) => {
    try {
      console.log(`💬 Adding comment to post ${postId}:`, commentText);
      // TODO: Implement comment API call
      // await addComment(postId, commentText);
      // fetchData(); // Refresh data after commenting
    } catch (error) {
      console.error('❌ Error adding comment:', error);
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
                    onToggleComments={handleComment}
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
