import React, { useEffect } from 'react';
import { 
  useFadeIn, 
  useStaggerAnimation, 
  useScrollTrigger, 
  useCounterAnimation,
  useHoverAnimation,
  useLoadingAnimation
} from '../hooks/useGSAP';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { useTheme } from '../context/ThemeContext';

const GSAPDemo = () => {
  const { isDarkMode } = useTheme();
  
  // Animation refs
  const titleRef = useFadeIn('fadeInUp', 0.2);
  const cardsContainerRef = useStaggerAnimation('staggerFadeIn', true);
  const scrollElementRef = useScrollTrigger(
    {
      from: { opacity: 0, x: -100 },
      to: { opacity: 1, x: 0, duration: 1, ease: "power3.out" }
    },
    { start: "top 80%" }
  );
  
  // Counter animations
  const [counter1Ref, startCounter1] = useCounterAnimation(150, { duration: 2 });
  const [counter2Ref, startCounter2] = useCounterAnimation(89, { duration: 1.5 });
  const [counter3Ref, startCounter3] = useCounterAnimation(1247, { duration: 2.5 });
  
  // Hover animations
  const hoverButtonRef = useHoverAnimation(
    { scale: 1.05, rotationY: 5, duration: 0.3 },
    { scale: 1, rotationY: 0, duration: 0.3 }
  );
  
  // Loading animation
  const loadingRef = useLoadingAnimation(true);
  
  // Start counter animations on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      startCounter1();
      startCounter2();
      startCounter3();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [startCounter1, startCounter2, startCounter3]);
  
  return (
    <div className={`min-h-screen p-8 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-6xl mx-auto">
        {/* Title with fade in animation */}
        <div ref={titleRef} className="text-center mb-12">
          <h1 className={`text-4xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            GSAP Animation Demo
          </h1>
          <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Demonstrating GSAP integration with React components
          </p>
        </div>
        
        {/* Stagger animation cards */}
        <div ref={cardsContainerRef} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div ref={loadingRef} className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                Loading Animation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                Smooth loading spinner using GSAP rotation
              </p>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Counter Animation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Users:</span>
                  <span ref={counter1Ref} className="font-bold text-blue-600">0</span>
                </div>
                <div className="flex justify-between">
                  <span>Score:</span>
                  <span ref={counter2Ref} className="font-bold text-green-600">0</span>
                </div>
                <div className="flex justify-between">
                  <span>Posts:</span>
                  <span ref={counter3Ref} className="font-bold text-purple-600">0</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Hover Effects</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                ref={hoverButtonRef}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                Hover Me!
              </Button>
              <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                3D hover effect with GSAP
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Scroll trigger element */}
        <div className="h-96 flex items-center justify-center">
          <div 
            ref={scrollElementRef}
            className={`p-8 rounded-lg shadow-xl ${
              isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
            }`}
          >
            <h2 className="text-2xl font-bold mb-4">Scroll Trigger Animation</h2>
            <p className="text-lg">
              This element animates when it comes into view!
            </p>
            <div className="mt-4 flex space-x-2">
              <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
              <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-4 h-4 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        </div>
        
        {/* Animation showcase */}
        <div className="mt-16 text-center">
          <h2 className={`text-2xl font-bold mb-8 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Animation Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
              <h3 className="font-semibold mb-2">Fade Animations</h3>
              <p className="text-sm opacity-75">Smooth fade in/out effects</p>
            </div>
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
              <h3 className="font-semibold mb-2">Stagger Effects</h3>
              <p className="text-sm opacity-75">Sequential element animations</p>
            </div>
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
              <h3 className="font-semibold mb-2">Scroll Triggers</h3>
              <p className="text-sm opacity-75">Viewport-based animations</p>
            </div>
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
              <h3 className="font-semibold mb-2">Counter Animations</h3>
              <p className="text-sm opacity-75">Animated number counting</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GSAPDemo;
