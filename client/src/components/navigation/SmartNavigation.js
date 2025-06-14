import React, { useState, useEffect } from 'react';
import TabNavigation from './TabNavigation';
import FeatureMenu from './FeatureMenu';
import MobileTabBar from './MobileTabBar';

const SmartNavigation = ({ 
  showTabNavigation = true,
  showFeatureMenu = true,
  showMobileTabBar = true,
  className = '' 
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return (
    <>
      {/* Desktop và Tablet Navigation */}
      {!isMobile && (
        <div className={`bg-white dark:bg-gray-800 ${className}`}>
          {/* Tab Navigation - hiển thị full trên desktop */}
          {showTabNavigation && !isTablet && (
            <TabNavigation />
          )}
          
          {/* Feature Menu - hiển thị trên tablet hoặc khi TabNavigation bị ẩn */}
          {showFeatureMenu && (isTablet || !showTabNavigation) && (
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  FactCheck
                </h1>
                <FeatureMenu />
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Mobile Bottom Navigation */}
      {isMobile && showMobileTabBar && (
        <MobileTabBar />
      )}
    </>
  );
};

export default SmartNavigation;
