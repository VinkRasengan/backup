import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Eye, 
  EyeOff, 
  Volume2, 
  VolumeX, 
  Keyboard, 
  MousePointer,
  Contrast,
  Type,
  CheckCircle,
  AlertTriangle,
  X,
  Settings
} from 'lucide-react';

const AccessibilityChecker = ({ isOpen, onClose }) => {
  const [checks, setChecks] = useState({
    reducedMotion: false,
    highContrast: false,
    largeText: false,
    keyboardNavigation: false,
    screenReader: false,
    colorBlindness: false
  });

  const [violations, setViolations] = useState([]);
  const [score, setScore] = useState(0);

  // Check for accessibility preferences
  useEffect(() => {
    const checkAccessibilityFeatures = () => {
      const newChecks = {
        reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        highContrast: window.matchMedia('(prefers-contrast: high)').matches,
        largeText: window.matchMedia('(prefers-font-size: large)').matches,
        keyboardNavigation: document.activeElement !== document.body,
        screenReader: window.speechSynthesis !== undefined,
        colorBlindness: window.matchMedia('(prefers-color-scheme: no-preference)').matches
      };

      setChecks(newChecks);
    };

    checkAccessibilityFeatures();

    // Listen for changes
    const mediaQueries = [
      window.matchMedia('(prefers-reduced-motion: reduce)'),
      window.matchMedia('(prefers-contrast: high)'),
      window.matchMedia('(prefers-font-size: large)')
    ];

    mediaQueries.forEach(mq => {
      mq.addEventListener('change', checkAccessibilityFeatures);
    });

    return () => {
      mediaQueries.forEach(mq => {
        mq.removeEventListener('change', checkAccessibilityFeatures);
      });
    };
  }, []);

  // Run accessibility audit
  const runAccessibilityAudit = () => {
    const newViolations = [];
    let newScore = 100;

    // Check for missing alt text
    const images = document.querySelectorAll('img:not([alt])');
    if (images.length > 0) {
      newViolations.push({
        type: 'error',
        message: `${images.length} images missing alt text`,
        impact: 'high'
      });
      newScore -= 20;
    }

    // Check for missing ARIA labels
    const buttons = document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])');
    const iconButtons = Array.from(buttons).filter(btn => 
      btn.querySelector('svg') && !btn.textContent.trim()
    );
    if (iconButtons.length > 0) {
      newViolations.push({
        type: 'warning',
        message: `${iconButtons.length} icon buttons missing ARIA labels`,
        impact: 'medium'
      });
      newScore -= 10;
    }

    // Check for proper heading hierarchy
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let lastLevel = 0;
    let hierarchyViolations = 0;
    
    headings.forEach(heading => {
      const level = parseInt(heading.tagName.charAt(1));
      if (level > lastLevel + 1) {
        hierarchyViolations++;
      }
      lastLevel = level;
    });

    if (hierarchyViolations > 0) {
      newViolations.push({
        type: 'warning',
        message: `${hierarchyViolations} heading hierarchy violations`,
        impact: 'medium'
      });
      newScore -= 5;
    }

    // Check for sufficient color contrast
    const elements = document.querySelectorAll('*');
    let contrastViolations = 0;
    
    // This is a simplified check - in reality you'd use a proper contrast checking library
    elements.forEach(el => {
      const style = window.getComputedStyle(el);
      const color = style.color;
      const backgroundColor = style.backgroundColor;
      
      // Simple check for very light text on light background
      if (color.includes('rgb(255') && backgroundColor.includes('rgb(255')) {
        contrastViolations++;
      }
    });

    if (contrastViolations > 0) {
      newViolations.push({
        type: 'error',
        message: `${contrastViolations} potential color contrast issues`,
        impact: 'high'
      });
      newScore -= 15;
    }

    // Check for keyboard accessibility
    const focusableElements = document.querySelectorAll(
      'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
    );
    const elementsWithoutFocus = Array.from(focusableElements).filter(el => {
      const style = window.getComputedStyle(el);
      return style.outline === 'none' && !style.boxShadow.includes('focus');
    });

    if (elementsWithoutFocus.length > 0) {
      newViolations.push({
        type: 'warning',
        message: `${elementsWithoutFocus.length} focusable elements without focus indicators`,
        impact: 'medium'
      });
      newScore -= 8;
    }

    setViolations(newViolations);
    setScore(Math.max(0, newScore));
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getViolationIcon = (type) => {
    return type === 'error' ? AlertTriangle : CheckCircle;
  };

  const getViolationColor = (type) => {
    return type === 'error' ? 'text-red-500' : 'text-yellow-500';
  };

  const accessibilityFeatures = [
    {
      key: 'reducedMotion',
      label: 'Reduced Motion',
      icon: EyeOff,
      description: 'Respects user preference for reduced motion'
    },
    {
      key: 'highContrast',
      label: 'High Contrast',
      icon: Contrast,
      description: 'Supports high contrast mode'
    },
    {
      key: 'largeText',
      label: 'Large Text',
      icon: Type,
      description: 'Adapts to large text preferences'
    },
    {
      key: 'keyboardNavigation',
      label: 'Keyboard Navigation',
      icon: Keyboard,
      description: 'Fully keyboard accessible'
    },
    {
      key: 'screenReader',
      label: 'Screen Reader',
      icon: Volume2,
      description: 'Screen reader compatible'
    }
  ];

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
            initial={{ opacity: 0, y: -300, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -300, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed top-4 left-1/2 transform -translate-x-1/2 w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-green-50 to-blue-50 dark:from-gray-700 dark:to-gray-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <Eye className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">Accessibility Checker</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">WCAG AA Compliance</p>
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
              {/* Accessibility Score */}
              <div className="text-center">
                <div className={`text-4xl font-bold ${getScoreColor(score)} mb-2`}>
                  {score}%
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Accessibility Score</p>
                <button
                  onClick={runAccessibilityAudit}
                  className="mt-3 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                >
                  Run Audit
                </button>
              </div>

              {/* Accessibility Features */}
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Accessibility Features</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {accessibilityFeatures.map((feature) => (
                    <div
                      key={feature.key}
                      className={`p-3 rounded-lg border ${
                        checks[feature.key]
                          ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                          : 'bg-gray-50 border-gray-200 dark:bg-gray-700 dark:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <feature.icon 
                          className={`w-5 h-5 ${
                            checks[feature.key] ? 'text-green-500' : 'text-gray-400'
                          }`} 
                        />
                        <div className="flex-1">
                          <div className={`font-medium ${
                            checks[feature.key] 
                              ? 'text-green-700 dark:text-green-300' 
                              : 'text-gray-700 dark:text-gray-300'
                          }`}>
                            {feature.label}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {feature.description}
                          </div>
                        </div>
                        {checks[feature.key] && (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Violations */}
              {violations.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Issues Found</h4>
                  <div className="space-y-2">
                    {violations.map((violation, index) => (
                      <div
                        key={index}
                        className="p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700"
                      >
                        <div className="flex items-center space-x-3">
                          {React.createElement(getViolationIcon(violation.type), {
                            className: `w-4 h-4 ${getViolationColor(violation.type)}`
                          })}
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 dark:text-white">
                              {violation.message}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Impact: {violation.impact}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AccessibilityChecker;
