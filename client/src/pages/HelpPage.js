import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Mail,
  Phone,
  Book,
  Shield,
  Users,
  Zap,
  HelpCircle,
  ExternalLink,
  Star,
  ThumbsUp,
  Clock
} from 'lucide-react';
import NavigationLayout from '../components/navigation/NavigationLayout';
import { useGSAP } from '../hooks/useGSAP';
import { gsap } from '../utils/gsap';

const HelpPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const containerRef = useRef(null);

  // FAQ data
  const faqData = [
    {
      id: 1,
      category: 'general',
      question: 'FactCheck AI hoạt động như thế nào?',
      answer: 'FactCheck AI sử dụng công nghệ AI tiên tiến để phân tích và xác minh thông tin từ nhiều nguồn đáng tin cậy. Hệ thống kiểm tra nội dung, nguồn gốc và so sánh với cơ sở dữ liệu fact-checking toàn cầu.'
    },
    {
      id: 2,
      category: 'security',
      question: 'Làm thế nào để kiểm tra một link có an toàn không?',
      answer: 'Bạn có thể dán link vào ô kiểm tra trên trang chủ. Hệ thống sẽ phân tích link qua nhiều lớp bảo mật, kiểm tra malware, phishing và đánh giá độ tin cậy của nguồn.'
    },
    {
      id: 3,
      category: 'community',
      question: 'Cách tham gia cộng đồng kiểm tin?',
      answer: 'Đăng ký tài khoản và tham gia tab Cộng đồng. Bạn có thể vote cho các bài viết, bình luận, báo cáo nội dung sai lệch và chia sẻ kinh nghiệm với cộng đồng.'
    },
    {
      id: 4,
      category: 'features',
      question: 'Các tính năng chính của FactCheck AI?',
      answer: 'Kiểm tra link, phân tích nội dung, cộng đồng kiểm tin, trợ lý AI, báo cáo an toàn, thống kê xu hướng và hệ thống cảnh báo thời gian thực.'
    },
    {
      id: 5,
      category: 'general',
      question: 'FactCheck AI có miễn phí không?',
      answer: 'Có, FactCheck AI hoàn toàn miễn phí cho người dùng cá nhân. Chúng tôi cung cấp gói doanh nghiệp với tính năng nâng cao cho tổ chức.'
    },
    {
      id: 6,
      category: 'security',
      question: 'Thông tin cá nhân có được bảo mật không?',
      answer: 'Chúng tôi tuân thủ nghiêm ngặt các tiêu chuẩn bảo mật quốc tế. Thông tin cá nhân được mã hóa và không chia sẻ với bên thứ ba.'
    }
  ];

  const categories = [
    { id: 'all', name: 'Tất cả', icon: HelpCircle },
    { id: 'general', name: 'Tổng quan', icon: Book },
    { id: 'security', name: 'Bảo mật', icon: Shield },
    { id: 'community', name: 'Cộng đồng', icon: Users },
    { id: 'features', name: 'Tính năng', icon: Zap }
  ];

  const contactMethods = [
    {
      id: 'chat',
      name: 'Chat trực tiếp',
      description: 'Hỗ trợ 24/7 qua chat',
      icon: MessageCircle,
      color: 'bg-blue-500',
      action: () => console.log('Open chat')
    },
    {
      id: 'email',
      name: 'Email hỗ trợ',
      description: 'support@factcheck.ai',
      icon: Mail,
      color: 'bg-green-500',
      action: () => window.open('mailto:support@factcheck.ai')
    },
    {
      id: 'phone',
      name: 'Hotline',
      description: '1900-1234 (miễn phí)',
      icon: Phone,
      color: 'bg-purple-500',
      action: () => window.open('tel:19001234')
    }
  ];

  // GSAP animations
  useGSAP(() => {
    if (!containerRef.current) return;

    // Animate FAQ items on scroll
    gsap.fromTo('.faq-item',
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: '.faq-container',
          start: "top 80%",
          end: "bottom 20%",
          toggleActions: "play none none reverse"
        }
      }
    );

    // Animate contact cards
    gsap.fromTo('.contact-card',
      { opacity: 0, scale: 0.9 },
      {
        opacity: 1,
        scale: 1,
        duration: 0.5,
        stagger: 0.2,
        ease: "back.out(1.7)",
        scrollTrigger: {
          trigger: '.contact-section',
          start: "top 80%",
          toggleActions: "play none none reverse"
        }
      }
    );
  }, []);

  const filteredFaqs = faqData.filter(faq => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleFaq = (id) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  return (
    <NavigationLayout>
      <div ref={containerRef} className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white py-20">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Trung tâm trợ giúp
              </h1>
              <p className="text-xl mb-8 text-blue-100">
                Tìm câu trả lời cho mọi thắc mắc về FactCheck AI
              </p>

              {/* Search Bar */}
              <div className="relative max-w-2xl mx-auto">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Tìm kiếm câu hỏi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/30"
                />
              </div>
            </motion.div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-12">
          {/* Category Filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap gap-3 mb-8 justify-center"
          >
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    selectedCategory === category.id
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {category.name}
                </button>
              );
            })}
          </motion.div>

          {/* FAQ Section */}
          <div className="faq-container grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
                Câu hỏi thường gặp
              </h2>
            </div>

            {filteredFaqs.map((faq) => (
              <motion.div
                key={faq.id}
                className="faq-item bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
                layout
              >
                <button
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  <h3 className="font-semibold text-gray-900 dark:text-white pr-4">
                    {faq.question}
                  </h3>
                  {expandedFaq === faq.id ? (
                    <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  )}
                </button>

                <AnimatePresence>
                  {expandedFaq === faq.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="border-t border-gray-200 dark:border-gray-700"
                    >
                      <div className="p-6 text-gray-600 dark:text-gray-300 leading-relaxed">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>

          {/* Contact Section */}
          <div className="contact-section">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
              Liên hệ hỗ trợ
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {contactMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <motion.div
                    key={method.id}
                    className="contact-card bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300 cursor-pointer"
                    onClick={method.action}
                    whileHover={{ y: -5 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className={`w-12 h-12 ${method.color} rounded-lg flex items-center justify-center mb-4`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {method.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      {method.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </NavigationLayout>
  );
};

export default HelpPage;
