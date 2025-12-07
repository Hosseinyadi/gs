/**
 * سرویس اعلان‌های Real-time
 * مدیریت اعلان‌های کاربران
 */

const { db } = require('../config/database');

const NotificationTypes = {
    LISTING_APPROVED: 'listing_approved',
    LISTING_REJECTED: 'listing_rejected',
    LISTING_EXPIRING: 'listing_expiring',
    LISTING_EXPIRED: 'listing_expired',
    FEATURED_EXPIRING: 'featured_expiring',
    FEATURED_EXPIRED: 'featured_expired',
    PAYMENT_CONFIRMED: 'payment_confirmed',
    RENEWAL_REMINDER: 'renewal_reminder',
    RENEWAL_APPROVED: 'renewal_approved',
    RENEWAL_REJECTED: 'renewal_rejected',
    NEW_MESSAGE: 'new_message',
    SYSTEM: 'system'
};

const NotificationTitles = {
    [NotificationTypes.LISTING_APPROVED]: 'آگهی تایید شد',
    [NotificationTypes.LISTING_REJECTED]: 'آگهی رد شد',
    [NotificationTypes.LISTING_EXPIRING]: 'آگهی در حال انقضا',
    [NotificationTypes.LISTING_EXPIRED]: 'آگهی منقضی شد',
    [NotificationTypes.FEATURED_EXPIRING]: 'ویژه در حال انقضا',
    [NotificationTypes.FEATURED_EXPIRED]: 'ویژه منقضی شد',
    [NotificationTypes.PAYMENT_CONFIRMED]: 'پرداخت تایید شد',
    [NotificationTypes.RENEWAL_REMINDER]: 'یادآوری تمدید',
    [NotificationTypes.RENEWAL_APPROVED]: 'تمدید تایید شد',
    [NotificationTypes.RENEWAL_REJECTED]: 'تمدید رد شد',
    [NotificationTypes.NEW_MESSAGE]: 'پیام جدید',
    [NotificationTypes.SYSTEM]: 'اعلان سیستم'
};

class NotificationService {
    /**
     * ایجاد اعلان جدید
     */
    static async create(userId, type, message, data = null) {
        return new Promise((resolve, reject) => {
            const title = NotificationTitles[type] || 'اعلان';
            const dataJson = data ? JSON.stringify(data) : null;
            
            db.run(
                `INSERT INTO user_notifications (user_id, type, title, message, data) VALUES (?, ?, ?, ?, ?)`,
                [userId, type, title, message, dataJson],
                function(err) {
                    if (err) {
                        console.error('Error creating notification:', err);
                        return reject(err);
                    }
                    resolve({ id: this.lastID, userId, type, title, message, data });
                }
            );
        });
    }

    /**
     * دریافت اعلان‌های کاربر
     */
    static async getUserNotifications(userId, options = {}) {
        const { limit = 20, offset = 0, unreadOnly = false } = options;
        
        return new Promise((resolve, reject) => {
            let query = `SELECT * FROM user_notifications WHERE user_id = ?`;
            const params = [userId];
            
            if (unreadOnly) {
                query += ` AND is_read = 0`;
            }
            
            query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
            params.push(limit, offset);
            
            db.all(query, params, (err, rows) => {
                if (err) return reject(err);
                
                // Parse JSON data
                const notifications = rows.map(row => ({
                    ...row,
                    data: row.data ? JSON.parse(row.data) : null
                }));
                
                resolve(notifications);
            });
        });
    }

    /**
     * تعداد اعلان‌های خوانده نشده
     */
    static async getUnreadCount(userId) {
        return new Promise((resolve, reject) => {
            db.get(
                `SELECT COUNT(*) as count FROM user_notifications WHERE user_id = ? AND is_read = 0`,
                [userId],
                (err, row) => {
                    if (err) return reject(err);
                    resolve(row?.count || 0);
                }
            );
        });
    }

    /**
     * علامت‌گذاری به عنوان خوانده شده
     */
    static async markAsRead(notificationId, userId) {
        return new Promise((resolve, reject) => {
            db.run(
                `UPDATE user_notifications SET is_read = 1, read_at = datetime('now') WHERE id = ? AND user_id = ?`,
                [notificationId, userId],
                function(err) {
                    if (err) return reject(err);
                    resolve(this.changes > 0);
                }
            );
        });
    }

    /**
     * علامت‌گذاری همه به عنوان خوانده شده
     */
    static async markAllAsRead(userId) {
        return new Promise((resolve, reject) => {
            db.run(
                `UPDATE user_notifications SET is_read = 1, read_at = datetime('now') WHERE user_id = ? AND is_read = 0`,
                [userId],
                function(err) {
                    if (err) return reject(err);
                    resolve(this.changes);
                }
            );
        });
    }

    /**
     * حذف اعلان
     */
    static async delete(notificationId, userId) {
        return new Promise((resolve, reject) => {
            db.run(
                `DELETE FROM user_notifications WHERE id = ? AND user_id = ?`,
                [notificationId, userId],
                function(err) {
                    if (err) return reject(err);
                    resolve(this.changes > 0);
                }
            );
        });
    }

    /**
     * حذف اعلان‌های قدیمی (بیش از 30 روز)
     */
    static async cleanupOld() {
        return new Promise((resolve, reject) => {
            db.run(
                `DELETE FROM user_notifications WHERE created_at < datetime('now', '-30 days') AND is_read = 1`,
                function(err) {
                    if (err) return reject(err);
                    console.log(`🧹 Cleaned up ${this.changes} old notifications`);
                    resolve(this.changes);
                }
            );
        });
    }

    // === اعلان‌های خاص ===

    /**
     * اعلان تایید آگهی
     */
    static async notifyListingApproved(userId, listingId, listingTitle) {
        return this.create(
            userId,
            NotificationTypes.LISTING_APPROVED,
            `آگهی "${listingTitle}" شما تایید و منتشر شد.`,
            { listingId, listingTitle }
        );
    }

    /**
     * اعلان رد آگهی
     */
    static async notifyListingRejected(userId, listingId, listingTitle, reason) {
        return this.create(
            userId,
            NotificationTypes.LISTING_REJECTED,
            `آگهی "${listingTitle}" رد شد. دلیل: ${reason}`,
            { listingId, listingTitle, reason }
        );
    }

    /**
     * اعلان نزدیک شدن به انقضا
     */
    static async notifyListingExpiring(userId, listingId, listingTitle, daysLeft) {
        return this.create(
            userId,
            NotificationTypes.LISTING_EXPIRING,
            `آگهی "${listingTitle}" تا ${daysLeft} روز دیگر منقضی می‌شود. برای تمدید اقدام کنید.`,
            { listingId, listingTitle, daysLeft }
        );
    }

    /**
     * اعلان انقضای آگهی
     */
    static async notifyListingExpired(userId, listingId, listingTitle) {
        return this.create(
            userId,
            NotificationTypes.LISTING_EXPIRED,
            `آگهی "${listingTitle}" منقضی شد. برای نمایش مجدد، آن را تمدید کنید.`,
            { listingId, listingTitle }
        );
    }

    /**
     * اعلان تایید پرداخت
     */
    static async notifyPaymentConfirmed(userId, amount, description) {
        return this.create(
            userId,
            NotificationTypes.PAYMENT_CONFIRMED,
            `پرداخت ${amount.toLocaleString('fa-IR')} تومان برای ${description} تایید شد.`,
            { amount, description }
        );
    }

    /**
     * اعلان تایید تمدید
     */
    static async notifyRenewalApproved(userId, listingId, listingTitle, newExpiryDate) {
        return this.create(
            userId,
            NotificationTypes.RENEWAL_APPROVED,
            `تمدید آگهی "${listingTitle}" تایید شد. اعتبار جدید: ${newExpiryDate}`,
            { listingId, listingTitle, newExpiryDate }
        );
    }

    /**
     * اعلان رد تمدید
     */
    static async notifyRenewalRejected(userId, listingId, listingTitle, reason) {
        return this.create(
            userId,
            NotificationTypes.RENEWAL_REJECTED,
            `درخواست تمدید آگهی "${listingTitle}" رد شد. دلیل: ${reason}`,
            { listingId, listingTitle, reason }
        );
    }
}

module.exports = { NotificationService, NotificationTypes };
