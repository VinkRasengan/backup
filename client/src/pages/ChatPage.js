import React, { useEffect } from 'react';
import ModernMessengerLayout from '../components/chat/ModernMessengerLayout';

const ChatPage = () => {
  useEffect(() => {
    // Add class to body for chat-specific styling if needed
    document.body.classList.add('chat-page-active');

    // Cleanup when component unmounts
    return () => {
      document.body.classList.remove('chat-page-active');
    };
  }, []);

  return (
    <div className="h-screen w-full bg-gray-50 dark:bg-gray-900 overflow-hidden pl-[80px]">

      <ModernMessengerLayout />
    </div>
  );
};

export default ChatPage;
