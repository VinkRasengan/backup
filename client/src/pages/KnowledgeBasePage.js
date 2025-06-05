import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Search, 
  Filter, 
  Eye, 
  Clock, 
  Tag,
  ChevronRight,
  Shield,
  AlertTriangle,
  CheckCircle,
  Users,
  Globe,
  Lightbulb
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

const KnowledgeBasePage = () => {
  const { isDarkMode } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [articles, setArticles] = useState([]);
  const [featuredArticles, setFeaturedArticles] = useState([]);

  const categories = [
    { id: 'all', name: 'Tất cả', icon: BookOpen, color: 'blue' },
    { id: 'basics', name: 'Kiến thức cơ bản', icon: Lightbulb, color: 'yellow' },
    { id: 'techniques', name: 'Kỹ thuật kiểm tin', icon: Shield, color: 'green' },
    { id: 'tools', name: 'Công cụ hữu ích', icon: Globe, color: 'purple' },
    { id: 'examples', name: 'Ví dụ thực tế', icon: Eye, color: 'red' },
    { id: 'community', name: 'Hướng dẫn cộng đồng', icon: Users, color: 'indigo' }
  ];

  const knowledgeArticles = [
    {
      id: 1,
      title: 'Cách nhận biết tin giả trên mạng xã hội',
      description: 'Hướng dẫn chi tiết về các dấu hiệu nhận biết tin giả và cách xác minh thông tin trên các nền tảng mạng xã hội.',
      category: 'basics',
      readTime: '5 phút',
      views: 1250,
      featured: true,
      content: `
        ## Các dấu hiệu nhận biết tin giả

        ### 1. Kiểm tra nguồn thông tin
        - Xem xét độ uy tín của trang web
        - Kiểm tra thông tin về tác giả
        - Tìm hiểu lịch sử của nguồn tin

        ### 2. Phân tích nội dung
        - Chú ý đến ngôn ngữ cảm xúc quá mức
        - Kiểm tra tính logic của thông tin
        - So sánh với các nguồn khác

        ### 3. Xác minh bằng công cụ
        - Sử dụng Google Reverse Image Search
        - Kiểm tra trên các trang fact-check
        - Tìm kiếm thông tin gốc
      `
    },
    {
      id: 2,
      title: 'Sử dụng công cụ kiểm tra hình ảnh',
      description: 'Hướng dẫn sử dụng các công cụ tìm kiếm ngược hình ảnh để xác minh tính xác thực của ảnh.',
      category: 'tools',
      readTime: '7 phút',
      views: 890,
      featured: true,
      content: `
        ## Công cụ kiểm tra hình ảnh

        ### Google Reverse Image Search
        1. Truy cập images.google.com
        2. Click vào biểu tượng camera
        3. Upload hoặc dán URL hình ảnh
        4. Phân tích kết quả tìm kiếm

        ### TinEye
        - Công cụ chuyên dụng tìm kiếm ngược
        - Có thể tìm thấy phiên bản gốc của ảnh
        - Hiển thị lịch sử sử dụng ảnh

        ### Yandex Images
        - Công cụ mạnh mẽ từ Nga
        - Thường cho kết quả tốt với ảnh từ châu Âu
      `
    },
    {
      id: 3,
      title: 'Phân tích độ tin cậy của website',
      description: 'Cách đánh giá độ tin cậy của một trang web thông qua nhiều yếu tố khác nhau.',
      category: 'techniques',
      readTime: '6 phút',
      views: 1100,
      featured: false,
      content: `
        ## Đánh giá độ tin cậy website

        ### Kiểm tra thông tin cơ bản
        - Trang "Về chúng tôi"
        - Thông tin liên hệ
        - Chính sách bảo mật

        ### Phân tích nội dung
        - Chất lượng bài viết
        - Tần suất cập nhật
        - Nguồn tham khảo

        ### Kiểm tra kỹ thuật
        - Chứng chỉ SSL
        - Tốc độ tải trang
        - Thiết kế responsive
      `
    },
    {
      id: 4,
      title: 'Ví dụ về tin giả COVID-19',
      description: 'Phân tích các trường hợp tin giả phổ biến về COVID-19 và cách chúng được lan truyền.',
      category: 'examples',
      readTime: '8 phút',
      views: 2100,
      featured: true,
      content: `
        ## Tin giả về COVID-19

        ### Ví dụ 1: Thuốc chữa COVID-19 thần kỳ
        - Tuyên bố không có bằng chứng khoa học
        - Lan truyền qua mạng xã hội
        - Cách xác minh: Kiểm tra với WHO, CDC

        ### Ví dụ 2: Thông tin sai về vaccine
        - Dữ liệu bị bóp méo
        - Nguồn không đáng tin cậy
        - Cách xác minh: Tham khảo nghiên cứu peer-reviewed

        ### Bài học rút ra
        - Luôn kiểm tra nguồn gốc
        - Tham khảo nhiều nguồn uy tín
        - Không chia sẻ thông tin chưa xác minh
      `
    },
    {
      id: 5,
      title: 'Cách tham gia cộng đồng kiểm tin',
      description: 'Hướng dẫn cách đóng góp hiệu quả vào cộng đồng kiểm tin và xác minh thông tin.',
      category: 'community',
      readTime: '4 phút',
      views: 750,
      featured: false,
      content: `
        ## Tham gia cộng đồng kiểm tin

        ### Nguyên tắc cơ bản
        - Khách quan và công bằng
        - Dựa trên bằng chứng
        - Tôn trọng ý kiến khác

        ### Cách đóng góp
        - Vote có trách nhiệm
        - Bình luận xây dựng
        - Chia sẻ nguồn đáng tin cậy

        ### Báo cáo vi phạm
        - Khi nào nên báo cáo
        - Cách viết báo cáo hiệu quả
        - Theo dõi kết quả xử lý
      `
    }
  ];

  useEffect(() => {
    // Filter articles based on search and category
    let filtered = knowledgeArticles;
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(article => article.category === selectedCategory);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(article => 
        article.title.toLowerCase().includes(query) ||
        article.description.toLowerCase().includes(query)
      );
    }
    
    setArticles(filtered);
    setFeaturedArticles(knowledgeArticles.filter(article => article.featured));
  }, [searchQuery, selectedCategory]);

  const getCategoryColor = (color) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      green: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      red: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      indigo: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300'
    };
    return colors[color] || colors.blue;
  };

  const ArticleCard = ({ article, featured = false }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} 
        border rounded-lg p-6 cursor-pointer transition-all duration-200 hover:shadow-lg
        ${featured ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {article.title}
          </h3>
          <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-3`}>
            {article.description}
          </p>
        </div>
        {featured && (
          <div className="ml-4">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Nổi bật
            </span>
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <Clock size={14} />
            <span>{article.readTime}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Eye size={14} />
            <span>{article.views.toLocaleString()}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            getCategoryColor(categories.find(c => c.id === article.category)?.color)
          }`}>
            {categories.find(c => c.id === article.category)?.name}
          </span>
          <ChevronRight size={16} className="text-gray-400" />
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Kiến thức nền
          </h1>
          <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Tìm hiểu cách kiểm tra và xác minh thông tin một cách hiệu quả
          </p>
        </motion.div>

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <Input
                    placeholder="Tìm kiếm bài viết..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    icon={Search}
                  />
                </div>
                
                {/* Category Filter */}
                <div className="md:w-64">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className={`w-full px-4 py-3 rounded-lg border ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  >
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Featured Articles */}
        {selectedCategory === 'all' && !searchQuery && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Bài viết nổi bật
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredArticles.map(article => (
                <ArticleCard key={article.id} article={article} featured={true} />
              ))}
            </div>
          </motion.div>
        )}

        {/* All Articles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {selectedCategory === 'all' ? 'Tất cả bài viết' : categories.find(c => c.id === selectedCategory)?.name}
            </h2>
            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {articles.length} bài viết
            </span>
          </div>

          {articles.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className={`w-12 h-12 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Không tìm thấy bài viết nào
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map(article => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          )}
        </motion.div>

        {/* Quick Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12"
        >
          <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <CardHeader>
              <CardTitle className={`flex items-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                <Lightbulb className="w-5 h-5 mr-2" />
                Mẹo nhanh
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Kiểm tra nguồn
                    </h4>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Luôn xác minh độ uy tín của nguồn thông tin trước khi tin tưởng
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  </div>
                  <div>
                    <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Nghi ngờ hợp lý
                    </h4>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Nếu thông tin quá sốc hoặc hoàn hảo, hãy kiểm tra kỹ hơn
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Users className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Tham khảo cộng đồng
                    </h4>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Sử dụng trí tuệ tập thể để xác minh thông tin
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default KnowledgeBasePage;
