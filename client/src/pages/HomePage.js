import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Shield, Users, BarChart3, BookOpen, MessageCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import TrendingArticles from '../components/TrendingArticles';

const HomePage = () => {
  const { user } = useAuth();

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
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 text-white py-16 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            Chống Thông Tin Sai Lệch với FactCheck
          </h1>
          <p className="text-xl mb-8 opacity-90">
            Xác minh độ tin cậy của tin tức và nguồn thông tin ngay lập tức.
            Tham gia cuộc chiến chống tin giả và thông tin sai lệch.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/check"
              className="px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 flex items-center gap-2"
            >
              <Search size={20} />
              Kiểm Tra Ngay
            </Link>
            {user ? (
              <Link
                to="/dashboard"
                className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-all duration-200"
              >
                Xem Dashboard
              </Link>
            ) : (
              <Link
                to="/register"
                className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-all duration-200"
              >
                Đăng Ký Miễn Phí
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Trending Articles Section */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <h2 className="text-3xl md:text-4xl font-bold mb-8 text-gray-900 dark:text-white">
                Hoạt động cộng đồng
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link
                  to="/community"
                  className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                >
                  <Users className="w-8 h-8 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Cộng đồng kiểm tin</h3>
                  <p className="opacity-90">Tham gia cùng cộng đồng đánh giá và xác minh thông tin</p>
                </Link>

                <Link
                  to="/knowledge"
                  className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                >
                  <BookOpen className="w-8 h-8 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Kiến thức nền</h3>
                  <p className="opacity-90">Học cách nhận biết và kiểm tra thông tin sai lệch</p>
                </Link>

                <Link
                  to="/chat"
                  className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                >
                  <MessageCircle className="w-8 h-8 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Trợ lý AI</h3>
                  <p className="opacity-90">Hỏi đáp với AI về cách kiểm tra thông tin</p>
                </Link>

                <Link
                  to="/submit"
                  className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                >
                  <Search className="w-8 h-8 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Gửi bài viết</h3>
                  <p className="opacity-90">Chia sẻ bài viết để cộng đồng cùng đánh giá</p>
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

      {/* Features Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-center text-3xl md:text-4xl font-bold mb-12 text-gray-900 dark:text-white">
            Tại Sao Chọn FactCheck?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="bg-white dark:bg-gray-700 p-8 rounded-xl shadow-sm hover:-translate-y-1 transition-transform duration-200 text-center"
              >
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600 dark:text-blue-400">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default HomePage;
