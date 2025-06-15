import React, { useRef } from 'react';
import { Search, Shield, Users, BarChart3, BookOpen, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import TrendingArticles from '../components/TrendingArticles';
import AnimatedStats from '../components/AnimatedStats';
import { ActionCard } from '../components/ui/StandardCard';
import { ResponsiveContainer, Section } from '../components/ui/ResponsiveLayout';
import EnhancedHeroSection from '../components/hero/EnhancedHeroSection';
import ScrollTriggeredSection from '../components/animations/ScrollTriggeredSection';
import PageTransition from '../components/transitions/PageTransition';

import { gsap } from '../utils/gsap';
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

  // GSAP animations
  useGSAP(() => {
    if (!containerRef.current) return;

    // Animate features on scroll
    gsap.fromTo(featuresRef.current?.children || [],
      { y: 60, opacity: 0, scale: 0.9 },
      {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.8,
        stagger: 0.2,
        ease: "power3.out",
        scrollTrigger: {
          trigger: featuresRef.current,
          start: "top 80%",
          end: "bottom 20%",
          toggleActions: "play none none reverse"
        }
      }
    );

    // Animate CTA section
    gsap.fromTo(ctaRef.current,
      { y: 40, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.6,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ctaRef.current,
          start: "top 85%",
          toggleActions: "play none none reverse"
        }
      }
    );

  }, []);

  return (
    <PageTransition>
      <div ref={containerRef}>


      {/* Enhanced Hero Section */}
      <EnhancedHeroSection />

      {/* Main Content Section - Enterprise Layout */}
      <Section className="py-16 bg-white dark:bg-gray-900">
        <ResponsiveContainer size="xl">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
              Hoạt động cộng đồng
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Tham gia vào hệ sinh thái kiểm chứng thông tin toàn diện với các công cụ và tính năng tiên tiến
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 lg:gap-12">
            {/* Main Action Cards */}
            <div className="xl:col-span-3">
              <ScrollTriggeredSection
                animation="popIn"
                stagger={0.15}
                className="grid grid-cols-1 md:grid-cols-2 gap-8 auto-rows-fr"
              >
                <ActionCard
                  icon={Users}
                  title="Cộng đồng kiểm tin"
                  description="Tham gia cùng cộng đồng đánh giá và xác minh thông tin với hệ thống voting thông minh. Kết nối với hàng nghìn người dùng để cùng nhau xác minh độ tin cậy của các thông tin trên mạng."
                  color="blue"
                  onClick={() => window.location.href = '/community'}
                >
                  <div className="flex items-center gap-2 text-sm text-white/80">
                    <Users size={16} />
                    <span>1,234+ thành viên</span>
                  </div>
                </ActionCard>

                <ActionCard
                  icon={BookOpen}
                  title="Kiến thức nền"
                  description="Học cách nhận biết và kiểm tra thông tin sai lệch qua các khóa học chuyên sâu. Nâng cao kỹ năng phân tích và đánh giá nguồn tin một cách khoa học."
                  color="green"
                  onClick={() => window.location.href = '/knowledge'}
                >
                  <div className="flex items-center gap-2 text-sm text-white/80">
                    <BookOpen size={16} />
                    <span>50+ bài học</span>
                  </div>
                </ActionCard>

                <ActionCard
                  icon={MessageCircle}
                  title="Trợ lý AI"
                  description="Hỏi đáp với AI về cách kiểm tra thông tin sử dụng công nghệ Gemini tiên tiến. Nhận được phân tích chi tiết và lời khuyên từ trí tuệ nhân tạo."
                  color="purple"
                  onClick={() => window.location.href = '/chat'}
                >
                  <div className="flex items-center gap-2 text-sm text-white/80">
                    <MessageCircle size={16} />
                    <span>Powered by Gemini</span>
                  </div>
                </ActionCard>

                <ActionCard
                  icon={Search}
                  title="Gửi bài viết"
                  description="Chia sẻ bài viết để cộng đồng cùng đánh giá với hệ thống phân tích đa chiều. Góp phần xây dựng cơ sở dữ liệu thông tin đáng tin cậy."
                  color="orange"
                  onClick={() => window.location.href = '/submit'}
                >
                  <div className="flex items-center gap-2 text-sm text-white/80">
                    <Search size={16} />
                    <span>Kiểm tra ngay</span>
                  </div>
                </ActionCard>
              </ScrollTriggeredSection>
            </div>

            {/* Enhanced Sidebar */}
            <div className="xl:col-span-1">
              <div className="sticky top-8">
                <TrendingArticles />
              </div>
            </div>
          </div>
        </ResponsiveContainer>
      </Section>

      {/* Animated Statistics Section */}
      <AnimatedStats />

      {/* Features Section - Enterprise Design */}
      <Section className="py-16 bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800">
        <ResponsiveContainer size="xl">
          <ScrollTriggeredSection animation="scaleIn" stagger={0.1}>
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
