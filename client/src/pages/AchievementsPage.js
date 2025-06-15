import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy,
  Star,
  Shield,
  Users,
  Target,
  Crown,
  Medal,
  Gem,
  Lock,
  CheckCircle
} from 'lucide-react';
import NavigationLayout from '../components/navigation/NavigationLayout';
import { useAuth } from '../context/AuthContext';
import { useGSAP } from '../hooks/useGSAP';
import { gsap } from '../utils/gsap';
import achievementService from '../services/achievementService';

const AchievementsPage = () => {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const containerRef = useRef(null);

  // Mock user stats
  const userStats = {
    level: 12,
    xp: 2450,
    nextLevelXp: 3000,
    totalChecks: 156,
    accurateReports: 89,
    communityVotes: 234,
    helpfulComments: 67
  };

  // Achievement categories
  const categories = [
    { id: 'all', name: 'Tất cả', icon: Trophy },
    { id: 'security', name: 'Bảo mật', icon: Shield },
    { id: 'community', name: 'Cộng đồng', icon: Users },
    { id: 'expert', name: 'Chuyên gia', icon: Star },
    { id: 'special', name: 'Đặc biệt', icon: Crown }
  ];

  // Achievements data
  const achievements = [
    {
      id: 1,
      category: 'security',
      name: 'Người bảo vệ',
      description: 'Kiểm tra 50 link thành công',
      icon: Shield,
      rarity: 'common',
      progress: 156,
      target: 50,
      unlocked: true,
      xpReward: 100,
      unlockedDate: '2024-01-15'
    },
    {
      id: 2,
      category: 'security',
      name: 'Thám tử mạng',
      description: 'Phát hiện 25 link lừa đảo',
      icon: Target,
      rarity: 'rare',
      progress: 23,
      target: 25,
      unlocked: false,
      xpReward: 250
    },
    {
      id: 3,
      category: 'community',
      name: 'Người hướng dẫn',
      description: 'Nhận 100 vote tích cực',
      icon: Users,
      rarity: 'common',
      progress: 234,
      target: 100,
      unlocked: true,
      xpReward: 150,
      unlockedDate: '2024-02-01'
    },
    {
      id: 4,
      category: 'expert',
      name: 'Chuyên gia phân tích',
      description: 'Đạt độ chính xác 95% trong 100 báo cáo',
      icon: Star,
      rarity: 'epic',
      progress: 89,
      target: 95,
      unlocked: false,
      xpReward: 500
    },
    {
      id: 5,
      category: 'special',
      name: 'Huyền thoại',
      description: 'Đạt level 50',
      icon: Crown,
      rarity: 'legendary',
      progress: 12,
      target: 50,
      unlocked: false,
      xpReward: 1000
    },
    {
      id: 6,
      category: 'community',
      name: 'Người truyền cảm hứng',
      description: 'Viết 50 bình luận hữu ích',
      icon: Medal,
      rarity: 'rare',
      progress: 67,
      target: 50,
      unlocked: true,
      xpReward: 200,
      unlockedDate: '2024-02-10'
    }
  ];

  const rarityColors = {
    common: 'from-gray-400 to-gray-600',
    rare: 'from-blue-400 to-blue-600',
    epic: 'from-purple-400 to-purple-600',
    legendary: 'from-yellow-400 to-yellow-600'
  };

  const rarityBorders = {
    common: 'border-gray-300',
    rare: 'border-blue-300',
    epic: 'border-purple-300',
    legendary: 'border-yellow-300'
  };

  // GSAP animations
  useGSAP(() => {
    if (!containerRef.current) return;

    // Animate achievement cards
    gsap.fromTo('.achievement-card',
      { opacity: 0, y: 30, scale: 0.9 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.6,
        stagger: 0.1,
        ease: "back.out(1.7)",
        scrollTrigger: {
          trigger: '.achievements-grid',
          start: "top 80%",
          end: "bottom 20%",
          toggleActions: "play none none reverse"
        }
      }
    );

    // Animate progress bars
    gsap.fromTo('.progress-fill',
      { width: 0 },
      {
        width: (index, target) => {
          const card = target.closest('.achievement-card');
          const progress = parseInt(card.dataset.progress);
          const targetValue = parseInt(card.dataset.target);
          return `${Math.min((progress / targetValue) * 100, 100)}%`;
        },
        duration: 1.5,
        ease: "power2.out",
        delay: 0.5,
        scrollTrigger: {
          trigger: '.achievements-grid',
          start: "top 80%",
          toggleActions: "play none none reverse"
        }
      }
    );
  }, []);

  const filteredAchievements = achievements.filter(achievement =>
    selectedCategory === 'all' || achievement.category === selectedCategory
  );

  const getProgressPercentage = (progress, target) => {
    return Math.min((progress / target) * 100, 100);
  };

  return (
    <NavigationLayout>
      <div ref={containerRef} className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 text-white py-20">
          <div className="max-w-6xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-12"
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Thành tích của bạn
              </h1>
              <p className="text-xl text-blue-100">
                Theo dõi tiến trình và mở khóa các huy hiệu đặc biệt
              </p>
            </motion.div>

            {/* User Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
            >
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                <div className="text-2xl font-bold">{userStats.level}</div>
                <div className="text-sm text-blue-200">Level</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                <div className="text-2xl font-bold">{userStats.totalChecks}</div>
                <div className="text-sm text-blue-200">Kiểm tra</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                <div className="text-2xl font-bold">{userStats.communityVotes}</div>
                <div className="text-sm text-blue-200">Vote</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                <div className="text-2xl font-bold">{Math.round((userStats.accurateReports / userStats.totalChecks) * 100)}%</div>
                <div className="text-sm text-blue-200">Độ chính xác</div>
              </div>
            </motion.div>

            {/* XP Progress */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="max-w-2xl mx-auto mt-8"
            >
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Level {userStats.level}</span>
                  <span className="text-sm text-blue-200">{userStats.xp}/{userStats.nextLevelXp} XP</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-3">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(userStats.xp / userStats.nextLevelXp) * 100}%` }}
                    transition={{ duration: 1.5, delay: 0.8 }}
                    className="bg-gradient-to-r from-yellow-400 to-orange-500 h-3 rounded-full"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-12">
          {/* Category Filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap gap-3 mb-8 justify-center"
          >
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    selectedCategory === category.id
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {category.name}
                </button>
              );
            })}
          </motion.div>

          {/* Achievements Grid */}
          <div className="achievements-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAchievements.map((achievement) => {
              const Icon = achievement.icon;
              const progressPercentage = getProgressPercentage(achievement.progress, achievement.target);

              return (
                <motion.div
                  key={achievement.id}
                  className={`achievement-card bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border-2 ${
                    achievement.unlocked ? rarityBorders[achievement.rarity] : 'border-gray-200 dark:border-gray-700'
                  } hover:shadow-lg transition-all duration-300 cursor-pointer ${
                    !achievement.unlocked ? 'opacity-75' : ''
                  }`}
                  data-progress={achievement.progress}
                  data-target={achievement.target}
                  onClick={() => setSelectedAchievement(achievement)}
                  whileHover={{ y: -5, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Achievement Icon */}
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${
                      achievement.unlocked ? rarityColors[achievement.rarity] : 'from-gray-300 to-gray-500'
                    } flex items-center justify-center relative`}>
                      {achievement.unlocked ? (
                        <Icon className="w-8 h-8 text-white" />
                      ) : (
                        <Lock className="w-8 h-8 text-white" />
                      )}
                      {achievement.unlocked && (
                        <CheckCircle className="absolute -top-1 -right-1 w-6 h-6 text-green-500 bg-white rounded-full" />
                      )}
                    </div>
                    <div className="text-right">
                      <div className={`text-xs font-medium px-2 py-1 rounded-full ${
                        achievement.rarity === 'legendary' ? 'bg-yellow-100 text-yellow-800' :
                        achievement.rarity === 'epic' ? 'bg-purple-100 text-purple-800' :
                        achievement.rarity === 'rare' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {achievement.rarity === 'legendary' ? 'Huyền thoại' :
                         achievement.rarity === 'epic' ? 'Sử thi' :
                         achievement.rarity === 'rare' ? 'Hiếm' : 'Thường'}
                      </div>
                    </div>
                  </div>

                  {/* Achievement Info */}
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2">
                    {achievement.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    {achievement.description}
                  </p>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">Tiến trình</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {achievement.progress}/{achievement.target}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`progress-fill h-2 rounded-full bg-gradient-to-r ${
                          achievement.unlocked ? rarityColors[achievement.rarity] : 'from-gray-400 to-gray-500'
                        }`}
                        style={{ width: '0%' }}
                      />
                    </div>
                  </div>

                  {/* Reward */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Gem className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        +{achievement.xpReward} XP
                      </span>
                    </div>
                    {achievement.unlocked && achievement.unlockedDate && (
                      <span className="text-xs text-gray-500">
                        {new Date(achievement.unlockedDate).toLocaleDateString('vi-VN')}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </NavigationLayout>
  );
};

export default AchievementsPage;
