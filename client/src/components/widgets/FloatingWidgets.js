import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  MessageCircle,
  Plus,
  HelpCircle,
  ArrowUp,
  Zap,
  Heart,
  Share2,
  Settings,
  TestTube
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import SystemTestPanel from '../testing/SystemTestPanel';

gsap.registerPlugin(ScrollTrigger);

const FloatingWidgets = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTestPanel, setShowTestPanel] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const containerRef = useRef();
  const chatWidgetRef = useRef();
  const plusWidgetRef = useRef();
  const scrollTopRef = useRef();
  const expandedMenuRef = useRef();
  
  let scrollTimeout;
  let lastScroll = 0;

  const widgets = [
    {
      id: 'chat',
      icon: MessageCircle,
      label: 'Chat AI',
      color: 'from-blue-500 to-blue-600',
      hoverColor: 'from-blue-600 to-blue-700',
      action: () => navigate('/chat'),
      requireAuth: true
    },
    {
      id: 'help',
      icon: HelpCircle,
      label: 'Trợ giúp',
      color: 'from-green-500 to-green-600',
      hoverColor: 'from-green-600 to-green-700',
      action: () => navigate('/knowledge')
    },
    {
      id: 'feedback',
      icon: Heart,
      label: 'Góp ý',
      color: 'from-pink-500 to-pink-600',
      hoverColor: 'from-pink-600 to-pink-700',
      action: () => window.open('mailto:support@factcheck.com')
    },
    {
      id: 'share',
      icon: Share2,
      label: 'Chia sẻ',
      color: 'from-purple-500 to-purple-600',
      hoverColor: 'from-purple-600 to-purple-700',
      action: () => {
        if (navigator.share) {
          navigator.share({
            title: 'FactCheck - Chống thông tin sai lệch',
            url: window.location.href
          });
        }
      }
    },
    {
      id: 'test',
      icon: TestTube,
      label: 'System Test',
      color: 'from-orange-500 to-orange-600',
      hoverColor: 'from-orange-600 to-orange-700',
      action: () => setShowTestPanel(true),
      requireAuth: false
    }
  ];

  const visibleWidgets = widgets.filter(widget => !widget.requireAuth || user);

  useEffect(() => {
    const container = containerRef.current;
    const chatWidget = chatWidgetRef.current;
    const plusWidget = plusWidgetRef.current;
    const scrollTop = scrollTopRef.current;

    if (!container || !chatWidget || !plusWidget) return;

    // Check for reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      gsap.set([chatWidget, plusWidget], { opacity: 1, y: 0 });
      return;
    }

    // Initial setup - start from bottom
    gsap.set([chatWidget, plusWidget], {
      y: 100,
      opacity: 0,
      scale: 0.8
    });

    // Entrance animation - slide up from bottom
    const entranceTl = gsap.timeline({ delay: 1 });
    entranceTl.to([chatWidget, plusWidget], {
      y: 0,
      opacity: 1,
      scale: 1,
      duration: 0.8,
      ease: "back.out(1.7)",
      stagger: 0.15
    });

    // Scroll handler with sticky behavior
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      const scrollDirection = currentScroll > lastScroll ? 'down' : 'up';
      const scrollVelocity = Math.abs(currentScroll - lastScroll);

      clearTimeout(scrollTimeout);

      // Sticky follow behavior - widgets move with scroll
      const followOffset = Math.min(currentScroll * 0.02, 20); // Max 20px offset

      // Show widgets on scroll with follow effect
      gsap.to([chatWidget, plusWidget], {
        opacity: 1,
        y: followOffset, // Follow scroll slightly
        scale: 1,
        duration: 0.4,
        ease: "power2.out"
      });

      // Fast scroll behavior
      if (scrollVelocity > 10) {
        if (scrollDirection === 'down') {
          // Fast scroll down - widgets slide down more
          gsap.to([chatWidget, plusWidget], {
            y: followOffset + 10,
            scale: 0.95,
            duration: 0.2,
            ease: "power2.out"
          });
        } else {
          // Fast scroll up - widgets bounce up
          gsap.to([chatWidget, plusWidget], {
            y: followOffset - 5,
            scale: 1.05,
            duration: 0.3,
            ease: "back.out(1.7)"
          });
        }
      }

      // Show scroll to top button
      if (currentScroll > 300) {
        setShowScrollTop(true);
        if (scrollTop) {
          gsap.to(scrollTop, {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.4,
            ease: "back.out(1.7)"
          });
        }
      } else {
        setShowScrollTop(false);
        if (scrollTop) {
          gsap.to(scrollTop, {
            opacity: 0,
            scale: 0.8,
            y: 20,
            duration: 0.3,
            ease: "power2.in"
          });
        }
      }

      // Auto-hide after inactivity
      scrollTimeout = setTimeout(() => {
        if (currentScroll > 200 && !isExpanded) {
          gsap.to([chatWidget, plusWidget], {
            opacity: 0.6,
            scale: 0.9,
            duration: 1,
            ease: "power2.out"
          });
        }
      }, 4000);

      lastScroll = currentScroll;
    };

    // Scroll event listener
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Parallax scroll effect - widgets follow scroll
    ScrollTrigger.create({
      start: 0,
      end: 99999,
      scrub: 0.5, // Smooth following
      onUpdate: (self) => {
        const scrollY = window.scrollY;

        // Calculate follow offset (widgets move slower than scroll)
        const followY = scrollY * 0.03; // 3% of scroll distance
        const maxFollow = 30; // Maximum follow distance
        const clampedFollow = Math.min(followY, maxFollow);

        // Apply parallax effect
        gsap.set([chatWidget, plusWidget], {
          y: clampedFollow
        });
      }
    });

    // Floating animation (subtle bounce)
    const floatingTl = gsap.timeline({ repeat: -1, yoyo: true });
    floatingTl.to([chatWidget, plusWidget], {
      y: "+=3", // Relative to current position
      duration: 3,
      ease: "sine.inOut",
      stagger: 0.5
    });

    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
      floatingTl.kill();
    };
  }, [isExpanded]);



  // Plus widget expansion
  const toggleExpanded = () => {
    const expandedMenu = expandedMenuRef.current;
    if (!expandedMenu) return;

    setIsExpanded(!isExpanded);

    if (!isExpanded) {
      // Expand animation
      gsap.set(expandedMenu.children, {
        opacity: 0,
        scale: 0,
        rotation: -180
      });

      gsap.to(expandedMenu, {
        opacity: 1,
        duration: 0.3
      });

      gsap.to(expandedMenu.children, {
        opacity: 1,
        scale: 1,
        rotation: 0,
        duration: 0.5,
        ease: "back.out(1.7)",
        stagger: 0.1
      });

      // Plus icon rotation
      gsap.to(plusWidgetRef.current.querySelector('svg'), {
        rotation: 45,
        duration: 0.4,
        ease: "power2.out"
      });
    } else {
      // Collapse animation
      gsap.to(expandedMenu.children, {
        opacity: 0,
        scale: 0,
        rotation: -180,
        duration: 0.3,
        ease: "power2.in",
        stagger: 0.05
      });

      gsap.to(expandedMenu, {
        opacity: 0,
        duration: 0.3,
        delay: 0.2
      });

      // Plus icon rotation back
      gsap.to(plusWidgetRef.current.querySelector('svg'), {
        rotation: 0,
        duration: 0.4,
        ease: "power2.out"
      });
    }
  };

  // Scroll to top function
  const scrollToTop = () => {
    gsap.to(window, {
      scrollTo: { y: 0 },
      duration: 1,
      ease: "power2.out"
    });

    // Button animation feedback
    gsap.to(scrollTopRef.current, {
      scale: 0.9,
      duration: 0.1,
      yoyo: true,
      repeat: 1,
      ease: "power2.out"
    });
  };

  return (
    <div ref={containerRef} className="fixed bottom-6 right-6 z-40">
      {/* Expanded Menu */}
      {isExpanded && (
        <div
          ref={expandedMenuRef}
          className="absolute bottom-20 right-0 flex flex-col space-y-3 opacity-0"
        >
          {visibleWidgets.map((widget, index) => {
            const Icon = widget.icon;
            return (
              <button
                key={widget.id}
                onClick={widget.action}
                className={`w-12 h-12 bg-gradient-to-r ${widget.color} hover:${widget.hoverColor} text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group relative`}
                title={widget.label}
              >
                <Icon size={20} className="group-hover:scale-110 transition-transform duration-200" />
                
                {/* Tooltip */}
                <div className="absolute right-full mr-3 px-3 py-1 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                  {widget.label}
                  <div className="absolute top-1/2 -right-1 transform -translate-y-1/2 w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Main Widgets */}
      <div className="flex flex-col space-y-4">
        {/* Scroll to Top */}
        {showScrollTop && (
          <button
            ref={scrollTopRef}
            onClick={scrollToTop}
            className={`w-12 h-12 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center opacity-0 scale-0`}
            title="Lên đầu trang"
          >
            <ArrowUp size={20} />
          </button>
        )}

        {/* Chat Widget */}
        <button
          ref={chatWidgetRef}
          onClick={() => navigate('/chat')}
          className="w-14 h-14 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group relative"
          title="Chat với AI"
        >
          <MessageCircle size={24} className="group-hover:scale-110 transition-transform duration-200" />
          
          {/* Pulse animation */}
          <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-20" />
          
          {/* Tooltip */}
          <div className="absolute right-full mr-3 px-3 py-1 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
            Chat với AI
            <div className="absolute top-1/2 -right-1 transform -translate-y-1/2 w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45" />
          </div>
        </button>

        {/* Plus Widget */}
        <button
          ref={plusWidgetRef}
          onClick={toggleExpanded}
          className={`w-14 h-14 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group relative ${
            isExpanded ? 'ring-4 ring-purple-300/50' : ''
          }`}
          title={isExpanded ? 'Đóng menu' : 'Mở menu'}
        >
          <Plus size={24} className="group-hover:scale-110 transition-transform duration-200" />
          
          {/* Tooltip */}
          <div className="absolute right-full mr-3 px-3 py-1 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
            {isExpanded ? 'Đóng menu' : 'Thêm tùy chọn'}
            <div className="absolute top-1/2 -right-1 transform -translate-y-1/2 w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45" />
          </div>
        </button>
      </div>

      {/* System Test Panel */}
      <SystemTestPanel
        isOpen={showTestPanel}
        onClose={() => setShowTestPanel(false)}
      />
    </div>
  );
};

export default FloatingWidgets;
