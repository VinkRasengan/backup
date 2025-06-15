import React from 'react';
import ModernMessengerLayout from '../components/chat/ModernMessengerLayout';
import NavigationLayout from '../components/navigation/NavigationLayout';

const ChatPage = () => {
  return (
    <NavigationLayout>
      <div className="h-screen bg-gray-50 dark:bg-gray-900">
        <ModernMessengerLayout />
      </div>
    </NavigationLayout>
  );
};

export default ChatPage;
