import React, { useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Search, Shield, Users, BarChart3, BookOpen, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { TrendingArticles, CommunityPreview, LatestNews } from '../components/features';
import AnimatedStats from '../components/animations/AnimatedStats';
import { ResponsiveContainer, Section } from '../components/ui/ResponsiveLayout';
import EnhancedHeroSection from '../components/hero/EnhancedHeroSection';
import ScrollTriggeredSection from '../components/animations/ScrollTriggeredSection';
import PageTransition from '../components/transitions/PageTransition';
import { gsap, ScrollTrigger } from '../utils/gsap';
import { useGSAP } from '../hooks/useGSAP';
//pages to be merged
import CommunityPage from './CommunityPage'; // Assuming this is the community page component
import MySubmissionsPage from './MySubmissionsPage';

const LoggedHomePage = () => {
  const containerRef = useRef(null);
  const featuresRef = useRef(null);
  const ctaRef = useRef(null);
  const { isDarkMode } = useTheme();

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
            onComplete: function () {
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
        <Section className="bg-gradient-to-br from-gray-50 via-white to-blue-50/50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <ResponsiveContainer size="full" padding='0'>
            <div className="w-full max-w-full flex flex-col items-center">
              <CommunityPage className="w-full"/>
            </div>
          </ResponsiveContainer>
        </Section>

        <Section className={`${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <ResponsiveContainer size="full" padding='0'>
            <div className="w-full flex flex-col items-center">
              <MySubmissionsPage className="w-full"/>
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
                        {/* <p className="text-gray-600 dark:text-gray-300">
                          Tham gia cộng đồng kiểm chứng thông tin ngay hôm nay
                        </p> */}
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

                        {/* <motion.button
                          onClick={() => window.location.href = '/community'}
                          className="px-8 py-4 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-2xl font-semibold border-2 border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 transition-all duration-300 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-500/30"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Tham gia cộng đồng
                        </motion.button> */}
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

export default LoggedHomePage;
