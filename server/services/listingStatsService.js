/**
 * سرویس آمار بازدید آگهی‌ها
 * ثبت و گزارش‌گیری بازدید روزانه/هفتگی
 */

const { db } = require('../config/database');

class ListingStatsService {
    /**
     * ثبت بازدید آگهی
     */
    static async recordView(listingId, userId = null, ip = null) {
        const today = new Date().toISOString().split('T')[0];
        
        return new Promise((resolve, reject) => {
            // ابتدا چک کنیم رکورد امروز وجود داره یا نه
            db.get(
                `SELECT id, view_count, unique_views FROM listing_daily_stats WHERE listing_id = ? AND stat_date = ?`,
                [listingId, today],
                (err, row) => {
                    if (err) return reject(err);
                    
                    if (row) {
                        // آپدیت رکورد موجود
                        db.run(
                            `UPDATE listing_daily_stats SET view_count = view_count + 1 WHERE id = ?`,
                            [row.id],
                            function(err) {
                                if (err) return reject(err);
                                
                                // آپدیت view_count در جدول listings هم
                                db.run(
                                    `UPDATE listings SET view_count = COALESCE(view_count, 0) + 1 WHERE id = ?`,
                                    [listingId]
                                );
                                
                                resolve({ viewCount: row.view_count + 1 });
                            }
                        );
                    } else {
                        // ایجاد رکورد جدید
                        db.run(
                            `INSERT INTO listing_daily_stats (listing_id, stat_date, view_count, unique_views) VALUES (?, ?, 1, 1)`,
                            [listingId, today],
                            function(err) {
                                if (err) return reject(err);
                                
                                // آپدیت view_count در جدول listings
                                db.run(
                                    `UPDATE listings SET view_count = COALESCE(view_count, 0) + 1 WHERE id = ?`,
                                    [listingId]
                                );
                                
                                resolve({ viewCount: 1 });
                            }
                        );
                    }
                }
            );
        });
    }

    /**
     * ثبت کلیک روی اطلاعات تماس
     */
    static async recordContactClick(listingId) {
        const today = new Date().toISOString().split('T')[0];
        
        return new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO listing_daily_stats (listing_id, stat_date, contact_clicks) 
                 VALUES (?, ?, 1)
                 ON CONFLICT(listing_id, stat_date) 
                 DO UPDATE SET contact_clicks = contact_clicks + 1`,
                [listingId, today],
                function(err) {
                    if (err) return reject(err);
                    resolve(true);
                }
            );
        });
    }

    /**
     * ثبت افزودن به علاقه‌مندی‌ها
     */
    static async recordFavorite(listingId) {
        const today = new Date().toISOString().split('T')[0];
        
        return new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO listing_daily_stats (listing_id, stat_date, favorite_count) 
                 VALUES (?, ?, 1)
                 ON CONFLICT(listing_id, stat_date) 
                 DO UPDATE SET favorite_count = favorite_count + 1`,
                [listingId, today],
                function(err) {
                    if (err) return reject(err);
                    resolve(true);
                }
            );
        });
    }

    /**
     * دریافت آمار روزانه یک آگهی
     */
    static async getDailyStats(listingId, days = 7) {
        return new Promise((resolve, reject) => {
            db.all(
                `SELECT stat_date, view_count, unique_views, favorite_count, contact_clicks
                 FROM listing_daily_stats 
                 WHERE listing_id = ? AND stat_date >= date('now', '-' || ? || ' days')
                 ORDER BY stat_date ASC`,
                [listingId, days],
                (err, rows) => {
                    if (err) return reject(err);
                    resolve(rows || []);
                }
            );
        });
    }

    /**
     * دریافت آمار هفتگی یک آگهی
     */
    static async getWeeklyStats(listingId, weeks = 4) {
        return new Promise((resolve, reject) => {
            db.all(
                `SELECT 
                    strftime('%Y-%W', stat_date) as week,
                    SUM(view_count) as total_views,
                    SUM(unique_views) as total_unique_views,
                    SUM(favorite_count) as total_favorites,
                    SUM(contact_clicks) as total_contacts
                 FROM listing_daily_stats 
                 WHERE listing_id = ? AND stat_date >= date('now', '-' || ? || ' weeks')
                 GROUP BY week
                 ORDER BY week ASC`,
                [listingId, weeks * 7],
                (err, rows) => {
                    if (err) return reject(err);
                    resolve(rows || []);
                }
            );
        });
    }

    /**
     * دریافت خلاصه آمار یک آگهی
     */
    static async getStatsSummary(listingId) {
        return new Promise((resolve, reject) => {
            db.get(
                `SELECT 
                    COALESCE(SUM(view_count), 0) as total_views,
                    COALESCE(SUM(unique_views), 0) as total_unique_views,
                    COALESCE(SUM(favorite_count), 0) as total_favorites,
                    COALESCE(SUM(contact_clicks), 0) as total_contacts,
                    (SELECT view_count FROM listing_daily_stats WHERE listing_id = ? AND stat_date = date('now')) as today_views,
                    (SELECT SUM(view_count) FROM listing_daily_stats WHERE listing_id = ? AND stat_date >= date('now', '-7 days')) as week_views
                 FROM listing_daily_stats 
                 WHERE listing_id = ?`,
                [listingId, listingId, listingId],
                (err, row) => {
                    if (err) return reject(err);
                    resolve(row || {
                        total_views: 0,
                        total_unique_views: 0,
                        total_favorites: 0,
                        total_contacts: 0,
                        today_views: 0,
                        week_views: 0
                    });
                }
            );
        });
    }

    /**
     * دریافت آمار همه آگهی‌های یک کاربر
     */
    static async getUserListingsStats(userId) {
        return new Promise((resolve, reject) => {
            db.all(
                `SELECT 
                    l.id,
                    l.title,
                    l.status,
                    l.view_count as total_views,
                    l.expires_at,
                    COALESCE((SELECT SUM(view_count) FROM listing_daily_stats WHERE listing_id = l.id AND stat_date = date('now')), 0) as today_views,
                    COALESCE((SELECT SUM(view_count) FROM listing_daily_stats WHERE listing_id = l.id AND stat_date >= date('now', '-7 days')), 0) as week_views,
                    COALESCE((SELECT SUM(contact_clicks) FROM listing_daily_stats WHERE listing_id = l.id), 0) as total_contacts
                 FROM listings l
                 WHERE l.user_id = ?
                 ORDER BY l.created_at DESC`,
                [userId],
                (err, rows) => {
                    if (err) return reject(err);
                    resolve(rows || []);
                }
            );
        });
    }

    /**
     * پرطرفدارترین آگهی‌ها
     */
    static async getTopListings(limit = 10, days = 7) {
        return new Promise((resolve, reject) => {
            db.all(
                `SELECT 
                    l.id,
                    l.title,
                    l.price,
                    l.images,
                    SUM(s.view_count) as period_views
                 FROM listing_daily_stats s
                 JOIN listings l ON l.id = s.listing_id
                 WHERE s.stat_date >= date('now', '-' || ? || ' days')
                   AND l.status = 'active'
                 GROUP BY l.id
                 ORDER BY period_views DESC
                 LIMIT ?`,
                [days, limit],
                (err, rows) => {
                    if (err) return reject(err);
                    resolve(rows || []);
                }
            );
        });
    }
}

module.exports = ListingStatsService;
