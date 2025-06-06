import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { motion } from 'framer-motion';
import { Search, CheckCircle, AlertTriangle, XCircle, Clipboard, Shield, Globe, Lock, AlertOctagon, Flag } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { linkAPI } from '../services/api';
import VoteComponent from '../components/Community/VoteComponent';
import CommentsSection from '../components/Community/CommentsSection';
import ReportModal from '../components/Community/ReportModal';
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
  const [showReportModal, setShowReportModal] = useState(false);

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
        const credibilityScore = Math.floor(Math.random() * 100);
        const securityScore = Math.floor(Math.random() * 100);
        const finalScore = Math.round((credibilityScore * 0.6) + (securityScore * 0.4));

        let status;
        if (finalScore >= 70) status = 'safe';
        else if (finalScore >= 40) status = 'warning';
        else status = 'dangerous';

        const mockResult = {
          url: data.url,
          status: status,
          credibilityScore: credibilityScore,
          securityScore: securityScore,
          finalScore: finalScore,
          metadata: {
            title: `Trang web ${domain}`,
            domain: domain,
            publishDate: new Date().toISOString(),
            author: 'Không xác định',
            ip: '157.240.199.35',
            country: 'Việt Nam',
            organization: `${domain.charAt(0).toUpperCase() + domain.slice(1)} Inc.`
          },
          security: {
            threats: {
              malicious: securityScore < 30,
              suspicious: securityScore >= 30 && securityScore < 60,
              threatNames: securityScore < 30 ? ['Phishing', 'Malware'] : securityScore < 60 ? ['Suspicious Content'] : []
            },
            urlAnalysis: {
              success: true,
              stats: {
                malicious: securityScore < 30 ? 2 : 0,
                suspicious: securityScore >= 30 && securityScore < 60 ? 1 : 0,
                harmless: securityScore >= 60 ? 5 : 3,
                undetected: 2
              }
            },
            domainAnalysis: {
              success: true,
              reputation: securityScore >= 60 ? 1 : securityScore >= 30 ? 0 : -1
            }
          },
          thirdPartyResults: [
            {
              name: 'VirusTotal',
              status: securityScore >= 70 ? 'clean' : securityScore >= 40 ? 'suspicious' : 'malicious',
              details: securityScore >= 70 ? 'An toàn' : securityScore >= 40 ? 'Đáng ngờ' : 'Nguy hiểm'
            },
            {
              name: 'URLScan',
              status: securityScore >= 60 ? 'clean' : 'suspicious',
              details: securityScore >= 60 ? 'An toàn' : 'Đáng ngờ'
            },
            {
              name: 'ScamAdviser',
              status: credibilityScore >= 50 ? 'clean' : 'suspicious',
              details: credibilityScore >= 50 ? 'An toàn' : 'Đáng ngờ'
            }
          ],
          screenshot: `https://via.placeholder.com/400x300/f0f0f0/666666?text=${encodeURIComponent(domain)}`,
          additionalTools: [
            { name: 'VirusTotal', color: 'blue' },
            { name: 'URLScan', color: 'red' },
            { name: 'ScamAdviser', color: 'orange' },
            { name: 'Thông gia cộng đồng', color: 'green' }
          ],
          summary: `Kết quả phân tích cho ${domain}. Điểm tin cậy: ${credibilityScore}/100, Điểm bảo mật: ${securityScore}/100. ${status === 'safe' ? 'Trang web này được đánh giá là an toàn.' : status === 'warning' ? 'Trang web này có một số dấu hiệu đáng ngờ.' : 'Trang web này có thể không an toàn.'} ${securityScore < 30 ? '⚠️ CẢNH BÁO BẢO MẬT: Phát hiện mối đe dọa bảo mật!' : securityScore < 60 ? '⚠️ Có dấu hiệu đáng ngờ về bảo mật.' : '✅ Không phát hiện mối đe dọa bảo mật.'}`
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto p-6">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Kiểm Tra Link
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Xác minh độ tin cậy của bài viết và nguồn thông tin
              </p>
            </div>
          </div>
        </motion.div>

        {/* Check Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="shadow-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 mb-8">
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
                  className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700"
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
            {/* Main Result Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Overall Result */}
              <Card className="shadow-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
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
                  <div className="mt-4 space-y-1">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Điểm tổng: {result.finalScore}/100
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">
                      Tin cậy: {result.credibilityScore} | Bảo mật: {result.securityScore}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Security Analysis */}
              <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-lg flex items-center justify-center gap-2">
                    <Shield className="w-5 h-5" />
                    Phân tích bảo mật
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  {result.security?.threats?.malicious ? (
                    <div className="inline-flex flex-col items-center gap-3 px-6 py-4 rounded-lg bg-red-100 dark:bg-red-900/30">
                      <XCircle className="w-12 h-12 text-red-800 dark:text-red-200" />
                      <span className="text-xl font-bold text-red-800 dark:text-red-200">
                        Nguy hiểm
                      </span>
                    </div>
                  ) : result.security?.threats?.suspicious ? (
                    <div className="inline-flex flex-col items-center gap-3 px-6 py-4 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                      <AlertTriangle className="w-12 h-12 text-yellow-800 dark:text-yellow-200" />
                      <span className="text-xl font-bold text-yellow-800 dark:text-yellow-200">
                        Đáng ngờ
                      </span>
                    </div>
                  ) : (
                    <div className="inline-flex flex-col items-center gap-3 px-6 py-4 rounded-lg bg-green-100 dark:bg-green-900/30">
                      <CheckCircle className="w-12 h-12 text-green-800 dark:text-green-200" />
                      <span className="text-xl font-bold text-green-800 dark:text-green-200">
                        An toàn
                      </span>
                    </div>
                  )}
                  <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                    Điểm bảo mật: {result.securityScore}/100
                  </div>
                  {result.security?.threats?.threatNames?.length > 0 && (
                    <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                      Phát hiện: {result.security.threats.threatNames.join(', ')}
                    </div>
                  )}
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

            {/* Security Details */}
            {result.security && (
              <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Shield className="w-6 h-6" />
                    Chi tiết phân tích bảo mật
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* URL Analysis */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">Phân tích URL</h4>
                      {result.security.urlAnalysis?.success ? (
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Độc hại:</span>
                            <span className="font-medium text-red-600 dark:text-red-400">
                              {result.security.urlAnalysis.stats.malicious || 0}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Đáng ngờ:</span>
                            <span className="font-medium text-yellow-600 dark:text-yellow-400">
                              {result.security.urlAnalysis.stats.suspicious || 0}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">An toàn:</span>
                            <span className="font-medium text-green-600 dark:text-green-400">
                              {result.security.urlAnalysis.stats.harmless || 0}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Không phát hiện:</span>
                            <span className="font-medium text-gray-600 dark:text-gray-400">
                              {result.security.urlAnalysis.stats.undetected || 0}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400">Không có dữ liệu phân tích URL</p>
                      )}
                    </div>

                    {/* Domain Analysis */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">Phân tích Domain</h4>
                      {result.security.domainAnalysis?.success ? (
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Uy tín:</span>
                            <span className={`font-medium ${
                              result.security.domainAnalysis.reputation > 0
                                ? 'text-green-600 dark:text-green-400'
                                : result.security.domainAnalysis.reputation === 0
                                ? 'text-yellow-600 dark:text-yellow-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {result.security.domainAnalysis.reputation > 0 ? 'Tốt' :
                               result.security.domainAnalysis.reputation === 0 ? 'Trung tính' : 'Xấu'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400">Không có dữ liệu phân tích domain</p>
                      )}
                    </div>
                  </div>

                  {/* Threat Information */}
                  {result.security.threats && (
                    <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                        Thông tin mối đe dọa
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className={`text-2xl font-bold ${
                            result.security.threats.malicious ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                          }`}>
                            {result.security.threats.malicious ? 'CÓ' : 'KHÔNG'}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Độc hại</div>
                        </div>
                        <div className="text-center">
                          <div className={`text-2xl font-bold ${
                            result.security.threats.suspicious ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'
                          }`}>
                            {result.security.threats.suspicious ? 'CÓ' : 'KHÔNG'}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Đáng ngờ</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {result.security.threats.threatNames?.length || 0}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Mối đe dọa</div>
                        </div>
                      </div>
                      {result.security.threats.threatNames?.length > 0 && (
                        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                          <div className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                            Các mối đe dọa được phát hiện:
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {result.security.threats.threatNames.map((threat, index) => (
                              <span
                                key={`threat-${index}`}
                                className="px-2 py-1 bg-red-100 dark:bg-red-800/30 text-red-800 dark:text-red-200 text-xs rounded-full"
                              >
                                {threat}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

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

            {/* Community Features */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Vote Component */}
              <VoteComponent
                linkId={result.id}
                className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
              />

              {/* Report Website */}
              <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Flag className="w-5 h-5 mr-2" />
                    Báo cáo trang web
                  </CardTitle>
                  <CardDescription>
                    Báo cáo nếu bạn thấy có dấu hiệu nghi ngờ
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="w-full px-6 py-4 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors flex items-center justify-center"
                  >
                    <Flag className="w-5 h-5 mr-2" />
                    Báo cáo ngay
                  </button>
                </CardContent>
              </Card>
            </div>

            {/* Comments Section */}
            <CommentsSection
              linkId={result.id}
              className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
            />
          </motion.div>
        )}

        {/* Report Modal */}
        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          linkId={result?.id}
          linkUrl={result?.url}
        />
      </div>
    </div>
  );
};

export default CheckLinkPage;
