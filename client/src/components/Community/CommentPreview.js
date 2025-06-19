import React from 'react';
import { MessageCircle, Heart } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const CommentPreview = ({ linkId, onToggleFullComments }) => {
  const { isDarkMode } = useTheme();

  // Generate preview comments based on linkId for uniqueness
  const generatePreviewComments = (postId) => {
    const commentTemplates = [
      {
        names: ['Nguyễn Văn A', 'Trần Minh B', 'Lê Thị C'],
        contents: [
          'Bài viết rất hay và bổ ích! Cảm ơn bạn đã chia sẻ 👍',
          'Thông tin rất hữu ích, mình đã học được nhiều điều mới!',
          'Cảm ơn bạn đã chia sẻ kiến thức quý báu này 🙏'
        ]
      },
      {
        names: ['Lê Minh D', 'Nguyễn Thảo E', 'Trần Hùng F'],
        contents: [
          'Có thể chia sẻ thêm về vấn đề này không? Mình muốn tìm hiểu sâu hơn.',
          'Bạn có thể giải thích rõ hơn phần này được không?',
          'Mình có một số câu hỏi về nội dung này, có thể trao đổi không?'
        ]
      }
    ];

    // Use postId to generate consistent but unique comments
    const postHash = postId ? postId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0) : 0;

    const comments = [];
    for (let i = 0; i < 2; i++) { // Always show 2 preview comments
      const templateIndex = Math.abs((postHash + i) % commentTemplates.length);
      const template = commentTemplates[templateIndex];
      const nameIndex = Math.abs((postHash + i * 2) % template.names.length);
      const contentIndex = Math.abs((postHash + i * 3) % template.contents.length);

      comments.push({
        id: `${postId}_preview_${i}`,
        author: template.names[nameIndex],
        content: template.contents[contentIndex],
        likes: Math.abs((postHash + i * 4) % 15) + 1
      });
    }

    return comments;
  };

  const previewComments = generatePreviewComments(linkId);

  return (
    <div className={`border-t border-gray-200 dark:border-gray-700 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
      {/* Preview Comments */}
      <div className="px-4 py-3 space-y-2">
        {previewComments.map((comment, index) => (
          <div key={comment.id} className="flex items-start space-x-2">
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(comment.author)}&background=${index === 0 ? '3b82f6' : '10b981'}&color=fff`}
              alt={comment.author}
              className="w-6 h-6 rounded-full flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg px-3 py-2`}>
                <div className="flex items-center space-x-2 mb-1">
                  <span className={`font-medium text-xs ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {comment.author}
                  </span>
                </div>
                <p className={`text-xs ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} line-clamp-2`}>
                  {comment.content}
                </p>
              </div>
              <div className="flex items-center space-x-3 mt-1 ml-3">
                <button className={`flex items-center space-x-1 text-xs ${isDarkMode ? 'text-gray-400 hover:text-red-400' : 'text-gray-500 hover:text-red-500'} transition-colors`}>
                  <Heart size={10} />
                  <span>{comment.likes}</span>
                </button>
                <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  2h
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* View All Comments Button */}
      <div className="px-4 pb-3">
        <button
          onClick={onToggleFullComments}
          className={`flex items-center space-x-2 text-sm font-medium ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'} transition-colors`}
        >
          <MessageCircle size={16} />
          <span>Xem tất cả bình luận</span>
        </button>
      </div>
    </div>
  );
};

export default CommentPreview;
