import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp,
  writeBatch,
  getDocs
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Notification Service
 * Handles real-time notifications with Firestore
 */
class NotificationService {
  constructor() {
    this.listeners = new Map();
    this.notificationTypes = {
      VOTE: 'vote',
      COMMENT: 'comment',
      REPLY: 'reply',
      MENTION: 'mention',
      SYSTEM: 'system',
      SECURITY_ALERT: 'security_alert',
      ACHIEVEMENT: 'achievement'
    };
  }

  /**
   * Create a new notification
   */
  async createNotification({
    userId,
    type,
    title,
    message,
    data = {},
    actionUrl = null,
    priority = 'normal' // low, normal, high, urgent
  }) {
    try {
      const notification = {
        userId,
        type,
        title,
        message,
        data,
        actionUrl,
        priority,
        read: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'notifications'), notification);
      
      // Send browser notification if permission granted
      if (priority === 'high' || priority === 'urgent') {
        this.sendBrowserNotification(title, message, actionUrl);
      }

      return docRef.id;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Get notifications for a user with real-time updates
   */
  subscribeToNotifications(userId, callback, options = {}) {
    const {
      limitCount = 20,
      includeRead = true,
      types = null
    } = options;

    try {
      let q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      // Filter by read status
      if (!includeRead) {
        q = query(q, where('read', '==', false));
      }

      // Filter by types
      if (types && types.length > 0) {
        q = query(q, where('type', 'in', types));
      }

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const notifications = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate()
        }));

        callback(notifications);
      }, (error) => {
        console.error('Error listening to notifications:', error);
        callback([]);
      });

      this.listeners.set(userId, unsubscribe);
      return unsubscribe;
    } catch (error) {
      console.error('Error subscribing to notifications:', error);
      callback([]);
      return () => {};
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId) {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId) {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('read', '==', false)
      );

      const snapshot = await getDocs(q);
      const batch = writeBatch(db);

      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, {
          read: true,
          updatedAt: serverTimestamp()
        });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Get unread notification count
   */
  subscribeToUnreadCount(userId, callback) {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('read', '==', false)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        callback(snapshot.size);
      }, (error) => {
        console.error('Error getting unread count:', error);
        callback(0);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error subscribing to unread count:', error);
      callback(0);
      return () => {};
    }
  }

  /**
   * Send browser notification
   */
  async sendBrowserNotification(title, message, actionUrl = null) {
    if (!('Notification' in window)) {
      return;
    }

    if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body: message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'factcheck-notification',
        requireInteraction: true
      });

      if (actionUrl) {
        notification.onclick = () => {
          window.focus();
          window.location.href = actionUrl;
          notification.close();
        };
      }

      // Auto close after 5 seconds
      setTimeout(() => notification.close(), 5000);
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        this.sendBrowserNotification(title, message, actionUrl);
      }
    }
  }

  /**
   * Create notification for vote
   */
  async notifyVote(postId, postTitle, voterEmail, voteType, postAuthorId) {
    if (!postAuthorId) return;

    const title = `Bài viết của bạn nhận được ${voteType === 'safe' ? 'vote tích cực' : 'vote tiêu cực'}`;
    const message = `${voterEmail} đã vote "${postTitle}" là ${voteType === 'safe' ? 'an toàn' : 'không an toàn'}`;

    return this.createNotification({
      userId: postAuthorId,
      type: this.notificationTypes.VOTE,
      title,
      message,
      data: { postId, voterEmail, voteType },
      actionUrl: `/community?post=${postId}`,
      priority: 'normal'
    });
  }

  /**
   * Create notification for comment
   */
  async notifyComment(postId, postTitle, commenterEmail, commentText, postAuthorId) {
    if (!postAuthorId) return;

    const title = 'Bình luận mới trên bài viết của bạn';
    const message = `${commenterEmail} đã bình luận: "${commentText.substring(0, 50)}..."`;

    return this.createNotification({
      userId: postAuthorId,
      type: this.notificationTypes.COMMENT,
      title,
      message,
      data: { postId, commenterEmail, commentText },
      actionUrl: `/community?post=${postId}#comments`,
      priority: 'normal'
    });
  }

  /**
   * Create system notification
   */
  async notifySystem(userId, title, message, priority = 'normal') {
    return this.createNotification({
      userId,
      type: this.notificationTypes.SYSTEM,
      title,
      message,
      priority
    });
  }

  /**
   * Create security alert notification
   */
  async notifySecurityAlert(userId, alertType, details) {
    const title = 'Cảnh báo bảo mật';
    const message = `Phát hiện ${alertType}: ${details}`;

    return this.createNotification({
      userId,
      type: this.notificationTypes.SECURITY_ALERT,
      title,
      message,
      data: { alertType, details },
      priority: 'high'
    });
  }

  /**
   * Cleanup listeners
   */
  cleanup(userId) {
    const unsubscribe = this.listeners.get(userId);
    if (unsubscribe) {
      unsubscribe();
      this.listeners.delete(userId);
    }
  }

  /**
   * Cleanup all listeners
   */
  cleanupAll() {
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners.clear();
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;
