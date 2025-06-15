import React from 'react';
import NavigationLayout from '../components/navigation/NavigationLayout';
import ModernMessengerLayout from '../components/chat/ModernMessengerLayout';

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
