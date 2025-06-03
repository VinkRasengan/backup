import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';

import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import PasswordStrengthIndicator from '../components/PasswordStrengthIndicator';

const schema = yup.object({
  firstName: yup
    .string()
    .min(2, 'Họ phải có ít nhất 2 ký tự')
    .max(50, 'Họ không được quá 50 ký tự')
    .required('Họ là bắt buộc'),
  lastName: yup
    .string()
    .min(2, 'Tên phải có ít nhất 2 ký tự')
    .max(50, 'Tên không được quá 50 ký tự')
    .required('Tên là bắt buộc'),
  email: yup
    .string()
    .email('Email không hợp lệ')
    .required('Email là bắt buộc'),
  password: yup
    .string()
    .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
    .matches(/[A-Z]/, 'Mật khẩu phải có ít nhất 1 chữ hoa')
    .matches(/[a-z]/, 'Mật khẩu phải có ít nhất 1 chữ thường')
    .matches(/\d/, 'Mật khẩu phải có ít nhất 1 số')
    .matches(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>?]/, 'Mật khẩu phải có ít nhất 1 ký tự đặc biệt')
    .required('Mật khẩu là bắt buộc'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Mật khẩu xác nhận không khớp')
    .required('Vui lòng xác nhận mật khẩu')
});

const ModernRegisterPage = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema)
  });

  const passwordValue = watch('password', '');

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const { confirmPassword, ...userData } = data;
      const result = await registerUser(userData);
      if (result.success) {
        navigate('/login', {
          state: {
            message: 'Đăng ký thành công! Vui lòng kiểm tra email để xác minh tài khoản trước khi đăng nhập.',
            type: 'info'
          }
        });
      }
    } finally {
      setIsLoading(false);
    }
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
          <CardHeader className="text-center pb-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4"
            >
              <User className="w-8 h-8 text-white" />
            </motion.div>
            <CardTitle className="text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Tạo Tài Khoản Mới
            </CardTitle>
            <CardDescription className="text-gray-600">
              Tham gia FactCheck để bắt đầu xác minh thông tin
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Họ"
                  placeholder="Nhập họ của bạn"
                  icon={User}
                  error={errors.firstName?.message}
                  {...register('firstName')}
                />
                <Input
                  label="Tên"
                  placeholder="Nhập tên của bạn"
                  icon={User}
                  error={errors.lastName?.message}
                  {...register('lastName')}
                />
              </div>

              {/* Email Field */}
              <Input
                label="Email"
                placeholder="Nhập địa chỉ email của bạn"
                type="email"
                icon={Mail}
                error={errors.email?.message}
                {...register('email')}
              />

              {/* Password Field */}
              <div className="space-y-2">
                <Input
                  label="Mật khẩu"
                  placeholder="Tạo mật khẩu mạnh"
                  type={showPassword ? 'text' : 'password'}
                  icon={Lock}
                  rightIcon={showPassword ? EyeOff : Eye}
                  onRightIconClick={() => setShowPassword(!showPassword)}
                  error={errors.password?.message}
                  {...register('password')}
                />
                <PasswordStrengthIndicator
                  password={passwordValue}
                  showRequirements={true}
                />
              </div>

              {/* Confirm Password Field */}
              <Input
                label="Xác nhận mật khẩu"
                placeholder="Nhập lại mật khẩu"
                type={showConfirmPassword ? 'text' : 'password'}
                icon={Lock}
                rightIcon={showConfirmPassword ? EyeOff : Eye}
                onRightIconClick={() => setShowConfirmPassword(!showConfirmPassword)}
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />

              {/* Submit Button */}
              <Button
                type="submit"
                loading={isLoading}
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                size="lg"
              >
                {!isLoading && <ArrowRight className="w-5 h-5 ml-2" />}
                Tạo Tài Khoản
              </Button>
            </form>
          </CardContent>

          <CardFooter className="justify-center">
            <p className="text-sm text-gray-600">
              Đã có tài khoản?{' '}
              <Link 
                to="/login" 
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                Đăng nhập tại đây
              </Link>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
};

export default ModernRegisterPage;
