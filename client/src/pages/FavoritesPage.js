import React from 'react';
import UserVotedPosts from '../components/Community/UserVotedPosts';

const FavoritesPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <UserVotedPosts />
    </div>
  );
};

export default FavoritesPage;
