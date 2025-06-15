import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Maximize2, 
  Minimize2, 
  X, 
  Move, 
  RotateCcw,
  Settings,
  Pin,
  PinOff
} from 'lucide-react';

const FlexibleWidget = ({ 
  id,
  title,
  children,
  defaultPosition = { x: 100, y: 100 },
  defaultSize = { width: 320, height: 240 },
  minSize = { width: 200, height: 150 },
  maxSize = { width: 800, height: 600 },
  resizable = true,
  draggable = true,
  closable = true,
  minimizable = true,
  pinnable = true,
  onClose,
  onMinimize,
  onMaximize,
  onPin,
  className = "",
  headerClassName = "",
  contentClassName = ""
}) => {
  const [position, setPosition] = useState(defaultPosition);
  const [size, setSize] = useState(defaultSize);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  
  const widgetRef = useRef(null);
  const headerRef = useRef(null);

  // Handle dragging
  const handleMouseDown = (e) => {
    if (!draggable || isMaximized) return;
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e) => {
    if (isDragging && !isMaximized) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    } else if (isResizing) {
      const newWidth = Math.max(minSize.width, Math.min(maxSize.width, resizeStart.width + (e.clientX - resizeStart.x)));
      const newHeight = Math.max(minSize.height, Math.min(maxSize.height, resizeStart.height + (e.clientY - resizeStart.y)));
      
      setSize({
        width: newWidth,
        height: newHeight
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  // Handle resizing
  const handleResizeStart = (e) => {
    if (!resizable || isMaximized) return;
    
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height
    });
  };

  // Add global mouse event listeners
  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragStart, resizeStart]);

  // Handle minimize
  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
    onMinimize?.(!isMinimized);
  };

  // Handle maximize
  const handleMaximize = () => {
    setIsMaximized(!isMaximized);
    onMaximize?.(!isMaximized);
  };

  // Handle close
  const handleClose = () => {
    onClose?.(id);
  };

  // Handle pin
  const handlePin = () => {
    setIsPinned(!isPinned);
    onPin?.(!isPinned);
  };

  // Handle reset position
  const handleReset = () => {
    setPosition(defaultPosition);
    setSize(defaultSize);
    setIsMaximized(false);
    setIsMinimized(false);
  };

  // Calculate widget styles
  const getWidgetStyles = () => {
    if (isMaximized) {
      return {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999
      };
    }

    return {
      position: isPinned ? 'sticky' : 'fixed',
      left: position.x,
      top: position.y,
      width: size.width,
      height: isMinimized ? 'auto' : size.height,
      zIndex: isPinned ? 10 : 1000
    };
  };

  return (
    <motion.div
      ref={widgetRef}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        ...getWidgetStyles()
      }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl overflow-hidden ${className} ${
        isDragging ? 'cursor-grabbing' : ''
      } ${isPinned ? 'relative' : ''}`}
      style={getWidgetStyles()}
    >
      {/* Widget Header */}
      <div
        ref={headerRef}
        onMouseDown={handleMouseDown}
        className={`flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 cursor-grab active:cursor-grabbing select-none ${headerClassName}`}
      >
        <div className="flex items-center space-x-2">
          <Move size={16} className="text-gray-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
            {title}
          </h3>
          {isPinned && (
            <Pin size={14} className="text-blue-500" />
          )}
        </div>

        <div className="flex items-center space-x-1">
          {/* Settings */}
          <button
            onClick={(e) => e.stopPropagation()}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
            title="Cài đặt"
          >
            <Settings size={14} className="text-gray-500 dark:text-gray-400" />
          </button>

          {/* Reset */}
          <button
            onClick={handleReset}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
            title="Đặt lại vị trí"
          >
            <RotateCcw size={14} className="text-gray-500 dark:text-gray-400" />
          </button>

          {/* Pin */}
          {pinnable && (
            <button
              onClick={handlePin}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
              title={isPinned ? 'Bỏ ghim' : 'Ghim'}
            >
              {isPinned ? (
                <PinOff size={14} className="text-blue-500" />
              ) : (
                <Pin size={14} className="text-gray-500 dark:text-gray-400" />
              )}
            </button>
          )}

          {/* Minimize */}
          {minimizable && (
            <button
              onClick={handleMinimize}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
              title={isMinimized ? 'Mở rộng' : 'Thu nhỏ'}
            >
              {isMinimized ? (
                <Maximize2 size={14} className="text-gray-500 dark:text-gray-400" />
              ) : (
                <Minimize2 size={14} className="text-gray-500 dark:text-gray-400" />
              )}
            </button>
          )}

          {/* Maximize */}
          <button
            onClick={handleMaximize}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
            title={isMaximized ? 'Khôi phục' : 'Toàn màn hình'}
          >
            {isMaximized ? (
              <Minimize2 size={14} className="text-gray-500 dark:text-gray-400" />
            ) : (
              <Maximize2 size={14} className="text-gray-500 dark:text-gray-400" />
            )}
          </button>

          {/* Close */}
          {closable && (
            <button
              onClick={handleClose}
              className="p-1 hover:bg-red-500 hover:text-white rounded transition-colors"
              title="Đóng"
            >
              <X size={14} className="text-gray-500 dark:text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Widget Content */}
      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`overflow-hidden ${contentClassName}`}
            style={{ 
              height: isMaximized ? 'calc(100vh - 60px)' : 'auto',
              maxHeight: isMaximized ? 'none' : size.height - 60
            }}
          >
            <div className="p-4 overflow-auto h-full">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resize Handle */}
      {resizable && !isMaximized && !isMinimized && (
        <div
          onMouseDown={handleResizeStart}
          className="absolute bottom-0 right-0 w-4 h-4 cursor-nw-resize opacity-50 hover:opacity-100 transition-opacity"
        >
          <div className="absolute bottom-1 right-1 w-2 h-2 bg-gray-400 dark:bg-gray-500 transform rotate-45"></div>
        </div>
      )}
    </motion.div>
  );
};

export default FlexibleWidget;
