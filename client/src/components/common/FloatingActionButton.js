import React, { useRef, useEffect, useState } from 'react';
import { Plus, Search, Users, MessageCircle, BookOpen } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { gsap } from '../../utils/gsap';
import { useTheme } from '../../context/ThemeContext';

const FloatingActionButton = () => {
  const { isDarkMode } = useTheme();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const fabRef = useRef();
  const menuRef = useRef();
  const iconRef = useRef();

  const menuItems = [
    {
      icon: Search,
      label: 'Kiểm tra link',
      to: '/check',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: Users,
      label: 'Cộng đồng',
      to: '/community',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: MessageCircle,
      label: 'Chat AI',
      to: '/chat',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: BookOpen,
      label: 'Kiến thức',
      to: '/knowledge',
      color: 'from-orange-500 to-orange-600'
    }
  ];

  // Calculate position based on current page and other widgets
  const getPositionClasses = () => {
    const isChatPage = location.pathname === '/chat';

    // Adjust position to avoid conflicts with ChatBot
    if (isChatPage) {
      return 'bottom-24 right-4'; // Move up when chat is active
    }

    return 'bottom-4 right-4'; // Default position
  };

  useEffect(() => {
    const fab = fabRef.current;
    if (!fab) return;

    // Entrance animation
    gsap.fromTo(fab, 
      {
        scale: 0,
        rotation: -180,
        opacity: 0
      },
      {
        scale: 1,
        rotation: 0,
        opacity: 1,
        duration: 0.8,
        ease: "back.out(1.7)",
        delay: 1
      }
    );

    // Floating animation
    const floatAnimation = gsap.to(fab, {
      y: -5,
      duration: 2,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true
    });

    return () => {
      floatAnimation.kill();
    };
  }, []);

  const toggleMenu = () => {
    const menu = menuRef.current;
    const icon = iconRef.current;
    
    if (!menu || !icon) return;

    if (!isOpen) {
      // Open animation
      gsap.to(icon, {
        rotation: 45,
        duration: 0.3,
        ease: "power2.out"
      });

      gsap.fromTo(menu.children,
        {
          scale: 0,
          opacity: 0,
          y: 20
        },
        {
          scale: 1,
          opacity: 1,
          y: 0,
          duration: 0.4,
          ease: "back.out(1.7)",
          stagger: 0.1
        }
      );
    } else {
      // Close animation
      gsap.to(icon, {
        rotation: 0,
        duration: 0.3,
        ease: "power2.out"
      });

      gsap.to(menu.children, {
        scale: 0,
        opacity: 0,
        y: 20,
        duration: 0.2,
        ease: "power2.in",
        stagger: 0.05
      });
    }

    setIsOpen(!isOpen);
  };

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  return (
    <div className={`fixed ${getPositionClasses()} z-floating-action transition-all duration-300`}>
      {/* Menu items */}
      <div ref={menuRef} className="absolute bottom-20 right-0 space-y-3">
        {menuItems.map((item, index) => {
          const IconComponent = item.icon;
          return (
            <Link
              key={item.label}
              to={item.to}
              className={`group flex items-center space-x-3 p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 ${
                isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
              }`}
              onClick={() => setIsOpen(false)}
            >
              <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${item.color} flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300`}>
                <IconComponent size={20} />
              </div>
              <span className="pr-4 font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Main FAB */}
      <button
        ref={fabRef}
        onClick={toggleMenu}
        className={`w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center justify-center group hover:scale-110 ${
          isOpen ? 'rotate-45' : ''
        }`}
        aria-label="Quick actions menu"
      >
        <div ref={iconRef}>
          <Plus size={24} className="group-hover:rotate-90 transition-transform duration-300" />
        </div>
        
        {/* Ripple effect */}
        <div className="absolute inset-0 rounded-full bg-white opacity-0 group-active:opacity-20 transition-opacity duration-150"></div>
        
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 opacity-0 group-hover:opacity-30 blur-lg transition-opacity duration-300"></div>
      </button>
    </div>
  );
};

export default FloatingActionButton;
