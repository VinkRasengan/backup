import React from 'react';
import MessengerLayout from '../components/chat/MessengerLayout';
import TabNavigation from '../components/navigation/TabNavigation';

const ChatPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Tab Navigation */}
      <TabNavigation />

      {/* Page Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Trợ lý AI
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Chat với AI để kiểm tra thông tin và nhận tư vấn
          </p>
        </div>

        <div className="h-[calc(100vh-12rem)]">
          <MessengerLayout />
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
