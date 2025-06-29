import React, { useRef } from 'react';
import { Search, Shield, Users, BarChart3, BookOpen, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import TrendingArticles from '../components/TrendingArticles';
import AnimatedStats from '../components/AnimatedStats';
import CommunityPreview from '../components/CommunityPreview';
import LatestNews from '../components/LatestNews';
import { ResponsiveContainer, Section } from '../components/ui/ResponsiveLayout';
import EnhancedHeroSection from '../components/hero/EnhancedHeroSection';
import ScrollTriggeredSection from '../components/animations/ScrollTriggeredSection';
import PageTransition from '../components/transitions/PageTransition';

import { gsap, ScrollTrigger } from '../utils/gsap';
import { useGSAP } from '../hooks/useGSAP';

const HomePage = () => {
  const containerRef = useRef(null);
  const featuresRef = useRef(null);
  const ctaRef = useRef(null);

  // Unified color palette for consistency
  const designSystem = {
    primary: 'from-blue-600 to-purple-600',
    secondary: 'from-blue-500 to-cyan-500',
    success: 'from-emerald-500 to-green-600',
    warning: 'from-amber-500 to-orange-600',
    danger: 'from-red-500 to-pink-600'
  };

  // Enhanced features with consistent design system
  const features = [
    {
      icon: Search,
      title: 'Kiểm Tra Link',
      description: 'Kiểm tra ngay độ tin cậy của bài viết tin tức và nguồn thông tin với hệ thống xác minh tiên tiến.',
      gradient: designSystem.primary,
      lightBg: 'from-blue-50 via-white to-blue-100',
      darkBg: 'from-blue-900/20 via-gray-800 to-blue-800/20',
      accentColor: 'blue'
    },
    {
      icon: Shield,
      title: 'Nguồn Đáng Tin',
      description: 'Nhận thông tin từ các tổ chức báo chí uy tín và các tổ chức kiểm chứng sự thật để đảm bảo độ chính xác.',
      gradient: designSystem.success,
      lightBg: 'from-emerald-50 via-white to-green-100',
      darkBg: 'from-emerald-900/20 via-gray-800 to-green-800/20',
      accentColor: 'emerald'
    },
    {
      icon: BarChart3,
      title: 'Chấm Điểm Tin Cậy',
      description: 'Nhận điểm số độ tin cậy chi tiết và phân tích để giúp bạn đưa ra quyết định thông tin chính xác.',
      gradient: designSystem.primary,
      lightBg: 'from-purple-50 via-white to-pink-100',
      darkBg: 'from-purple-900/20 via-gray-800 to-pink-800/20',
      accentColor: 'purple'
    },
    {
      icon: Users,
      title: 'Cộng Đồng',
      description: 'Tham gia cộng đồng kiểm chứng sự thật và cùng nhau chống lại thông tin sai lệch.',
      gradient: designSystem.warning,
      lightBg: 'from-amber-50 via-white to-orange-100',
      darkBg: 'from-amber-900/20 via-gray-800 to-orange-800/20',
      accentColor: 'amber'
    }
  ];

  // Enhanced GSAP animations with better effects
  useGSAP(() => {
    if (!containerRef.current) return;

    // Improved feature animation with slide-in and bounce
    const featureElements = featuresRef.current?.children;
    if (featureElements && featureElements.length > 0) {
      // Set initial state
      gsap.set(featureElements, { 
        opacity: 0, 
        x: -60, 
        y: 30,
        scale: 0.9
      });

      ScrollTrigger.create({
        trigger: featuresRef.current,
        start: "top 85%",
        once: true,
        onEnter: () => {
          gsap.to(featureElements, {
            opacity: 1,
            x: 0,
            y: 0,
            scale: 1,
            duration: 0.8,
            ease: "power2.out",
            stagger: 0.15,
            clearProps: "all" // Clean up transforms after animation
          });

          // Add subtle bounce effect on icons
          gsap.to(featureElements, {
            delay: 0.8,
            duration: 0.6,
            ease: "elastic.out(1, 0.5)",
            stagger: 0.1,
            onComplete: function() {
              // Add hover interactions after animation
              featureElements.forEach(element => {
                const icon = element.querySelector('.feature-icon');
                if (icon) {
                  element.addEventListener('mouseenter', () => {
                    gsap.to(icon, { scale: 1.1, duration: 0.3, ease: "power2.out" });
                  });
                  element.addEventListener('mouseleave', () => {
                    gsap.to(icon, { scale: 1, duration: 0.3, ease: "power2.out" });
                  });
                }
              });
            }
          });
        }
      });
    }

    // Enhanced CTA animation with slide-up and glow effect
    if (ctaRef.current) {
      gsap.set(ctaRef.current, { 
        opacity: 0, 
        y: 40,
        scale: 0.95
      });

      ScrollTrigger.create({
        trigger: ctaRef.current,
        start: "top 90%",
        once: true,
        onEnter: () => {
          gsap.to(ctaRef.current, {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.8,
            ease: "power3.out"
          });

          // Add subtle glow effect
          const ctaButton = ctaRef.current.querySelector('.cta-primary');
          if (ctaButton) {
            gsap.to(ctaButton, {
              delay: 0.8,
              boxShadow: "0 0 30px rgba(59, 130, 246, 0.3)",
              duration: 1.5,
              ease: "power2.inOut",
              yoyo: true,
              repeat: 1
            });
          }
        }
      });
    }

  }, []);

  return (
    <PageTransition>
      <div ref={containerRef} className="font-inter">
        {/* Enhanced Hero Section */}
        <EnhancedHeroSection />

        {/* Main Content Section - Improved Design */}
        <Section className="py-24 bg-gradient-to-br from-gray-50 via-white to-blue-50/50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <ResponsiveContainer size="xl">
            {/* Section Header */}
            <div className="text-center mb-20">
              <motion.h2
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight"
              >
                Khám phá tính năng
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed"
              >
                Tham gia vào hệ sinh thái kiểm chứng thông tin toàn diện với các công cụ và tính năng tiên tiến
              </motion.p>
            </div>

            {/* Modern Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">
              {/* Main Action Cards - Redesigned */}
              <div className="lg:col-span-8">
                <ScrollTriggeredSection
                  animation="popIn"
                  stagger={0.15}
                  className="grid grid-cols-1 md:grid-cols-2 gap-8"
                >
                  {/* Primary Card - AI Assistant */}
                  <div className="md:col-span-2">
                    <div className="group">
                      <div className="relative p-8 bg-gradient-to-br from-blue-600 to-purple-700 rounded-3xl shadow-lg hover:shadow-xl border border-blue-200/20 dark:border-blue-800/30 overflow-hidden transition-all duration-300">
                        {/* Subtle Background Pattern */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>

                        <div className="relative flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-6">
                              <div className="w-16 h-16 bg-white/15 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                                <MessageCircle className="w-8 h-8 text-white" />
                              </div>
                              <div>
                                <h3 className="text-2xl font-bold text-white mb-1">Trợ lý AI</h3>
                                <p className="text-blue-100 text-sm font-medium">Powered by Gemini</p>
                              </div>
                            </div>
                            <p className="text-white/90 text-lg leading-relaxed mb-8">
                              Hỏi đáp với AI về cách kiểm tra thông tin sử dụng công nghệ Gemini tiên tiến
                            </p>
                            <button
                              onClick={() => window.location.href = '/chat'}
                              className="px-8 py-4 bg-white/15 hover:bg-white/25 text-white rounded-xl font-semibold transition-all duration-300 backdrop-blur-sm border border-white/20 hover:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/30"
                            >
                              Bắt đầu chat →
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Secondary Cards - Improved Design */}
                  <div className="group">
                    <div className={`relative p-6 bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-blue-900/20 dark:via-gray-800 dark:to-blue-800/20 rounded-2xl shadow-md hover:shadow-lg border border-blue-200/60 dark:border-blue-700/50 h-full transition-all duration-300 overflow-hidden`}>
                      {/* Subtle Background Pattern */}
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/3 to-transparent"></div>
                      <div className="absolute top-0 right-0 w-20 h-20 bg-blue-400/8 rounded-full -translate-y-10 translate-x-10"></div>

                      <div className="relative">
                        <div className="flex items-center gap-3 mb-6">
                          <div className={`feature-icon w-12 h-12 bg-gradient-to-br ${designSystem.secondary} rounded-xl flex items-center justify-center shadow-md`}>
                            <Users className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Cộng đồng</h3>
                            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">1,234+ thành viên</p>
                          </div>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                          Tham gia cộng đồng đánh giá và xác minh thông tin với hệ thống voting thông minh
                        </p>
                        <button
                          onClick={() => window.location.href = '/community'}
                          className="px-6 py-3 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-semibold rounded-lg transition-all duration-300 border border-blue-200 dark:border-blue-600/50 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                        >
                          Tham gia →
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="group">
                    <div className={`relative p-6 bg-gradient-to-br from-emerald-50 via-white to-green-100 dark:from-emerald-900/20 dark:via-gray-800 dark:to-green-800/20 rounded-2xl shadow-md hover:shadow-lg border border-emerald-200/60 dark:border-emerald-700/50 h-full transition-all duration-300 overflow-hidden`}>
                      {/* Subtle Background Pattern */}
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/3 to-transparent"></div>
                      <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-400/8 rounded-full -translate-y-10 translate-x-10"></div>

                      <div className="relative">
                        <div className="flex items-center gap-3 mb-6">
                          <div className={`feature-icon w-12 h-12 bg-gradient-to-br ${designSystem.success} rounded-xl flex items-center justify-center shadow-md`}>
                            <BookOpen className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Kiến thức</h3>
                            <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">50+ bài học</p>
                          </div>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                          Học cách nhận biết và kiểm tra thông tin sai lệch qua các khóa học chuyên sâu
                        </p>
                        <button
                          onClick={() => window.location.href = '/knowledge'}
                          className="px-6 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold rounded-lg transition-all duration-300 border border-emerald-200 dark:border-emerald-600/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                        >
                          Học ngay →
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="group md:col-span-2">
                    <div className={`relative p-6 bg-gradient-to-br from-amber-50 via-white to-orange-100 dark:from-amber-900/20 dark:via-gray-800 dark:to-orange-800/20 rounded-2xl shadow-md hover:shadow-lg border border-amber-200/60 dark:border-amber-700/50 transition-all duration-300 overflow-hidden`}>
                      {/* Subtle Background Pattern */}
                      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/3 to-transparent"></div>
                      <div className="absolute top-0 right-0 w-20 h-20 bg-amber-400/8 rounded-full -translate-y-10 translate-x-10"></div>

                      <div className="relative flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-6">
                            <div className={`feature-icon w-14 h-14 bg-gradient-to-br ${designSystem.warning} rounded-xl flex items-center justify-center shadow-md`}>
                              <Search className="w-7 h-7 text-white" />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">Kiểm tra Link</h3>
                              <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">Phân tích ngay lập tức</p>
                            </div>
                          </div>
                          <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                            Chia sẻ bài viết để cộng đồng cùng đánh giá với hệ thống phân tích đa chiều
                          </p>
                          <button
                            onClick={() => window.location.href = '/submit'}
                            className="px-8 py-4 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-semibold rounded-lg transition-all duration-300 border border-amber-200 dark:border-amber-600/50 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                          >
                            Gửi ngay →
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollTriggeredSection>
              </div>

              {/* Enhanced Sidebar */}
              <div className="lg:col-span-4">
                <ScrollTriggeredSection
                  animation="fadeInRight"
                  stagger={0.1}
                  className="sticky top-8"
                >
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <TrendingArticles />
                  </div>
                </ScrollTriggeredSection>
              </div>
            </div>
          </ResponsiveContainer>
        </Section>

        {/* Animated Statistics Section */}
        <ScrollTriggeredSection
          animation="scaleIn"
          stagger={0.2}
          trigger="top 85%"
        >
          <AnimatedStats />
        </ScrollTriggeredSection>

        {/* Additional Content Cards Section */}
        <Section className="py-24 bg-gradient-to-br from-white via-gray-50 to-blue-50/50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800">
          <ResponsiveContainer size="xl">
            <div className="text-center mb-20">
              <motion.h2
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white"
              >
                Cập nhật mới nhất
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
                className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed"
              >
                Theo dõi hoạt động cộng đồng và tin tức bảo mật mới nhất
              </motion.p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-stretch">
              {/* Community Preview */}
              <motion.div
                className="w-full"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                viewport={{ once: true, margin: "-100px" }}
                whileHover={{ y: -4 }}
              >
                <CommunityPreview />
              </motion.div>

              {/* Latest News */}
              <motion.div
                className="w-full"
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                viewport={{ once: true, margin: "-100px" }}
                whileHover={{ y: -4 }}
              >
                <LatestNews />
              </motion.div>
            </div>
          </ResponsiveContainer>
        </Section>

        {/* Features Section - Enhanced Design */}
        <Section className="py-24 bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800">
          <ResponsiveContainer size="xl">
            <ScrollTriggeredSection animation="fadeInUp" stagger={0.1} trigger="top 90%">
              {/* Section Header */}
              <div className="text-center mb-20">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
                  Tại Sao Chọn FactCheck?
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
                  Nền tảng kiểm chứng thông tin hàng đầu với công nghệ AI tiên tiến và cộng đồng chuyên gia
                </p>
              </div>

              {/* Features Grid */}
              <div ref={featuresRef} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 lg:gap-10 mb-20">
                {features.map((feature, index) => (
                  <div
                    key={feature.title}
                    className="group relative"
                  >
                    <div className="relative p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300">
                      {/* Gradient Background */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>

                      {/* Icon */}
                      <div className={`feature-icon relative w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-6 transition-transform duration-300`}>
                        <feature.icon className="w-8 h-8 text-white" />
                      </div>

                      {/* Content */}
                      <div className="relative">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 transition-all duration-300">
                          {feature.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                          {feature.description}
                        </p>
                      </div>

                      {/* Hover Effect */}
                      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${feature.gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`}></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Enhanced Call to Action */}
              <div ref={ctaRef} className="text-center">
                <div className="relative inline-block">
                  <div className="relative px-12 py-8 bg-gradient-to-br from-white via-blue-50/50 to-purple-50/50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-700 rounded-3xl shadow-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5"></div>

                    {/* Floating Elements */}
                    <div className="absolute top-4 left-4 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    <div className="absolute top-8 right-6 w-1 h-1 bg-purple-400 rounded-full animate-pulse delay-300"></div>
                    <div className="absolute bottom-6 left-8 w-1.5 h-1.5 bg-pink-400 rounded-full animate-pulse delay-700"></div>

                    <div className="relative flex flex-col sm:flex-row items-center gap-8">
                      <div className="text-center sm:text-left">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                          Sẵn sàng bắt đầu?
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300">
                          Tham gia cộng đồng kiểm chứng thông tin ngay hôm nay
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4">
                        <motion.button
                          onClick={() => window.location.href = '/check'}
                          className="cta-primary px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg relative overflow-hidden group focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <span className="relative z-10">Kiểm tra ngay</span>
                          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </motion.button>

                        <motion.button
                          onClick={() => window.location.href = '/community'}
                          className="px-8 py-4 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-2xl font-semibold border-2 border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 transition-all duration-300 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-500/30"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Tham gia cộng đồng
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollTriggeredSection>
          </ResponsiveContainer>
        </Section>
      </div>
    </PageTransition>
  );
};

export default HomePage;
