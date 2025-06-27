import React from 'react';
import SimpleVoteComponent from './SimpleVoteComponent';

/**
 * Example component showing how to use SimpleVoteComponent
 * Replace the complex vote logic with this simple component
 */
const VoteExample = () => {
  // Example links
  const exampleLinks = [
    { id: 'link-1', title: 'Example Link 1' },
    { id: 'link-2', title: 'Example Link 2' },
    { id: 'link-3', title: 'Example Link 3' }
  ];

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Simple Vote Component Examples</h2>
      
      <div className="space-y-4">
        {exampleLinks.map(link => (
          <div key={link.id} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <div>
              <h3 className="font-semibold">{link.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Link ID: {link.id}</p>
            </div>
            
            {/* Simple Vote Component - Just pass linkId */}
            <SimpleVoteComponent linkId={link.id} />
          </div>
        ))}
      </div>
      
      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h3 className="font-semibold mb-2">Usage:</h3>
        <pre className="text-sm overflow-x-auto">
{`// Simple usage - just pass linkId
<SimpleVoteComponent linkId="your-link-id" />

// With custom className
<SimpleVoteComponent 
  linkId="your-link-id" 
  className="my-custom-class" 
/>`}
        </pre>
      </div>
      
      <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
        <h3 className="font-semibold mb-2">Features:</h3>
        <ul className="text-sm space-y-1">
          <li>✅ Single file - no complex dependencies</li>
          <li>✅ Auto-loads vote data from database</li>
          <li>✅ Optimistic updates for instant feedback</li>
          <li>✅ Error handling with rollback</li>
          <li>✅ State persists after page refresh</li>
          <li>✅ No manual page refreshes needed</li>
        </ul>
      </div>
    </div>
  );
};

export default VoteExample; 