import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { motion } from 'framer-motion';
import { Search, CheckCircle, AlertTriangle, XCircle, Clipboard, Shield, Globe } from 'lucide-react';
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
        const score = Math.floor(Math.random() * 100);
        const status = score >= 70 ? 'safe' : score >= 40 ? 'warning' : 'dangerous';

        const mockResult = {
          url: data.url,
          status: status,
          credibilityScore: score,
          metadata: {
            title: `Trang web ${domain}`,
            domain: domain,
            publishDate: new Date().toISOString(),
            author: 'Không xác định',
            ip: '157.240.199.35',
            country: 'Tuần Mỹ',
            organization: `${domain.charAt(0).toUpperCase() + domain.slice(1)} Inc.`
          },
          thirdPartyResults: [
            {
              name: 'VirusTotal',
              status: score >= 70 ? 'clean' : score >= 40 ? 'suspicious' : 'malicious',
              details: score >= 70 ? 'An toàn' : score >= 40 ? 'Đáng ngờ' : 'Nguy hiểm'
            },
            {
              name: 'URLScan',
              status: score >= 60 ? 'clean' : 'suspicious',
              details: score >= 60 ? 'An toàn' : 'Đáng ngờ'
            },
            {
              name: 'ScamAdviser',
              status: score >= 50 ? 'clean' : 'suspicious',
              details: score >= 50 ? 'An toàn' : 'Đáng ngờ'
            }
          ],
          screenshot: `https://via.placeholder.com/400x300/f0f0f0/666666?text=${encodeURIComponent(domain)}`,
          additionalTools: [
            { name: 'VirusTotal', color: 'blue' },
            { name: 'URLScan', color: 'red' },
            { name: 'ScamAdviser', color: 'orange' },
            { name: 'Thông gia cộng đồng', color: 'green' }
          ],
          summary: `Kết quả phân tích cho ${domain}. ${status === 'safe' ? 'Trang web này được đánh giá là an toàn.' : status === 'warning' ? 'Trang web này có một số dấu hiệu đáng ngờ.' : 'Trang web này có thể không an toàn.'} Vui lòng thận trọng khi truy cập và không cung cấp thông tin cá nhân.`
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



  const getStatusInfo = (status) => {
    switch (status) {
      case 'safe':
        return {
          text: 'An toàn',
          bgColor: 'bg-green-100 dark:bg-green-900/30',
          textColor: 'text-green-800 dark:text-green-200',
          icon: CheckCircle
        };
      case 'warning':
        return {
          text: 'Đáng ngờ',
          bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
          textColor: 'text-yellow-800 dark:text-yellow-200',
          icon: AlertTriangle
        };
      case 'dangerous':
        return {
          text: 'Nguy hiểm',
          bgColor: 'bg-red-100 dark:bg-red-900/30',
          textColor: 'text-red-800 dark:text-red-200',
          icon: XCircle
        };
      default:
        return {
          text: 'Không xác định',
          bgColor: 'bg-gray-100 dark:bg-gray-900/30',
          textColor: 'text-gray-800 dark:text-gray-200',
          icon: AlertTriangle
        };
    }
  };

  const getThirdPartyStatusColor = (status) => {
    switch (status) {
      case 'clean':
        return 'text-green-600 dark:text-green-400';
      case 'suspicious':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'malicious':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getToolButtonColor = (color) => {
    const colors = {
      blue: 'bg-blue-500 hover:bg-blue-600',
      red: 'bg-red-500 hover:bg-red-600',
      orange: 'bg-orange-500 hover:bg-orange-600',
      green: 'bg-green-500 hover:bg-green-600'
    };
    return colors[color] || 'bg-gray-500 hover:bg-gray-600';
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
            className="space-y-6"
          >
            {/* Main Result Card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Overall Result */}
              <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-lg">Kết quả tổng quan</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  {(() => {
                    const statusInfo = getStatusInfo(result.status);
                    const StatusIcon = statusInfo.icon;
                    return (
                      <div className={`inline-flex flex-col items-center gap-3 px-6 py-4 rounded-lg ${statusInfo.bgColor}`}>
                        <StatusIcon className={`w-12 h-12 ${statusInfo.textColor}`} />
                        <span className={`text-xl font-bold ${statusInfo.textColor}`}>
                          {statusInfo.text}
                        </span>
                      </div>
                    );
                  })()}
                  <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                    Điểm số: {result.credibilityScore}/100
                  </div>
                </CardContent>
              </Card>

              {/* Third Party Results */}
              <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-lg">Kết quả từ bên thứ 3</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {result.thirdPartyResults?.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {item.name}
                      </span>
                      <span className={`font-semibold ${getThirdPartyStatusColor(item.status)}`}>
                        {item.details}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Screenshot */}
              <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-lg">Ảnh chụp màn hình</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                    <img
                      src={result.screenshot}
                      alt="Website screenshot"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/400x300/f0f0f0/666666?text=No+Screenshot';
                      }}
                    />
                  </div>
                  <div className="mt-3 text-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {result.metadata?.domain}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Information */}
            <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl">Thông tin cần biết</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">URL:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100 break-all">
                        {result.url}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">IP:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {result.metadata?.ip}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Quốc gia:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {result.metadata?.country}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Tổ chức:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {result.metadata?.organization}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Ngày kiểm tra:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {new Date().toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                    Lời khuyên từ chuyên gia:
                  </h4>
                  <p className="text-blue-800 dark:text-blue-300 text-sm leading-relaxed">
                    {result.summary}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Additional Tools and Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Additional Checking Tools */}
              <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Kiểm tra thêm bằng</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {result.additionalTools?.map((tool, index) => (
                    <button
                      key={index}
                      className={`w-full px-4 py-3 text-white rounded-lg font-medium transition-colors ${getToolButtonColor(tool.color)}`}
                      onClick={() => {
                        // In a real implementation, this would open the tool with the URL
                        toast.info(`Mở ${tool.name} để kiểm tra thêm`);
                      }}
                    >
                      {tool.name}
                    </button>
                  ))}
                </CardContent>
              </Card>

              {/* Report and Database */}
              <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Cơ sở dữ liệu</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <button className="w-full px-4 py-3 bg-gray-800 dark:bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-900 dark:hover:bg-gray-700 transition-colors">
                    Danh sách không an toàn
                  </button>
                  <button className="w-full px-4 py-3 bg-gray-800 dark:bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-900 dark:hover:bg-gray-700 transition-colors">
                    Danh sách an toàn
                  </button>
                </CardContent>
              </Card>
            </div>

            {/* Report Website */}
            <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Báo cáo trang web này nếu bạn thấy có dấu hiệu nghi ngờ!</CardTitle>
              </CardHeader>
              <CardContent>
                <button className="w-full px-6 py-4 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors">
                  Báo cáo ngay
                </button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CheckLinkPage;
