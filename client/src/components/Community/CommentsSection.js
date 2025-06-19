import React from 'react';
import { useTheme } from '../../context/ThemeContext';

const CommentsSection = ({ postId, linkId, initialCommentCount = 0 }) => {
  const { isDarkMode } = useTheme();
  const id = postId || linkId;

  return (
    <div className={`p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
      <div className="text-center py-8">
        <div className="text-4xl mb-2">💬</div>
        <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Comments Section
        </h3>
        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
          Comments feature coming soon for post {id}
        </p>
        <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
          {initialCommentCount} comments
        </p>
      </div>
    </div>
  );
};

export default CommentsSection;
