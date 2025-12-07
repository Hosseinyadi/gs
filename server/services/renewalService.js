/**
 * سرویس تمدید آگهی
 * مدیریت تمدید آگهی‌های منقضی شده
 */

const { db } = require('../config/database');
const { NotificationService, NotificationTypes } = require('./notificationService');

class RenewalService {
    /**
     * دریافت تنظیمات تمدید
     */
    static async getSettings() {
        return new Promise((resolve, reject) => {
            db.all(`SELECT setting_key, setting_value FROM renewal_settings`, (err, rows) => {
                if (err) return reject(err);
                
                const settings = {};
                (rows || []).forEach(row => {
                    settings[row.setting_key] = row.setting_value;
                });
                
                // مقادیر پیش‌فرض
                resolve({
                    listing_duration_days: parseInt(settings.listing_duration_days) || 90,
                    renewal_price: parseInt(settings.renewal_price) || 50000,
                    free_renewal_count: parseInt(settings.free_renewal_count) || 1,
                    expiry_warning_days: parseInt(settings.expiry_warning_days) || 7,
                    renewal_duration_days: parseInt(settings.renewal_duration_days) || 30
                });
            });
        });
    }

    /**
     * به‌روزرسانی تنظیمات
     */
    static async updateSettings(settings) {
        return new Promise((resolve, reject) => {
            const updates = Object.entries(settings);
            let completed = 0;
            
            updates.forEach(([key, value]) => {
                db.run(
                    `UPDATE renewal_settings SET setting_value = ?, updated_at = datetime('now') WHERE setting_key = ?`,
                    [value.toString(), key],
                    function(err) {
                        if (err) console.error(`Error updating ${key}:`, err);
                        completed++;
                        if (completed === updates.length) {
                            resolve(true);
                        }
                    }
                );
            });
        });
    }

    /**
     * بررسی آیا آگهی منقضی شده
     */
    static async isListingExpired(listingId) {
        return new Promise((resolve, reject) => {
            db.get(
                `SELECT id, expires_at, status FROM listings WHERE id = ?`,
                [listingId],
                (err, row) => {
                    if (err) return reject(err);
                    if (!row) return resolve({ expired: false, notFound: true });
                    
                    const now = new Date();
                    const expiresAt = row.expires_at ? new Date(row.expires_at) : null;
                    
                    resolve({
                        expired: expiresAt ? now > expiresAt : false,
                        expiresAt: row.expires_at,
                        status: row.status
                    });
                }
            );
        });
    }

    /**
     * بررسی آیا تمدید رایگان است
     */
    static async isRenewalFree(listingId) {
        const settings = await this.getSettings();
        
        return new Promise((resolve, reject) => {
            db.get(
                `SELECT renewal_count FROM listings WHERE id = ?`,
                [listingId],
                (err, row) => {
                    if (err) return reject(err);
                    
                    const renewalCount = row?.renewal_count || 0;
                    const isFree = renewalCount < settings.free_renewal_count;
                    
                    resolve({
                        isFree,
                        renewalCount,
                        freeLimit: settings.free_renewal_count,
                        price: isFree ? 0 : settings.renewal_price
                    });
                }
            );
        });
    }

    /**
     * ایجاد درخواست تمدید
     */
    static async createRenewalRequest(listingId, userId, paymentMethod = null, paymentProof = null) {
        const settings = await this.getSettings();
        const renewalInfo = await this.isRenewalFree(listingId);
        
        return new Promise((resolve, reject) => {
            // دریافت اطلاعات آگهی
            db.get(
                `SELECT id, title, user_id, expires_at, status FROM listings WHERE id = ?`,
                [listingId],
                async (err, listing) => {
                    if (err) return reject(err);
                    if (!listing) return reject(new Error('آگهی یافت نشد'));
                    if (listing.user_id !== userId) return reject(new Error('شما مالک این آگهی نیستید'));
                    
                    // بررسی وضعیت آگهی - فقط آگهی‌های منتشر شده یا منقضی شده قابل تمدید هستند
                    if (listing.status !== 'active' && listing.status !== 'expired') {
                        return reject(new Error('فقط آگهی‌های فعال یا منقضی شده قابل تمدید هستند'));
                    }
                    
                    const renewalType = renewalInfo.isFree ? 'free' : 'paid';
                    const amount = renewalInfo.price;
                    const oldExpiryDate = listing.expires_at;
                    
                    // محاسبه تاریخ انقضای جدید
                    const baseDate = new Date(oldExpiryDate) > new Date() ? new Date(oldExpiryDate) : new Date();
                    const newExpiryDate = new Date(baseDate);
                    newExpiryDate.setDate(newExpiryDate.getDate() + settings.renewal_duration_days);
                    
                    // اگر رایگان است، مستقیم تایید شود
                    const status = renewalType === 'free' ? 'approved' : 'pending';
                    const paymentStatus = renewalType === 'free' ? 'completed' : 'pending';
                    
                    db.run(
                        `INSERT INTO listing_renewals 
                         (listing_id, user_id, renewal_type, duration_days, amount, payment_status, payment_method, payment_proof, old_expiry_date, new_expiry_date, status)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            listingId, userId, renewalType, settings.renewal_duration_days,
                            amount, paymentStatus, paymentMethod, paymentProof,
                            oldExpiryDate, newExpiryDate.toISOString(), status
                        ],
                        async function(err) {
                            if (err) return reject(err);
                            
                            const renewalId = this.lastID;
                            
                            // اگر رایگان است، آگهی را مستقیم تمدید کن
                            if (renewalType === 'free') {
                                await RenewalService.applyRenewal(listingId, newExpiryDate);
                                
                                // ارسال اعلان
                                await NotificationService.notifyRenewalApproved(
                                    userId, listingId, listing.title,
                                    newExpiryDate.toLocaleDateString('fa-IR')
                                );
                            }
                            
                            resolve({
                                id: renewalId,
                                listingId,
                                renewalType,
                                amount,
                                status,
                                newExpiryDate: newExpiryDate.toISOString(),
                                isFree: renewalType === 'free'
                            });
                        }
                    );
                }
            );
        });
    }

    /**
     * اعمال تمدید روی آگهی
     */
    static async applyRenewal(listingId, newExpiryDate) {
        return new Promise((resolve, reject) => {
            db.run(
                `UPDATE listings 
                 SET expires_at = ?, 
                     renewal_count = COALESCE(renewal_count, 0) + 1,
                     status = 'active'
                 WHERE id = ?`,
                [newExpiryDate.toISOString(), listingId],
                function(err) {
                    if (err) return reject(err);
                    resolve(this.changes > 0);
                }
            );
        });
    }

    /**
     * تایید درخواست تمدید (توسط ادمین)
     */
    static async approveRenewal(renewalId, adminId, adminNote = null) {
        return new Promise((resolve, reject) => {
            db.get(
                `SELECT r.*, l.title, l.user_id 
                 FROM listing_renewals r
                 JOIN listings l ON l.id = r.listing_id
                 WHERE r.id = ?`,
                [renewalId],
                async (err, renewal) => {
                    if (err) return reject(err);
                    if (!renewal) return reject(new Error('درخواست تمدید یافت نشد'));
                    if (renewal.status !== 'pending') return reject(new Error('این درخواست قبلاً پردازش شده'));
                    
                    // به‌روزرسانی درخواست
                    db.run(
                        `UPDATE listing_renewals 
                         SET status = 'approved', payment_status = 'completed', 
                             admin_note = ?, processed_by = ?, processed_at = datetime('now')
                         WHERE id = ?`,
                        [adminNote, adminId, renewalId],
                        async function(err) {
                            if (err) return reject(err);
                            
                            // اعمال تمدید
                            await RenewalService.applyRenewal(renewal.listing_id, new Date(renewal.new_expiry_date));
                            
                            // ارسال اعلان
                            await NotificationService.notifyRenewalApproved(
                                renewal.user_id, renewal.listing_id, renewal.title,
                                new Date(renewal.new_expiry_date).toLocaleDateString('fa-IR')
                            );
                            
                            resolve(true);
                        }
                    );
                }
            );
        });
    }

    /**
     * رد درخواست تمدید (توسط ادمین)
     */
    static async rejectRenewal(renewalId, adminId, reason) {
        return new Promise((resolve, reject) => {
            db.get(
                `SELECT r.*, l.title, l.user_id 
                 FROM listing_renewals r
                 JOIN listings l ON l.id = r.listing_id
                 WHERE r.id = ?`,
                [renewalId],
                async (err, renewal) => {
                    if (err) return reject(err);
                    if (!renewal) return reject(new Error('درخواست تمدید یافت نشد'));
                    if (renewal.status !== 'pending') return reject(new Error('این درخواست قبلاً پردازش شده'));
                    
                    db.run(
                        `UPDATE listing_renewals 
                         SET status = 'rejected', payment_status = 'failed',
                             admin_note = ?, processed_by = ?, processed_at = datetime('now')
                         WHERE id = ?`,
                        [reason, adminId, renewalId],
                        async function(err) {
                            if (err) return reject(err);
                            
                            // ارسال اعلان
                            await NotificationService.notifyRenewalRejected(
                                renewal.user_id, renewal.listing_id, renewal.title, reason
                            );
                            
                            resolve(true);
                        }
                    );
                }
            );
        });
    }

    /**
     * دریافت درخواست‌های تمدید در انتظار (برای ادمین)
     */
    static async getPendingRenewals(options = {}) {
        const { limit = 20, offset = 0 } = options;
        
        return new Promise((resolve, reject) => {
            db.all(
                `SELECT r.*, l.title as listing_title, l.images, u.phone as user_phone, u.name as user_name
                 FROM listing_renewals r
                 JOIN listings l ON l.id = r.listing_id
                 JOIN users u ON u.id = r.user_id
                 WHERE r.status = 'pending'
                 ORDER BY r.created_at ASC
                 LIMIT ? OFFSET ?`,
                [limit, offset],
                (err, rows) => {
                    if (err) return reject(err);
                    resolve(rows || []);
                }
            );
        });
    }

    /**
     * دریافت تاریخچه تمدید یک آگهی
     */
    static async getRenewalHistory(listingId) {
        return new Promise((resolve, reject) => {
            db.all(
                `SELECT r.*, a.name as admin_name
                 FROM listing_renewals r
                 LEFT JOIN admin_users a ON a.id = r.processed_by
                 WHERE r.listing_id = ?
                 ORDER BY r.created_at DESC`,
                [listingId],
                (err, rows) => {
                    if (err) return reject(err);
                    resolve(rows || []);
                }
            );
        });
    }

    /**
     * دریافت آگهی‌های در حال انقضا
     */
    static async getExpiringListings(daysAhead = 7) {
        return new Promise((resolve, reject) => {
            db.all(
                `SELECT l.*, u.phone as user_phone, u.name as user_name
                 FROM listings l
                 JOIN users u ON u.id = l.user_id
                 WHERE l.status = 'active'
                   AND l.expires_at IS NOT NULL
                   AND l.expires_at BETWEEN datetime('now') AND datetime('now', '+' || ? || ' days')
                 ORDER BY l.expires_at ASC`,
                [daysAhead],
                (err, rows) => {
                    if (err) return reject(err);
                    resolve(rows || []);
                }
            );
        });
    }

    /**
     * منقضی کردن آگهی‌های گذشته
     */
    static async expireOldListings() {
        return new Promise((resolve, reject) => {
            // ابتدا آگهی‌های منقضی شده را پیدا کن
            db.all(
                `SELECT id, user_id, title FROM listings 
                 WHERE status = 'active' 
                   AND expires_at IS NOT NULL 
                   AND expires_at < datetime('now')`,
                async (err, listings) => {
                    if (err) return reject(err);
                    
                    if (!listings || listings.length === 0) {
                        return resolve({ expired: 0 });
                    }
                    
                    // به‌روزرسانی وضعیت
                    db.run(
                        `UPDATE listings SET status = 'expired' 
                         WHERE status = 'active' 
                           AND expires_at IS NOT NULL 
                           AND expires_at < datetime('now')`,
                        async function(err) {
                            if (err) return reject(err);
                            
                            // ارسال اعلان به کاربران
                            for (const listing of listings) {
                                try {
                                    await NotificationService.notifyListingExpired(
                                        listing.user_id, listing.id, listing.title
                                    );
                                } catch (e) {
                                    console.error('Error sending expiry notification:', e);
                                }
                            }
                            
                            console.log(`⏰ Expired ${this.changes} listings`);
                            resolve({ expired: this.changes });
                        }
                    );
                }
            );
        });
    }

    /**
     * ارسال یادآوری انقضا
     */
    static async sendExpiryReminders() {
        const settings = await this.getSettings();
        const listings = await this.getExpiringListings(settings.expiry_warning_days);
        
        let sent = 0;
        for (const listing of listings) {
            try {
                const expiresAt = new Date(listing.expires_at);
                const now = new Date();
                const daysLeft = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));
                
                await NotificationService.notifyListingExpiring(
                    listing.user_id, listing.id, listing.title, daysLeft
                );
                sent++;
            } catch (e) {
                console.error('Error sending reminder:', e);
            }
        }
        
        console.log(`📧 Sent ${sent} expiry reminders`);
        return { sent };
    }
}

module.exports = RenewalService;
