const { dbHelpers } = require('../config/database');
const notificationService = require('./notification');
const emailService = require('./emailService');
const smsService = require('./smsService');

class FeaturedCronService {
  /**
   * بررسی و غیرفعال کردن آگهی‌های ویژه منقضی شده
   */
  async checkExpiredListings() {
    try {
      console.log('🔍 Checking for expired featured listings...');

      // Find expired featured listings
      const expiredListings = await dbHelpers.all(`
        SELECT fl.*, l.title, l.user_id
        FROM featured_listings fl
        JOIN listings l ON fl.listing_id = l.id
        WHERE fl.end_date <= datetime('now')
        AND fl.listing_id IN (
          SELECT listing_id FROM featured_listings
          WHERE end_date <= datetime('now')
        )
      `);

      if (expiredListings.length === 0) {
        console.log('✅ No expired featured listings found');
        return { expired: 0 };
      }

      console.log(`📋 Found ${expiredListings.length} expired featured listings`);

      // Delete expired featured listings
      for (const listing of expiredListings) {
        await dbHelpers.run(
          'DELETE FROM featured_listings WHERE id = ?',
          [listing.id]
        );

        // Send notification to user
        await notificationService.createNotification(listing.user_id, {
          title: 'انقضای آگهی ویژه',
          message: `مدت ویژه بودن آگهی "${listing.title}" به پایان رسید. برای تمدید، آگهی را مجدداً ویژه کنید.`,
          type: 'warning',
          category: 'featured',
          related_id: listing.listing_id
        });

        console.log(`✅ Expired featured listing #${listing.listing_id} - ${listing.title}`);
      }

      return { expired: expiredListings.length };
    } catch (error) {
      console.error('❌ Error checking expired listings:', error);
      throw error;
    }
  }

  /**
   * ارسال اطلاع‌رسانی برای آگهی‌هایی که 24 ساعت به انقضا مانده
   */
  async notifyExpiringListings() {
    try {
      console.log('🔔 Checking for expiring featured listings...');

      // Find listings expiring in next 24 hours
      const expiringListings = await dbHelpers.all(`
        SELECT fl.*, l.title, l.user_id
        FROM featured_listings fl
        JOIN listings l ON fl.listing_id = l.id
        WHERE fl.end_date > datetime('now')
        AND fl.end_date <= datetime('now', '+24 hours')
      `);

      if (expiringListings.length === 0) {
        console.log('✅ No expiring featured listings found');
        return { notified: 0 };
      }

      console.log(`📋 Found ${expiringListings.length} expiring featured listings`);

      // Send notifications
      for (const listing of expiringListings) {
        const hoursLeft = Math.ceil(
          (new Date(listing.end_date) - new Date()) / (1000 * 60 * 60)
        );

        await notificationService.createNotification(listing.user_id, {
          title: 'آگهی ویژه شما در حال انقضاست',
          message: `آگهی "${listing.title}" ${hoursLeft} ساعت دیگر از حالت ویژه خارج می‌شود. برای تمدید اقدام کنید.`,
          type: 'warning',
          category: 'featured_expiring',
          related_id: listing.id
        });

        // Send email and SMS notifications
        try {
          const user = await dbHelpers.get('SELECT * FROM users WHERE id = ?', [listing.user_id]);
          if (user) {
            await emailService.sendExpiringWarning(user, listing, hoursLeft);
            await smsService.sendExpiringWarningSMS(user.phone, listing.title, hoursLeft);
          }
        } catch (error) {
          console.error('Notification send error:', error);
        }

        console.log(`✅ Notified user for listing #${listing.listing_id} - ${hoursLeft}h left`);
      }

      return { notified: expiringListings.length };
    } catch (error) {
      console.error('❌ Error notifying expiring listings:', error);
      throw error;
    }
  }

  /**
   * دریافت آمار آگهی‌های ویژه
   */
  async getFeaturedStats() {
    try {
      const stats = await dbHelpers.get(`
        SELECT 
          COUNT(*) as total_featured,
          COUNT(CASE WHEN end_date > datetime('now') THEN 1 END) as active_featured,
          COUNT(CASE WHEN end_date <= datetime('now') THEN 1 END) as expired_featured,
          COUNT(CASE WHEN end_date > datetime('now') AND end_date <= datetime('now', '+24 hours') THEN 1 END) as expiring_soon
        FROM featured_listings
      `);

      return stats;
    } catch (error) {
      console.error('Error getting featured stats:', error);
      throw error;
    }
  }

  /**
   * اجرای تمام وظایف cron
   */
  async runAll() {
    console.log('🚀 Running all featured cron jobs...');
    
    try {
      const expiredResult = await this.checkExpiredListings();
      const notifyResult = await this.notifyExpiringListings();
      const stats = await this.getFeaturedStats();

      console.log('📊 Cron job results:', {
        expired: expiredResult.expired,
        notified: notifyResult.notified,
        stats
      });

      return {
        success: true,
        expired: expiredResult.expired,
        notified: notifyResult.notified,
        stats
      };
    } catch (error) {
      console.error('❌ Error running cron jobs:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new FeaturedCronService();
