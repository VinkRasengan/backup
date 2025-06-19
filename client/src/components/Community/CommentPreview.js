import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const CommentPreview = ({ linkId, onToggleFullComments }) => {
  const { isDarkMode } = useTheme();

  return (
    <div className={`px-4 py-3 border-t border-gray-200 dark:border-gray-700 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
      <button
        onClick={onToggleFullComments}
        className={`flex items-center space-x-2 text-sm ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
      >
        <MessageCircle size={16} />
        <span>View all comments</span>
      </button>
    </div>
  );
};

export default CommentPreview;
