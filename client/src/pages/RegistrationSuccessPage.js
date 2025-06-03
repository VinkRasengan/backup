import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Mail, ArrowRight, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

const RegistrationSuccessPage = () => {
  const navigate = useNavigate();

  // Auto redirect to login after 30 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/login');
    }, 30000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mx-auto w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mb-4"
            >
              <CheckCircle className="w-10 h-10 text-white" />
            </motion.div>
            <CardTitle className="text-2xl bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Đăng Ký Thành Công!
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6 text-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-center space-x-2 text-blue-600 dark:text-blue-400">
                <Mail className="w-5 h-5" />
                <span className="font-medium">Email xác minh đã được gửi</span>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                  Chúng tôi đã gửi một email xác minh đến địa chỉ email của bạn. 
                  Vui lòng kiểm tra hộp thư (bao gồm cả thư mục spam) và click vào 
                  link xác minh để hoàn tất quá trình đăng ký.
                </p>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                  ⚠️ Quan trọng: Bạn cần xác minh email trước khi có thể đăng nhập
                </p>
              </div>

              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <p>Sau khi xác minh email thành công:</p>
                <ul className="list-disc list-inside space-y-1 text-left">
                  <li>Tài khoản của bạn sẽ được kích hoạt</li>
                  <li>Bạn có thể đăng nhập và sử dụng đầy đủ tính năng</li>
                  <li>Thông tin cá nhân sẽ được lưu vào hệ thống</li>
                </ul>
              </div>
            </motion.div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-3">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="w-full space-y-3"
            >
              <Button
                asChild
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Link to="/login">
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Đi đến trang đăng nhập
                </Link>
              </Button>
              
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Gửi lại email xác minh
              </Button>
            </motion.div>

            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Trang này sẽ tự động chuyển hướng đến trang đăng nhập sau 30 giây
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
};

export default RegistrationSuccessPage;
