import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Grid, Settings, Eye, EyeOff } from 'lucide-react';
import FlexibleWidget from './FlexibleWidget';

const WidgetManager = ({ 
  availableWidgets = [],
  defaultWidgets = [],
  onWidgetAdd,
  onWidgetRemove,
  onWidgetUpdate,
  className = ""
}) => {
  const [activeWidgets, setActiveWidgets] = useState([]);
  const [showWidgetPicker, setShowWidgetPicker] = useState(false);
  const [widgetSettings, setWidgetSettings] = useState({});

  // Initialize with default widgets
  useEffect(() => {
    if (defaultWidgets.length > 0) {
      setActiveWidgets(defaultWidgets);
    }
  }, [defaultWidgets]);

  // Add widget
  const handleAddWidget = useCallback((widgetType) => {
    const newWidget = {
      id: `${widgetType.id}-${Date.now()}`,
      type: widgetType.id,
      title: widgetType.title,
      component: widgetType.component,
      props: widgetType.defaultProps || {},
      position: { 
        x: Math.random() * (window.innerWidth - 400) + 50, 
        y: Math.random() * (window.innerHeight - 300) + 50 
      },
      size: widgetType.defaultSize || { width: 320, height: 240 },
      settings: widgetType.defaultSettings || {}
    };

    setActiveWidgets(prev => [...prev, newWidget]);
    setShowWidgetPicker(false);
    onWidgetAdd?.(newWidget);
  }, [onWidgetAdd]);

  // Remove widget
  const handleRemoveWidget = useCallback((widgetId) => {
    setActiveWidgets(prev => prev.filter(w => w.id !== widgetId));
    onWidgetRemove?.(widgetId);
  }, [onWidgetRemove]);

  // Update widget
  const handleUpdateWidget = useCallback((widgetId, updates) => {
    setActiveWidgets(prev => 
      prev.map(widget => 
        widget.id === widgetId 
          ? { ...widget, ...updates }
          : widget
      )
    );
    onWidgetUpdate?.(widgetId, updates);
  }, [onWidgetUpdate]);

  // Widget picker modal
  const WidgetPicker = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={() => setShowWidgetPicker(false)}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Thêm Widget
          </h3>
          <button
            onClick={() => setShowWidgetPicker(false)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {availableWidgets.map((widget) => (
            <button
              key={widget.id}
              onClick={() => handleAddWidget(widget)}
              className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
            >
              <div className="text-2xl mb-2">{widget.icon}</div>
              <div className="font-medium text-gray-900 dark:text-white text-sm">
                {widget.title}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {widget.description}
              </div>
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );

  return (
    <div className={`relative ${className}`}>
      {/* Widget Control Panel */}
      <div className="fixed top-4 right-4 z-40 flex items-center space-x-2">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 flex items-center space-x-2">
          <button
            onClick={() => setShowWidgetPicker(true)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            title="Thêm widget"
          >
            <Plus size={16} className="text-gray-600 dark:text-gray-400" />
          </button>
          
          <div className="w-px h-4 bg-gray-300 dark:bg-gray-600"></div>
          
          <button
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            title="Quản lý layout"
          >
            <Grid size={16} className="text-gray-600 dark:text-gray-400" />
          </button>
          
          <button
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            title="Cài đặt"
          >
            <Settings size={16} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Active Widgets Count */}
        {activeWidgets.length > 0 && (
          <div className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-md text-xs font-medium">
            {activeWidgets.length} widget{activeWidgets.length > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Active Widgets */}
      <AnimatePresence>
        {activeWidgets.map((widget) => (
          <FlexibleWidget
            key={widget.id}
            id={widget.id}
            title={widget.title}
            defaultPosition={widget.position}
            defaultSize={widget.size}
            onClose={handleRemoveWidget}
            onMinimize={(minimized) => 
              handleUpdateWidget(widget.id, { minimized })
            }
            onMaximize={(maximized) => 
              handleUpdateWidget(widget.id, { maximized })
            }
            onPin={(pinned) => 
              handleUpdateWidget(widget.id, { pinned })
            }
          >
            <widget.component {...widget.props} />
          </FlexibleWidget>
        ))}
      </AnimatePresence>

      {/* Widget Picker Modal */}
      <AnimatePresence>
        {showWidgetPicker && <WidgetPicker />}
      </AnimatePresence>
    </div>
  );
};

export default WidgetManager;
