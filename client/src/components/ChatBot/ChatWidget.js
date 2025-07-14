import React, { useState } from 'react';
import { X, MessageCircle } from 'lucide-react';
import ChatBot from './ChatBot';

const ChatWidget = ({ onClose, isFloating = true }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (isFloating && !isExpanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-colors"
          aria-label="Open chat"
        >
          <MessageCircle size={24} />
        </button>
      </div>
    );
  }

  return (
    <div className={`
      ${isFloating 
        ? 'fixed bottom-4 right-4 w-80 h-96 z-50 shadow-2xl rounded-lg overflow-hidden' 
        : 'w-full h-full'
      }
      bg-white border border-gray-200
    `}>
      {isFloating && (
        <div className="flex justify-between items-center p-3 bg-blue-600 text-white">
          <h3 className="font-semibold">Chat Assistant</h3>
          <button
            onClick={() => {
              setIsExpanded(false);
              onClose?.();
            }}
            className="hover:bg-blue-700 p-1 rounded"
            aria-label="Close chat"
          >
            <X size={16} />
          </button>
        </div>
      )}
      
      <div className={isFloating ? 'h-80' : 'h-full'}>
        <ChatBot />
      </div>
    </div>
  );
};

export default ChatWidget; 