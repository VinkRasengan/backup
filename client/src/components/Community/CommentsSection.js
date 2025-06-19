import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Reply, MoreHorizontal, Send } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const CommentsSection = ({ postId, linkId, initialCommentCount = 0, onClose }) => {
  const { isDarkMode } = useTheme();
  const id = postId || linkId;
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  // Generate demo comments based on postId for uniqueness
  const generateDemoComments = (postId) => {
    const commentTemplates = [
      {
        names: ['Nguyễn Văn A', 'Trần Minh B', 'Lê Thị C', 'Phạm Đức D', 'Hoàng Mai E'],
        contents: [
          'Bài viết rất hay và bổ ích! Cảm ơn bạn đã chia sẻ 👍',
          'Thông tin rất hữu ích, mình đã học được nhiều điều mới!',
          'Cảm ơn bạn đã chia sẻ kiến thức quý báu này 🙏',
          'Nội dung rất chất lượng và dễ hiểu!',
          'Bài viết giải đáp được nhiều thắc mắc của mình!'
        ]
      },
      {
        names: ['Lê Minh F', 'Nguyễn Thảo G', 'Trần Hùng H', 'Vũ Linh I', 'Đỗ Nam J'],
        contents: [
          'Có thể chia sẻ thêm về vấn đề này không? Mình muốn tìm hiểu sâu hơn.',
          'Bạn có thể giải thích rõ hơn phần này được không?',
          'Mình có một số câu hỏi về nội dung này, có thể trao đổi không?',
          'Rất mong được nghe thêm ý kiến của bạn về chủ đề này!',
          'Có tài liệu nào tham khảo thêm không bạn?'
        ]
      },
      {
        names: ['Phạm Thị K', 'Lý Văn L', 'Cao Thị M', 'Bùi Minh N', 'Đặng Hoa O'],
        contents: [
          'Thông tin rất chính xác và cập nhật. Đã save để đọc lại sau! 📚',
          'Nội dung rất thực tế và áp dụng được ngay! 💪',
          'Cảm ơn bạn, mình sẽ áp dụng những gì học được!',
          'Bài viết giúp mình hiểu rõ hơn về vấn đề này! ✨',
          'Rất bổ ích! Đã share cho bạn bè rồi! 🔥'
        ]
      }
    ];

    // Use postId to generate consistent but unique comments
    const postHash = postId ? postId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0) : 0;

    const numComments = Math.abs(postHash % 3) + 1; // 1-3 comments per post
    const comments = [];

    for (let i = 0; i < numComments; i++) {
      const templateIndex = Math.abs((postHash + i) % commentTemplates.length);
      const template = commentTemplates[templateIndex];
      const nameIndex = Math.abs((postHash + i * 2) % template.names.length);
      const contentIndex = Math.abs((postHash + i * 3) % template.contents.length);

      const comment = {
        id: `${postId}_comment_${i}`,
        author: {
          name: template.names[nameIndex],
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(template.names[nameIndex])}&background=${['3b82f6', 'ef4444', '10b981', 'f59e0b', '8b5cf6'][nameIndex % 5]}&color=fff`,
          verified: i === 0 && Math.abs(postHash) % 3 === 0 // Some verified users
        },
        content: template.contents[contentIndex],
        timestamp: new Date(Date.now() - (i + 1) * 30 * 60 * 1000), // 30 min intervals
        likes: Math.abs((postHash + i * 4) % 15) + 1, // 1-15 likes
        liked: Math.abs((postHash + i * 5) % 4) === 0, // 25% chance liked
        replies: i === 0 && numComments > 1 ? [
          {
            id: `${postId}_reply_${i}`,
            author: {
              name: template.names[(nameIndex + 1) % template.names.length],
              avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(template.names[(nameIndex + 1) % template.names.length])}&background=6366f1&color=fff`
            },
            content: 'Mình cũng nghĩ vậy! Rất hữu ích 👍',
            timestamp: new Date(Date.now() - i * 25 * 60 * 1000),
            likes: Math.abs((postHash + i * 6) % 8) + 1,
            liked: Math.abs((postHash + i * 7) % 3) === 0
          }
        ] : []
      };

      comments.push(comment);
    }

    return comments;
  };

  useEffect(() => {
    // Load demo comments based on post ID
    const demoComments = generateDemoComments(id);
    setComments(demoComments);
  }, [id]);

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'vừa xong';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
    return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
  };

  const handleLikeComment = (commentId, isReply = false, parentId = null) => {
    setComments(prev => prev.map(comment => {
      if (isReply && comment.id === parentId) {
        return {
          ...comment,
          replies: comment.replies.map(reply =>
            reply.id === commentId
              ? {
                  ...reply,
                  liked: !reply.liked,
                  likes: reply.liked ? reply.likes - 1 : reply.likes + 1
                }
              : reply
          )
        };
      } else if (comment.id === commentId) {
        return {
          ...comment,
          liked: !comment.liked,
          likes: comment.liked ? comment.likes - 1 : comment.likes + 1
        };
      }
      return comment;
    }));
  };

  const handleSubmitComment = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const comment = {
      id: `new_${Date.now()}`,
      author: {
        name: 'Bạn',
        avatar: 'https://ui-avatars.com/api/?name=You&background=6366f1&color=fff'
      },
      content: newComment,
      timestamp: new Date(),
      likes: 0,
      liked: false,
      replies: []
    };

    setComments(prev => [comment, ...prev]);
    setNewComment('');
  };

  const CommentItem = ({ comment, isReply = false, parentId = null }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex space-x-3 ${isReply ? 'ml-12 mt-3' : 'mb-4'}`}
    >
      <img
        src={comment.author.avatar}
        alt={comment.author.name}
        className="w-8 h-8 rounded-full flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-2xl px-3 py-2`}>
          <div className="flex items-center space-x-2 mb-1">
            <span className={`font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {comment.author.name}
            </span>
            {comment.author.verified && (
              <span className="text-blue-500 text-xs">✓</span>
            )}
          </div>
          <p className={`text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
            {comment.content}
          </p>
        </div>

        <div className="flex items-center space-x-4 mt-1 ml-3">
          <button
            onClick={() => handleLikeComment(comment.id, isReply, parentId)}
            className={`flex items-center space-x-1 text-xs font-medium transition-colors ${
              comment.liked
                ? 'text-red-500'
                : isDarkMode ? 'text-gray-400 hover:text-red-400' : 'text-gray-500 hover:text-red-500'
            }`}
          >
            <Heart size={12} className={comment.liked ? 'fill-current' : ''} />
            <span>{comment.likes > 0 ? comment.likes : 'Thích'}</span>
          </button>

          {!isReply && (
            <button className={`text-xs font-medium ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'} transition-colors`}>
              Phản hồi
            </button>
          )}

          <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            {formatTimeAgo(comment.timestamp)}
          </span>

          <button className={`p-1 rounded-full ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'} transition-colors`}>
            <MoreHorizontal size={12} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
          </button>
        </div>

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2">
            {comment.replies.map(reply => (
              <CommentItem
                key={reply.id}
                comment={reply}
                isReply={true}
                parentId={comment.id}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );

  return (
    <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t`}>
      <div className="p-4">
        {/* Comment Input */}
        <form onSubmit={handleSubmitComment} className="mb-6">
          <div className="flex space-x-3">
            <img
              src="https://ui-avatars.com/api/?name=You&background=6366f1&color=fff"
              alt="Your avatar"
              className="w-8 h-8 rounded-full flex-shrink-0"
            />
            <div className="flex-1">
              <div className={`${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-200'} border rounded-full flex items-center px-4 py-2`}>
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Viết bình luận..."
                  className={`flex-1 bg-transparent ${isDarkMode ? 'text-white placeholder-gray-400' : 'text-gray-900 placeholder-gray-500'} text-sm focus:outline-none`}
                />
                <button
                  type="submit"
                  disabled={!newComment.trim() || loading}
                  className={`ml-2 p-1 rounded-full transition-colors ${
                    newComment.trim()
                      ? 'text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                      : 'text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Comments List */}
        <div className="space-y-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Bình luận ({comments.length + initialCommentCount})
            </h3>
            {onClose && (
              <button
                onClick={onClose}
                className={`text-sm font-medium ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'} transition-colors`}
              >
                Ẩn bình luận
              </button>
            )}
          </div>

          <AnimatePresence>
            {comments.map(comment => (
              <CommentItem key={comment.id} comment={comment} />
            ))}
          </AnimatePresence>

          {comments.length === 0 && (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">💬</div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Chưa có bình luận nào. Hãy là người đầu tiên bình luận!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentsSection;
