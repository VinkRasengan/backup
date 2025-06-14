import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search, Shield, Users, BarChart3, BookOpen, MessageCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import TrendingArticles from '../components/TrendingArticles';
import AnimatedStats from '../components/AnimatedStats';
import { ActionCard, FeatureCard } from '../components/ui/StandardCard';
import { ResponsiveContainer, Section, ContentLayout, ActionGridLayout, FeatureGridLayout } from '../components/ui/ResponsiveLayout';
import { useStaggerAnimation, useScrollTrigger } from '../hooks/useGSAP';
import { gsap } from '../utils/gsap';

const HomePage = () => {
  const { user } = useAuth();

  // Refs for premium animations
  const heroTitleRef = useRef();
  const heroSubtitleRef = useRef();
  const heroButtonsRef = useRef();
  const backgroundRef = useRef();
  const particlesRef = useRef();

  // GSAP animations
  const communityCardsRef = useStaggerAnimation('staggerFadeIn', true);
  const featuresRef = useScrollTrigger(
    {
      from: { opacity: 0, y: 50 },
      to: { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }
    },
    { start: "top 80%" }
  );  // Premium Hero Animation Timeline with proper cleanup
  useEffect(() => {
    if (!heroTitleRef.current || !heroSubtitleRef.current || !backgroundRef.current) return;

    // Store refs to avoid stale closure
    const titleEl = heroTitleRef.current;
    const subtitleEl = heroSubtitleRef.current;
    const backgroundEl = backgroundRef.current;
    const buttonsEl = heroButtonsRef.current;
    const particlesEl = particlesRef.current;

    const tl = gsap.timeline({ delay: 0.5 });

    // Background gradient animation
    tl.fromTo(backgroundEl,
      {
        background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)"
      },
      {
        background: "linear-gradient(135deg, #1e40af 0%, #7c3aed 50%, #ec4899 100%)",
        duration: 2,
        ease: "power2.inOut"
      }
    )

    // Title cinematic reveal - safer targeting
    if (titleEl.children.length > 0) {
      tl.fromTo(Array.from(titleEl.children),
        {
          y: 100,
          opacity: 0,
          rotationX: 90
        },
        {
          y: 0,
          opacity: 1,
          rotationX: 0,
          duration: 1.2,
          ease: "power3.out",
          stagger: 0.1
        }, "-=1.5");
    }

    // Subtitle scale bounce
    tl.fromTo(subtitleEl,
      {
        scale: 0.8,
        opacity: 0,
        y: 30
      },
      {
        scale: 1,
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "back.out(1.7)"
      }, "-=0.8");

    // Buttons magnetic entrance
    if (buttonsEl?.children) {
      tl.fromTo(Array.from(buttonsEl.children),
        {
          y: 50,
          opacity: 0,
          scale: 0.9
        },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.6,
          ease: "power2.out",
          stagger: 0.2
        }, "-=0.4");
    }

    // Floating particles animation - safer targeting
    let particlesArray = null;
    if (particlesEl?.children) {
      particlesArray = Array.from(particlesEl.children);
      gsap.to(particlesArray, {
        y: "random(-20, 20)",
        x: "random(-10, 10)",
        rotation: "random(-180, 180)",
        duration: "random(3, 6)",
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        stagger: 0.2
      });
    }

    // Cleanup function
    return () => {
      tl.kill();
      if (particlesArray) {
        gsap.killTweensOf(particlesArray);
      }
    };  }, []); // Empty dependency array to run once

  const features = [
    {
      icon: <Search size={24} />,
      title: 'Kiểm Tra Link',
      description: 'Kiểm tra ngay độ tin cậy của bài viết tin tức và nguồn thông tin với hệ thống xác minh tiên tiến.'
    },
    {
      icon: <Shield size={24} />,
      title: 'Nguồn Đáng Tin',
      description: 'Nhận thông tin từ các tổ chức báo chí uy tín và các tổ chức kiểm chứng sự thật để đảm bảo độ chính xác.'
    },
    {
      icon: <BarChart3 size={24} />,
      title: 'Chấm Điểm Tin Cậy',
      description: 'Nhận điểm số độ tin cậy chi tiết và phân tích để giúp bạn đưa ra quyết định thông tin chính xác.'
    },
    {
      icon: <Users size={24} />,
      title: 'Cộng Đồng',
      description: 'Tham gia cộng đồng kiểm chứng sự thật và cùng nhau chống lại thông tin sai lệch.'
    }
  ];

  return (
    <>
      {/* Premium Hero Section */}
      <section
        ref={backgroundRef}
        className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 text-white py-20 text-center min-h-[80vh] flex items-center z-10"
      >
        {/* Floating Particles Background */}
        <div ref={particlesRef} className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-4 h-4 bg-white/20 rounded-full"></div>
          <div className="absolute top-40 right-20 w-6 h-6 bg-white/10 rounded-full"></div>
          <div className="absolute top-60 left-1/4 w-3 h-3 bg-white/30 rounded-full"></div>
          <div className="absolute bottom-40 right-10 w-5 h-5 bg-white/15 rounded-full"></div>
          <div className="absolute bottom-60 left-20 w-2 h-2 bg-white/25 rounded-full"></div>
          <div className="absolute top-32 right-1/3 w-4 h-4 bg-white/20 rounded-full"></div>
          <div className="absolute bottom-32 left-1/3 w-3 h-3 bg-white/35 rounded-full"></div>
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>

        <div className="relative max-w-6xl mx-auto px-4 z-10">
          <div ref={heroTitleRef} className="mb-6">
            <span className="inline-block text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              Chống
            </span>
            <span className="inline-block text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight ml-4 bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
              Thông Tin
            </span>
            <span className="inline-block text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight ml-4">
              Sai Lệch
            </span>
            <div className="mt-2">
              <span className="inline-block text-2xl md:text-4xl lg:text-5xl font-light tracking-wider opacity-90">
                với FactCheck
              </span>
            </div>
          </div>

          <div ref={heroSubtitleRef} className="mb-10">
            <p className="text-xl md:text-2xl lg:text-3xl mb-4 opacity-90 font-light leading-relaxed max-w-4xl mx-auto">
              Xác minh độ tin cậy của tin tức và nguồn thông tin ngay lập tức.
            </p>
            <p className="text-lg md:text-xl opacity-75 max-w-3xl mx-auto">
              Tham gia cuộc chiến chống tin giả và thông tin sai lệch với công nghệ AI tiên tiến.
            </p>
          </div>

          <div ref={heroButtonsRef} className="flex flex-wrap gap-6 justify-center">
            <Link
              to="/check"
              className="group relative px-10 py-5 bg-white text-blue-600 rounded-2xl font-bold text-lg hover:bg-gray-50 transition-all duration-300 flex items-center gap-3 shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 hover:scale-105"
            >
              <Search size={24} className="group-hover:rotate-12 transition-transform duration-300" />
              <span>Kiểm Tra Ngay</span>
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
            </Link>
            {user ? (
              <Link
                to="/dashboard"
                className="group relative px-10 py-5 bg-transparent border-3 border-white text-white rounded-2xl font-bold text-lg hover:bg-white hover:text-blue-600 transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105"
              >
                <span>Xem Dashboard</span>
                <div className="absolute inset-0 rounded-2xl bg-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
              </Link>
            ) : (
              <Link
                to="/register"
                className="group relative px-10 py-5 bg-transparent border-3 border-white text-white rounded-2xl font-bold text-lg hover:bg-white hover:text-blue-600 transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105"
              >
                <span>Đăng Ký Miễn Phí</span>
                <div className="absolute inset-0 rounded-2xl bg-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
              </Link>
            )}
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
              <div className="w-1 h-3 bg-white/70 rounded-full mt-2 animate-pulse"></div>
            </div>
          </div>
        </div>
      </section>      {/* Trending Articles Section */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <h2 className="text-3xl md:text-4xl font-bold mb-8 text-gray-900 dark:text-white">
                Hoạt động cộng đồng
              </h2>
              <div ref={communityCardsRef} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link
                  to="/community"
                  className="group relative bg-gradient-to-br from-blue-500 to-blue-600 text-white p-8 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                      <Users className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3 group-hover:text-yellow-300 transition-colors duration-300">Cộng đồng kiểm tin</h3>
                    <p className="opacity-90 text-lg leading-relaxed">Tham gia cùng cộng đồng đánh giá và xác minh thông tin</p>
                    <div className="absolute top-4 right-4 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  </div>
                  <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                </Link>

                <Link
                  to="/knowledge"
                  className="group relative bg-gradient-to-br from-green-500 to-green-600 text-white p-8 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-green-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                      <BookOpen className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3 group-hover:text-yellow-300 transition-colors duration-300">Kiến thức nền</h3>
                    <p className="opacity-90 text-lg leading-relaxed">Học cách nhận biết và kiểm tra thông tin sai lệch</p>
                    <div className="absolute top-4 right-4 w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                  </div>
                  <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                </Link>

                <Link
                  to="/chat"
                  className="group relative bg-gradient-to-br from-purple-500 to-purple-600 text-white p-8 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                      <MessageCircle className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3 group-hover:text-yellow-300 transition-colors duration-300">Trợ lý AI</h3>
                    <p className="opacity-90 text-lg leading-relaxed">Hỏi đáp với AI về cách kiểm tra thông tin</p>
                    <div className="absolute top-4 right-4 w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                  </div>
                  <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                </Link>

                <Link
                  to="/submit"
                  className="group relative bg-gradient-to-br from-orange-500 to-orange-600 text-white p-8 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-orange-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                      <Search className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3 group-hover:text-yellow-300 transition-colors duration-300">Gửi bài viết</h3>
                    <p className="opacity-90 text-lg leading-relaxed">Chia sẻ bài viết để cộng đồng cùng đánh giá</p>
                    <div className="absolute top-4 right-4 w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                  </div>
                  <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                </Link>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <TrendingArticles />
            </div>
          </div>
        </div>
      </section>

      {/* Animated Statistics Section */}
      <AnimatedStats />      {/* Features Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div ref={featuresRef} className="max-w-6xl mx-auto px-4">
          <h2 className="text-center text-3xl md:text-4xl font-bold mb-12 text-gray-900 dark:text-white">
            Tại Sao Chọn FactCheck?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group relative bg-white dark:bg-gray-700 p-6 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 text-center overflow-hidden"
              >
                {/* Background gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                {/* Animated background circles */}
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full group-hover:scale-125 transition-transform duration-700"></div>

                <div className="relative z-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600 dark:text-blue-400 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Animated progress bar */}
                  <div className="mt-4 w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transform -translate-x-full group-hover:translate-x-0 transition-transform duration-1000 ease-out"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default HomePage;
