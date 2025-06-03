import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight } from 'lucide-react';

import { EnhancedInput } from '../components/ui/EnhancedInput';
import { FormField } from '../components/ui/FormField';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

const TestRegisterPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleInputChange = (field) => (e) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <User className="w-8 h-8 text-white" />
            </motion.div>
            <CardTitle className="text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Test Form Đăng Ký
            </CardTitle>
            <CardDescription className="text-gray-600">
              Kiểm tra hiển thị tên trường trong form
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <form className="space-y-4">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-3">
                <EnhancedInput
                  label="Họ"
                  placeholder="Nhập họ của bạn"
                  icon={User}
                  required={true}
                  helperText="Họ và tên đệm"
                  value={formData.firstName}
                  onChange={handleInputChange('firstName')}
                />
                <EnhancedInput
                  label="Tên"
                  placeholder="Nhập tên của bạn"
                  icon={User}
                  required={true}
                  helperText="Tên riêng của bạn"
                  value={formData.lastName}
                  onChange={handleInputChange('lastName')}
                />
              </div>

              {/* Email Field */}
              <EnhancedInput
                label="Email"
                placeholder="Nhập địa chỉ email của bạn"
                type="email"
                icon={Mail}
                required={true}
                helperText="Sử dụng email thật để xác minh tài khoản"
                value={formData.email}
                onChange={handleInputChange('email')}
              />

              {/* Password Field */}
              <EnhancedInput
                label="Mật khẩu"
                placeholder="Tạo mật khẩu mạnh"
                type={showPassword ? 'text' : 'password'}
                icon={Lock}
                rightIcon={showPassword ? EyeOff : Eye}
                onRightIconClick={() => setShowPassword(!showPassword)}
                required={true}
                helperText="Tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt"
                value={formData.password}
                onChange={handleInputChange('password')}
              />

              {/* Confirm Password Field */}
              <EnhancedInput
                label="Xác nhận mật khẩu"
                placeholder="Nhập lại mật khẩu"
                type={showConfirmPassword ? 'text' : 'password'}
                icon={Lock}
                rightIcon={showConfirmPassword ? EyeOff : Eye}
                onRightIconClick={() => setShowConfirmPassword(!showConfirmPassword)}
                required={true}
                helperText="Nhập lại mật khẩu để xác nhận"
                value={formData.confirmPassword}
                onChange={handleInputChange('confirmPassword')}
              />

              {/* Test FormField Component */}
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Test FormField Component:</h3>
                <FormField
                  label="Số điện thoại"
                  description="Tùy chọn"
                  required={false}
                  placeholder="Nhập số điện thoại"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="button"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                onClick={() => console.log('Form data:', formData)}
              >
                Kiểm tra dữ liệu
                <ArrowRight size={20} />
              </Button>
            </form>

            {/* Display current form data */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Dữ liệu hiện tại:</h4>
              <pre className="text-xs text-gray-600 overflow-auto">
                {JSON.stringify(formData, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default TestRegisterPage;
