import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bug, X, RefreshCw, Eye, EyeOff } from 'lucide-react';

const ScrollDebugPanel = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [debugData, setDebugData] = useState(null);
  const [isDebugging, setIsDebugging] = useState(false);

  useEffect(() => {
    // Listen for keyboard shortcut
    const handleKeyPress = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setIsVisible(!isVisible);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isVisible]);

  const startDebugging = () => {
    if (window.scrollDebugger) {
      window.scrollDebugger.startDebugging();
      setIsDebugging(true);
      
      // Get debug data
      setTimeout(() => {
        const report = window.scrollDebugger.generateReport();
        setDebugData(report);
      }, 500);
    }
  };

  const stopDebugging = () => {
    if (window.scrollDebugger) {
      window.scrollDebugger.stopDebugging();
      setIsDebugging(false);
      setDebugData(null);
    }
  };

  const autoFix = () => {
    if (window.scrollDebugger) {
      window.scrollDebugger.autoFix();
      
      // Refresh data after fix
      setTimeout(() => {
        const report = window.scrollDebugger.generateReport();
        setDebugData(report);
      }, 500);
    }
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 300 }}
        className="fixed top-4 right-4 z-[9999] bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 w-80"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Bug className="w-5 h-5 text-red-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Scroll Debugger
            </h3>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Controls */}
          <div className="flex space-x-2">
            <button
              onClick={isDebugging ? stopDebugging : startDebugging}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isDebugging
                  ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-300'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300'
              }`}
            >
              {isDebugging ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>{isDebugging ? 'Stop' : 'Start'}</span>
            </button>

            <button
              onClick={autoFix}
              className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-300 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Auto Fix</span>
            </button>
          </div>

          {/* Debug Data */}
          {debugData && (
            <div className="space-y-3">
              <div className="text-sm">
                <div className="font-medium text-gray-900 dark:text-white mb-2">
                  Scroll Analysis:
                </div>
                
                <div className="space-y-1 text-gray-600 dark:text-gray-300">
                  <div className="flex justify-between">
                    <span>Total scrollable:</span>
                    <span className="font-mono">{debugData.totalScrollableElements}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Vertical scrollers:</span>
                    <span className="font-mono">{debugData.verticalScrollers.length}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Horizontal scrollers:</span>
                    <span className="font-mono">{debugData.horizontalScrollers.length}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Potential conflicts:</span>
                    <span className={`font-mono ${
                      debugData.potentialConflicts > 1 ? 'text-red-500' : 'text-green-500'
                    }`}>
                      {debugData.potentialConflicts}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className={`p-3 rounded-md text-sm ${
                debugData.potentialConflicts > 1
                  ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'
                  : 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300'
              }`}>
                {debugData.potentialConflicts > 1
                  ? '⚠️ Multiple scroll containers detected! This may cause dual scrollbars.'
                  : '✅ No scroll conflicts detected.'
                }
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <div><kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">Ctrl+Shift+S</kbd> Toggle debugging</div>
            <div><kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">Ctrl+Shift+F</kbd> Auto-fix</div>
            <div><kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">Ctrl+Shift+D</kbd> Toggle panel</div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ScrollDebugPanel;
