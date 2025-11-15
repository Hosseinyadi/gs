const express = require('express');
const router = express.Router();
const { dbHelpers } = require('../config/database');
const { authenticateUser } = require('../middleware/auth');

// Get user loyalty status
router.get('/loyalty-status', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's payment stats
    const stats = await dbHelpers.get(`
      SELECT 
        COUNT(*) as total_payments,
        SUM(amount) as total_spent,
        AVG(amount) as average_payment
      FROM payments
      WHERE user_id = ? AND status = 'completed'
    `, [userId]);

    // Calculate loyalty score
    const totalSpent = stats.total_spent || 0;
    const totalPayments = stats.total_payments || 0;
    
    const spentWeight = 0.6;
    const countWeight = 0.4;
    
    const normalizedSpent = Math.min(totalSpent / 1000000, 1);
    const normalizedCount = Math.min(totalPayments / 10, 1);
    
    const loyaltyScore = Math.round(
      (normalizedSpent * spentWeight + normalizedCount * countWeight) * 100
    );

    // Determine customer tier
    let customerTier = 'عادی';
    let nextTier = null;
    
    if (totalSpent >= 500000 || totalPayments >= 5) {
      customerTier = 'طلایی';
      nextTier = null; // Already at top tier
    } else if (totalSpent >= 200000 || totalPayments >= 3) {
      customerTier = 'نقره‌ای';
      nextTier = {
        name: 'طلایی',
        required_spent: 500000,
        remaining: 500000 - totalSpent
      };
    } else if (totalSpent >= 50000 || totalPayments >= 1) {
      customerTier = 'برنزی';
      nextTier = {
        name: 'نقره‌ای',
        required_spent: 200000,
        remaining: 200000 - totalSpent
      };
    } else {
      nextTier = {
        name: 'برنزی',
        required_spent: 50000,
        remaining: 50000 - totalSpent
      };
    }

    // Get available discount codes
    const discounts = await dbHelpers.all(`
      SELECT code, discount_percent, valid_until
      FROM discount_codes
      WHERE is_active = 1
      AND user_specific = 1
      AND specific_user_id = ?
      AND valid_until > datetime('now')
      AND used_count < max_uses
      ORDER BY created_at DESC
    `, [userId]);

    res.json({
      success: true,
      data: {
        total_payments: totalPayments,
        total_spent: totalSpent,
        average_payment: stats.average_payment || 0,
        loyalty_score: loyaltyScore,
        customer_tier: customerTier,
        next_tier: nextTier,
        available_discounts: discounts
      }
    });
  } catch (error) {
    console.error('Error getting loyalty status:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت وضعیت وفاداری'
    });
  }
});

// Get user's monthly listing limit
router.get('/listing-limit', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Start of current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Count listings this month
    const monthlyListings = await dbHelpers.get(`
      SELECT COUNT(*) as count 
      FROM listings 
      WHERE user_id = ? 
      AND created_at >= ? 
      AND status != 'deleted'
    `, [userId, startOfMonth.toISOString()]);

    const currentCount = monthlyListings.count;
    const freeLimit = 1;
    const hasFreeRemaining = currentCount < freeLimit;
    const additionalCost = 50000; // 50,000 تومان

    res.json({
      success: true,
      data: {
        current_count: currentCount,
        free_limit: freeLimit,
        has_free_remaining: hasFreeRemaining,
        needs_payment: !hasFreeRemaining,
        additional_cost: additionalCost,
        message: hasFreeRemaining 
          ? 'شما می‌توانید یک آگهی رایگان در این ماه ثبت کنید'
          : `برای ثبت آگهی بعدی، ${additionalCost.toLocaleString('fa-IR')} تومان پرداخت کنید`
      }
    });
  } catch (error) {
    console.error('Error getting listing limit:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در بررسی محدودیت آگهی'
    });
  }
});

module.exports = router;