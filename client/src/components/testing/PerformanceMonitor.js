import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Monitor, 
  Zap, 
  Activity, 
  AlertTriangle, 
  CheckCircle,
  X,
  BarChart3,
  Smartphone,
  Tablet,
  Laptop
} from 'lucide-react';
import { gsap } from '../../utils/gsap';

const PerformanceMonitor = ({ isOpen, onClose }) => {
  const [metrics, setMetrics] = useState({
    fps: 0,
    memory: 0,
    animations: 0,
    loadTime: 0,
    deviceType: 'desktop'
  });
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [performanceScore, setPerformanceScore] = useState(0);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());

  // Detect device type
  useEffect(() => {
    const detectDevice = () => {
      const width = window.innerWidth;
      if (width < 768) return 'mobile';
      if (width < 1024) return 'tablet';
      return 'desktop';
    };

    setMetrics(prev => ({ ...prev, deviceType: detectDevice() }));

    const handleResize = () => {
      setMetrics(prev => ({ ...prev, deviceType: detectDevice() }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Performance monitoring with throttling
  useEffect(() => {
    if (!isMonitoring) return;

    let animationId;
    let lastUpdate = 0;
    const UPDATE_INTERVAL = 2000; // Update every 2 seconds instead of every second

    const measureFPS = () => {
      frameCountRef.current++;
      const now = performance.now();
      
      // Throttle updates to reduce re-renders
      if (now - lastUpdate >= UPDATE_INTERVAL) {
        const fps = Math.round((frameCountRef.current * 1000) / (now - lastTimeRef.current));
        
        setMetrics(prev => ({
          ...prev,
          fps,
          memory: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : 0,
          animations: gsap.globalTimeline.getChildren().length
        }));

        frameCountRef.current = 0;
        lastTimeRef.current = now;
        lastUpdate = now;
      }

      if (isMonitoring) {
        animationId = requestAnimationFrame(measureFPS);
      }
    };

    measureFPS();

    // Cleanup function
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isMonitoring]);

  // Calculate performance score
  useEffect(() => {
    const calculateScore = () => {
      let score = 100;
      
      // FPS penalty
      if (metrics.fps < 30) score -= 30;
      else if (metrics.fps < 45) score -= 15;
      else if (metrics.fps < 55) score -= 5;

      // Memory penalty
      if (metrics.memory > 100) score -= 20;
      else if (metrics.memory > 50) score -= 10;

      // Animation count penalty
      if (metrics.animations > 20) score -= 15;
      else if (metrics.animations > 10) score -= 5;

      setPerformanceScore(Math.max(0, score));
    };

    calculateScore();
  }, [metrics]);

  const startMonitoring = () => {
    setIsMonitoring(true);
    frameCountRef.current = 0;
    lastTimeRef.current = performance.now();
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreIcon = (score) => {
    if (score >= 80) return CheckCircle;
    if (score >= 60) return AlertTriangle;
    return AlertTriangle;
  };

  const getDeviceIcon = (device) => {
    switch (device) {
      case 'mobile': return Smartphone;
      case 'tablet': return Tablet;
      default: return Laptop;
    }
  };

  const runPerformanceTest = () => {
    // Kill existing animations first
    gsap.killTweensOf(".performance-test-element");
    
    // Create test animations
    const testElements = document.querySelectorAll('.performance-test-element');
    
    testElements.forEach((element, index) => {
      gsap.to(element, {
        rotation: 360,
        scale: 1.2,
        duration: 2,
        delay: index * 0.1,
        repeat: 2,
        yoyo: true,
        ease: "power2.inOut"
      });
    });
  };

  const optimizePerformance = () => {
    // Kill all animations
    gsap.killTweensOf("*");
    
    // Force garbage collection if available
    if (window.gc) {
      window.gc();
    }
    
    // Refresh metrics
    setMetrics(prev => ({
      ...prev,
      animations: 0
    }));
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
            initial={{ opacity: 0, x: 300, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed top-4 right-4 w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <Monitor className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">Performance Monitor</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Real-time metrics</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Performance Score */}
              <div className="text-center">
                <div className={`text-4xl font-bold ${getScoreColor(performanceScore)} mb-2`}>
                  {performanceScore}
                </div>
                <div className="flex items-center justify-center space-x-2">
                  {React.createElement(getScoreIcon(performanceScore), { 
                    className: `w-5 h-5 ${getScoreColor(performanceScore)}` 
                  })}
                  <span className="text-sm text-gray-600 dark:text-gray-300">Performance Score</span>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <div className="flex items-center space-x-2 mb-2">
                    <Zap className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">FPS</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {metrics.fps}
                  </div>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <div className="flex items-center space-x-2 mb-2">
                    <Activity className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Memory</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {metrics.memory}MB
                  </div>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <div className="flex items-center space-x-2 mb-2">
                    <BarChart3 className="w-4 h-4 text-purple-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Animations</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {metrics.animations}
                  </div>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <div className="flex items-center space-x-2 mb-2">
                    {React.createElement(getDeviceIcon(metrics.deviceType), { 
                      className: "w-4 h-4 text-orange-500" 
                    })}
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Device</span>
                  </div>
                  <div className="text-sm font-bold text-gray-900 dark:text-white capitalize">
                    {metrics.deviceType}
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <button
                    onClick={isMonitoring ? stopMonitoring : startMonitoring}
                    className={`flex-1 px-4 py-2 rounded-xl font-medium transition-colors ${
                      isMonitoring
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                  >
                    {isMonitoring ? 'Stop' : 'Start'} Monitoring
                  </button>
                  
                  <button
                    onClick={runPerformanceTest}
                    className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors"
                  >
                    Run Test
                  </button>
                </div>

                <button
                  onClick={optimizePerformance}
                  className="w-full px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-medium transition-colors"
                >
                  Optimize Performance
                </button>
              </div>

              {/* Test Elements (hidden) */}
              <div className="hidden">
                <div className="performance-test-element w-4 h-4 bg-blue-500"></div>
                <div className="performance-test-element w-4 h-4 bg-blue-500"></div>
                <div className="performance-test-element w-4 h-4 bg-blue-500"></div>
                <div className="performance-test-element w-4 h-4 bg-blue-500"></div>
                <div className="performance-test-element w-4 h-4 bg-blue-500"></div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PerformanceMonitor;
