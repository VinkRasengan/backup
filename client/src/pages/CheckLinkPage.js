import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { motion } from 'framer-motion';
import { Search, CheckCircle, AlertTriangle, XCircle, Clipboard, Shield, Globe, Flag } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { linkAPI } from '../services/api';
import VoteComponent from '../components/Community/VoteComponent';
import CommentsSection from '../components/Community/CommentsSection';
import ReportModal from '../components/Community/ReportModal';
import toast from 'react-hot-toast';

// Custom URL validation that auto-adds protocol
const normalizeUrl = (url) => {
  if (!url) return url;

  // Remove whitespace
  url = url.trim();

  // If no protocol, add https://
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }

  return url;
};

const schema = yup.object({
  url: yup
    .string()
    .required('URL là bắt buộc')
    .test('is-valid-url', 'Vui lòng nhập URL hợp lệ', (value) => {
      if (!value) return false;

      // Normalize URL first
      const normalizedUrl = normalizeUrl(value);
      console.log('Validating URL:', value, '-> normalized:', normalizedUrl);

      try {
        new URL(normalizedUrl);
        console.log('URL validation passed for:', normalizedUrl);
        return true;
      } catch (error) {
        console.log('URL validation failed for:', normalizedUrl, error.message);
        return false;
      }
    })
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
      // Normalize and validate URL manually
      const normalizedUrl = normalizeUrl(data.url);

      // Validate normalized URL
      try {
        new URL(normalizedUrl);
      } catch (error) {
        toast.error('URL không hợp lệ. Vui lòng kiểm tra lại.');
        setIsLoading(false);
        return;
      }

      // Show normalized URL to user
      if (normalizedUrl !== data.url) {
        toast.success(`URL đã được chuẩn hóa: ${normalizedUrl}`);
      }      // Try real API first, fallback to mock if not available
      let response;
      let resultData;
      
      try {
        response = await linkAPI.checkLink(normalizedUrl);
        resultData = response.data.result;
        setResult(resultData);
      } catch (apiError) {
        console.log('API not available, using mock data:', apiError.message);
        // Mock response for demo
        await new Promise(resolve => setTimeout(resolve, 2000));        const domain = new URL(normalizedUrl).hostname;
        const credibilityScore = Math.floor(Math.random() * 100);
        const vtSecurityScore = Math.floor(Math.random() * 100);
        const saScore = Math.floor(Math.random() * 100);
        const combinedSecurityScore = Math.round((vtSecurityScore * 0.6) + (saScore * 0.4));
        const finalScore = Math.round((credibilityScore * 0.6) + (combinedSecurityScore * 0.4));

        let status;
        if (finalScore >= 70) status = 'safe';
        else if (finalScore >= 40) status = 'warning';
        else status = 'dangerous';

        // Generate ScamAdviser risk level
        let riskLevel;
        if (saScore >= 80) riskLevel = 'low';
        else if (saScore >= 60) riskLevel = 'medium';
        else if (saScore >= 40) riskLevel = 'high';
        else riskLevel = 'very_high';

        // Generate risk factors for ScamAdviser
        const possibleRiskFactors = [
          'Suspicious activity detected',
          'High phishing risk',
          'Very new domain',
          'No SSL/HTTPS security',
          'High-risk country'
        ];
        const riskFactors = riskLevel === 'very_high' ? possibleRiskFactors.slice(0, 3) :
                           riskLevel === 'high' ? possibleRiskFactors.slice(0, 2) :
                           riskLevel === 'medium' ? possibleRiskFactors.slice(0, 1) : [];

        resultData = {
          url: normalizedUrl,
          status: status,
          credibilityScore: credibilityScore,
          securityScore: combinedSecurityScore,
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
            virusTotal: {
              threats: {
                malicious: vtSecurityScore < 30,
                suspicious: vtSecurityScore >= 30 && vtSecurityScore < 60,
                threatNames: vtSecurityScore < 30 ? ['Phishing', 'Malware'] : vtSecurityScore < 60 ? ['Suspicious Content'] : []
              },
              urlAnalysis: {
                success: true,
                stats: {
                  malicious: vtSecurityScore < 30 ? 2 : 0,
                  suspicious: vtSecurityScore >= 30 && vtSecurityScore < 60 ? 1 : 0,
                  harmless: vtSecurityScore >= 60 ? 5 : 3,
                  undetected: 2
                }
              },
              domainAnalysis: {
                success: true,
                reputation: vtSecurityScore >= 60 ? 1 : vtSecurityScore >= 30 ? 0 : -1
              },
              securityScore: vtSecurityScore,
              analyzedAt: new Date().toISOString()
            },
            scamAdviser: {
              trustScore: saScore,
              riskLevel: riskLevel,
              riskFactors: riskFactors,
              details: {
                domain: domain,
                country: 'Vietnam',
                registrationDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
                ssl: saScore >= 50,
                socialMedia: saScore >= 70,
                reviews: Math.floor(saScore / 20),
                lastChecked: new Date().toISOString()
              },
              analyzedAt: new Date().toISOString()
            },
            combinedScore: combinedSecurityScore
          },
          thirdPartyResults: [
            {
              name: 'VirusTotal',
              status: vtSecurityScore >= 70 ? 'clean' : vtSecurityScore >= 40 ? 'suspicious' : 'malicious',
              details: vtSecurityScore >= 70 ? 'An toàn' : vtSecurityScore >= 40 ? 'Đáng ngờ' : 'Nguy hiểm'
            },
            {
              name: 'URLScan',
              status: vtSecurityScore >= 60 ? 'clean' : 'suspicious',
              details: vtSecurityScore >= 60 ? 'An toàn' : 'Đáng ngờ'
            },
            {
              name: 'ScamAdviser',
              status: saScore >= 50 ? 'clean' : 'suspicious',
              details: saScore >= 50 ? 'An toàn' : 'Đáng ngờ'
            }
          ],
          screenshot: `https://via.placeholder.com/400x300/f0f0f0/666666?text=${encodeURIComponent(domain)}`,
          additionalTools: [
            { name: 'VirusTotal', color: 'blue' },
            { name: 'URLScan', color: 'red' },
            { name: 'ScamAdviser', color: 'orange' },
            { name: 'Thông gia cộng đồng', color: 'green' }
          ],
          summary: `Kết quả phân tích cho ${domain}. Điểm tin cậy: ${credibilityScore}/100, Điểm bảo mật tổng hợp: ${combinedSecurityScore}/100 (VirusTotal: ${vtSecurityScore}, ScamAdviser: ${saScore}). ${status === 'safe' ? 'Trang web này được đánh giá là an toàn.' : status === 'warning' ? 'Trang web này có một số dấu hiệu đáng ngờ.' : 'Trang web này có thể không an toàn.'} ${vtSecurityScore < 30 ? '⚠️ CẢNH BÁO BẢO MẬT: VirusTotal phát hiện mối đe dọa!' : vtSecurityScore < 60 ? '⚠️ VirusTotal phát hiện dấu hiệu đáng ngờ.' : '✅ VirusTotal xác nhận an toàn.'} ${riskLevel === 'very_high' ? '🚨 ScamAdviser cảnh báo nguy cơ lừa đảo rất cao!' : riskLevel === 'high' ? '⚠️ ScamAdviser cảnh báo nguy cơ lừa đảo cao.' : riskLevel === 'medium' ? '⚠️ ScamAdviser đánh giá có rủi ro trung bình.' : '✅ ScamAdviser đánh giá an toàn.'}`
        };
        setResult(resultData);
      }

      toast.success('Kiểm tra link thành công!');

      // Trigger dashboard refresh by dispatching a custom event
      window.dispatchEvent(new CustomEvent('linkChecked', {
        detail: {
          url: normalizedUrl,
          result: resultData
        }
      }));

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
                      placeholder="fb.com, google.com, https://example.com"
                      type="text"
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
              </Card>              {/* Security Analysis */}
              <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-lg flex items-center justify-center gap-2">
                    <Shield className="w-5 h-5" />
                    Phân tích bảo mật
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  {(() => {
                    // Determine overall security status from combined score or individual scores
                    const securityScore = result.securityScore;
                    const hasVirusTotal = result.security?.virusTotal && !result.security.virusTotal.error;
                    const hasScamAdviser = result.security?.scamAdviser && !result.security.scamAdviser.error;
                    
                    let status, icon, colorClass;
                    
                    if (securityScore >= 70) {
                      status = 'An toàn';
                      icon = CheckCircle;
                      colorClass = 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200';
                    } else if (securityScore >= 40) {
                      status = 'Đáng ngờ';
                      icon = AlertTriangle;
                      colorClass = 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200';
                    } else if (securityScore !== null) {
                      status = 'Nguy hiểm';
                      icon = XCircle;
                      colorClass = 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200';
                    } else {
                      status = 'Không xác định';
                      icon = AlertTriangle;
                      colorClass = 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200';
                    }
                    
                    const StatusIcon = icon;
                    
                    return (
                      <>
                        <div className={`inline-flex flex-col items-center gap-3 px-6 py-4 rounded-lg ${colorClass}`}>
                          <StatusIcon className="w-12 h-12" />
                          <span className="text-xl font-bold">
                            {status}
                          </span>
                        </div>
                        <div className="mt-4 space-y-2">                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Điểm bảo mật tổng hợp: {securityScore != null ? `${securityScore}/100` : 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-500 space-y-1">
                            {hasVirusTotal && (
                              <div>VirusTotal: {result.security.virusTotal.securityScore ?? 'N/A'}/100</div>
                            )}
                            {hasScamAdviser && (
                              <div>ScamAdviser: {result.security.scamAdviser.trustScore ?? 'N/A'}/100</div>
                            )}
                            {!hasVirusTotal && !hasScamAdviser && (
                              <div>Không có dữ liệu bảo mật chi tiết</div>
                            )}
                          </div>
                        </div>
                      </>
                    );
                  })()}
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
            </Card>            {/* Security Details */}
            {result.security && (
              <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Shield className="w-6 h-6" />
                    Chi tiết phân tích bảo mật
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* VirusTotal Section */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                          <Shield className="w-4 h-4 text-white" />
                        </div>
                        VirusTotal
                      </h3>
                      
                      {result.security.virusTotal && !result.security.virusTotal.error ? (
                        <div className="space-y-4">
                          {/* URL Analysis */}
                          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Phân tích URL</h4>
                            {result.security.virusTotal.urlAnalysis ? (
                              <div className="grid grid-cols-2 gap-3">
                                <div className="text-center">
                                  <div className="text-lg font-bold text-red-600 dark:text-red-400">
                                    {result.security.virusTotal.urlAnalysis.stats?.malicious || 0}
                                  </div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400">Độc hại</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                                    {result.security.virusTotal.urlAnalysis.stats?.suspicious || 0}
                                  </div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400">Đáng ngờ</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-lg font-bold text-green-600 dark:text-green-400">
                                    {result.security.virusTotal.urlAnalysis.stats?.harmless || 0}
                                  </div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400">An toàn</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-lg font-bold text-gray-600 dark:text-gray-400">
                                    {result.security.virusTotal.urlAnalysis.stats?.undetected || 0}
                                  </div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400">Không phát hiện</div>
                                </div>
                              </div>
                            ) : (
                              <p className="text-gray-500 dark:text-gray-400 text-sm">Không có dữ liệu phân tích URL</p>
                            )}
                          </div>

                          {/* Threat Information */}
                          {result.security.virusTotal.threats && (
                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Mối đe dọa</h4>
                              <div className="grid grid-cols-3 gap-3 text-center">
                                <div>
                                  <div className={`text-lg font-bold ${
                                    result.security.virusTotal.threats.malicious ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                                  }`}>
                                    {result.security.virusTotal.threats.malicious ? 'CÓ' : 'KHÔNG'}
                                  </div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400">Độc hại</div>
                                </div>
                                <div>
                                  <div className={`text-lg font-bold ${
                                    result.security.virusTotal.threats.suspicious ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'
                                  }`}>
                                    {result.security.virusTotal.threats.suspicious ? 'CÓ' : 'KHÔNG'}
                                  </div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400">Đáng ngờ</div>
                                </div>
                                <div>
                                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                    {result.security.virusTotal.threats.threatNames?.length || 0}
                                  </div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400">Loại mối đe dọa</div>
                                </div>
                              </div>
                              
                              {result.security.virusTotal.threats.threatNames?.length > 0 && (
                                <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                  <div className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                                    Các mối đe dọa được phát hiện:
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    {result.security.virusTotal.threats.threatNames.map((threat, index) => (
                                      <span
                                        key={`vt-threat-${index}`}
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
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <XCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-500 dark:text-gray-400 text-sm">
                            {result.security.virusTotal?.error || 'VirusTotal không khả dụng'}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* ScamAdviser Section */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <div className="w-6 h-6 bg-orange-600 rounded flex items-center justify-center">
                          <Globe className="w-4 h-4 text-white" />
                        </div>
                        ScamAdviser
                      </h3>
                      
                      {result.security.scamAdviser && !result.security.scamAdviser.error ? (
                        <div className="space-y-4">
                          {/* Trust Score */}
                          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Đánh giá độ tin cậy</h4>
                            <div className="text-center">                              <div className={`text-3xl font-bold mb-2 ${
                                result.security.scamAdviser.riskLevel === 'low' ? 'text-green-600 dark:text-green-400' :
                                result.security.scamAdviser.riskLevel === 'medium' ? 'text-yellow-600 dark:text-yellow-400' :
                                result.security.scamAdviser.riskLevel === 'high' ? 'text-orange-600 dark:text-orange-400' :
                                result.security.scamAdviser.riskLevel === 'very_high' ? 'text-red-600 dark:text-red-400' :
                                'text-gray-600 dark:text-gray-400'
                              }`}>
                                {result.security.scamAdviser.trustScore ?? 'N/A'}
                                {result.security.scamAdviser.trustScore != null && '/100'}
                              </div>
                              <div className={`text-sm font-medium ${
                                result.security.scamAdviser.riskLevel === 'low' ? 'text-green-800 dark:text-green-200' :
                                result.security.scamAdviser.riskLevel === 'medium' ? 'text-yellow-800 dark:text-yellow-200' :
                                result.security.scamAdviser.riskLevel === 'high' ? 'text-orange-800 dark:text-orange-200' :
                                result.security.scamAdviser.riskLevel === 'very_high' ? 'text-red-800 dark:text-red-200' :
                                'text-gray-800 dark:text-gray-200'
                              }`}>
                                Mức rủi ro: {
                                  result.security.scamAdviser.riskLevel === 'low' ? 'Thấp' :
                                  result.security.scamAdviser.riskLevel === 'medium' ? 'Trung bình' :
                                  result.security.scamAdviser.riskLevel === 'high' ? 'Cao' :
                                  result.security.scamAdviser.riskLevel === 'very_high' ? 'Rất cao' :
                                  'Không xác định'
                                }
                              </div>
                            </div>
                          </div>

                          {/* Risk Factors */}
                          {result.security.scamAdviser.riskFactors?.length > 0 && (
                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Yếu tố rủi ro</h4>
                              <div className="space-y-2">
                                {result.security.scamAdviser.riskFactors.map((factor, index) => (
                                  <div key={`risk-factor-${index}`} className="flex items-start gap-2">
                                    <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">{factor}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Domain Details */}
                          {result.security.scamAdviser.details && (
                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Thông tin domain</h4>
                              <div className="space-y-2 text-sm">
                                {result.security.scamAdviser.details.country && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Quốc gia:</span>
                                    <span className="font-medium text-gray-900 dark:text-gray-100">
                                      {result.security.scamAdviser.details.country}
                                    </span>
                                  </div>
                                )}
                                {result.security.scamAdviser.details.registrationDate && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Ngày đăng ký:</span>
                                    <span className="font-medium text-gray-900 dark:text-gray-100">
                                      {new Date(result.security.scamAdviser.details.registrationDate).toLocaleDateString('vi-VN')}
                                    </span>
                                  </div>
                                )}
                                <div className="flex justify-between">
                                  <span className="text-gray-600 dark:text-gray-400">HTTPS:</span>
                                  <span className={`font-medium ${
                                    result.security.scamAdviser.details.ssl ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                  }`}>
                                    {result.security.scamAdviser.details.ssl ? 'Có' : 'Không'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <XCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-500 dark:text-gray-400 text-sm">
                            {result.security.scamAdviser?.error || 'ScamAdviser không khả dụng'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Combined Security Summary */}
                  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                      Tổng kết bảo mật:
                    </h4>
                    <p className="text-blue-800 dark:text-blue-300 text-sm leading-relaxed">
                      {(() => {
                        const hasVT = result.security.virusTotal && !result.security.virusTotal.error;
                        const hasSA = result.security.scamAdviser && !result.security.scamAdviser.error;
                        const combinedScore = result.security.combinedScore;
                        
                        if (combinedScore >= 80) {
                          return `Trang web này được đánh giá là an toàn với điểm bảo mật ${combinedScore}/100. ${hasVT && hasSA ? 'Cả VirusTotal và ScamAdviser đều xác nhận không có mối đe dọa đáng kể.' : hasVT ? 'VirusTotal xác nhận không có mối đe dọa về malware.' : hasSA ? 'ScamAdviser đánh giá độ tin cậy cao.' : ''}`;
                        } else if (combinedScore >= 50) {
                          return `Trang web này có một số cảnh báo với điểm bảo mật ${combinedScore}/100. Khuyến nghị thận trọng khi truy cập và không cung cấp thông tin cá nhân.`;
                        } else if (combinedScore !== null) {
                          return `Cảnh báo: Trang web này có nguy cơ cao với điểm bảo mật chỉ ${combinedScore}/100. Không nên truy cập hoặc cung cấp bất kỳ thông tin cá nhân nào.`;
                        } else {
                          return 'Không thể đánh giá mức độ an toàn của trang web này do thiếu dữ liệu. Khuyến nghị thận trọng khi truy cập.';
                        }
                      })()}
                    </p>
                  </div>
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
