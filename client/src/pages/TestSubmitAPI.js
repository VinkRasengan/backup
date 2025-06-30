import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { auth } from '../config/firebase';

const TestSubmitAPI = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);

  const addLog = (message, data = null) => {
    setLogs(prev => [...prev, { message, data, time: new Date().toLocaleTimeString() }]);
  };

  const testSubmit = async () => {
    setLogs([]);
    addLog('Starting test...');

    try {
      // Check auth
      addLog('Checking auth...');
      addLog('Context user:', user);
      addLog('Firebase currentUser:', auth.currentUser);

      if (!auth.currentUser) {
        addLog('❌ No Firebase user!');
        return;
      }

      // Get token
      addLog('Getting Firebase token...');
      const token = await auth.currentUser.getIdToken(true);
      addLog('✅ Got token:', token.substring(0, 50) + '...');

      // Prepare data
      const testData = {
        url: 'https://example.com',
        title: 'Test Article',
        category: 'technology',
        description: 'Test description',
        checkResult: {
          credibilityScore: 80,
          securityScore: 90,
          status: 'safe'
        }
      };

      addLog('📦 Prepared data:', testData);
      addLog('🔗 Target URL: http://localhost:8080/api/links');
      addLog('🔑 Authorization header:', `Bearer ${token.substring(0, 30)}...`);
      
      addLog('🚀 Sending request to API...');
      
      try {
        // Direct fetch to debug
        const response = await fetch('http://localhost:8080/api/links', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(testData)
        });

        addLog(`📡 Response received - Status: ${response.status}`);
        addLog(`📡 Response headers:`, Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
          const errorText = await response.text();
          addLog('❌ Error response body:', errorText);
        } else {
          const data = await response.json();
          addLog('✅ Success response:', data);
        }
      } catch (fetchError) {
        addLog('❌ Fetch error:', fetchError.message);
        addLog('❌ Fetch error type:', fetchError.constructor.name);
        addLog('❌ Fetch error stack:', fetchError.stack);
      }

    } catch (error) {
      addLog('❌ Caught error:', error.message);
      addLog('Stack:', error.stack);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Test Submit API</h1>
      
      <button
        onClick={testSubmit}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mb-4"
      >
        Test Submit to Community
      </button>

      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-bold mb-2">Logs:</h2>
        {logs.map((log, idx) => (
          <div key={idx} className="mb-2">
            <span className="text-gray-600">[{log.time}]</span> {log.message}
            {log.data && (
              <pre className="text-xs bg-gray-200 p-2 rounded mt-1 overflow-x-auto">
                {JSON.stringify(log.data, null, 2)}
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TestSubmitAPI; 