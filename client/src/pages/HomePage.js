import React, { useRef } from 'react';
import { Search, Shield, Users, BarChart3, BookOpen, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import TrendingArticles from '../components/TrendingArticles';
import AnimatedStats from '../components/AnimatedStats';
import CommunityPreview from '../components/CommunityPreview';
import LatestNews from '../components/LatestNews';
import { ActionCard } from '../components/ui/StandardCard';
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

  // Enhanced features with new icons and descriptions
  const features = [
    {
      icon: Search,
      title: 'Kiểm Tra Link',
      description: 'Kiểm tra ngay độ tin cậy của bài viết tin tức và nguồn thông tin với hệ thống xác minh tiên tiến.',
      color: 'blue',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Shield,
      title: 'Nguồn Đáng Tin',
      description: 'Nhận thông tin từ các tổ chức báo chí uy tín và các tổ chức kiểm chứng sự thật để đảm bảo độ chính xác.',
      color: 'green',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      icon: BarChart3,
      title: 'Chấm Điểm Tin Cậy',
      description: 'Nhận điểm số độ tin cậy chi tiết và phân tích để giúp bạn đưa ra quyết định thông tin chính xác.',
      color: 'purple',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      icon: Users,
      title: 'Cộng Đồng',
      description: 'Tham gia cộng đồng kiểm chứng sự thật và cùng nhau chống lại thông tin sai lệch.',
      color: 'orange',
      gradient: 'from-orange-500 to-red-500'
    }
  ];

  // Optimized lightweight animations
  useGSAP(() => {
    if (!containerRef.current) return;

    // Simple feature animation - no complex transforms
    const featureElements = featuresRef.current?.children;
    if (featureElements && featureElements.length > 0) {
      gsap.set(featureElements, { opacity: 1, y: 0 }); // Visible immediately

      ScrollTrigger.create({
        trigger: featuresRef.current,
        start: "top 90%",
        once: true,
        onEnter: () => {
          gsap.fromTo(featureElements,
            { opacity: 0.8 },
            {
              opacity: 1,
              duration: 0.4,
              ease: "none",
              stagger: 0.1
            }
          );
        }
      });
    }

    // Simple CTA animation
    if (ctaRef.current) {
      gsap.set(ctaRef.current, { opacity: 1, y: 0 }); // Visible immediately

      ScrollTrigger.create({
        trigger: ctaRef.current,
        start: "top 95%",
        once: true,
        onEnter: () => {
          gsap.fromTo(ctaRef.current,
            { opacity: 0.8 },
            {
              opacity: 1,
              duration: 0.3,
              ease: "none"
            }
          );
        }
      });
    }

  }, []);

  return (
    <PageTransition>
      <div ref={containerRef}>


      {/* Enhanced Hero Section */}
      <EnhancedHeroSection />

      {/* Main Content Section - Modern Layout */}
      <Section className="py-20 bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <ResponsiveContainer size="xl">
          {/* Section Header */}
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Main Action Cards - Redesigned */}
            <div className="lg:col-span-8">
              <ScrollTriggeredSection
                animation="popIn"
                stagger={0.15}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {/* Primary Card - Larger */}
                <div className="md:col-span-2">
                  <div className="card-hover floating-card stagger-1 group">
                    <div className="relative p-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl shadow-2xl border border-blue-200 dark:border-blue-800 overflow-hidden">
                      {/* Background Pattern */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>

                      <div className="relative flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-4">
                            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                              <MessageCircle className="w-8 h-8 text-white" />
                            </div>
                            <div>
                              <h3 className="text-2xl font-bold text-white mb-1">Trợ lý AI</h3>
                              <p className="text-blue-100 text-sm">Powered by Gemini</p>
                            </div>
                          </div>
                          <p className="text-white/90 text-lg leading-relaxed mb-6">
                            Hỏi đáp với AI về cách kiểm tra thông tin sử dụng công nghệ Gemini tiên tiến
                          </p>
                          <button
                            onClick={() => window.location.href = '/chat'}
                            className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl font-semibold transition-all duration-300 backdrop-blur-sm border border-white/20"
                          >
                            Bắt đầu chat →
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Secondary Cards */}
                <div className="card-hover floating-card stagger-2">
                  <div className="relative p-6 bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-blue-900/20 dark:via-gray-800 dark:to-blue-800/20 rounded-2xl shadow-xl border border-blue-200 dark:border-blue-700/50 h-full group hover:shadow-2xl transition-all duration-300 overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent"></div>
                    <div className="absolute top-0 right-0 w-20 h-20 bg-blue-400/10 rounded-full -translate-y-10 translate-x-10"></div>

                    <div className="relative">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                          <Users className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Cộng đồng</h3>
                          <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">1,234+ thành viên</p>
                        </div>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                        Tham gia cộng đồng đánh giá và xác minh thông tin với hệ thống voting thông minh
                      </p>
                      <button
                        onClick={() => window.location.href = '/community'}
                        className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-semibold rounded-lg transition-all duration-300 border border-blue-200 dark:border-blue-600/50"
                      >
                        Tham gia →
                      </button>
                    </div>
                  </div>
                </div>

                <div className="card-hover floating-card stagger-3">
                  <div className="relative p-6 bg-gradient-to-br from-green-50 via-white to-emerald-100 dark:from-green-900/20 dark:via-gray-800 dark:to-emerald-800/20 rounded-2xl shadow-xl border border-green-200 dark:border-green-700/50 h-full group hover:shadow-2xl transition-all duration-300 overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent"></div>
                    <div className="absolute top-0 right-0 w-20 h-20 bg-green-400/10 rounded-full -translate-y-10 translate-x-10"></div>

                    <div className="relative">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                          <BookOpen className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">Kiến thức</h3>
                          <p className="text-sm text-green-600 dark:text-green-400 font-medium">50+ bài học</p>
                        </div>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                        Học cách nhận biết và kiểm tra thông tin sai lệch qua các khóa học chuyên sâu
                      </p>
                      <button
                        onClick={() => window.location.href = '/knowledge'}
                        className="px-4 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-400 font-semibold rounded-lg transition-all duration-300 border border-green-200 dark:border-green-600/50"
                      >
                        Học ngay →
                      </button>
                    </div>
                  </div>
                </div>

                <div className="card-hover floating-card stagger-4">
                  <div className="relative p-6 bg-gradient-to-br from-orange-50 via-white to-amber-100 dark:from-orange-900/20 dark:via-gray-800 dark:to-amber-800/20 rounded-2xl shadow-xl border border-orange-200 dark:border-orange-700/50 h-full group hover:shadow-2xl transition-all duration-300 overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent"></div>
                    <div className="absolute top-0 right-0 w-20 h-20 bg-orange-400/10 rounded-full -translate-y-10 translate-x-10"></div>

                    <div className="relative">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
                          <Search className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">Kiểm tra</h3>
                          <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">Phân tích ngay</p>
                        </div>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                        Chia sẻ bài viết để cộng đồng cùng đánh giá với hệ thống phân tích đa chiều
                      </p>
                      <button
                        onClick={() => window.location.href = '/submit'}
                        className="px-4 py-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 font-semibold rounded-lg transition-all duration-300 border border-orange-200 dark:border-orange-600/50"
                      >
                        Gửi ngay →
                      </button>
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
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <TrendingArticles />
                </div>
              </ScrollTriggeredSection>
            </div>
          </div>
        </ResponsiveContainer>
      </Section>      {/* Animated Statistics Section */}
      <ScrollTriggeredSection
        animation="scaleIn"
        stagger={0.2}
        trigger="top 85%"
      >
        <AnimatedStats />
      </ScrollTriggeredSection>

      {/* Additional Content Cards Section */}
      <Section className="py-20 bg-gradient-to-br from-white via-gray-50 to-blue-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800">
        <ResponsiveContainer size="xl">
          <div className="text-center mb-16">
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

          <div
            className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-stretch"
            style={{ minHeight: '600px' }}
          >
            {/* Community Preview - Left Side */}
            <motion.div
              className="w-full flex"
              initial={{ opacity: 1, x: 0 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              viewport={{ once: true, margin: "-100px" }}
              whileHover={{ y: -2 }}
            >
              <div className="w-full">
                <CommunityPreview />
              </div>
            </motion.div>

            {/* Latest News - Right Side */}
            <motion.div
              className="w-full flex"
              initial={{ opacity: 1, x: 0 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              viewport={{ once: true, margin: "-100px" }}
              whileHover={{ y: -2 }}
            >
              <div className="w-full">
                <LatestNews />
              </div>
            </motion.div>
          </div>
        </ResponsiveContainer>
      </Section>

      {/* Features Section - Enterprise Design */}
      <Section className="py-16 bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800">
        <ResponsiveContainer size="xl">
          <ScrollTriggeredSection animation="fadeInUp" stagger={0.1} trigger="top 90%">
            {/* Section Header */}
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
                Tại Sao Chọn FactCheck?
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
                Nền tảng kiểm chứng thông tin hàng đầu với công nghệ AI tiên tiến và cộng đồng chuyên gia
              </p>
            </div>

            {/* Features Grid */}
            <div ref={featuresRef} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 lg:gap-10">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  className="group relative"
                  whileHover={{ y: -8, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <div className="relative p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {/* Gradient Background */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>

                    {/* Icon */}
                    <div className={`relative w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className="w-8 h-8 text-white" />
                    </div>

                    {/* Content */}
                    <div className="relative">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>

                    {/* Hover Effect */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Enhanced Call to Action */}
            <div ref={ctaRef} className="text-center mt-16">
              <motion.div
                className="relative inline-block"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <div className="relative px-12 py-8 bg-gradient-to-br from-white via-blue-50 to-purple-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-700 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-600 overflow-hidden">
                  {/* Background Pattern */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10"></div>

                  {/* Floating Elements */}
                  <div className="absolute top-4 left-4 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <div className="absolute top-8 right-6 w-1 h-1 bg-purple-400 rounded-full animate-pulse delay-300"></div>
                  <div className="absolute bottom-6 left-8 w-1.5 h-1.5 bg-pink-400 rounded-full animate-pulse delay-700"></div>

                  <div className="relative flex flex-col sm:flex-row items-center gap-6">
                    <div className="text-center sm:text-left">
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Sẵn sàng bắt đầu?
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        Tham gia cộng đồng kiểm chứng thông tin ngay hôm nay
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <motion.button
                        onClick={() => window.location.href = '/check'}
                        className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl relative overflow-hidden group"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <span className="relative z-10">Kiểm tra ngay</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </motion.button>

                      <motion.button
                        onClick={() => window.location.href = '/community'}
                        className="px-8 py-4 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-2xl font-semibold border-2 border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 transition-all duration-300 shadow-md hover:shadow-lg"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Tham gia cộng đồng
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </ScrollTriggeredSection>
        </ResponsiveContainer>
      </Section>
      </div>
    </PageTransition>
  );
};

export default HomePage;
