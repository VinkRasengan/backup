import React, { useEffect, useRef } from 'react';
import { gsap } from '../utils/gsap';
import { useCounterAnimation } from '../hooks/useGSAP';
import { useTheme } from '../context/ThemeContext';
import { Users, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';

const AnimatedStats = () => {
  const { isDarkMode } = useTheme();
  const containerRef = useRef();
  
  // Counter animations
  const [usersCountRef, startUsersCount] = useCounterAnimation(1247, { duration: 2 });
  const [checksCountRef, startChecksCount] = useCounterAnimation(8934, { duration: 2.5 });
  const [accuracyRef, startAccuracy] = useCounterAnimation(94, { duration: 1.8 });
  const [trendsRef, startTrends] = useCounterAnimation(156, { duration: 2.2 });

  const stats = [
    {
      icon: Users,
      label: 'Người dùng hoạt động',
      value: 1247,
      suffix: '+',
      color: 'from-blue-500 to-blue-600',
      ref: usersCountRef,
      start: startUsersCount
    },
    {
      icon: CheckCircle,
      label: 'Bài viết đã kiểm tra',
      value: 8934,
      suffix: '+',
      color: 'from-green-500 to-green-600',
      ref: checksCountRef,
      start: startChecksCount
    },
    {
      icon: TrendingUp,
      label: 'Độ chính xác',
      value: 94,
      suffix: '%',
      color: 'from-purple-500 to-purple-600',
      ref: accuracyRef,
      start: startAccuracy
    },
    {
      icon: AlertTriangle,
      label: 'Tin giả phát hiện',
      value: 156,
      suffix: '+',
      color: 'from-orange-500 to-orange-600',
      ref: trendsRef,
      start: startTrends
    }
  ];

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Create timeline for better control
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: container,
        start: "top 80%",
        onEnter: () => {
          // Start counter animations when visible
          setTimeout(() => {
            stats.forEach(stat => stat.start());
          }, 300);
        }
      }
    });

    // Stagger animation for stats cards with improved performance
    tl.fromTo(container.children,
      {
        opacity: 0,
        y: 30,
        scale: 0.9
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.6,
        ease: "power2.out",
        stagger: 0.15
      }
    );

    // Simplified hover effects with better performance
    const cards = Array.from(container.children);
    cards.forEach((card) => {
      const handleMouseEnter = () => {
        gsap.to(card, {
          y: -8,
          scale: 1.02,
          duration: 0.3,
          ease: "power2.out"
        });
      };

      const handleMouseLeave = () => {
        gsap.to(card, {
          y: 0,
          scale: 1,
          duration: 0.3,
          ease: "power2.out"
        });
      };

      card.addEventListener('mouseenter', handleMouseEnter);
      card.addEventListener('mouseleave', handleMouseLeave);
    });

    // Cleanup function
    return () => {
      tl.kill();
      cards.forEach((card) => {
        card.removeEventListener('mouseenter', () => {});
        card.removeEventListener('mouseleave', () => {});
      });
    };
  }, []);

  return (
    <div className={`py-16 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Thống Kê Hoạt Động
          </h2>
          <p className={`text-lg ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Cộng đồng FactCheck đang phát triển mạnh mẽ
          </p>
        </div>

        <div ref={containerRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => {
            const IconComponent = stat.icon;
            return (
              <div
                key={stat.label}
                className={`group relative p-6 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-600 ${
                  isDarkMode ? 'bg-gray-700' : 'bg-white'
                }`}
              >
                {/* Background gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                
                {/* Animated background circle */}
                <div className={`absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br ${stat.color} opacity-10 rounded-full group-hover:scale-150 transition-transform duration-500`}></div>
                
                <div className="relative z-10 text-center">
                  {/* Icon */}
                  <div className={`w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-md`}>
                    <IconComponent size={20} />
                  </div>
                  
                  {/* Counter */}
                  <div className={`text-3xl font-bold mb-2 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    <span ref={stat.ref}>0</span>
                    <span className={`text-xl bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                      {stat.suffix}
                    </span>
                  </div>
                  
                  {/* Label */}
                  <p className={`text-sm font-medium ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {stat.label}
                  </p>
                  
                  {/* Progress bar */}
                  <div className={`mt-4 w-full h-1 rounded-full overflow-hidden ${
                    isDarkMode ? 'bg-gray-600' : 'bg-gray-200'
                  }`}>
                    <div 
                      className={`h-full bg-gradient-to-r ${stat.color} rounded-full transform -translate-x-full group-hover:translate-x-0 transition-transform duration-1000 ease-out`}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AnimatedStats;
