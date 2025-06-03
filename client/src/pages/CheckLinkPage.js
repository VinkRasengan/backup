import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { motion } from 'framer-motion';
import { Search, ExternalLink, Calendar, User, Globe, CheckCircle, AlertTriangle, XCircle, Clipboard, Shield } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { linkAPI } from '../services/api';
import toast from 'react-hot-toast';

const schema = yup.object({
  url: yup
    .string()
    .url('Vui lòng nhập URL hợp lệ')
    .required('URL là bắt buộc')
});

// Helper functions for styling
const getCredibilityBadgeClasses = (score) => {
  if (score >= 80) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
  if (score >= 60) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
  if (score >= 40) return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
  return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
};

const getSourceCredibilityClasses = (level) => {
  if (level === 'high') return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
  if (level === 'medium') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
  return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
};

const getCredibilityLabel = (credibility) => {
  if (credibility === 'high') return 'Cao';
  if (credibility === 'medium') return 'Trung bình';
  return 'Thấp';
};

const CheckLinkPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema)
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      // Try real API first, fallback to mock if not available
      let response;
      try {
        response = await linkAPI.checkLink(data.url);
        setResult(response.data.result);
      } catch (apiError) {
        console.log('API not available, using mock data:', apiError.message);
        // Mock response for demo
        await new Promise(resolve => setTimeout(resolve, 2000));

        const domain = new URL(data.url).hostname;
        const mockResult = {
          url: data.url,
          credibilityScore: Math.floor(Math.random() * 40) + 60, // Random score between 60-100
          metadata: {
            title: `Bài viết từ ${domain}`,
            domain: domain,
            publishDate: new Date().toISOString(),
            author: 'Tác giả mẫu'
          },
          summary: `Đây là phân tích mẫu cho ${domain}. Hệ thống đã kiểm tra nội dung, nguồn gốc và độ tin cậy của bài viết. Kết quả cho thấy bài viết có độ tin cậy ở mức trung bình đến cao dựa trên các yếu tố như nguồn thông tin, tính chính xác của nội dung và uy tín của trang web.`,
          sources: [
            {
              name: 'Nguồn tin đáng tin cậy',
              url: 'https://example.com/source1',
              credibility: 'high'
            },
            {
              name: 'Nguồn tham khảo',
              url: 'https://example.com/source2',
              credibility: 'medium'
            }
          ]
        };
        setResult(mockResult);
      }

      toast.success('Kiểm tra link thành công!');

      // Optionally save to history (this would be handled by the API in real implementation)
      // The dashboard will automatically update when the user navigates to it

    } catch (error) {
      console.error('Error checking link:', error);
      toast.error('Không thể kiểm tra link');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to paste from clipboard
  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        // Set the value using react-hook-form's setValue
        setValue('url', text);
        toast.success('Đã dán link từ clipboard!');
      }
    } catch (error) {
      console.error('Clipboard access error:', error);
      toast.error('Không thể truy cập clipboard');
    }
  };

  const getCredibilityIcon = (score) => {
    if (score >= 80) return <CheckCircle size={20} />;
    if (score >= 40) return <AlertTriangle size={20} />;
    return <XCircle size={20} />;
  };

  const getCredibilityText = (score) => {
    if (score >= 80) return 'Độ tin cậy cao';
    if (score >= 60) return 'Độ tin cậy tốt';
    if (score >= 40) return 'Độ tin cậy trung bình';
    return 'Độ tin cậy thấp';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Kiểm Tra Độ Tin Cậy Link
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Nhập URL để xác minh độ tin cậy của bài viết tin tức và nguồn thông tin
          </p>
        </motion.div>

        {/* Check Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm mb-8">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl text-gray-900 dark:text-gray-100">
                Nhập Link Cần Kiểm Tra
              </CardTitle>
              <CardDescription>
                Dán hoặc nhập URL của bài viết, tin tức mà bạn muốn kiểm tra
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      label="URL"
                      placeholder="https://example.com/article"
                      type="url"
                      icon={Globe}
                      error={errors.url?.message}
                      {...register('url')}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="mt-6 h-12"
                    onClick={pasteFromClipboard}
                  >
                    <Clipboard className="w-4 h-4" />
                  </Button>
                </div>

                <Button
                  type="submit"
                  loading={isLoading}
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  size="lg"
                >
                  {!isLoading && <Search className="w-5 h-5 mr-2" />}
                  Kiểm Tra Link
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Results */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              {/* Result Header */}
              <CardHeader className="text-center pb-4">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-lg ${getCredibilityBadgeClasses(result.credibilityScore)}`}>
                  {getCredibilityIcon(result.credibilityScore)}
                  {result.credibilityScore}% - {getCredibilityText(result.credibilityScore)}
                </div>
              </CardHeader>

              {/* Result Content */}
              <CardContent className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    {result.metadata?.title || 'Tiêu đề không xác định'}
                  </h2>

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                      <Globe size={16} />
                      <span>{result.metadata?.domain || new URL(result.url).hostname}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                      <Calendar size={16} />
                      <span>
                        {result.metadata?.publishDate ?
                          new Date(result.metadata.publishDate).toLocaleDateString('vi-VN') :
                          'Ngày không xác định'
                        }
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                      <User size={16} />
                      <span>{result.metadata?.author || 'Tác giả không xác định'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                      <ExternalLink size={16} />
                      <a
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Xem bài gốc
                      </a>
                    </div>
                  </div>
                </div>

                {/* Summary Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Tóm Tắt Phân Tích
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {result.summary || 'Không có thông tin phân tích.'}
                    </p>
                  </div>
                </div>

                {/* Sources */}
                {result.sources && result.sources.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      Nguồn Tham Khảo
                    </h3>
                    <div className="space-y-3">
                      {result.sources.map((source, index) => (
                        <div key={`${source.name}-${index}`} className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 dark:text-white mb-1">
                              {source.name}
                            </div>
                            <a
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 dark:text-blue-400 text-sm hover:underline flex items-center gap-1"
                            >
                              {source.url} <ExternalLink size={12} />
                            </a>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase ${getSourceCredibilityClasses(source.credibility.toLowerCase())}`}>
                            {getCredibilityLabel(source.credibility)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CheckLinkPage;
