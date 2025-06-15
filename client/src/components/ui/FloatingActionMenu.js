import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { 
  Plus, 
  X, 
  MessageCircle, 
  Search, 
  Users, 
  PenTool,
  Shield,
  Settings,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const FloatingActionMenu = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  
  const mainButtonRef = useRef();
  const menuRef = useRef();
  const overlayRef = useRef();

  const menuItems = [
    {
      icon: MessageCircle,
      label: 'Chat AI',
      path: '/chat',
      color: 'bg-blue-500 hover:bg-blue-600',
      requireAuth: true
    },
    {
      icon: Search,
      label: 'Kiểm tra',
      path: '/check',
      color: 'bg-green-500 hover:bg-green-600',
      requireAuth: false
    },
    {
      icon: Users,
      label: 'Cộng đồng',
      path: '/community',
      color: 'bg-purple-500 hover:bg-purple-600',
      requireAuth: false
    },
    {
      icon: PenTool,
      label: 'Gửi bài',
      path: '/submit',
      color: 'bg-orange-500 hover:bg-orange-600',
      requireAuth: true
    },
    {
      icon: Shield,
      label: 'Dashboard',
      path: '/dashboard',
      color: 'bg-indigo-500 hover:bg-indigo-600',
      requireAuth: true
    },
    {
      icon: Settings,
      label: 'Cài đặt',
      path: '/settings',
      color: 'bg-gray-500 hover:bg-gray-600',
      requireAuth: true
    }
  ];

  // Filter items based on auth status
  const visibleItems = menuItems.filter(item => !item.requireAuth || user);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Initial setup
      const menuItems = menuRef.current?.children || [];
      
      gsap.set(menuItems, {
        opacity: 0,
        scale: 0,
        rotation: -180,
        transformOrigin: "center center"
      });

      gsap.set(overlayRef.current, {
        opacity: 0,
        pointerEvents: 'none'
      });

    }, menuRef);

    return () => ctx.revert();
  }, []);

  const toggleMenu = () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);

    const ctx = gsap.context(() => {
      const menuItems = menuRef.current?.children || [];
      const mainButton = mainButtonRef.current;
      const overlay = overlayRef.current;

      if (newIsOpen) {
        // Opening animation
        const tl = gsap.timeline({
          onComplete: () => setIsAnimating(false)
        });

        // Show overlay
        tl.to(overlay, {
          opacity: 1,
          pointerEvents: 'auto',
          duration: 0.3,
          ease: "power2.out"
        });

        // Rotate main button
        tl.to(mainButton, {
          rotation: 45,
          scale: 1.1,
          duration: 0.4,
          ease: "back.out(1.7)"
        }, 0);

        // Animate menu items in radial pattern
        Array.from(menuItems).forEach((item, index) => {
          const angle = (index * (360 / visibleItems.length)) - 90;
          const radius = 100;
          const x = Math.cos(angle * Math.PI / 180) * radius;
          const y = Math.sin(angle * Math.PI / 180) * radius;

          tl.to(item, {
            opacity: 1,
            scale: 1,
            rotation: 0,
            x: x,
            y: y,
            duration: 0.6,
            ease: "back.out(1.7)"
          }, 0.1 + index * 0.05);
        });

      } else {
        // Closing animation
        const tl = gsap.timeline({
          onComplete: () => setIsAnimating(false)
        });

        // Hide menu items
        tl.to(menuItems, {
          opacity: 0,
          scale: 0,
          rotation: -180,
          x: 0,
          y: 0,
          duration: 0.3,
          ease: "power2.in",
          stagger: {
            amount: 0.1,
            from: "end"
          }
        });

        // Rotate main button back
        tl.to(mainButton, {
          rotation: 0,
          scale: 1,
          duration: 0.4,
          ease: "back.out(1.7)"
        }, 0);

        // Hide overlay
        tl.to(overlay, {
          opacity: 0,
          pointerEvents: 'none',
          duration: 0.3,
          ease: "power2.out"
        }, 0.2);
      }

    }, menuRef);
  };

  const handleItemClick = (path) => {
    // Close menu first
    setIsOpen(false);
    setIsAnimating(true);

    const ctx = gsap.context(() => {
      const menuItems = menuRef.current?.children || [];
      const mainButton = mainButtonRef.current;
      const overlay = overlayRef.current;

      const tl = gsap.timeline({
        onComplete: () => {
          setIsAnimating(false);
          navigate(path);
        }
      });

      // Quick close animation
      tl.to(menuItems, {
        opacity: 0,
        scale: 0,
        x: 0,
        y: 0,
        duration: 0.2,
        ease: "power2.in"
      });

      tl.to(mainButton, {
        rotation: 0,
        scale: 1,
        duration: 0.3,
        ease: "power2.out"
      }, 0);

      tl.to(overlay, {
        opacity: 0,
        pointerEvents: 'none',
        duration: 0.2
      }, 0);

    }, menuRef);
  };

  const handleOverlayClick = () => {
    if (!isAnimating) {
      toggleMenu();
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
        onClick={handleOverlayClick}
      />

      {/* Floating Action Menu */}
      <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
        {/* Menu Items */}
        <div ref={menuRef} className="absolute bottom-0 right-0">
          {visibleItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => handleItemClick(item.path)}
                className={`absolute bottom-0 right-0 w-12 h-12 ${item.color} text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group`}
                title={item.label}
                disabled={isAnimating}
              >
                <Icon size={20} className="group-hover:scale-110 transition-transform duration-200" />
                
                {/* Tooltip */}
                <div className="absolute right-full mr-3 px-3 py-1 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                  {item.label}
                  <div className="absolute top-1/2 -right-1 transform -translate-y-1/2 w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Main Button */}
        <button
          ref={mainButtonRef}
          onClick={toggleMenu}
          disabled={isAnimating}
          className={`w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center group ${
            isOpen ? 'ring-4 ring-blue-300/50' : ''
          }`}
          aria-label={isOpen ? 'Đóng menu' : 'Mở menu'}
        >
          <div className="relative">
            <Plus 
              size={24} 
              className={`transition-all duration-300 ${
                isOpen ? 'opacity-0 rotate-45' : 'opacity-100 rotate-0'
              }`}
            />
            <X 
              size={24} 
              className={`absolute inset-0 transition-all duration-300 ${
                isOpen ? 'opacity-100 rotate-0' : 'opacity-0 -rotate-45'
              }`}
            />
          </div>

          {/* Ripple effect */}
          <div className="absolute inset-0 rounded-full bg-white opacity-0 group-active:opacity-20 transition-opacity duration-150" />
          
          {/* Pulse animation when closed */}
          {!isOpen && (
            <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-20" />
          )}
        </button>

        {/* Help tooltip for main button */}
        {!isOpen && (
          <div className="absolute bottom-full right-0 mb-3 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
            <div className="flex items-center space-x-2">
              <HelpCircle size={14} />
              <span>Truy cập nhanh</span>
            </div>
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45 -mt-1" />
          </div>
        )}
      </div>
    </>
  );
};

export default FloatingActionMenu;
