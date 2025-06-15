import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Bell,
  Shield,
  Moon,
  Sun,
  Globe,
  Key,
  Database,
  Download,
  Trash2,
  Save,
  Eye,
  EyeOff,
  Navigation
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import TabNavigation from '../components/navigation/TabNavigation';
import NavigationTest from '../components/testing/NavigationTest';

const SettingsPage = () => {
  const { user, updateProfile } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  
  // Form states
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: user?.bio || '',
    avatar: user?.avatar || ''
  });
  
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    community: true,
    security: true
  });
  
  const [privacy, setPrivacy] = useState({
    profileVisible: true,
    activityVisible: false,
    emailVisible: false
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile(profile);
      setMessage('Cập nhật thông tin thành công!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      setMessage('Mật khẩu xác nhận không khớp!');
      return;
    }
    setLoading(true);
    try {
      // API call to change password
      setMessage('Đổi mật khẩu thành công!');
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (error) {
      setMessage('Có lỗi xảy ra khi đổi mật khẩu.');
    } finally {
      setLoading(false);
    }
  };

  const SettingSection = ({ title, children, icon: Icon }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6"
    >
      <div className="flex items-center space-x-3 mb-4">
        <Icon size={24} className="text-blue-600 dark:text-blue-400" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
      </div>
      {children}
    </motion.div>
  );

  const ToggleSwitch = ({ checked, onChange, label, description }) => (
    <div className="flex items-center justify-between py-3">
      <div>
        <div className="text-sm font-medium text-gray-900 dark:text-white">{label}</div>
        {description && (
          <div className="text-sm text-gray-500 dark:text-gray-400">{description}</div>
        )}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <TabNavigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Cài đặt</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Quản lý tài khoản và tùy chỉnh trải nghiệm của bạn
          </p>
        </div>

        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 rounded-lg ${
              message.includes('thành công') 
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            }`}
          >
            {message}
          </motion.div>
        )}

        {/* Profile Settings */}
        <SettingSection title="Thông tin cá nhân" icon={User}>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tên hiển thị
                </label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({...profile, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({...profile, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Giới thiệu
              </label>
              <textarea
                value={profile.bio}
                onChange={(e) => setProfile({...profile, bio: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Viết vài dòng về bản thân..."
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Save size={16} />
              <span>{loading ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
            </button>
          </form>
        </SettingSection>

        {/* Password Change */}
        <SettingSection title="Đổi mật khẩu" icon={Key}>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mật khẩu hiện tại
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={passwords.current}
                  onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mật khẩu mới
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={passwords.new}
                  onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Xác nhận mật khẩu
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={passwords.confirm}
                  onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Key size={16} />
              <span>{loading ? 'Đang cập nhật...' : 'Đổi mật khẩu'}</span>
            </button>
          </form>
        </SettingSection>

        {/* Theme Settings */}
        <SettingSection title="Giao diện" icon={isDarkMode ? Moon : Sun}>
          <ToggleSwitch
            checked={isDarkMode}
            onChange={toggleTheme}
            label="Chế độ tối"
            description="Sử dụng giao diện tối để bảo vệ mắt"
          />
        </SettingSection>

        {/* Notification Settings */}
        <SettingSection title="Thông báo" icon={Bell}>
          <div className="space-y-2">
            <ToggleSwitch
              checked={notifications.email}
              onChange={(value) => setNotifications({...notifications, email: value})}
              label="Email thông báo"
              description="Nhận thông báo qua email"
            />
            <ToggleSwitch
              checked={notifications.community}
              onChange={(value) => setNotifications({...notifications, community: value})}
              label="Hoạt động cộng đồng"
              description="Thông báo về bình luận và tương tác"
            />
            <ToggleSwitch
              checked={notifications.security}
              onChange={(value) => setNotifications({...notifications, security: value})}
              label="Cảnh báo bảo mật"
              description="Thông báo về hoạt động đáng ngờ"
            />
          </div>
        </SettingSection>

        {/* Privacy Settings */}
        <SettingSection title="Quyền riêng tư" icon={Shield}>
          <div className="space-y-2">
            <ToggleSwitch
              checked={privacy.profileVisible}
              onChange={(value) => setPrivacy({...privacy, profileVisible: value})}
              label="Hồ sơ công khai"
              description="Cho phép người khác xem hồ sơ của bạn"
            />
            <ToggleSwitch
              checked={privacy.activityVisible}
              onChange={(value) => setPrivacy({...privacy, activityVisible: value})}
              label="Hiển thị hoạt động"
              description="Cho phép người khác xem hoạt động của bạn"
            />
          </div>
        </SettingSection>

        {/* Navigation Test */}
        <SettingSection title="Navigation Test" icon={Database}>
          <NavigationTest />
        </SettingSection>

        {/* Data Management */}
        <SettingSection title="Quản lý dữ liệu" icon={Database}>
          <div className="space-y-4">
            <button className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
              <Download size={16} />
              <span>Tải xuống dữ liệu của tôi</span>
            </button>
            <button className="flex items-center space-x-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
              <Trash2 size={16} />
              <span>Xóa tài khoản</span>
            </button>
          </div>
        </SettingSection>
      </div>
    </div>
  );
};

export default SettingsPage;
