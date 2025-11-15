const { dbHelpers } = require('../config/database');

class LoyalCustomersService {
  /**
   * دریافت مشتریان وفادار بر اساس پرداخت‌های ماهانه
   */
  async getMonthlyLoyalCustomers(month = null, year = null) {
    try {
      // اگر ماه و سال مشخص نشده، ماه جاری را در نظر بگیر
      const targetDate = new Date();
      if (month && year) {
        targetDate.setFullYear(year, month - 1, 1);
      } else {
        targetDate.setDate(1);
      }
      
      const startOfMonth = new Date(targetDate);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const endOfMonth = new Date(targetDate);
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);
      endOfMonth.setDate(0);
      endOfMonth.setHours(23, 59, 59, 999);

      // دریافت مشتریان با پرداخت‌های موفق در ماه مورد نظر
      const loyalCustomers = await dbHelpers.all(`
        SELECT 
          u.id as user_id,
          u.phone,
          u.name,
          u.email,
          COUNT(p.id) as total_payments,
          SUM(p.amount) as total_spent,
          AVG(p.amount) as average_payment,
          COUNT(DISTINCT p.listing_id) as unique_listings,
          COUNT(CASE WHEN fp.name LIKE '%ویژه%' THEN 1 END) as featured_count,
          GROUP_CONCAT(DISTINCT fp.name) as purchased_plans,
          MIN(p.created_at) as first_payment_date,
          MAX(p.created_at) as last_payment_date
        FROM users u
        INNER JOIN payments p ON u.id = p.user_id
        LEFT JOIN featured_plans fp ON p.plan_id = fp.id
        WHERE p.status = 'completed'
        AND p.created_at >= ?
        AND p.created_at <= ?
        GROUP BY u.id, u.phone, u.name, u.email
        ORDER BY total_spent DESC, total_payments DESC
      `, [startOfMonth.toISOString(), endOfMonth.toISOString()]);

      // اضافه کردن رتبه‌بندی
      const rankedCustomers = loyalCustomers.map((customer, index) => ({
        ...customer,
        rank: index + 1,
        loyalty_score: this.calculateLoyaltyScore(customer),
        customer_tier: this.getCustomerTier(customer.total_spent, customer.total_payments)
      }));

      return rankedCustomers;
    } catch (error) {
      console.error('Error getting monthly loyal customers:', error);
      throw new Error('خطا در دریافت مشتریان وفادار');
    }
  }

  /**
   * محاسبه امتیاز وفاداری مشتری
   */
  calculateLoyaltyScore(customer) {
    const spentWeight = 0.6;
    const countWeight = 0.3;
    const featuredWeight = 0.1;

    // نرمال‌سازی مقادیر (بر اساس حداکثر مقادیر فرضی)
    const normalizedSpent = Math.min(customer.total_spent / 1000000, 1); // حداکثر 1 میلیون تومان
    const normalizedCount = Math.min(customer.total_payments / 10, 1); // حداکثر 10 پرداخت
    const normalizedFeatured = Math.min(customer.featured_count / 5, 1); // حداکثر 5 ویژه‌سازی

    const score = (
      normalizedSpent * spentWeight +
      normalizedCount * countWeight +
      normalizedFeatured * featuredWeight
    ) * 100;

    return Math.round(score);
  }

  /**
   * تعیین سطح مشتری
   */
  getCustomerTier(totalSpent, totalPayments) {
    if (totalSpent >= 500000 || totalPayments >= 5) {
      return 'طلایی';
    } else if (totalSpent >= 200000 || totalPayments >= 3) {
      return 'نقره‌ای';
    } else if (totalSpent >= 50000 || totalPayments >= 1) {
      return 'برنزی';
    }
    return 'عادی';
  }

  /**
   * دریافت جزئیات یک مشتری وفادار
   */
  async getLoyalCustomerDetails(userId, month = null, year = null) {
    try {
      const targetDate = new Date();
      if (month && year) {
        targetDate.setFullYear(year, month - 1, 1);
      } else {
        targetDate.setDate(1);
      }
      
      const startOfMonth = new Date(targetDate);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const endOfMonth = new Date(targetDate);
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);
      endOfMonth.setDate(0);
      endOfMonth.setHours(23, 59, 59, 999);

      // اطلاعات کلی مشتری
      const customer = await dbHelpers.get(`
        SELECT 
          u.id,
          u.phone,
          u.name,
          u.email,
          u.created_at as registration_date
        FROM users u
        WHERE u.id = ?
      `, [userId]);

      if (!customer) {
        throw new Error('مشتری یافت نشد');
      }

      // پرداخت‌های ماه جاری
      const monthlyPayments = await dbHelpers.all(`
        SELECT 
          p.*,
          l.title as listing_title,
          fp.name as plan_name,
          fp.duration_days
        FROM payments p
        LEFT JOIN listings l ON p.listing_id = l.id
        LEFT JOIN featured_plans fp ON p.plan_id = fp.id
        WHERE p.user_id = ?
        AND p.status = 'completed'
        AND p.created_at >= ?
        AND p.created_at <= ?
        ORDER BY p.created_at DESC
      `, [userId, startOfMonth.toISOString(), endOfMonth.toISOString()]);

      // آمار کلی
      const totalStats = await dbHelpers.get(`
        SELECT 
          COUNT(*) as total_payments,
          SUM(amount) as total_spent,
          AVG(amount) as average_payment,
          MIN(created_at) as first_payment,
          MAX(created_at) as last_payment
        FROM payments
        WHERE user_id = ? AND status = 'completed'
      `, [userId]);

      // آگهی‌های فعال
      const activeListings = await dbHelpers.all(`
        SELECT 
          l.*,
          fl.end_date as featured_until,
          fp.name as featured_plan
        FROM listings l
        LEFT JOIN featured_listings fl ON l.id = fl.listing_id AND fl.end_date > CURRENT_TIMESTAMP
        LEFT JOIN featured_plans fp ON fl.plan_id = fp.id
        WHERE l.user_id = ? AND l.status = 'active'
        ORDER BY fl.end_date DESC, l.created_at DESC
      `, [userId]);

      const monthlyStats = {
        total_payments: monthlyPayments.length,
        total_spent: monthlyPayments.reduce((sum, p) => sum + p.amount, 0),
        featured_count: monthlyPayments.filter(p => p.plan_name && p.plan_name.includes('ویژه')).length
      };

      return {
        customer,
        monthly_stats: monthlyStats,
        total_stats: totalStats,
        monthly_payments: monthlyPayments,
        active_listings: activeListings,
        loyalty_score: this.calculateLoyaltyScore(monthlyStats),
        customer_tier: this.getCustomerTier(monthlyStats.total_spent, monthlyStats.total_payments)
      };
    } catch (error) {
      console.error('Error getting loyal customer details:', error);
      throw error;
    }
  }

  /**
   * دریافت آمار کلی مشتریان وفادار
   */
  async getLoyalCustomersStats(month = null, year = null) {
    try {
      const targetDate = new Date();
      if (month && year) {
        targetDate.setFullYear(year, month - 1, 1);
      } else {
        targetDate.setDate(1);
      }
      
      const startOfMonth = new Date(targetDate);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const endOfMonth = new Date(targetDate);
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);
      endOfMonth.setDate(0);
      endOfMonth.setHours(23, 59, 59, 999);

      const stats = await dbHelpers.get(`
        SELECT 
          COUNT(DISTINCT p.user_id) as total_customers,
          COUNT(p.id) as total_payments,
          SUM(p.amount) as total_revenue,
          AVG(p.amount) as average_payment,
          COUNT(CASE WHEN fp.name LIKE '%ویژه%' THEN 1 END) as featured_purchases
        FROM payments p
        LEFT JOIN featured_plans fp ON p.plan_id = fp.id
        WHERE p.status = 'completed'
        AND p.created_at >= ?
        AND p.created_at <= ?
      `, [startOfMonth.toISOString(), endOfMonth.toISOString()]);

      // آمار بر اساس سطح مشتری
      const customers = await this.getMonthlyLoyalCustomers(month, year);
      const tierStats = customers.reduce((acc, customer) => {
        const tier = customer.customer_tier;
        if (!acc[tier]) {
          acc[tier] = { count: 0, total_spent: 0 };
        }
        acc[tier].count++;
        acc[tier].total_spent += customer.total_spent;
        return acc;
      }, {});

      return {
        ...stats,
        tier_breakdown: tierStats,
        top_customers: customers.slice(0, 10) // 10 مشتری برتر
      };
    } catch (error) {
      console.error('Error getting loyal customers stats:', error);
      throw error;
    }
  }

  /**
   * دریافت مقایسه ماهانه مشتریان وفادار
   */
  async getMonthlyComparison(months = 6) {
    try {
      const comparison = [];
      
      for (let i = 0; i < months; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        
        const stats = await this.getLoyalCustomersStats(month, year);
        
        comparison.push({
          month,
          year,
          month_name: date.toLocaleDateString('fa-IR', { month: 'long', year: 'numeric' }),
          ...stats
        });
      }
      
      return comparison.reverse(); // از قدیمی به جدید
    } catch (error) {
      console.error('Error getting monthly comparison:', error);
      throw error;
    }
  }

  /**
   * ارسال پیام تشکر به مشتریان وفادار
   */
  async sendAppreciationMessage(userId, message) {
    try {
      // ایجاد نوتیفیکیشن
      await dbHelpers.run(
        `INSERT INTO notifications 
        (user_id, title, message, type, category, created_at)
        VALUES (?, ?, ?, 'info', 'appreciation', CURRENT_TIMESTAMP)`,
        [userId, 'پیام تشکر از مدیریت', message]
      );

      // ثبت در لاگ
      await dbHelpers.run(
        `INSERT INTO admin_logs 
        (admin_id, action, target_type, target_id, details, created_at)
        VALUES (?, 'send_appreciation', 'user', ?, ?, CURRENT_TIMESTAMP)`,
        [1, userId, message] // فرض: admin_id = 1
      );

      return {
        success: true,
        message: 'پیام تشکر با موفقیت ارسال شد'
      };
    } catch (error) {
      console.error('Error sending appreciation message:', error);
      throw error;
    }
  }

  /**
   * اعطای تخفیف ویژه به مشتریان وفادار
   */
  async grantLoyaltyDiscount(userId, discountPercent, validDays = 30) {
    try {
      const discountCode = `LOYAL${userId}${Date.now()}`;
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + validDays);

      await dbHelpers.run(
        `INSERT INTO discount_codes 
        (code, discount_percent, max_uses, used_count, valid_from, valid_until, 
         is_active, user_specific, specific_user_id, created_by, created_at)
        VALUES (?, ?, 1, 0, CURRENT_TIMESTAMP, ?, 1, 1, ?, 1, CURRENT_TIMESTAMP)`,
        [discountCode, discountPercent, expiryDate.toISOString(), userId]
      );

      // ارسال نوتیفیکیشن
      await dbHelpers.run(
        `INSERT INTO notifications 
        (user_id, title, message, type, category, created_at)
        VALUES (?, ?, ?, 'success', 'discount', CURRENT_TIMESTAMP)`,
        [
          userId, 
          'تخفیف ویژه مشتریان وفادار',
          `کد تخفیف ${discountPercent}% ویژه شما: ${discountCode}`
        ]
      );

      return {
        success: true,
        discount_code: discountCode,
        discount_percent: discountPercent,
        valid_until: expiryDate,
        message: 'تخفیف ویژه با موفقیت اعطا شد'
      };
    } catch (error) {
      console.error('Error granting loyalty discount:', error);
      throw error;
    }
  }
}

module.exports = new LoyalCustomersService();