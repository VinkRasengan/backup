import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Calendar, Edit3, Save, X, Settings, Shield, Bell, Key, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { PasswordStrengthIndicator } from '../components/common';
import toast from 'react-hot-toast';

// Validation schemas
const profileSchema = yup.object({
  firstName: yup
    .string()
    .min(2, 'Tên phải có ít nhất 2 ký tự')
    .max(50, 'Tên không được vượt quá 50 ký tự')
    .matches(/^[a-zA-ZÀ-ỹà-ỹ\s]+$/, 'Tên không được chứa ký tự đặc biệt')
    .required('Tên là bắt buộc'),
  lastName: yup
    .string()
    .min(2, 'Họ phải có ít nhất 2 ký tự')
    .max(50, 'Họ không được vượt quá 50 ký tự')
    .matches(/^[a-zA-ZÀ-ỹà-ỹ\s]+$/, 'Họ không được chứa ký tự đặc biệt')
    .required('Họ là bắt buộc'),
  bio: yup
    .string()
    .max(500, 'Tiểu sử không được vượt quá 500 ký tự')
});

const passwordSchema = yup.object({
  currentPassword: yup
    .string()
    .required('Mật khẩu hiện tại là bắt buộc'),
  newPassword: yup
    .string()
    .min(8, 'Mật khẩu mới phải có ít nhất 8 ký tự')
    .matches(/[a-z]/, 'Mật khẩu phải có ít nhất 1 chữ thường')
    .matches(/[A-Z]/, 'Mật khẩu phải có ít nhất 1 chữ hoa')
    .matches(/[0-9]/, 'Mật khẩu phải có ít nhất 1 số')
    .matches(/[^a-zA-Z0-9]/, 'Mật khẩu phải có ít nhất 1 ký tự đặc biệt')
    .required('Mật khẩu mới là bắt buộc'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('newPassword')], 'Xác nhận mật khẩu không khớp')
    .required('Xác nhận mật khẩu là bắt buộc')
});



const ProfilePage = () => {
  const { user, updateProfile, changePassword, sendPasswordResetEmail } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Profile form
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
    reset: resetProfile
  } = useForm({
    resolver: yupResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      bio: user?.profile?.bio || ''
    }
  });

  // Password form
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword,
    watch: watchPassword
  } = useForm({
    resolver: yupResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  });

  const newPassword = watchPassword('newPassword');

  // Profile handlers
  const onProfileSubmit = async (data) => {
    setIsLoading(true);
    try {
      const result = await updateProfile(data);
      if (result.success) {
        setIsEditing(false);
        toast.success('Cập nhật thông tin thành công!');
      } else {
        toast.error(result.error || 'Có lỗi xảy ra khi cập nhật thông tin');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Có lỗi xảy ra khi cập nhật thông tin');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileCancel = () => {
    resetProfile({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      bio: user?.profile?.bio || ''
    });
    setIsEditing(false);
  };

  // Password handlers
  const onPasswordSubmit = async (data) => {
    setIsPasswordLoading(true);
    try {
      const result = await changePassword(data.currentPassword, data.newPassword);
      if (result.success) {
        setIsChangingPassword(false);
        resetPassword();
        toast.success('Đổi mật khẩu thành công!');
      } else {
        toast.error(result.error || 'Có lỗi xảy ra khi đổi mật khẩu');
      }
    } catch (error) {
      console.error('Password change error:', error);
      toast.error('Có lỗi xảy ra khi đổi mật khẩu');
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const handlePasswordCancel = () => {
    resetPassword();
    setIsChangingPassword(false);
  };

  const handleForgotPassword = async () => {
    try {
      const result = await sendPasswordResetEmail(user.email);
      if (result.success) {
        toast.success('Email đặt lại mật khẩu đã được gửi!');
      } else {
        toast.error(result.error || 'Có lỗi xảy ra khi gửi email');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      toast.error('Có lỗi xảy ra khi gửi email đặt lại mật khẩu');
    }
  };

  const getInitials = () => {
    if (!user) return 'U';
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-4xl mx-auto p-4 md:p-8">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Đang tải thông tin...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Cài đặt tài khoản
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Quản lý thông tin tài khoản và tùy chọn cá nhân của bạn
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-1"
          >
            <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                {/* Avatar */}
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold shadow-lg">
                  {getInitials()}
                </div>

                {/* User Info */}
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {user.firstName} {user.lastName}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {user.email}
                </p>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {user.stats?.linksChecked || 0}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Links đã kiểm tra
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {user.stats?.chatMessages || 0}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Tin nhắn chat
                    </div>
                  </div>
                </div>

                {/* Member Since */}
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Calendar className="w-4 h-4" />
                    Thành viên từ {user.createdAt ?
                      new Date(user.createdAt).toLocaleDateString('vi-VN') :
                      'N/A'
                    }
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Settings Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Settings className="w-5 h-5 text-blue-500" />
                    Thông tin cá nhân
                  </CardTitle>
                  {!isEditing && (
                    <Button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2"
                      variant="outline"
                    >
                      <Edit3 className="w-4 h-4" />
                      Chỉnh sửa
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                {isEditing ? (
                  <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Input
                          label="Tên"
                          placeholder="Nhập tên của bạn"
                          error={profileErrors.firstName?.message}
                          {...registerProfile('firstName')}
                        />
                      </div>
                      <div>
                        <Input
                          label="Họ"
                          placeholder="Nhập họ của bạn"
                          error={profileErrors.lastName?.message}
                          {...registerProfile('lastName')}
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Tiểu sử
                      </label>
                      <textarea
                        id="bio"
                        {...registerProfile('bio')}
                        placeholder="Giới thiệu về bản thân..."
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      />
                      {profileErrors.bio && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {profileErrors.bio.message}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleProfileCancel}
                        className="flex items-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        Hủy
                      </Button>
                      <Button
                        type="submit"
                        loading={isLoading}
                        className="flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        {isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-6">
                    {/* Personal Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                          <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Họ và tên</div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {user.firstName} {user.lastName}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                          <Mail className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Email</div>
                          <div className="font-medium text-gray-900 dark:text-white relative group">
                            <span className="max-w-[17ch] truncate inline-block align-bottom cursor-pointer group-hover:underline">
                              {user.email}
                            </span>
                            <div className="absolute right-0 -top-4 z-10 hidden group-hover:block bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs px-3 py-2 rounded shadow-lg border border-gray-200 dark:border-gray-700 min-w-max"
                              style={{ transform: 'translateY(-100%)' }}>
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bio */}
                    {user.profile?.bio && (
                      <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                            <Edit3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div className="flex-1">
                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Tiểu sử</div>
                            <div className="text-gray-900 dark:text-white">
                              {user.profile.bio}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Account Security */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-green-500" />
                        Bảo mật tài khoản
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm font-medium text-green-800 dark:text-green-200">
                              Email đã xác thực
                            </span>
                          </div>
                          <p className="text-sm text-green-700 dark:text-green-300">
                            Tài khoản của bạn đã được xác thực
                          </p>
                        </div>

                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="flex items-center gap-2 mb-2">
                            <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                              Thông báo bảo mật
                            </span>
                          </div>
                          <p className="text-sm text-blue-700 dark:text-blue-300">
                            Nhận cảnh báo về hoạt động đáng ngờ
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Password Security */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          <Key className="w-5 h-5 text-orange-500" />
                          Mật khẩu
                        </h3>
                        {!isChangingPassword && (
                          <div className="flex gap-2">
                            <Button
                              onClick={handleForgotPassword}
                              variant="ghost"
                              size="sm"
                              className="text-blue-600 dark:text-blue-400"
                            >
                              Quên mật khẩu?
                            </Button>
                            <Button
                              onClick={() => setIsChangingPassword(true)}
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-2"
                            >
                              <Lock className="w-4 h-4" />
                              Đổi mật khẩu
                            </Button>
                          </div>
                        )}
                      </div>

                      {isChangingPassword ? (
                        <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Mật khẩu hiện tại
                            </label>
                            <div className="relative">
                              <input
                                type={showCurrentPassword ? 'text' : 'password'}
                                {...registerPassword('currentPassword')}
                                placeholder="Nhập mật khẩu hiện tại"
                                className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                              />
                              <button
                                type="button"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                              >
                                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                            {passwordErrors.currentPassword && (
                              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                {passwordErrors.currentPassword.message}
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Mật khẩu mới
                            </label>
                            <div className="relative">
                              <input
                                type={showNewPassword ? 'text' : 'password'}
                                {...registerPassword('newPassword')}
                                placeholder="Nhập mật khẩu mới"
                                className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                              />
                              <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                              >
                                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                            {passwordErrors.newPassword && (
                              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                {passwordErrors.newPassword.message}
                              </p>
                            )}
                            {newPassword && (
                              <div className="mt-2">
                                <PasswordStrengthIndicator password={newPassword} />
                              </div>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Xác nhận mật khẩu mới
                            </label>
                            <div className="relative">
                              <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                {...registerPassword('confirmPassword')}
                                placeholder="Nhập lại mật khẩu mới"
                                className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                              />
                              <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                              >
                                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                            {passwordErrors.confirmPassword && (
                              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                {passwordErrors.confirmPassword.message}
                              </p>
                            )}
                          </div>

                          <div className="flex gap-3 pt-4">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={handlePasswordCancel}
                              className="flex items-center gap-2"
                            >
                              <X className="w-4 h-4" />
                              Hủy
                            </Button>
                            <Button
                              type="submit"
                              loading={isPasswordLoading}
                              className="flex items-center gap-2"
                            >
                              <Save className="w-4 h-4" />
                              {isPasswordLoading ? 'Đang đổi...' : 'Đổi mật khẩu'}
                            </Button>
                          </div>
                        </form>
                      ) : (
                        <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                          <div className="flex items-center gap-2 mb-2">
                            <Lock className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                            <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
                              Mật khẩu được bảo vệ
                            </span>
                          </div>
                          <p className="text-sm text-orange-700 dark:text-orange-300">
                            Mật khẩu của bạn được mã hóa và bảo mật. Thay đổi định kỳ để tăng cường bảo mật.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
