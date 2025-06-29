import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  orderBy,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import notificationService from './notificationService';

/**
 * Achievement Service
 * Manages user achievements, badges, and progress tracking
 */
class AchievementService {
  constructor() {
    this.achievements = {
      // Community achievements
      FIRST_POST: {
        id: 'first_post',
        name: 'Người đóng góp đầu tiên',
        description: 'Tạo bài viết đầu tiên trong cộng đồng',
        icon: '📝',
        category: 'community',
        points: 10,
        condition: { type: 'posts_count', value: 1 }
      },
      ACTIVE_CONTRIBUTOR: {
        id: 'active_contributor',
        name: 'Người đóng góp tích cực',
        description: 'Tạo 10 bài viết trong cộng đồng',
        icon: '🏆',
        category: 'community',
        points: 50,
        condition: { type: 'posts_count', value: 10 }
      },
      COMMUNITY_LEADER: {
        id: 'community_leader',
        name: 'Lãnh đạo cộng đồng',
        description: 'Tạo 50 bài viết và nhận 100 votes tích cực',
        icon: '👑',
        category: 'community',
        points: 200,
        condition: { type: 'posts_and_votes', posts: 50, votes: 100 }
      },

      // Security achievements
      SECURITY_GUARDIAN: {
        id: 'security_guardian',
        name: 'Người bảo vệ',
        description: 'Báo cáo 5 link lừa đảo',
        icon: '🛡️',
        category: 'security',
        points: 30,
        condition: { type: 'reports_count', value: 5 }
      },
      FRAUD_HUNTER: {
        id: 'fraud_hunter',
        name: 'Thợ săn lừa đảo',
        description: 'Báo cáo 25 link lừa đảo',
        icon: '🕵️',
        category: 'security',
        points: 100,
        condition: { type: 'reports_count', value: 25 }
      },

      // Engagement achievements
      HELPFUL_VOTER: {
        id: 'helpful_voter',
        name: 'Người vote hữu ích',
        description: 'Vote cho 50 bài viết',
        icon: '👍',
        category: 'engagement',
        points: 25,
        condition: { type: 'votes_given', value: 50 }
      },
      COMMENT_MASTER: {
        id: 'comment_master',
        name: 'Bậc thầy bình luận',
        description: 'Viết 100 bình luận hữu ích',
        icon: '💬',
        category: 'engagement',
        points: 75,
        condition: { type: 'comments_count', value: 100 }
      },

      // Streak achievements
      DAILY_VISITOR: {
        id: 'daily_visitor',
        name: 'Khách thường xuyên',
        description: 'Truy cập 7 ngày liên tiếp',
        icon: '📅',
        category: 'streak',
        points: 20,
        condition: { type: 'daily_streak', value: 7 }
      },
      DEDICATED_USER: {
        id: 'dedicated_user',
        name: 'Người dùng tận tâm',
        description: 'Truy cập 30 ngày liên tiếp',
        icon: '🔥',
        category: 'streak',
        points: 100,
        condition: { type: 'daily_streak', value: 30 }
      }
    };
  }

  /**
   * Get user achievements and progress
   */
  async getUserAchievements(userId) {
    try {
      const userAchievementsRef = doc(db, 'userAchievements', userId);
      const userAchievementsDoc = await getDoc(userAchievementsRef);
      
      if (!userAchievementsDoc.exists()) {
        // Initialize user achievements
        const initialData = {
          userId,
          unlockedAchievements: [],
          progress: {},
          totalPoints: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        await setDoc(userAchievementsRef, initialData);
        return initialData;
      }
      
      return {
        id: userAchievementsDoc.id,
        ...userAchievementsDoc.data()
      };
    } catch (error) {
      console.error('Error getting user achievements:', error);
      throw error;
    }
  }

  /**
   * Update user progress and check for new achievements
   */
  async updateProgress(userId, progressType, value = 1) {
    try {
      const userAchievementsRef = doc(db, 'userAchievements', userId);
      const userAchievements = await this.getUserAchievements(userId);
      
      // Update progress
      const currentProgress = userAchievements.progress || {};
      currentProgress[progressType] = (currentProgress[progressType] || 0) + value;
      
      // Check for new achievements
      const newAchievements = this.checkAchievements(currentProgress, userAchievements.unlockedAchievements || []);
      
      // Update document
      const updateData = {
        progress: currentProgress,
        updatedAt: serverTimestamp()
      };
      
      if (newAchievements.length > 0) {
        updateData.unlockedAchievements = [
          ...(userAchievements.unlockedAchievements || []),
          ...newAchievements.map(a => a.id)
        ];
        
        // Calculate total points
        const totalPoints = updateData.unlockedAchievements.reduce((sum, achievementId) => {
          const achievement = Object.values(this.achievements).find(a => a.id === achievementId);
          return sum + (achievement?.points || 0);
        }, 0);
        
        updateData.totalPoints = totalPoints;
        
        // Send notifications for new achievements
        for (const achievement of newAchievements) {
          await notificationService.createNotification({
            userId,
            type: 'achievement',
            title: 'Thành tích mới!',
            message: `Bạn đã đạt được "${achievement.name}"`,
            data: { achievementId: achievement.id },
            priority: 'normal'
          });
        }
      }
      
      await updateDoc(userAchievementsRef, updateData);
      
      return {
        newAchievements,
        totalProgress: currentProgress,
        totalPoints: updateData.totalPoints || userAchievements.totalPoints || 0
      };
    } catch (error) {
      console.error('Error updating progress:', error);
      throw error;
    }
  }

  /**
   * Check which achievements should be unlocked
   */
  checkAchievements(progress, unlockedAchievements) {
    const newAchievements = [];
    
    for (const achievement of Object.values(this.achievements)) {
      // Skip if already unlocked
      if (unlockedAchievements.includes(achievement.id)) {
        continue;
      }
      
      // Check condition
      if (this.checkAchievementCondition(achievement.condition, progress)) {
        newAchievements.push(achievement);
      }
    }
    
    return newAchievements;
  }

  /**
   * Check if achievement condition is met
   */
  checkAchievementCondition(condition, progress) {
    switch (condition.type) {
      case 'posts_count':
        return (progress.posts_count || 0) >= condition.value;
      
      case 'reports_count':
        return (progress.reports_count || 0) >= condition.value;
      
      case 'votes_given':
        return (progress.votes_given || 0) >= condition.value;
      
      case 'comments_count':
        return (progress.comments_count || 0) >= condition.value;
      
      case 'daily_streak':
        return (progress.daily_streak || 0) >= condition.value;
      
      case 'posts_and_votes':
        return (progress.posts_count || 0) >= condition.posts && 
               (progress.votes_received || 0) >= condition.votes;
      
      default:
        return false;
    }
  }

  /**
   * Get achievement by ID
   */
  getAchievement(achievementId) {
    return Object.values(this.achievements).find(a => a.id === achievementId);
  }

  /**
   * Get all achievements
   */
  getAllAchievements() {
    return Object.values(this.achievements);
  }

  /**
   * Get achievements by category
   */
  getAchievementsByCategory(category) {
    return Object.values(this.achievements).filter(a => a.category === category);
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(limit = 10) {
    try {
      const q = query(
        collection(db, 'userAchievements'),
        orderBy('totalPoints', 'desc'),
        limit(limit)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      return [];
    }
  }

  /**
   * Track specific events
   */
  async trackEvent(userId, eventType, data = {}) {
    switch (eventType) {
      case 'post_created':
        await this.updateProgress(userId, 'posts_count', 1);
        break;
      
      case 'vote_submitted':
        await this.updateProgress(userId, 'votes_given', 1);
        break;
      
      case 'vote_received':
        await this.updateProgress(userId, 'votes_received', 1);
        break;
      
      case 'comment_posted':
        await this.updateProgress(userId, 'comments_count', 1);
        break;
      
      case 'report_submitted':
        await this.updateProgress(userId, 'reports_count', 1);
        break;
      
      case 'daily_visit':
        await this.updateDailyStreak(userId);
        break;
      
      default:
        console.warn('Unknown event type:', eventType);
    }
  }

  /**
   * Update daily streak
   */
  async updateDailyStreak(userId) {
    try {
      const userAchievementsRef = doc(db, 'userAchievements', userId);
      const userAchievements = await this.getUserAchievements(userId);
      
      const today = new Date().toDateString();
      const lastVisit = userAchievements.lastVisitDate;
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
      
      let newStreak = 1;
      
      if (lastVisit === today) {
        // Already visited today
        return;
      } else if (lastVisit === yesterday) {
        // Consecutive day
        newStreak = (userAchievements.progress?.daily_streak || 0) + 1;
      }
      
      await updateDoc(userAchievementsRef, {
        lastVisitDate: today,
        [`progress.daily_streak`]: newStreak,
        updatedAt: serverTimestamp()
      });
      
      // Check for streak achievements
      await this.updateProgress(userId, 'daily_streak', 0); // Just trigger check without incrementing
    } catch (error) {
      console.error('Error updating daily streak:', error);
    }
  }
}

// Create singleton instance
const achievementService = new AchievementService();

export default achievementService;
