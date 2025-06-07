// Test component for ChatInput behavior
import React, { useState, useRef } from 'react';
import { ChatInput } from '../components/ui/ChatInput';

const ChatInputTest = () => {
  const [value, setValue] = useState('');
  const [log, setLog] = useState([]);
  const inputRef = useRef(null);

  const addLog = (message) => {
    setLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const handleChange = (e) => {
    const newValue = e.target.value;
    addLog(`onChange: "${newValue}" (length: ${newValue.length})`);
    setValue(newValue);
  };

  const handleKeyDown = (e) => {
    addLog(`keyDown: "${e.key}" current value: "${e.target.value}"`);
  };

  const clearLog = () => {
    setLog([]);
  };

  const focusInput = () => {
    if (inputRef.current) {
      inputRef.current.focus();
      addLog('Input focused programmatically');
    }
  };

  const clearInput = () => {
    setValue('');
    addLog('Input cleared');
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">ChatInput Test</h1>
      
      {/* Test Input */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Test Input:</label>
        <ChatInput
          ref={inputRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type here to test input behavior..."
          className="w-full"
          maxLength={100}
        />
        <p className="text-sm text-gray-600">
          Current value: "{value}" (length: {value.length})
        </p>
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        <button
          onClick={focusInput}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Focus Input
        </button>
        <button
          onClick={clearInput}
          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Clear Input
        </button>
        <button
          onClick={clearLog}
          className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Clear Log
        </button>
      </div>

      {/* Event Log */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Event Log:</h2>
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg h-64 overflow-y-auto">
          {log.length === 0 ? (
            <p className="text-gray-500">No events logged yet. Start typing...</p>
          ) : (
            <div className="space-y-1">
              {log.map((entry, index) => (
                <div key={index} className="text-sm font-mono">
                  {entry}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Test Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Test Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Type slowly and check if first character is captured</li>
          <li>Type quickly and check for missing characters</li>
          <li>Use backspace and delete keys</li>
          <li>Copy and paste text</li>
          <li>Use arrow keys to navigate</li>
          <li>Press Enter to test key handling</li>
        </ol>
      </div>
    </div>
  );
};

export default ChatInputTest;
