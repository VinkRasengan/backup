import React, { useEffect, useState } from 'react';
import UnifiedPostCard from '../components/Community/UnifiedPostCard';
import toast from 'react-hot-toast';
import { communityAPI } from '../services/api';

const CommunityPage = () => {
  // Simple state management instead of complex hook
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Handler functions for LinkCard interactions
  const handleVote = async (linkId, voteType) => {
    try {
      // Get user info
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user.uid && !user.id) {
        toast.error('Vui lòng đăng nhập để vote');
        return;
      }

      // ✅ Use API service instead of direct fetch
      const response = await communityAPI.submitVote(
        linkId,
        voteType,
        user.uid || user.id,
        user.email
      );      if (response.success) {
        fetchPosts(); // Refresh data after voting
      } else {
        console.error('❌ Vote failed:', response.error);
        toast.error('Failed to vote');
      }
    } catch (error) {
      console.error('❌ Error voting:', error);
      toast.error('Error voting');
    }
  };  // Toggle comments section (just show/hide)
  const handleToggleComments = (postId) => {
    // This is just for toggling comment visibility
    // The actual comment adding is handled by CommentsSection component
  };

  const handleShare = (post) => {
    try {
      if (navigator.share) {
        navigator.share({
          title: post.title,
          text: post.content?.substring(0, 100) + '...',
          url: post.url || window.location.href
        });
      } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(post.url || window.location.href);
        toast.success('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('❌ Error sharing:', error);
    }
  };

  // Simple fetch function using API service
  const fetchPosts = async () => {    try {
      setLoading(true);
      setError(null);

      // ✅ Use API service instead of direct fetch
      const response = await communityAPI.getPosts({
        page: 1,
        sort: 'newest',
        limit: 10,
        newsOnly: false,
        includeNews: true
      });

      if (response?.success && response?.data?.posts) {
        setPosts(response.data.posts);
      } else {
        console.error('❌ Invalid API response structure:', response);
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
    fetchPosts();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Community Page</h1>

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
  );
};

export default CommunityPage;
