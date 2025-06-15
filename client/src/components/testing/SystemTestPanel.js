import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  BarChart3, 
  Monitor,
  Smartphone,
  Tablet,
  Zap,
  Eye
} from 'lucide-react';
import SystemTest from '../../utils/systemTest';

const SystemTestPanel = ({ isOpen, onClose }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [currentTest, setCurrentTest] = useState('');

  const runTests = async () => {
    setIsRunning(true);
    setTestResults(null);
    setCurrentTest('Initializing...');

    try {
      const systemTest = new SystemTest();
      
      // Override addResult to update UI
      const originalAddResult = systemTest.addResult.bind(systemTest);
      systemTest.addResult = (testName, passed) => {
        setCurrentTest(testName);
        originalAddResult(testName, passed);
      };

      await systemTest.runAllTests();
      const report = systemTest.generateReport();
      setTestResults(report);
      
    } catch (error) {
      console.error('Test execution error:', error);
      setTestResults({
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        successRate: 0,
        errors: [{ test: 'System', error: error.message }],
        results: []
      });
    } finally {
      setIsRunning(false);
      setCurrentTest('');
    }
  };

  const getStatusIcon = (passed) => {
    return passed ? (
      <CheckCircle className="w-5 h-5 text-green-500" />
    ) : (
      <XCircle className="w-5 h-5 text-red-500" />
    );
  };

  const getSuccessRateColor = (rate) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  System Test Panel
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Comprehensive testing for FactCheck application
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <XCircle className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Test Controls */}
          <div className="mb-6">
            <button
              onClick={runTests}
              disabled={isRunning}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                isRunning
                  ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
              }`}
            >
              <Play className={`w-5 h-5 ${isRunning ? 'animate-spin' : ''}`} />
              <span>{isRunning ? 'Running Tests...' : 'Run All Tests'}</span>
            </button>
          </div>

          {/* Current Test Status */}
          {isRunning && currentTest && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800"
            >
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-blue-700 dark:text-blue-300 font-medium">
                  Testing: {currentTest}
                </span>
              </div>
            </motion.div>
          )}

          {/* Test Results */}
          {testResults && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm">Total Tests</p>
                      <p className="text-2xl font-bold">{testResults.totalTests}</p>
                    </div>
                    <BarChart3 className="w-8 h-8 text-blue-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm">Passed</p>
                      <p className="text-2xl font-bold">{testResults.passedTests}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-4 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-red-100 text-sm">Failed</p>
                      <p className="text-2xl font-bold">{testResults.failedTests}</p>
                    </div>
                    <XCircle className="w-8 h-8 text-red-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm">Success Rate</p>
                      <p className="text-2xl font-bold">{testResults.successRate}%</p>
                    </div>
                    <Zap className="w-8 h-8 text-purple-200" />
                  </div>
                </div>
              </div>

              {/* Detailed Results */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Test Results
                </h3>
                <div className="space-y-2">
                  {testResults.results.map((result, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(result.passed)}
                        <span className="text-gray-900 dark:text-white">
                          {result.test}
                        </span>
                      </div>
                      <span className={`text-sm font-medium ${
                        result.passed ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {result.passed ? 'PASSED' : 'FAILED'}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Errors */}
              {testResults.errors.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 border border-red-200 dark:border-red-800">
                  <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-4 flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5" />
                    <span>Errors</span>
                  </h3>
                  <div className="space-y-2">
                    {testResults.errors.map((error, index) => (
                      <div key={index} className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                        <p className="font-medium text-red-700 dark:text-red-300">
                          {error.test}
                        </p>
                        <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                          {error.error}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SystemTestPanel;
