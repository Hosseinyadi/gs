const { dbHelpers } = require('../config/database');

class NotificationService {
  /**
   * ایجاد نوتیفیکیشن جدید
   */
  async createNotification(userId, data) {
    try {
      const { title, message, type = 'info', category = null, related_id = null } = data;

      const result = await dbHelpers.run(
        `INSERT INTO notifications 
        (user_id, title, message, type, category, related_id, is_read, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)`,
        [userId, title, message, type, category, related_id]
      );

      return {
        id: result.id,
        user_id: userId,
        title,
        message,
        type,
        category,
        related_id,
        is_read: false,
        created_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error creating notification:', error);
      throw new Error('خطا در ایجاد نوتیفیکیشن');
    }
  }

  /**
   * دریافت نوتیفیکیشن‌های کاربر
   */
  async getUserNotifications(userId, filters = {}) {
    try {
      let query = 'SELECT * FROM notifications WHERE user_id = ?';
      const params = [userId];

      if (filters.is_read !== undefined) {
        query += ' AND is_read = ?';
        params.push(filters.is_read ? 1 : 0);
      }

      if (filters.category) {
        query += ' AND category = ?';
        params.push(filters.category);
      }

      query += ' ORDER BY created_at DESC';

      if (filters.limit) {
        query += ' LIMIT ?';
        params.push(filters.limit);
      }

      const notifications = await dbHelpers.all(query, params);
      
      return notifications.map(n => ({
        ...n,
        is_read: Boolean(n.is_read)
      }));
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw new Error('خطا در دریافت نوتیفیکیشن‌ها');
    }
  }

  /**
   * خواندن یک نوتیفیکیشن
   */
  async markAsRead(notificationId, userId) {
    try {
      const result = await dbHelpers.run(
        'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
        [notificationId, userId]
      );

      if (result.changes === 0) {
        throw new Error('نوتیفیکیشن یافت نشد');
      }

      return { success: true };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * خواندن همه نوتیفیکیشن‌های کاربر
   */
  async markAllAsRead(userId) {
    try {
      await dbHelpers.run(
        'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
        [userId]
      );

      return { success: true };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw new Error('خطا در خواندن نوتیفیکیشن‌ها');
    }
  }

  /**
   * حذف نوتیفیکیشن
   */
  async deleteNotification(notificationId, userId) {
    try {
      const result = await dbHelpers.run(
        'DELETE FROM notifications WHERE id = ? AND user_id = ?',
        [notificationId, userId]
      );

      if (result.changes === 0) {
        throw new Error('نوتیفیکیشن یافت نشد');
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * دریافت تعداد نوتیفیکیشن‌های خوانده نشده
   */
  async getUnreadCount(userId) {
    try {
      const result = await dbHelpers.get(
        'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
        [userId]
      );

      return result.count;
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw new Error('خطا در دریافت تعداد نوتیفیکیشن‌ها');
    }
  }
}

module.exports = new NotificationService();


