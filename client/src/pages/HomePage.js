import React from 'react';
import { Search, Shield, Users, BarChart3, BookOpen, MessageCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import TrendingArticles from '../components/TrendingArticles';
import AnimatedStats from '../components/AnimatedStats';
import { ActionCard, FeatureCard } from '../components/ui/StandardCard';
import { ResponsiveContainer, Section } from '../components/ui/ResponsiveLayout';
import EnhancedHeroSection from '../components/hero/EnhancedHeroSection';
import ScrollTriggeredSection, { AnimatedCards } from '../components/animations/ScrollTriggeredSection';
import FloatingActionMenu from '../components/ui/FloatingActionMenu';
import PageTransition from '../components/transitions/PageTransition';

const HomePage = () => {
  const { user } = useAuth();
  const features = [
    {
      icon: Search,
      title: 'Kiểm Tra Link',
      description: 'Kiểm tra ngay độ tin cậy của bài viết tin tức và nguồn thông tin với hệ thống xác minh tiên tiến.'
    },
    {
      icon: Shield,
      title: 'Nguồn Đáng Tin',
      description: 'Nhận thông tin từ các tổ chức báo chí uy tín và các tổ chức kiểm chứng sự thật để đảm bảo độ chính xác.'
    },
    {
      icon: BarChart3,
      title: 'Chấm Điểm Tin Cậy',
      description: 'Nhận điểm số độ tin cậy chi tiết và phân tích để giúp bạn đưa ra quyết định thông tin chính xác.'
    },
    {
      icon: Users,
      title: 'Cộng Đồng',
      description: 'Tham gia cộng đồng kiểm chứng sự thật và cùng nhau chống lại thông tin sai lệch.'
    }
  ];

  return (
    <PageTransition>
      {/* Enhanced Hero Section */}
      <EnhancedHeroSection />

      {/* Floating Action Menu */}
      <FloatingActionMenu />
      {/* Trending Articles Section */}
      <Section className="py-16 bg-white dark:bg-gray-900">
        <ResponsiveContainer size="lg">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <h2 className="text-3xl md:text-4xl font-bold mb-8 text-gray-900 dark:text-white">
                Hoạt động cộng đồng
              </h2>
              <ScrollTriggeredSection
                animation="popIn"
                stagger={0.2}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                <ActionCard
                  icon={Users}
                  title="Cộng đồng kiểm tin"
                  description="Tham gia cùng cộng đồng đánh giá và xác minh thông tin"
                  color="blue"
                  onClick={() => window.location.href = '/community'}
                />
                
                <ActionCard
                  icon={BookOpen}
                  title="Kiến thức nền"
                  description="Học cách nhận biết và kiểm tra thông tin sai lệch"
                  color="green"
                  onClick={() => window.location.href = '/knowledge'}
                />

                <ActionCard
                  icon={MessageCircle}
                  title="Trợ lý AI"
                  description="Hỏi đáp với AI về cách kiểm tra thông tin"
                  color="purple"
                  onClick={() => window.location.href = '/chat'}
                />

                <ActionCard
                  icon={Search}
                  title="Gửi bài viết"
                  description="Chia sẻ bài viết để cộng đồng cùng đánh giá"
                  color="orange"
                  onClick={() => window.location.href = '/submit'}
                />
              </ScrollTriggeredSection>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <TrendingArticles />
            </div>
          </div>
        </ResponsiveContainer>
      </Section>

      {/* Animated Statistics Section */}
      <AnimatedStats />      {/* Features Section */}
      <Section className="py-16 bg-gray-50 dark:bg-gray-800">
        <ResponsiveContainer size="lg">
          <ScrollTriggeredSection animation="scaleIn" stagger={0.15}>
            <h2 className="text-center text-3xl md:text-4xl font-bold mb-12 text-gray-900 dark:text-white">
              Tại Sao Chọn FactCheck?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature) => (
                <FeatureCard
                  key={feature.title}
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                  color="blue"
                />
              ))}
            </div>
          </ScrollTriggeredSection>
        </ResponsiveContainer>
      </Section>
    </PageTransition>
  );
};

export default HomePage;
