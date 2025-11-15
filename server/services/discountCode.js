const { dbHelpers } = require('../config/database');

/**
 * Discount Code Service
 */

/**
 * Validate and apply discount code
 */
async function validateDiscountCode(code, userId, planId, amount) {
  try {
    // Get discount code
    const discount = await dbHelpers.get(
      `SELECT * FROM discount_codes 
       WHERE code = ? AND is_active = 1 
       AND (expiry_date IS NULL OR expiry_date > datetime('now'))`,
      [code.toUpperCase()]
    );

    if (!discount) {
      return {
        valid: false,
        error: 'کد تخفیف نامعتبر یا منقضی شده است'
      };
    }

    // Check usage limit
    if (discount.max_uses && discount.used_count >= discount.max_uses) {
      return {
        valid: false,
        error: 'ظرفیت استفاده از این کد تخفیف تکمیل شده است'
      };
    }

    // Check per-user limit
    if (discount.max_uses_per_user) {
      const userUsage = await dbHelpers.get(
        'SELECT COUNT(*) as count FROM discount_code_usage WHERE discount_code_id = ? AND user_id = ?',
        [discount.id, userId]
      );

      if (userUsage.count >= discount.max_uses_per_user) {
        return {
          valid: false,
          error: 'شما قبلاً از این کد تخفیف استفاده کرده‌اید'
        };
      }
    }

    // Check minimum amount
    if (discount.min_amount && amount < discount.min_amount) {
      return {
        valid: false,
        error: `حداقل مبلغ برای استفاده از این کد ${discount.min_amount.toLocaleString('fa-IR')} تومان است`
      };
    }

    // Check applicable plans
    if (discount.applicable_plans) {
      const applicablePlans = JSON.parse(discount.applicable_plans);
      if (applicablePlans.length > 0 && !applicablePlans.includes(planId)) {
        return {
          valid: false,
          error: 'این کد تخفیف برای پلن انتخابی شما قابل استفاده نیست'
        };
      }
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (discount.discount_type === 'percentage') {
      discountAmount = Math.floor((amount * discount.discount_value) / 100);
      
      // Apply max discount limit
      if (discount.max_discount && discountAmount > discount.max_discount) {
        discountAmount = discount.max_discount;
      }
    } else if (discount.discount_type === 'fixed') {
      discountAmount = discount.discount_value;
    }

    // Ensure discount doesn't exceed amount
    if (discountAmount > amount) {
      discountAmount = amount;
    }

    const finalAmount = amount - discountAmount;

    return {
      valid: true,
      discount: {
        id: discount.id,
        code: discount.code,
        type: discount.discount_type,
        value: discount.discount_value,
        discountAmount,
        finalAmount,
        description: discount.description
      }
    };
  } catch (error) {
    console.error('Error validating discount code:', error);
    return {
      valid: false,
      error: 'خطا در بررسی کد تخفیف'
    };
  }
}

/**
 * Record discount code usage
 */
async function recordDiscountUsage(discountCodeId, userId, paymentId, discountAmount) {
  try {
    // Record usage
    await dbHelpers.run(
      `INSERT INTO discount_code_usage 
       (discount_code_id, user_id, payment_id, discount_amount, used_at)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [discountCodeId, userId, paymentId, discountAmount]
    );

    // Increment usage count
    await dbHelpers.run(
      'UPDATE discount_codes SET used_count = used_count + 1 WHERE id = ?',
      [discountCodeId]
    );

    return { success: true };
  } catch (error) {
    console.error('Error recording discount usage:', error);
    throw error;
  }
}

/**
 * Create discount code (Admin)
 */
async function createDiscountCode(data, adminId) {
  try {
    const {
      code,
      description,
      discount_type,
      discount_value,
      max_discount,
      min_amount,
      max_uses,
      max_uses_per_user,
      expiry_date,
      applicable_plans
    } = data;

    // Check if code already exists
    const existing = await dbHelpers.get(
      'SELECT id FROM discount_codes WHERE code = ?',
      [code.toUpperCase()]
    );

    if (existing) {
      return {
        success: false,
        error: 'این کد تخفیف قبلاً ثبت شده است'
      };
    }

    // Create discount code
    const result = await dbHelpers.run(
      `INSERT INTO discount_codes 
       (code, description, discount_type, discount_value, max_discount, 
        min_amount, max_uses, max_uses_per_user, expiry_date, 
        applicable_plans, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        code.toUpperCase(),
        description,
        discount_type,
        discount_value,
        max_discount || null,
        min_amount || null,
        max_uses || null,
        max_uses_per_user || null,
        expiry_date || null,
        applicable_plans ? JSON.stringify(applicable_plans) : null,
        adminId
      ]
    );

    return {
      success: true,
      data: {
        id: result.lastID,
        code: code.toUpperCase()
      }
    };
  } catch (error) {
    console.error('Error creating discount code:', error);
    return {
      success: false,
      error: 'خطا در ایجاد کد تخفیف'
    };
  }
}

/**
 * Get all discount codes (Admin)
 */
async function getAllDiscountCodes(filters = {}) {
  try {
    let query = `
      SELECT 
        dc.*,
        au.username as created_by_username,
        (SELECT COUNT(*) FROM discount_code_usage WHERE discount_code_id = dc.id) as actual_usage
      FROM discount_codes dc
      LEFT JOIN admin_users au ON dc.created_by = au.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.is_active !== undefined) {
      query += ' AND dc.is_active = ?';
      params.push(filters.is_active);
    }

    if (filters.search) {
      query += ' AND (dc.code LIKE ? OR dc.description LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    query += ' ORDER BY dc.created_at DESC';

    const codes = await dbHelpers.all(query, params);

    return {
      success: true,
      data: codes.map(code => ({
        ...code,
        applicable_plans: code.applicable_plans ? JSON.parse(code.applicable_plans) : []
      }))
    };
  } catch (error) {
    console.error('Error getting discount codes:', error);
    return {
      success: false,
      error: 'خطا در دریافت کدهای تخفیف'
    };
  }
}

/**
 * Update discount code (Admin)
 */
async function updateDiscountCode(id, data) {
  try {
    const updates = [];
    const params = [];

    if (data.description !== undefined) {
      updates.push('description = ?');
      params.push(data.description);
    }

    if (data.is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(data.is_active ? 1 : 0);
    }

    if (data.max_uses !== undefined) {
      updates.push('max_uses = ?');
      params.push(data.max_uses);
    }

    if (data.expiry_date !== undefined) {
      updates.push('expiry_date = ?');
      params.push(data.expiry_date);
    }

    if (updates.length === 0) {
      return { success: false, error: 'هیچ تغییری ارسال نشده است' };
    }

    params.push(id);

    await dbHelpers.run(
      `UPDATE discount_codes SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      params
    );

    return { success: true };
  } catch (error) {
    console.error('Error updating discount code:', error);
    return {
      success: false,
      error: 'خطا در بروزرسانی کد تخفیف'
    };
  }
}

/**
 * Get discount code statistics
 */
async function getDiscountStats() {
  try {
    const stats = await dbHelpers.get(`
      SELECT 
        COUNT(*) as total_codes,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_codes,
        SUM(used_count) as total_uses,
        SUM(CASE WHEN expiry_date < datetime('now') THEN 1 ELSE 0 END) as expired_codes
      FROM discount_codes
    `);

    const recentUsage = await dbHelpers.all(`
      SELECT 
        dc.code,
        dc.description,
        COUNT(*) as usage_count,
        SUM(dcu.discount_amount) as total_discount
      FROM discount_code_usage dcu
      JOIN discount_codes dc ON dcu.discount_code_id = dc.id
      WHERE dcu.used_at > datetime('now', '-30 days')
      GROUP BY dc.id
      ORDER BY usage_count DESC
      LIMIT 10
    `);

    return {
      success: true,
      data: {
        ...stats,
        recent_usage: recentUsage
      }
    };
  } catch (error) {
    console.error('Error getting discount stats:', error);
    return {
      success: false,
      error: 'خطا در دریافت آمار'
    };
  }
}

module.exports = {
  validateDiscountCode,
  recordDiscountUsage,
  createDiscountCode,
  getAllDiscountCodes,
  updateDiscountCode,
  getDiscountStats
};
