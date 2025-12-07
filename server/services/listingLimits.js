const { dbHelpers } = require('../config/database');

class ListingLimitsService {
  /**
   * بررسی محدودیت آگهی‌های ماهانه کاربر
   */
  async checkMonthlyListingLimit(userId) {
    try {
      // تاریخ شروع ماه جاری
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      // تعداد آگهی‌های منتشر شده در ماه جاری (فقط آگهی‌های فعال یا در انتظار تایید)
      const monthlyListings = await dbHelpers.get(
        `SELECT COUNT(*) as count 
         FROM listings 
         WHERE user_id = ? 
         AND created_at >= ? 
         AND is_active != 0`,
        [userId, startOfMonth.toISOString()]
      );

      const currentCount = monthlyListings?.count || 0;
      const freeLimit = 1; // یک آگهی رایگان در ماه

      console.log('[ListingLimits] User:', userId, 'Monthly count:', currentCount, 'Free limit:', freeLimit);

      return {
        current_count: currentCount,
        free_limit: freeLimit,
        has_free_remaining: currentCount < freeLimit,
        needs_payment: currentCount >= freeLimit
      };
    } catch (error) {
      console.error('Error checking monthly listing limit:', error);
      throw new Error('خطا در بررسی محدودیت آگهی‌ها');
    }
  }

  /**
   * محاسبه هزینه آگهی جدید
   */
  async calculateListingCost(userId) {
    try {
      const limitCheck = await this.checkMonthlyListingLimit(userId);
      
      if (limitCheck.has_free_remaining) {
        return {
          is_free: true,
          cost: 0,
          message: 'آگهی رایگان ماهانه شما'
        };
      }

      // هزینه آگهی‌های اضافی (قابل تنظیم)
      const additionalListingCost = 50000; // 50,000 تومان

      return {
        is_free: false,
        cost: additionalListingCost,
        message: `هزینه آگهی اضافی: ${additionalListingCost.toLocaleString('fa-IR')} تومان`
      };
    } catch (error) {
      console.error('Error calculating listing cost:', error);
      throw error;
    }
  }

  /**
   * ایجاد پرداخت برای آگهی اضافی
   */
  async createAdditionalListingPayment(userId, listingData) {
    try {
      const costInfo = await this.calculateListingCost(userId);
      
      if (costInfo.is_free) {
        // آگهی رایگان است، مستقیماً ایجاد کن
        return await this.createFreeListing(userId, listingData);
      }

      // ایجاد پرداخت برای آگهی اضافی
      const result = await dbHelpers.run(
        `INSERT INTO additional_listing_payments 
        (user_id, amount, listing_data, status, created_at)
        VALUES (?, ?, ?, 'pending', CURRENT_TIMESTAMP)`,
        [userId, costInfo.cost, JSON.stringify(listingData)]
      );

      return {
        payment_id: result.id,
        amount: costInfo.cost,
        needs_payment: true,
        message: 'برای انتشار آگهی اضافی، ابتدا پرداخت را انجام دهید'
      };
    } catch (error) {
      console.error('Error creating additional listing payment:', error);
      throw error;
    }
  }

  /**
   * ایجاد آگهی رایگان
   */
  async createFreeListing(userId, listingData) {
    try {
      const result = await dbHelpers.run(
        `INSERT INTO listings 
        (user_id, title, description, price, category_id, location, images, contact_info, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)`,
        [
          userId,
          listingData.title,
          listingData.description,
          listingData.price,
          listingData.category_id,
          listingData.location,
          JSON.stringify(listingData.images || []),
          JSON.stringify(listingData.contact_info || {})
        ]
      );

      return {
        listing_id: result.id,
        needs_payment: false,
        is_free: true,
        message: 'آگهی رایگان شما با موفقیت ثبت شد'
      };
    } catch (error) {
      console.error('Error creating free listing:', error);
      throw error;
    }
  }

  /**
   * تایید پرداخت آگهی اضافی و ایجاد آگهی
   */
  async approveAdditionalListingPayment(paymentId) {
    try {
      // دریافت اطلاعات پرداخت
      const payment = await dbHelpers.get(
        'SELECT * FROM additional_listing_payments WHERE id = ? AND status = ?',
        [paymentId, 'pending']
      );

      if (!payment) {
        throw new Error('پرداخت یافت نشد یا قبلاً پردازش شده');
      }

      const listingData = JSON.parse(payment.listing_data);

      // ایجاد آگهی
      const listingResult = await dbHelpers.run(
        `INSERT INTO listings 
        (user_id, title, description, price, category_id, location, images, contact_info, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)`,
        [
          payment.user_id,
          listingData.title,
          listingData.description,
          listingData.price,
          listingData.category_id,
          listingData.location,
          JSON.stringify(listingData.images || []),
          JSON.stringify(listingData.contact_info || {})
        ]
      );

      // به‌روزرسانی وضعیت پرداخت
      await dbHelpers.run(
        `UPDATE additional_listing_payments 
        SET status = 'completed', listing_id = ?, completed_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
        [listingResult.id, paymentId]
      );

      return {
        listing_id: listingResult.id,
        message: 'آگهی اضافی شما با موفقیت ایجاد شد'
      };
    } catch (error) {
      console.error('Error approving additional listing payment:', error);
      throw error;
    }
  }

  /**
   * دریافت آمار آگهی‌های کاربر
   */
  async getUserListingStats(userId) {
    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const stats = await dbHelpers.get(
        `SELECT 
          COUNT(*) as total_listings,
          SUM(CASE WHEN created_at >= ? THEN 1 ELSE 0 END) as monthly_listings,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_listings,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_listings
         FROM listings 
         WHERE user_id = ? AND status != 'deleted'`,
        [startOfMonth.toISOString(), userId]
      );

      const limitCheck = await this.checkMonthlyListingLimit(userId);
      const costInfo = await this.calculateListingCost(userId);

      return {
        ...stats,
        ...limitCheck,
        next_listing_cost: costInfo
      };
    } catch (error) {
      console.error('Error getting user listing stats:', error);
      throw error;
    }
  }

  /**
   * دریافت پرداخت‌های آگهی اضافی کاربر
   */
  async getUserAdditionalPayments(userId) {
    try {
      const payments = await dbHelpers.all(
        `SELECT alp.*, l.title as listing_title, l.status as listing_status
         FROM additional_listing_payments alp
         LEFT JOIN listings l ON alp.listing_id = l.id
         WHERE alp.user_id = ?
         ORDER BY alp.created_at DESC`,
        [userId]
      );

      return payments;
    } catch (error) {
      console.error('Error getting user additional payments:', error);
      throw error;
    }
  }

  /**
   * دریافت تمام پرداخت‌های آگهی اضافی (Admin)
   */
  async getAllAdditionalPayments(filters = {}) {
    try {
      let query = `
        SELECT alp.*, u.phone as user_phone, l.title as listing_title
        FROM additional_listing_payments alp
        LEFT JOIN users u ON alp.user_id = u.id
        LEFT JOIN listings l ON alp.listing_id = l.id
        WHERE 1=1
      `;
      const params = [];

      if (filters.status) {
        query += ' AND alp.status = ?';
        params.push(filters.status);
      }

      if (filters.user_id) {
        query += ' AND alp.user_id = ?';
        params.push(filters.user_id);
      }

      query += ' ORDER BY alp.created_at DESC';

      if (filters.limit) {
        query += ' LIMIT ?';
        params.push(filters.limit);
      }

      const payments = await dbHelpers.all(query, params);
      return payments;
    } catch (error) {
      console.error('Error getting all additional payments:', error);
      throw error;
    }
  }
}

module.exports = new ListingLimitsService();