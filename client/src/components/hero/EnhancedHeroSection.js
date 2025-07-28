import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search, Shield, Sparkles, Zap } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useAuth } from '../../context/AuthContext';

gsap.registerPlugin(ScrollTrigger);

const EnhancedHeroSection = () => {
  const { user } = useAuth();
  const heroRef = useRef();
  const titleRef = useRef();
  const subtitleRef = useRef();
  const buttonsRef = useRef();
  const particlesRef = useRef();
  const backgroundRef = useRef();

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Check for reduced motion
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      
      if (prefersReducedMotion) {
        gsap.set([titleRef.current, subtitleRef.current, buttonsRef.current], { opacity: 1 });
        return;
      }

      // Master timeline
      const masterTl = gsap.timeline({ delay: 0.5 });

      // Background gradient animation
      masterTl.fromTo(backgroundRef.current, {
        background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)"
      }, {
        background: "linear-gradient(135deg, #1e40af 0%, #7c3aed 50%, #ec4899 100%)",
        duration: 3,
        ease: "power2.inOut"
      });

      // Floating particles setup and animation
      const particles = particlesRef.current?.children;
      if (particles) {
        gsap.set(particles, { 
          opacity: 0, 
          scale: 0,
          rotation: "random(-180, 180)"
        });

        masterTl.to(particles, {
          opacity: 0.6,
          scale: 1,
          duration: 2,
          stagger: {
            amount: 1.5,
            from: "random"
          },
          ease: "back.out(1.7)"
        }, 0.5);

        // Continuous floating animation - reduced intensity
        gsap.to(particles, {
          y: "random(-15, 15)", // Reduced from -30,30
          x: "random(-10, 10)",  // Reduced from -20,20
          rotation: "random(-180, 180)", // Reduced from -360,360
          duration: "random(6, 10)", // Increased duration for slower movement
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          stagger: {
            amount: 3, // Increased stagger for more distributed timing
            from: "random"
          }
        });
      }

              // Title cinematic reveal - improved timing
        const titleWords = titleRef.current?.children;
        if (titleWords) {
          gsap.set(titleWords, {
            y: 100,
            opacity: 0,
            rotationX: 90,
            transformOrigin: "center bottom"
          });

          masterTl.to(titleWords, {
            y: 0,
            opacity: 1,
            rotationX: 0,
            duration: 1.2,
            ease: "power3.out",
            stagger: {
              amount: 0.4, // Reduced from 0.8 for faster reveal
              from: "start"
            }
          }, 1);
        }

      // Subtitle scale bounce with text reveal
      if (subtitleRef.current) {
        gsap.set(subtitleRef.current, {
          scale: 0.8,
          opacity: 0,
          y: 50
        });

        masterTl.to(subtitleRef.current, {
          scale: 1,
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "back.out(1.7)"
        }, 2);
      }

      // Buttons magnetic entrance
      const buttons = buttonsRef.current?.children;
      if (buttons) {
        gsap.set(buttons, {
          y: 80,
          opacity: 0,
          scale: 0.8,
          rotation: "random(-10, 10)"
        });

        masterTl.to(buttons, {
          y: 0,
          opacity: 1,
          scale: 1,
          rotation: 0,
          duration: 0.8,
          ease: "back.out(1.7)",
          stagger: {
            amount: 0.4,
            from: "center"
          }
        }, 2.5);

        // Add hover animations for buttons
        Array.from(buttons).forEach(button => {
          const hoverTl = gsap.timeline({ paused: true });
          
          hoverTl.to(button, {
            scale: 1.05,
            y: -5,
            duration: 0.3,
            ease: "power2.out"
          });

          button.addEventListener('mouseenter', () => hoverTl.play());
          button.addEventListener('mouseleave', () => hoverTl.reverse());
        });
      }

      // Scroll indicator animation
      const scrollIndicator = heroRef.current?.querySelector('.scroll-indicator');
      if (scrollIndicator) {
        gsap.fromTo(scrollIndicator, {
          opacity: 0,
          y: 20
        }, {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power2.out",
          delay: 3.5
        });

        gsap.to(scrollIndicator, {
          y: 10,
          duration: 1.5,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true
        });
      }

      // Parallax effect on scroll
      ScrollTrigger.create({
        trigger: heroRef.current,
        start: "top top",
        end: "bottom top",
        scrub: 1,
        onUpdate: (self) => {
          const progress = self.progress;
          gsap.to(titleRef.current, {
            y: progress * 100,
            opacity: 1 - progress * 0.5,
            duration: 0.3
          });
          gsap.to(particlesRef.current, {
            y: progress * 150,
            opacity: 1 - progress,
            duration: 0.3
          });
        }
      });

    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative overflow-hidden h-[70vh] min-h-[600px] max-h-[800px] flex items-center justify-center"
    >
      {/* Animated Background */}
      <div
        ref={backgroundRef}
        className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600"
      />

      {/* Floating Particles */}
      <div ref={particlesRef} className="absolute inset-0 pointer-events-none">
        {/* Large particles */}
        <div className="absolute top-20 left-10 w-6 h-6 bg-white/20 rounded-full backdrop-blur-sm">
          <Sparkles className="w-full h-full text-white/40" />
        </div>
        <div className="absolute top-40 right-20 w-8 h-8 bg-white/15 rounded-full backdrop-blur-sm">
          <Zap className="w-full h-full text-white/30" />
        </div>
        <div className="absolute top-60 left-1/4 w-4 h-4 bg-white/30 rounded-full backdrop-blur-sm" />
        <div className="absolute bottom-40 right-10 w-10 h-10 bg-white/10 rounded-full backdrop-blur-sm">
          <Shield className="w-full h-full text-white/20" />
        </div>
        <div className="absolute bottom-60 left-20 w-3 h-3 bg-white/25 rounded-full backdrop-blur-sm" />
        <div className="absolute top-32 right-1/3 w-5 h-5 bg-white/20 rounded-full backdrop-blur-sm" />
        <div className="absolute bottom-32 left-1/3 w-7 h-7 bg-white/15 rounded-full backdrop-blur-sm" />
        
        {/* Small particles - reduced for better performance */}
        {Array.from({ length: 12 }, (_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white/15 rounded-full"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
        {/* Title */}
        <div ref={titleRef} className="mb-6">
          <div className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
            <span className="inline-block">Chống</span>
          </div>
          <div className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
            <span className="inline-block bg-gradient-to-r from-yellow-300 via-orange-300 to-pink-300 bg-clip-text text-transparent">
              Thông Tin
            </span>
          </div>
          <div className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
            <span className="inline-block">Sai Lệch</span>
          </div>
          <div className="mt-3 text-2xl md:text-3xl lg:text-4xl font-light tracking-wider opacity-90">
            <span className="inline-block">với FactCheck</span>
          </div>
        </div>

        {/* Subtitle */}
        <div ref={subtitleRef} className="mb-8 max-w-3xl mx-auto">
          <p className="text-lg md:text-xl lg:text-2xl mb-4 opacity-90 font-light leading-relaxed">
            Xác minh độ tin cậy của tin tức và nguồn thông tin ngay lập tức
          </p>
          <p className="text-base md:text-lg lg:text-xl opacity-75 leading-relaxed">
            Tham gia cuộc chiến chống tin giả với công nghệ AI tiên tiến
          </p>
        </div>

        {/* Action Buttons */}
        <div ref={buttonsRef} className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            to="/check"
            className="group relative px-8 py-4 bg-white text-blue-600 rounded-xl font-bold text-lg hover:bg-gray-50 transition-all duration-300 flex items-center gap-3 shadow-xl hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-blue-300/50 min-w-[200px] justify-center"
            data-animate="cta"
          >
            <Search size={24} className="group-hover:rotate-12 transition-transform duration-300" />
            <span>Kiểm Tra Ngay</span>
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
          </Link>

          {user ? (
            <Link
              to="/dashboard"
              className="group relative px-8 py-4 bg-transparent border-2 border-white text-white rounded-xl font-bold text-lg hover:bg-white hover:text-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl min-w-[200px] justify-center flex items-center gap-3"
              data-animate="cta"
            >
              <Shield size={24} />
              <span>Xem Dashboard</span>
              <div className="absolute inset-0 rounded-xl bg-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
            </Link>
          ) : (
            <Link
              to="/register"
              className="group relative px-8 py-4 bg-transparent border-2 border-white text-white rounded-xl font-bold text-lg hover:bg-white hover:text-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl min-w-[200px] justify-center flex items-center gap-3"
              data-animate="cta"
            >
              <Sparkles size={24} />
              <span>Đăng Ký Miễn Phí</span>
              <div className="absolute inset-0 rounded-xl bg-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
            </Link>
          )}
        </div>

        {/* Scroll Indicator */}
        <div className="scroll-indicator absolute bottom-6 left-1/2 transform -translate-x-1/2">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center relative">
            <div className="w-1 h-3 bg-white/70 rounded-full mt-2 animate-pulse" />
            <div className="absolute -bottom-6 text-white/70 text-xs font-medium">
              Cuộn xuống
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

EnhancedHeroSection.isUserLoggedIn = () => {
  const { user } = useAuth();
  return !!user; // Returns true if user exists, otherwise false
};

export default EnhancedHeroSection;
