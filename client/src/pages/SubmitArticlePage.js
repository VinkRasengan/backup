import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Globe, 
  FileText, 
  Tag, 
  Clipboard, 
  CheckCircle,
  AlertTriangle,
  XCircle,
  Shield
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { linkAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';
import { auth } from '../config/firebase';

import { normalizeUrl } from '../utils/urlUtils';

const schema = yup.object({
  url: yup
    .string()
    .required('URL là bắt buộc')
    .transform((value) => normalizeUrl(value))
    .test('is-valid-url', 'Vui lòng nhập URL hợp lệ', (value) => {
      if (!value) return false;
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    }),
  title: yup
    .string()
    .min(10, 'Tiêu đề phải có ít nhất 10 ký tự')
    .max(200, 'Tiêu đề không được quá 200 ký tự'),
  description: yup
    .string()
    .max(500, 'Mô tả không được quá 500 ký tự'),
  category: yup
    .string()
    .required('Vui lòng chọn danh mục')
});

const SubmitArticlePage = () => {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [checkResult, setCheckResult] = useState(null);
  const [step, setStep] = useState(1); // 1: Form, 2: Verification, 3: Success

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      category: ''
    }
  });

  const watchedUrl = watch('url');

  const categories = [
    { value: 'politics', label: '🏛️ Chính trị' },
    { value: 'health', label: '🏥 Sức khỏe' },
    { value: 'technology', label: '💻 Công nghệ' },
    { value: 'education', label: '📚 Giáo dục' },
    { value: 'economy', label: '💰 Kinh tế' },
    { value: 'society', label: '👥 Xã hội' },
    { value: 'environment', label: '🌍 Môi trường' },
    { value: 'sports', label: '⚽ Thể thao' },
    { value: 'entertainment', label: '🎭 Giải trí' },
    { value: 'other', label: '📰 Khác' }
  ];

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.startsWith('http')) {
        setValue('url', text);
        toast.success('Đã dán URL từ clipboard!');

        // Auto-extract title if possible
        try {
          const domain = new URL(text).hostname;
          if (!watch('title')) {
            setValue('title', `Bài viết từ ${domain}`);
          }
        } catch (e) {
          // Ignore URL parsing errors
        }
      } else {
        toast.error('Clipboard không chứa URL hợp lệ');
      }
    } catch (error) {
      console.error('Clipboard access error:', error);
      toast.error('Không thể truy cập clipboard');
    }
  };



  const checkArticle = async () => {
    if (!watchedUrl) {
      toast.error('Vui lòng nhập URL trước');
      return;
    }

    setIsLoading(true);
    try {
      const response = await linkAPI.checkLink(watchedUrl);
      setCheckResult(response.data.result);
      setStep(2);
      toast.success('Đã kiểm tra bài viết thành công!');
    } catch (error) {
      console.error('Error checking article:', error);
      toast.error('Không thể kiểm tra bài viết');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data) => {
    console.log('📝 onSubmit called with data:', data);
    console.log('📝 checkResult exists:', !!checkResult);
    console.log('📝 current step:', step);
    
    if (!checkResult) {
      console.log('📝 No checkResult, calling checkArticle...');
      await checkArticle();
      return;
    }

    console.log('📝 Starting submission process...');
    setIsLoading(true);

    // Add timeout warning after 10 seconds
    const timeoutWarning = setTimeout(() => {
      toast.info('Đang xử lý yêu cầu, vui lòng đợi...', { duration: 5000 });
    }, 10000);

    try {
      // Submit article to community
      // Map status from checkResult to expected values
      const mapStatus = (status, credibilityScore) => {
        if (status === 'completed') {
          // Map based on credibility score
          if (credibilityScore >= 80) return 'safe';
          if (credibilityScore >= 50) return 'warning';
          return 'dangerous';
        }
        return status; // Keep original if already mapped
      };

      const articleData = {
        ...data,
        content: data.description || data.title || 'No description provided', // Backend expects 'content' field
        checkResult,
        credibilityScore: checkResult.credibilityScore || checkResult.finalScore,
        securityScore: checkResult.securityScore,
        status: mapStatus(checkResult.status, checkResult.credibilityScore || checkResult.finalScore)
      };

      // Submit to community API endpoint with Firebase token
      console.log('👤 Current user:', user);
      if (!user) {
        toast.error('Bạn cần đăng nhập để gửi bài viết');
        setIsLoading(false);
        return;
      }

      // Get Firebase user and token
      const firebaseUser = auth.currentUser;
      console.log('🔥 Firebase user:', firebaseUser);
      console.log('🔥 Firebase user UID:', firebaseUser?.uid);
      console.log('🔥 Firebase user email:', firebaseUser?.email);

      if (!firebaseUser) {
        toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        setIsLoading(false);
        return;
      }

      // Force refresh token to ensure it's valid with timeout protection
      console.log('🔄 Getting fresh Firebase token...');
      const tokenPromise = firebaseUser.getIdToken(true);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Firebase token refresh timed out')), 10000)
      );
      const token = await Promise.race([tokenPromise, timeoutPromise]);
      
      // Store the token in localStorage so communityAPI can access it
      if (token) {
        localStorage.setItem('firebaseToken', token);
        console.log('💾 Stored Firebase token in localStorage');
      }
      
      console.log('🚀 Submitting to community:', articleData);
      console.log('🔑 Using Firebase token:', token ? `${token.substring(0, 20)}...` : 'No token found');
      console.log('🔑 Token length:', token ? token.length : 0);
      console.log('🔑 Token is valid JWT:', token && token.split('.').length === 3);

      // Test token validity by decoding header
      if (token) {
        try {
          const tokenParts = token.split('.');
          const header = JSON.parse(atob(tokenParts[0]));
          const payload = JSON.parse(atob(tokenParts[1]));
          console.log('🔍 Token header:', header);
          console.log('🔍 Token payload (user):', payload.uid, payload.email);
          console.log('🔍 Token expiry:', new Date(payload.exp * 1000));
        } catch (e) {
          console.error('❌ Failed to decode token:', e);
        }
      }

      console.log('🌐 Making request to backend API');
      console.log('📦 Request payload:', JSON.stringify(articleData, null, 2));
      console.log('🔑 Token length:', token ? token.length : 'No token');

      try {
        // Test API connectivity first
        console.log('🧪 Testing API connectivity...');
        const testResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/health`);
        console.log('🧪 API health check status:', testResponse.status);
        
        // Use communityAPI service with correct endpoint
        console.log('📡 Importing communityAPI...');
        const { communityAPI } = await import('../services/api');
        console.log('📡 communityAPI imported:', communityAPI);
        
        console.log('🚀 Calling submitToCommunity with data:', articleData);
        const response = await communityAPI.submitToCommunity(articleData);

        console.log('✅ Submit success:', response);

        // Trigger community refresh
        localStorage.setItem('newCommunitySubmission', Date.now().toString());

        setStep(3);
        toast.success('Bài viết đã được gửi đến cộng đồng!');
        setTimeout(() => {
          navigate('/community');
        }, 2000);
      } catch (fetchError) {
        console.error('❌ API error:', fetchError);
        console.error('❌ Error type:', fetchError.constructor.name);
        console.error('❌ Error message:', fetchError.message);
        console.error('❌ Error stack:', fetchError.stack);
        console.error('❌ Response status:', fetchError.response?.status);
        console.error('❌ Response data:', fetchError.response?.data);

        // Show error toast
        toast.error(fetchError.message || 'Không thể gửi bài viết');
        // Don't return here - let finally block handle loading state
        throw fetchError;
      }
    } catch (error) {
      console.error('Error submitting article:', error);
      toast.error('Không thể gửi bài viết');
    } finally {
      clearTimeout(timeoutWarning);
      setIsLoading(false);
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

  if (step === 3) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Thành công!
          </h1>
          <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
            Bài viết đã được gửi đến cộng đồng để đánh giá
          </p>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Đang chuyển hướng đến trang cộng đồng...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-white" />
          </div>
          <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Gửi bài viết đến cộng đồng
          </h1>
          <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Chia sẻ bài viết để cộng đồng cùng đánh giá độ tin cậy
          </p>
        </motion.div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              1
            </div>
            <div className={`w-16 h-1 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              2
            </div>
            <div className={`w-16 h-1 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              3
            </div>
          </div>
        </div>

        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <CardHeader>
                <CardTitle className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                  Thông tin bài viết
                </CardTitle>
                <CardDescription>
                  Nhập thông tin về bài viết bạn muốn chia sẻ
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* URL Input */}
                  <div className="space-y-2">
                    <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                      URL bài viết *
                    </label>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Input
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
                        onClick={pasteFromClipboard}
                        className="h-12"
                      >
                        <Clipboard className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Title Input */}
                  <div className="space-y-2">
                    <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                      Tiêu đề bài viết
                    </label>
                    <Input
                      placeholder="Nhập tiêu đề bài viết (tùy chọn)"
                      icon={FileText}
                      error={errors.title?.message}
                      {...register('title')}
                    />
                  </div>

                  {/* Category Select */}
                  <div className="space-y-2">
                    <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                      Danh mục *
                    </label>
                    <select
                      {...register('category')}
                      className={`w-full px-4 py-3 rounded-lg border ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    >
                      <option value="">Chọn danh mục</option>
                      {categories.map(category => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                    {errors.category && (
                      <p className="text-red-500 text-sm">{errors.category.message}</p>
                    )}
                  </div>

                  {/* Description Input */}
                  <div className="space-y-2">
                    <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                      Mô tả (tùy chọn)
                    </label>
                    <textarea
                      {...register('description')}
                      placeholder="Mô tả ngắn về bài viết..."
                      rows={3}
                      className={`w-full px-4 py-3 rounded-lg border ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      } focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none`}
                    />
                    {errors.description && (
                      <p className="text-red-500 text-sm">{errors.description.message}</p>
                    )}
                  </div>

                  <Button
                    type="button"
                    onClick={checkArticle}
                    loading={isLoading}
                    className="w-full"
                    disabled={!watchedUrl}
                  >
                    <Shield className="w-5 h-5 mr-2" />
                    Kiểm tra và tiếp tục
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 2 && checkResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Verification Result */}
            <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <CardHeader>
                <CardTitle className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                  Kết quả kiểm tra
                </CardTitle>
                <CardDescription>
                  Xem lại thông tin trước khi gửi đến cộng đồng
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {/* Overall Status */}
                  <div className="text-center">
                    {(() => {
                      const statusInfo = getStatusInfo(checkResult.status);
                      const StatusIcon = statusInfo.icon;
                      return (
                        <div className={`inline-flex flex-col items-center gap-2 px-4 py-3 rounded-lg ${statusInfo.bgColor}`}>
                          <StatusIcon className={`w-8 h-8 ${statusInfo.textColor}`} />
                          <span className={`font-medium ${statusInfo.textColor}`}>
                            {statusInfo.text}
                          </span>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Credibility Score */}
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {checkResult.credibilityScore || checkResult.finalScore}/100
                    </div>
                    <div className="text-sm text-gray-500">Điểm tin cậy</div>
                  </div>

                  {/* Security Score */}
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {checkResult.securityScore}/100
                    </div>
                    <div className="text-sm text-gray-500">Điểm bảo mật</div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1"
                  >
                    Quay lại
                  </Button>
                  <Button
                    onClick={async () => {
                      console.log('🔘 Button "Gửi đến cộng đồng" clicked');
                      const formData = {
                        url: watchedUrl,
                        title: watch('title'),
                        category: watch('category'), 
                        description: watch('description')
                      };
                      console.log('🔘 Form data:', formData);
                      await onSubmit(formData);
                    }}
                    loading={isLoading}
                    className="flex-1"
                  >
                    Gửi đến cộng đồng
                  </Button>
                  <Button
                    onClick={() => {
                      console.log('🐛 DEBUG INFO:');
                      console.log('🐛 watchedUrl:', watchedUrl);
                      console.log('🐛 watch title:', watch('title'));
                      console.log('🐛 watch category:', watch('category'));
                      console.log('🐛 watch description:', watch('description'));
                      console.log('🐛 checkResult:', checkResult);
                      console.log('🐛 step:', step);
                      console.log('🐛 isLoading:', isLoading);
                    }}
                    variant="secondary"
                    className="px-4"
                  >
                    Debug
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SubmitArticlePage;

// Debug helper function to test API connectivity
window.testSubmitAPI = async () => {
  console.log('🧪 Testing Submit API...');
  
  try {
    // Test API Gateway health
    const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
    console.log('🌐 Testing API Gateway at:', baseURL);
    
    const healthResponse = await fetch(`${baseURL}/health`);
    console.log('🩺 Health check status:', healthResponse.status);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('🩺 Health data:', healthData);
    }
    
    // Test community API
    const { communityAPI } = await import('../services/api');
    console.log('📡 CommunityAPI imported successfully');
    
    // Test auth headers
    const headers = await communityAPI.getAuthHeaders();
    console.log('🔑 Auth headers:', headers);
    
    return { success: true, message: 'API tests passed' };
  } catch (error) {
    console.error('❌ API test failed:', error);
    return { success: false, error: error.message };
  }
};

// Test complete submit flow
window.testCompleteSubmitFlow = async () => {
  console.log('🔥 Testing Complete Submit Flow...');
  
  try {
    // 1. Test Firebase auth
    const { auth } = await import('../config/firebase');
    const user = auth.currentUser;
    
    if (!user) {
      console.error('❌ No Firebase user logged in');
      return { success: false, error: 'User not logged in' };
    }
    
    console.log('✅ Firebase user:', user.uid, user.email);
    
    // 2. Test token refresh
    const token = await user.getIdToken(true);
    console.log('✅ Firebase token refreshed:', token.substring(0, 30) + '...');
    
    // Store token
    localStorage.setItem('firebaseToken', token);
    
    // 3. Test community API
    const { communityAPI } = await import('../services/api');
    
    // 4. Test submit with real data
    const testArticleData = {
      url: "https://example.com/test-article",
      title: "Test Article From Debug",
      content: "This is a test article submitted via debug function",
      category: "technology",
      checkResult: {
        status: "safe",
        credibilityScore: 85,
        securityScore: 90
      },
      credibilityScore: 85,
      securityScore: 90,
      status: "safe"
    };
    
    console.log('🚀 Submitting test article:', testArticleData);
    
    const response = await communityAPI.submitToCommunity(testArticleData);
    console.log('✅ Submit successful:', response);
    
    return { success: true, response };
    
  } catch (error) {
    console.error('❌ Complete submit flow failed:', error);
    console.error('❌ Stack:', error.stack);
    return { success: false, error: error.message };
  }
};

// Test complete submit flow
window.testCompleteSubmitFlow = async () => {
  console.log('🔥 Testing Complete Submit Flow...');
  
  try {
    // 1. Test Firebase auth
    const { auth } = await import('../config/firebase');
    const user = auth.currentUser;
    
    if (!user) {
      console.error('❌ No Firebase user logged in');
      return { success: false, error: 'User not logged in' };
    }
    
    console.log('✅ Firebase user:', user.uid, user.email);
    
    // 2. Test token refresh
    const token = await user.getIdToken(true);
    console.log('✅ Firebase token refreshed:', token.substring(0, 30) + '...');
    
    // Store token
    localStorage.setItem('firebaseToken', token);
    
    // 3. Test community API
    const { communityAPI } = await import('../services/api');
    
    // 4. Test submit with real data
    const testArticleData = {
      url: "https://example.com/test-article",
      title: "Test Article From Debug",
      content: "This is a test article submitted via debug function",
      category: "technology",
      checkResult: {
        status: "safe",
        credibilityScore: 85,
        securityScore: 90
      },
      credibilityScore: 85,
      securityScore: 90,
      status: "safe"
    };
    
    console.log('🚀 Submitting test article:', testArticleData);
    
    const response = await communityAPI.submitToCommunity(testArticleData);
    console.log('✅ Submit successful:', response);
    
    return { success: true, response };
    
  } catch (error) {
    console.error('❌ Complete submit flow failed:', error);
    console.error('❌ Stack:', error.stack);
    return { success: false, error: error.message };
  }
};
