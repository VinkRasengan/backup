import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  Zap, 
  Star, 
  Heart, 
  Rocket, 
  Award,
  Target,
  Layers
} from 'lucide-react';
import { 
  useAdvancedTimeline, 
  useResponsiveAnimation, 
  useBreakpointAnimation,
  useMagneticHover,
  useParallax
} from '../../hooks/useGSAP';
import { AdvancedTimeline, createOptimizedScrollAnimation } from '../../utils/advancedAnimations';

const AdvancedAnimationShowcase = () => {
  const containerRef = useRef(null);
  const heroRef = useRef(null);
  const cardsRef = useRef(null);
  const parallaxRef = useRef(null);
  
  // Advanced timeline for coordinated animations
  const timeline = useAdvancedTimeline({
    paused: true,
    onComplete: () => console.log('Timeline complete!')
  });

  // Magnetic hover effects
  const magneticRef1 = useMagneticHover(1.5);
  const magneticRef2 = useMagneticHover(2);
  const magneticRef3 = useMagneticHover(1);

  // Parallax effects
  const parallaxBg = useParallax(0.3);
  const parallaxMid = useParallax(0.6);
  const parallaxFg = useParallax(0.9);

  // Responsive animations
  const responsiveRef = useResponsiveAnimation({
    mobile: { scale: 1, y: 0, duration: 0.3 },
    tablet: { scale: 1.05, y: -5, duration: 0.4 },
    desktop: { scale: 1.1, y: -10, duration: 0.5 }
  });

  // Breakpoint-aware animation
  const breakpointRef = useBreakpointAnimation((element, breakpoint) => {
    const configs = {
      mobile: { rotation: 0, scale: 1 },
      tablet: { rotation: 5, scale: 1.1 },
      desktop: { rotation: 10, scale: 1.2 }
    };
    
    return gsap.to(element, {
      ...configs[breakpoint],
      duration: 0.5,
      ease: "power2.out"
    });
  });

  useEffect(() => {
    if (!timeline || !containerRef.current) return;

    // Create entrance sequence
    timeline
      .createEntranceSequence([
        heroRef.current,
        cardsRef.current?.children
      ].filter(Boolean))
      .createScrollSequence(containerRef.current, [
        cardsRef.current?.children
      ].filter(Boolean));

    // Create optimized scroll animations
    const scrollAnimation = createOptimizedScrollAnimation(
      cardsRef.current?.children || [],
      { duration: 0.8, stagger: 0.1 }
    );

    // Play timeline
    timeline.play();

    return () => {
      timeline.kill();
      if (scrollAnimation) {
        scrollAnimation.forEach(anim => anim.kill());
      }
    };
  }, [timeline]);

  const showcaseItems = [
    {
      icon: Sparkles,
      title: 'Timeline Coordination',
      description: 'Synchronized animations with perfect timing',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Zap,
      title: 'ScrollTrigger Magic',
      description: 'Viewport-based animations that respond to scroll',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Star,
      title: 'Responsive Breakpoints',
      description: 'Animations that adapt to screen size',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: Heart,
      title: 'Magnetic Interactions',
      description: 'Elements that follow your cursor',
      color: 'from-red-500 to-rose-500'
    },
    {
      icon: Rocket,
      title: 'Parallax Effects',
      description: 'Depth and dimension through layered motion',
      color: 'from-orange-500 to-amber-500'
    },
    {
      icon: Award,
      title: 'Performance Optimized',
      description: 'Smooth 60fps animations with reduced motion support',
      color: 'from-indigo-500 to-purple-500'
    }
  ];

  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-hidden">
      {/* Parallax Background Layers */}
      <div ref={parallaxBg} className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-20 w-32 h-32 bg-blue-400 rounded-full blur-xl"></div>
        <div className="absolute top-40 right-32 w-24 h-24 bg-purple-400 rounded-full blur-lg"></div>
        <div className="absolute bottom-32 left-1/3 w-40 h-40 bg-pink-400 rounded-full blur-2xl"></div>
      </div>

      <div ref={parallaxMid} className="absolute inset-0 opacity-10">
        <div className="absolute top-32 right-20 w-16 h-16 bg-green-400 rounded-full blur-md"></div>
        <div className="absolute bottom-20 right-1/4 w-20 h-20 bg-yellow-400 rounded-full blur-lg"></div>
      </div>

      {/* Hero Section */}
      <div ref={heroRef} className="relative z-10 container mx-auto px-6 pt-20 pb-16">
        <div className="text-center">
          <motion.div
            ref={responsiveRef}
            className="inline-block mb-6"
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          >
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <Layers className="w-10 h-10 text-white" />
            </div>
          </motion.div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Advanced GSAP
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Experience the power of coordinated animations, responsive breakpoints, and performance optimization
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <motion.button
              ref={magneticRef1}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-shadow duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Start Animation
            </motion.button>
            
            <motion.button
              ref={magneticRef2}
              className="px-8 py-4 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-2xl font-semibold border-2 border-gray-200 dark:border-gray-600 shadow-lg hover:shadow-xl transition-shadow duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Learn More
            </motion.button>
          </div>
        </div>
      </div>

      {/* Showcase Cards */}
      <div ref={cardsRef} className="relative z-10 container mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {showcaseItems.map((item, index) => (
            <motion.div
              key={item.title}
              ref={index === 0 ? breakpointRef : null}
              className="group relative"
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <div className="relative p-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
                
                {/* Floating Icon */}
                <motion.div
                  ref={index === 1 ? magneticRef3 : null}
                  className={`relative w-16 h-16 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                  whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  <item.icon className="w-8 h-8 text-white" />
                </motion.div>
                
                {/* Content */}
                <div className="relative">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {item.description}
                  </p>
                </div>
                
                {/* Animated Border */}
                <div className="absolute inset-0 rounded-3xl border-2 border-transparent group-hover:border-gradient-to-r group-hover:from-blue-500 group-hover:to-purple-500 transition-all duration-300"></div>
                
                {/* Hover Glow */}
                <div className={`absolute -inset-1 bg-gradient-to-r ${item.color} rounded-3xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-500 -z-10`}></div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Parallax Foreground */}
      <div ref={parallaxFg} className="absolute inset-0 pointer-events-none opacity-5">
        <div className="absolute top-1/4 left-10 w-8 h-8 bg-blue-500 rounded-full"></div>
        <div className="absolute top-1/2 right-16 w-6 h-6 bg-purple-500 rounded-full"></div>
        <div className="absolute bottom-1/4 left-1/2 w-10 h-10 bg-pink-500 rounded-full"></div>
      </div>
    </div>
  );
};

export default AdvancedAnimationShowcase;
