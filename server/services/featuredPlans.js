const { dbHelpers } = require('../config/database');

class FeaturedPlansService {
  /**
   * دریافت تمام پلن‌های ویژه‌سازی
   * @param {boolean} activeOnly - فقط پلن‌های فعال
   * @returns {Promise<Array>}
   */
  async getAllPlans(activeOnly = false) {
    try {
      let query = 'SELECT * FROM featured_plans';
      const params = [];

      if (activeOnly) {
        query += ' WHERE is_active = ?';
        params.push(1);
      }

      query += ' ORDER BY display_order ASC, duration_days ASC';

      const plans = await dbHelpers.all(query, params);
      
      // Parse features JSON
      return plans.map(plan => ({
        ...plan,
        features: plan.features ? JSON.parse(plan.features) : [],
        is_active: Boolean(plan.is_active)
      }));
    } catch (error) {
      console.error('Error getting all plans:', error);
      throw new Error('خطا در دریافت لیست پلن‌ها');
    }
  }

  /**
   * دریافت جزئیات یک پلن
   * @param {number} id - شناسه پلن
   * @returns {Promise<Object>}
   */
  async getPlanById(id) {
    try {
      const plan = await dbHelpers.get(
        'SELECT * FROM featured_plans WHERE id = ?',
        [id]
      );

      if (!plan) {
        throw new Error('پلن مورد نظر یافت نشد');
      }

      return {
        ...plan,
        features: plan.features ? JSON.parse(plan.features) : [],
        is_active: Boolean(plan.is_active)
      };
    } catch (error) {
      console.error('Error getting plan by id:', error);
      throw error;
    }
  }

  /**
   * ایجاد پلن جدید (Admin)
   * @param {Object} data - اطلاعات پلن
   * @returns {Promise<Object>}
   */
  async createPlan(data) {
    try {
      const { name, name_en, duration_days, price, discount_percent, features, is_active, display_order } = data;

      // Validation
      if (!name || !name_en || !duration_days || !price) {
        throw new Error('اطلاعات پلن ناقص است');
      }

      if (duration_days <= 0) {
        throw new Error('مدت زمان پلن باید بیشتر از صفر باشد');
      }

      if (price < 0) {
        throw new Error('قیمت نمی‌تواند منفی باشد');
      }

      const featuresJson = JSON.stringify(features || []);

      const result = await dbHelpers.run(
        `INSERT INTO featured_plans 
        (name, name_en, duration_days, price, discount_percent, features, is_active, display_order) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          name,
          name_en,
          duration_days,
          price,
          discount_percent || 0,
          featuresJson,
          is_active !== false ? 1 : 0,
          display_order || 0
        ]
      );

      return await this.getPlanById(result.id);
    } catch (error) {
      console.error('Error creating plan:', error);
      throw error;
    }
  }

  /**
   * ویرایش پلن (Admin)
   * @param {number} id - شناسه پلن
   * @param {Object} data - اطلاعات جدید
   * @returns {Promise<Object>}
   */
  async updatePlan(id, data) {
    try {
      // Check if plan exists
      await this.getPlanById(id);

      const { name, name_en, duration_days, price, discount_percent, features, is_active, display_order } = data;

      // Validation
      if (duration_days !== undefined && duration_days <= 0) {
        throw new Error('مدت زمان پلن باید بیشتر از صفر باشد');
      }

      if (price !== undefined && price < 0) {
        throw new Error('قیمت نمی‌تواند منفی باشد');
      }

      const updates = [];
      const params = [];

      if (name !== undefined) {
        updates.push('name = ?');
        params.push(name);
      }
      if (name_en !== undefined) {
        updates.push('name_en = ?');
        params.push(name_en);
      }
      if (duration_days !== undefined) {
        updates.push('duration_days = ?');
        params.push(duration_days);
      }
      if (price !== undefined) {
        updates.push('price = ?');
        params.push(price);
      }
      if (discount_percent !== undefined) {
        updates.push('discount_percent = ?');
        params.push(discount_percent);
      }
      if (features !== undefined) {
        updates.push('features = ?');
        params.push(JSON.stringify(features));
      }
      if (is_active !== undefined) {
        updates.push('is_active = ?');
        params.push(is_active ? 1 : 0);
      }
      if (display_order !== undefined) {
        updates.push('display_order = ?');
        params.push(display_order);
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');
      params.push(id);

      await dbHelpers.run(
        `UPDATE featured_plans SET ${updates.join(', ')} WHERE id = ?`,
        params
      );

      return await this.getPlanById(id);
    } catch (error) {
      console.error('Error updating plan:', error);
      throw error;
    }
  }

  /**
   * حذف پلن (Admin)
   * @param {number} id - شناسه پلن
   * @returns {Promise<void>}
   */
  async deletePlan(id) {
    try {
      // Check if plan exists
      await this.getPlanById(id);

      // Check if plan is being used
      const usageCount = await dbHelpers.get(
        'SELECT COUNT(*) as count FROM payments WHERE plan_id = ?',
        [id]
      );

      if (usageCount.count > 0) {
        throw new Error('این پلن در حال استفاده است و نمی‌توان آن را حذف کرد. می‌توانید آن را غیرفعال کنید.');
      }

      await dbHelpers.run('DELETE FROM featured_plans WHERE id = ?', [id]);
    } catch (error) {
      console.error('Error deleting plan:', error);
      throw error;
    }
  }

  /**
   * دریافت پلن‌های فعال (برای نمایش به کاربران)
   * @returns {Promise<Array>}
   */
  async getActivePlans() {
    return await this.getAllPlans(true);
  }

  /**
   * محاسبه قیمت نهایی با تخفیف
   * @param {number} planId - شناسه پلن
   * @returns {Promise<Object>}
   */
  async calculateFinalPrice(planId) {
    try {
      const plan = await this.getPlanById(planId);
      
      const originalPrice = parseFloat(plan.price);
      const discountPercent = parseFloat(plan.discount_percent || 0);
      const discountAmount = (originalPrice * discountPercent) / 100;
      const finalPrice = originalPrice - discountAmount;

      return {
        original_price: originalPrice,
        discount_percent: discountPercent,
        discount_amount: discountAmount,
        final_price: finalPrice
      };
    } catch (error) {
      console.error('Error calculating final price:', error);
      throw error;
    }
  }

  /**
   * دریافت آمار پلن‌ها (Admin)
   * @returns {Promise<Object>}
   */
  async getPlansStats() {
    try {
      const stats = await dbHelpers.get(`
        SELECT 
          COUNT(*) as total_plans,
          SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_plans,
          SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive_plans
        FROM featured_plans
      `);

      const usageStats = await dbHelpers.all(`
        SELECT 
          fp.name,
          fp.name_en,
          COUNT(p.id) as usage_count,
          SUM(CASE WHEN p.status = 'completed' THEN 1 ELSE 0 END) as completed_count,
          SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END) as total_revenue
        FROM featured_plans fp
        LEFT JOIN payments p ON fp.id = p.plan_id
        GROUP BY fp.id
        ORDER BY usage_count DESC
      `);

      return {
        ...stats,
        usage_by_plan: usageStats
      };
    } catch (error) {
      console.error('Error getting plans stats:', error);
      throw new Error('خطا در دریافت آمار پلن‌ها');
    }
  }
}

module.exports = new FeaturedPlansService();
