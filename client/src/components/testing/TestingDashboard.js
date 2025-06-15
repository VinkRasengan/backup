import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TestTube,
  Monitor,
  Eye,
  Smartphone,
  Tablet,
  Laptop,
  Chrome,
  Globe,
  X,
  Play,
  RotateCcw
} from 'lucide-react';
import PerformanceMonitor from './PerformanceMonitor';
import AccessibilityChecker from './AccessibilityChecker';

const TestingDashboard = ({ isOpen, onClose }) => {
  const [activeTest, setActiveTest] = useState(null);
  const [testResults, setTestResults] = useState({
    performance: null,
    accessibility: null,
    responsive: null,
    browser: null
  });

  const testSuites = [
    {
      id: 'performance',
      title: 'Performance Testing',
      description: 'Monitor FPS, memory usage, and animation performance',
      icon: Monitor,
      color: 'from-blue-500 to-cyan-500',
      component: PerformanceMonitor
    },
    {
      id: 'accessibility',
      title: 'Accessibility Testing',
      description: 'Check WCAG AA compliance and accessibility features',
      icon: Eye,
      color: 'from-green-500 to-emerald-500',
      component: AccessibilityChecker
    },
    {
      id: 'responsive',
      title: 'Responsive Testing',
      description: 'Test layouts across different screen sizes',
      icon: Smartphone,
      color: 'from-purple-500 to-pink-500',
      component: null
    },
    {
      id: 'browser',
      title: 'Browser Compatibility',
      description: 'Check compatibility across different browsers',
      icon: Chrome,
      color: 'from-orange-500 to-red-500',
      component: null
    }
  ];

  const deviceSizes = [
    { name: 'Mobile', width: 375, height: 667, icon: Smartphone },
    { name: 'Tablet', width: 768, height: 1024, icon: Tablet },
    { name: 'Desktop', width: 1920, height: 1080, icon: Laptop }
  ];

  const browsers = [
    { name: 'Chrome', icon: Chrome, supported: true },
    { name: 'Firefox', icon: Chrome, supported: true }, // Using Chrome icon as Firefox isn't available
    { name: 'Safari', icon: Globe, supported: true } // Using Globe icon as Safari isn't available
  ];

  const runTest = (testId) => {
    setActiveTest(testId);
    
    // Simulate test execution
    setTimeout(() => {
      const mockResult = {
        score: Math.floor(Math.random() * 30) + 70,
        issues: Math.floor(Math.random() * 5),
        timestamp: new Date().toISOString()
      };
      
      setTestResults(prev => ({
        ...prev,
        [testId]: mockResult
      }));
      
      setActiveTest(null);
    }, 2000);
  };

  const runAllTests = () => {
    testSuites.forEach((suite, index) => {
      setTimeout(() => runTest(suite.id), index * 500);
    });
  };

  const resetTests = () => {
    setTestResults({
      performance: null,
      accessibility: null,
      responsive: null,
      browser: null
    });
    setActiveTest(null);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed inset-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <TestTube className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">Testing Dashboard</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Comprehensive testing suite</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={runAllTests}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                  >
                    <Play className="w-4 h-4" />
                    <span>Run All</span>
                  </button>
                  <button
                    onClick={resetTests}
                    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Reset</span>
                  </button>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 h-full overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                {/* Test Suites */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Test Suites</h4>
                  
                  {testSuites.map((suite) => (
                    <motion.div
                      key={suite.id}
                      className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600"
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 bg-gradient-to-r ${suite.color} rounded-lg flex items-center justify-center`}>
                            <suite.icon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h5 className="font-medium text-gray-900 dark:text-white">{suite.title}</h5>
                            <p className="text-sm text-gray-600 dark:text-gray-300">{suite.description}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          {testResults[suite.id] && (
                            <div className="text-right">
                              <div className={`text-lg font-bold ${getScoreColor(testResults[suite.id].score)}`}>
                                {testResults[suite.id].score}%
                              </div>
                              <div className="text-xs text-gray-500">
                                {testResults[suite.id].issues} issues
                              </div>
                            </div>
                          )}
                          
                          <button
                            onClick={() => runTest(suite.id)}
                            disabled={activeTest === suite.id}
                            className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                              activeTest === suite.id
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-blue-500 hover:bg-blue-600 text-white'
                            }`}
                          >
                            {activeTest === suite.id ? (
                              <div className="flex items-center space-x-1">
                                <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                <span>Testing</span>
                              </div>
                            ) : (
                              'Run Test'
                            )}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Device & Browser Testing */}
                <div className="space-y-6">
                  {/* Responsive Testing */}
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Device Testing</h4>
                    <div className="grid grid-cols-3 gap-3">
                      {deviceSizes.map((device) => (
                        <motion.div
                          key={device.name}
                          className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 text-center"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <device.icon className="w-6 h-6 mx-auto mb-2 text-gray-600 dark:text-gray-300" />
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{device.name}</div>
                          <div className="text-xs text-gray-500">{device.width}×{device.height}</div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Browser Compatibility */}
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Browser Support</h4>
                    <div className="space-y-2">
                      {browsers.map((browser) => (
                        <div
                          key={browser.name}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                        >
                          <div className="flex items-center space-x-3">
                            <browser.icon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                            <span className="font-medium text-gray-900 dark:text-white">{browser.name}</span>
                          </div>
                          <div className={`px-2 py-1 rounded text-xs font-medium ${
                            browser.supported
                              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                              : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                          }`}>
                            {browser.supported ? 'Supported' : 'Not Supported'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Quick Stats</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {Object.values(testResults).filter(r => r && r.score >= 80).length}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">Passed Tests</div>
                      </div>
                      <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                          {Object.values(testResults).reduce((sum, r) => sum + (r ? r.issues : 0), 0)}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">Total Issues</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default TestingDashboard;
